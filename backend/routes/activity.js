const express = require("express");
const router = express.Router();
const db = require("../db");
const { json } = require("body-parser");

/**
 * Helper: find factor for category+item OR fallback by category
 */
async function findFactor(category, item) {
  const r = await db.query(
    `SELECT * FROM emission_factors WHERE LOWER(category)=LOWER($1) and LOWER(item)=LOWER($2) LIMIT 1`,
    [category, item]
  );
  if (r.rows.length) return r.rows[0];
  // fallback: find representative factor for category (first)
  const r2 = await db.query(
    `SELECT * FROM emission_factors WHERE LOWER(category) = LOWER($1) LIMIT 1`,
    [category]
  );
  if (r2.rows.length) return r2.rows[0];
  return null;
}

/**
 * POST /api/activity/add
 * body: { user_id, category, activity, value, unit, date }
 */
router.post('/add', async(req, res) => {
  try {
    const { user_id, category, activity, value, unit, date } = req.body;
    if(!category || !activity || value == null) return res.status(400).json({ error: 'missing field' });

    const factorRow = await findFactor(category, activity);
    if (!factorRow) return res.status(400).json({ error: 'emission factor not found' });
    const factor = parseFloat(factorRow.factor);

    // For demo simplicity: assume units are consistent. Add conversions if needed
    const emission_kg = parseFloat(value) * factor;
    await db.query(
      `INSERT INTO user_activity_logs (user_id, category, activity, value, unit, emission_kg, log_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user_id, category, activity, value, unit || factorRow.unit || '', emission_kg, date || new Date().toISOString().split('T')[0]]
    );

    const tot = await db.query(
      `SELECT COALESCE(SUM(emission_kg),0) as total FROM user_activity_logs WHERE user_id=$1 AND log_date=$2`,
      [user_id, date || new Date().toISOString().split('T')[0]]
    );

    // Simple gamification rule
    const points = 1 + ((category.toLowerCase() === 'food' && activity.toLowerCase().includes('veg')) ? 5: 0);
    await db.query('INSERT INTO user_points (user_id, points, reason, created_at) VALUES ($1, $2, $3, now())', [user_id, points, `Logged ${activity}`]);
    res.json({ emission_kg, total_today: parseFloat(tot.rows[0].total), points });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * GET /api/activity/summery?user_id=&date=
 */
router.get('/summery', async(req, res) => {
  try {
    const { user_id = 1, date } = req.query;
    const d = date || new Date().toISOString().split('T')[0];
    const r = await db.query(
      `SELECT category, COALESCE(SUM(emission_kg), 0) as total
      FROM user_activity_logs
      WHERE user_id=$1 AND log_date=$2
      GROUP BY category ORDER BY total DESC`,
      [user_id, d]
    );
    res.json({ date: d, data: r.rows });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'server error' })
  }
});

/**
 * GET /api/activity/history?user_id=&from=&from=&to=
 */
router.get('/history', async(req, res) => {
  try {
    const { user_id = 1, from, to } = req.query;
    const f = from || new Date().toISOString().split('T')[0];
    const t = to || f;
    const r = await db.query(
      `SELECT id, category, activity, value, unit, emission_kg, log_date, created_at
      FROM user_activity_logs WHERE user_id=$1 AND log_date BETWEEN $2 AND $3
      ORDER BY log_date DESC, created_at DESC`,
      [user_id, f, t]
    );
    res.json(r.rows);
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;