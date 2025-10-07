// backend/routes/activity.js
const express = require("express");
const db = require("../db");
const router = express.Router();

// POST /api/activity
router.post("/activity", async (req, res) => {
  try {
    const { user_id = 1, category, activity, value, unit, date } = req.body;
    if(!category || !activity || value == null) return res.stattus(400).json({
      error: 'missing fields'
    });
    // fetch factor: try exact match on item first, fall back by category
    let fRow = await db.query(
      "SELECT factor, unit FROM emission_factors WHERE LOWER(category)=LOWER($1) AND LOWER(item)=LOWER($2) LIMIT 1",
      [category, activity]
    );
    if (!fRow.rows.length) {
      // try by category only (use first row)
      const catRow = await db.query(
        "SELECT factor, unit, item FROM emission_factors WHERE LOWER(category)=LOWER($1) LIMIT 1",
        [category]
      );
      if (catRow.rows.length) {
        fRow = catRow;
      } else {
        return res.status(400).json({ error: "emission factor not found" });
      }
    }

    const factor = parseFloat(fRow.rows[0].factor);
    // naive unit-check; in demo we assume units align
    const emission_kg = parseFloat(value) * factor;

    await db.query(
      `INSERT INTO user_activity_logs
         (user_id, category, activity, value, unit, emission_kg, log_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        user_id,
        category,
        activity,
        value,
        unit || "",
        emission_kg,
        date || new Date().toISOString().split("T")[0],
      ]
    );

    const tot = await db.query(
      `SELECT COALESCE(SUM(emission_kg),0) as total FROM user_activity_logs
       WHERE user_id=$1 AND log_date=$2`,
      [user_id, date || new Date().toISOString().split("T")[0]]
    );

    // simple gamification: points (1 point per activity, +5 for veg meal if category=Food item contains 'veg')
    const points =
      1 +
      (category.toLowerCase() === "food" &&
      activity.toLowerCase().includes("veg")
        ? 5
        : 0);

    res.json({
      emission_kg,
      total_today: parseFloat(tot.rows[0].total),
      points,
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// GET /api/summary
router.get("/emission-factors", async (req, res) => {
  try {
    const {category} = req.query;
    if(category) {
      const q = await db.query('SELECT * FROM emission_factors WHERE category=$1 ORDER BY item', [category]);
      return res.json(q.rows);
    }
    const q = await db.query('SELECT * FROM emission_factors ORDER BY category, item');
    res.json(q.rows);
  } catch(err) {
    console.error(err);
    res.status(500).json({
      error: 'server error'
    });
  }
});

router.get("/history", async (req, res) => {
  try {
    const { user_id = 1, from, to } = req.query;
    const fromDate = from || new Date().toISOString().split("T")[0];
    const toDate = to || fromDate;
    const q = await db.query(
      `SELECT * FROM user_activity_logs WHERE user_id=$1 AND log_date BETWEEN $2 AND $3 ORDER BY log_date DESC, created_at DESC`,
      [user_id, fromDate, toDate]
    );
    res.json(q.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;