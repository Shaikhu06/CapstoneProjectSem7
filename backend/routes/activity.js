// backend/routes/activity.js
const express = require("express");
const db = require("../db");
const router = express.Router();

// POST /api/activity
router.post("/activity", async (req, res) => {
  try {
    const { user_id, category, activity, value, unit, date } = req.body;
    const f = await db.query(
      `SELECT factor, unit FROM emission_factors WHERE category=$1 AND item=$2 LIMIT 1`,
      [category, activity]
    );
    if (!f.rows.length)
      return res.status(400).json({ error: "factor not found" });
    const factor = parseFloat(f.rows[0].factor);
    const emission_kg = parseFloat(value) * factor;
    await db.query(
      `INSERT INTO user_activity_logs (user_id, category, activity, value, unit, emission_kg, log_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [user_id, category, activity, value, unit, emission_kg, date]
    );
    const tot = await db.query(
      `SELECT COALESCE(SUM(emission_kg),0) as total FROM user_activity_logs WHERE user_id=$1 AND log_date=$2`,
      [user_id, date]
    );
    res.json({ emission_kg, total_today: parseFloat(tot.rows[0].total) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// GET /api/summary
router.get("/summary", async (req, res) => {
  const { user_id, date } = req.query;
  const q = await db.query(
    `SELECT category, SUM(emission_kg) as total FROM user_activity_logs
     WHERE user_id=$1 AND log_date=$2 GROUP BY category`,
    [user_id, date]
  );
  res.json(q.rows);
});

module.exports = router;
