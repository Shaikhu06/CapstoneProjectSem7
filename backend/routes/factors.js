const express = require('express')
const router = express.Router();
const db = require('../db');
const { param } = require('./auth');

// GET /api/factors?category=&q=
router.get('/', async (req, res) => {
    try {
        const { category, q } = req.query;
        let base = 'SELECT * FROM emission_factors'

        const params = []
        const where = []
        if (category) { params.push(category); where.push(`LOWER(category)=LOWER($${params.length})`);}
        if  (q) { params.push(`%${q.toLowerCase()}%`); where.push(`LOWER(item) LIKE $${params.length}`);}
        if (where.length) base+=' WHERE ' + where.join(' AND ');
        base += 'ORDERED BY category, item';
        const r = await db.query(base, params);
        res.json(r.rows);
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

// POST /api/factors (create) - simple admin usage
router.post('/', async(req, res)=> {
    try {
        const { category, item, factor, unit, source, year, notes } = req.body;
        if (!category || !item || factor == null) return res.status(400).json({ error: 'missing fields' });
        const insert = await db.query(
            `INSERT INTO emission_factors (category, item, factor, unit, source, year, notes)
            VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [category, item, factor, unit || '', source || '', year || null, notes || '']
        );
        res.json(insert.rows[0]);
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

// PUT /api/factors/:id
router.put('/:id', async(req, res) => {
    try {
        const id = req.params.id;
        const { category, item, factor, unit, source, year, notes } = req.body;
        const q = await db.query(
            `UPDATE emission_factors SET category=$1, item=$2, factor=$3, unit=$4, source=$5, year=$6, notes=$7 WHERE id=$8 RETURNING *`,
            [category, item, factor, unit || '', source || '', year || null, notes || '', id]
        );
        res.json(q.rows[0]);
    } catch(err){
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

// DELETE /api/factors/:id
router.delete('/:id', async (req, res) => {
    try {
      const id = req.params.id;
      await db.query('DELETE FROM emission_factors WHERE id=$1', [id]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'server error' });
    }
  });
  
  module.exports = router;