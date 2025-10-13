// backend/routes/admin.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const fs = require("fs");
const path = require("path");
const parse = require("csv-parse");

const CSV_NAME = path.join(
  __dirname,
  "../data/India-specific_Emission_Factors.csv"
);

// POST /api/admin/import  -> import CSV into emission_factors
router.post("/import", async (req, res) => {
  try {
    if (!fs.existsSync(CSV_NAME))
      return res
        .status(400)
        .json({ error: "CSV file not found in backend folder" });

    const parser = fs
      .createReadStream(CSV_NAME)
      .pipe(parse({ columns: true, trim: true }));
    let inserted = 0,
      skipped = 0;
    for await (const row of parser) {
      const category =
        row.Category || row.category || row.CategoryName || row.Category_Name;
      const item = row.Item || row.item || row.ItemName || row.Name;
      const factor = row.Factor || row.factor || row.Value;
      const unit = row.Unit || row.unit || row.StandardUnit || "";
      const source = row.Source || row.source || "";
      const year = row.Year ? parseInt(row.Year) : null;
      const notes = row.Notes || row.notes || "";

      if (!category || !item || !factor) {
        skipped++;
        continue;
      }
      try {
        await db.query(
          `INSERT INTO emission_factors (category,item,factor,unit,source,year,notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
          [category, item, factor, unit, source, year, notes]
        );
        inserted++;
      } catch (e) {
        console.error("row insert error", e.message);
        skipped++;
      }
    }
    res.json({ inserted, skipped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// GET /api/admin/stats -> basic DB stats
router.get("/stats", async (req, res) => {
  try {
    const e = await db.query("SELECT COUNT(*) as cnt FROM emission_factors");
    const u = await db.query("SELECT COUNT(*) as cnt FROM users");
    const l = await db.query("SELECT COUNT(*) as cnt FROM user_activity_logs");
    res.json({
      emission_factors: parseInt(e.rows[0].cnt),
      users: parseInt(u.rows[0].cnt),
      logs: parseInt(l.rows[0].cnt),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
