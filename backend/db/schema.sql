CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120),
  email VARCHAR(200) UNIQUE,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emission_factors (
  id SERIAL PRIMARY KEY,
  category VARCHAR(80),
  item VARCHAR(200),
  factor NUMERIC,
  unit VARCHAR(60),
  source VARCHAR(200),
  year INT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS user_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  category VARCHAR(50),
  activity VARCHAR(200),
  value NUMERIC,
  unit VARCHAR(50),
  emission_kg NUMERIC,
  log_date DATE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_points (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  points INT,
  reason TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  badge_key VARCHAR(100),
  badge_name VARCHAR(200),
  awarded_at TIMESTAMP DEFAULT now()
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_logs_user_date ON user_activity_logs (user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_factors_cat ON emission_factors (LOWER(category));