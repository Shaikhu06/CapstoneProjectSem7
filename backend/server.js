// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");

const app = express();
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      // allow XHR / fetch / websocket connections to local backend + emulator host
      "connect-src": [
        "'self'",
        "http://localhost:4000",
        "http://127.0.0.1:4000",
        "http://10.0.2.2:4000", // Android emulator host
      ],
      "img-src": ["'self'", "data:"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'"],
    },
  })
);

// CORS: allow all origins for development. Tighten for prod.
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

// routes
const authRoutes = require('./routes/auth');
const factorRoutes = require('./routes/factors');
const activityRoutes = require("./routes/activity");
const reportRoutes = require('./routes/reports');
const suggestionRoutes = require('./routes/suggestions');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/factors', factorRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/admin', adminRoutes);

// health
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.get("/api", (req, res) => {
  res.json({
    message:
      "API root - available: /api/factors, /api/activity, /api/reports, /api/suggestions, /api/auth",
  });
});

app.get("/", (req, res) => {
  res.send(`
    <h2>🌱 Carbon Footprint Tracker API</h2>
    <p>Server is running successfully.</p>
    <ul>
      <li><a href="/health">/health</a> – Health check</li>
      <li><a href="/api/factors">/api/factors</a> – Emission factors</li>
      <li><a href="/api/activity/summary?user_id=1&date=2025-10-11">/api/activity/summary</a> – Daily summary</li>
    </ul>
  `);
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));