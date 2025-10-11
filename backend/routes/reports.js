const express = require('express')
const router = express.Router()
const db = require('../db')

/**
 * GET /api/reports/monthly?user_id=&year=&month=
 * returns totals per category for that month, plus daily breakdown
 */

router.get('/monthly', async(req, res) => {
    try {
        const { user_id = 1, year, month } = req.query;
        const y = year ? parseInt(year) : new Date.getFullYear();
        const m = month ? parseInt(month) : new Date.getMonth() + 1; // 1-based
        const monthStart = `${y}-${String(m).padLeft ? String(m).padLeft(2, '0') : (m < 10 ? '0' + m : '' + m)} - 01`;
        // Simple query by date pattern (works in ISO dates)
        const monthPattern = `${y}-${m.toString().padStart(2, '0')}`;
        // category totals
        const catTotals = await db.query(
            `SELECT category, COALESCE(SUM(emission_kg), 0) as total
            FROM user_activity_logs WHERE user_id=$1 AND to_char(log_date, 'YYYY-MM')=$2 GROUP BY category ORDER BY total DESC`,
            [user_id, monthPattern]
        );
        // daily totals
        const daily = await db.query(
            `SELECT log_date::text as date, COALESCE(SUM(emission_kg),0) as total
             FROM user_activity_logs WHERE user_id=$1 AND to_char(log_date,'YYYY-MM')=$2 GROUP BY log_date ORDER BY log_date`,
            [user_id, monthPattern]
          );
          res.json({ year: y, month: m, category_totals: catTotals.rows, daily: daily.rows });
    } catch(err) {
          console.error(err);
          res.status(500).json({ error: 'server error' });
    }
});

/**
 * GET /api/reports/range?user_id=&from=&to=
 */
router.get('/range', async (req, res) => {
    try {
      const { user_id = 1, from, to } = req.query;
      const f = from || new Date().toISOString().split('T')[0];
      const t = to || f;
      const totals = await db.query(
        `SELECT category, COALESCE(SUM(emission_kg),0) as total FROM user_activity_logs WHERE user_id=$1 AND log_date BETWEEN $2 AND $3 GROUP BY category`,
        [user_id, f, t]
      );
      res.json({ from: f, to: t, totals: totals.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'server error' });
    }
  });
  
  module.exports = router;