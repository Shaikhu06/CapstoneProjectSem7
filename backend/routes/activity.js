const express = require('express')
const router = express.Router()
const db = require('../db');
// const { use } = require('react');

/**
 * Helper: find factor for category + item OR fallback by category
 */

async function findFactor(category, item) {
  const r = await db.query(
    `SELECT * FROM emission_factors WHERE LOWER(category)=LOWER($1) AND LOWER(item)=LOWER($2) LIMIT 1`,
    [category, item]
  );
  if (r.rows.length) return r.rows[0];
  // fallback: find representative factor for category (first)
  const r2 = await db.query(
    `SELECT * FROM emission_factors WHERE LOWER(category)=LOWER($1) LIMIT 1`,
    [category]
  );
  if (r2.rows.length) return r2.rows[0];
  return null;
}

/**
 * GET /api/activity/
 * simple index for quick testing in browser
 */
router.get('/', (req, res) =>{
  res.json({
    message:
      "Activity routes: POST /api/activity, GET /api/activity/summary, GET /api/activity/history",
    examples: {
      add: {
        method: "POST",
        path: "/api/activity",
        body: {
          user_id: 1,
          category: "Travel",
          activity: "Petrol Car",
          value: 20,
          unit: "km",
          date: "2025-10-11",
        },
      },
      summary: '/api/activity/summary?user_id=1&date=2025-10-11',
      history: '/api/activity/history?user_id=1&from=2025-10-11&to=2025-10-11'
    },
  });
});

/**
 * POST /api/activity
 * body: { user_id, category, activity, value, unit, date }
 */
router.post('/', async(req, res) => {
  try {
    const { user_id = 1, category, activity, value, unit, date } = req.body;
    if (!category || !activity || value == null) {
      return res.status(400).json({ error: 'missing fields: category, activity and value are required' });
    }

    const factorRow = await findFactor(category, activity);
    if (!factorRow) return res.status(400).json({ error: 'emission factor not found for given category/activity' });
    const factor = parseFloat(factorRow.factor);
    if (Number.isNaN(factor)) return res.status(400).json({ error: 'invalid factor in DB' });

    // For demo simplicity: assume units are consistent.
    const emission_kg = parseFloat(value) * factor;

    await db.query(
      `INSERT INTO user_activity_logs (user_id, category, activity, value, unit, emission_kg, log_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user_id, category, activity, value, unit || factorRow.unit || '', emission_kg, date || new Date().toISOString().split('T')[0]]
    );

    const toto = await db.query(
      `SELECT COALESCE(SUM(emission_kg), 0) as total FROM user_activity_logs WHERE user_id=$1 AND log_date=$2`,
      [user_id, date || new Date().toISOString().split('T')[0]]
    );

    // Simple gamification rule and store points
    const points = 1 + ((category.toLowerCase() === 'food' && activity.toLowerCase().includes('veg')) ? 5 : 0);
    await db.query(
      'INSER INTO user_points (user_id, points, reason, created_at) VALUES ($1, $2, $3, now())',
      [user_id, points, `Logged ${activity}`]
    );

    res.json({ emission_kg, total_today: parseFloat(toto.rows[0].total), points });
  } catch(err) {
    console.error('[activity.post]', err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * GET /api/activity/summery?user_id=&date=
 */
router.get('/summary', async(req, res) => {
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
    console.error('[activity.summary]', err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * GET /api/activity/history?user_id=&from=&to=
 * Returns logs between from/to (inclusive)
 * Accepts dates as YYYY-MM-DD. If missing, uses today for both.
 */
router.get('/history', async(req, res) => {
  try {
    // Validate and normalize inputs
    let { user_id = 1, from, to } = req.query;
    
    // ensure user_id is an integer (as string or number)
    if (Array.isArray(user_id)) user_id = user_id[0];
    const uid = parseInt(user_id, 10);
    if (Number.isNaN(uid)) return res.status(400).json({ error: 'invalid user_id (must be integer)' });

    // default dates to today if not provided
    const today = new Date().toISOString().split('T')[0];
    if (!from) from = today;
    if (!to) to = from;

    // Basic date format check (YYYY-MM-DD).
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(from) || !dateRegex.test(to)) {
      return res.status(400).json({ error: 'invalid date format. Use YYYY-MM-DD for from and to' });
    }

    // Ensure from <= to (string compare works for ISO dates)
    if (from > to) {
      // swap
      const tmp = from;
      from = to;
      to = tmp;
    }

    // Use explicit casts to avoid type-mismatch errors
    const q = `
      SELECT id, category, activity, value, unit, emission_kg, log_date, created_at
      FROM user_activity_logs
      WHERE user_id = $1::int
        AND log_date BETWEEN $2::date AND $3::date
      ORDER BY log_date DESC, created_at DESC
    `;

    const params = [uid, from, to];
    const r = await db.query(q, params);
    res.json(r.rows);
  } catch(err) {
    console.error('[activity.history] error:', err);
    // return safe message but keep details in server logs
    res.status(500).json({ error: 'server error - check server logs for details' });
  }
}); 

module.exports = router;