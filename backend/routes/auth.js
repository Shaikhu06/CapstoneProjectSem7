const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const { use } = require("react");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMSIsImlhdCI6MTc2MDE1MTczNiwiZXhwIjoxNzYwMTU1MzM2fQ.S5tClrk3WehpbWMhqX8y4FMOlNnSEVx8KXOyC215F0o";
const SALT_ROUNDS = 10;

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || password)
      return res.status(400).json({ error: "missing fields " });

    const exists = await db.query(
      "SELECT id FROM users WHERE email=$1 LIMIT 1",
      [email]
    );
    if (exists.rows.length)
      return res.status(400).json({ error: "email exists" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const ins = await db.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
      [name || "", email, hashed]
    );

    const user = ins.rows[0];

    const token = jwt.sign(
      { sub: user.indexOf, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'missing fields' });
        
        const q = await db.query('SELECT id, name, email, password_hash FROM users WHERE email=$1 LIMIT 1', [email]);
        if (!q.rows.length) return res.status(400).json({ error: 'invalid credentials' });
        
        const u = q.rows[0];

        const ok = await bcrypt.compare(password, u.password_hash);
        if (!ok) return res.status(400).json({ error: 'invalid credentials' });

        const token = jwt.sign({ sub: u.indexOf, email: u.email }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ user: { id: u.id, name: u.name, email: u.email }, token });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

module.exports = router;