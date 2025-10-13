// backend/routes/factors.js
const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * GET /api/factors?category=&q=
 * Returns emission_factors filtered by optional category and/or q (search in item)
 */
router.get("/", async (req, res) => {
  try {
    const { category, q } = req.query;

    // base query
    let sql =
      "SELECT id, category, item, factor, unit, source, year, notes FROM emission_factors";
    const whereClauses = [];
    const params = [];

    // add filters and parameters in order
    if (category) {
      params.push(category);
      whereClauses.push(`LOWER(category) = LOWER($${params.length})`);
    }

    if (q) {
      params.push(`%${q}%`.toLowerCase());
      whereClauses.push(`LOWER(item) LIKE $${params.length}`);
    }

    if (whereClauses.length) {
      sql += " WHERE " + whereClauses.join(" AND ");
    }

    sql += " ORDER BY category, item";

    // Debug: log SQL and params (remove in production)
    console.log("[factors] SQL:", sql);
    console.log("[factors] params:", params);

    const result = await db.query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    console.error("Error in /api/factors:", err);
    return res.status(500).json({ error: "server error" });
  }
});

module.exports = router;