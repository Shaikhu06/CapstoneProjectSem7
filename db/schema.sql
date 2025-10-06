CREATE TABLE emission_factors (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50),
  item VARCHAR(100),
  factor NUMERIC,
  unit VARCHAR(50),
  source VARCHAR(150),
  year INT,
  notes TEXT
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(150),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE user_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  category VARCHAR(50),
  activity VARCHAR(100),
  value NUMERIC,
  unit VARCHAR(50),
  emission_kg NUMERIC,
  log_date DATE,
  created_at TIMESTAMP DEFAULT now()
);