# Backend — Full Setup (local / docker)

Prereqs:
- Node.js (v18+), npm
- PostgreSQL OR Docker + Docker Compose

---------------------------------------------------------
Option A — Local (no Docker)
1. Create DB and user (psql):
   psql -U postgres
   CREATE DATABASE carbon_tracker;
   CREATE USER ct_user WITH ENCRYPTED PASSWORD 'ct_pass';
   GRANT ALL PRIVILEGES ON DATABASE carbon_tracker TO ct_user;

2. Run schema:
   psql -U postgres -d carbon_tracker -f ./backend/db/schema.sql

3. Copy .env:
   cp backend/.env.example backend/.env
   Edit DATABASE_URL if needed.

4. Install and import:
   cd backend
   npm install
   Put your CSV file as backend/India-specific_Emission_Factors.csv
   npm run import

5. Start server:
   npm start
   (or npm run dev with nodemon)

---------------------------------------------------------
Option B — Docker (recommended for demo)
1. Copy .env.example -> .env at project root and set JWT_SECRET (export or place in .env for compose)
2. docker-compose up --build
3. After containers up, import CSV:
   docker-compose exec backend node import_csv.js
4. Backend will be reachable at http://localhost:4000

---------------------------------------------------------
Notes:
- Use /api/auth to create users (signup/login), then pass Bearer token if you later secure endpoints.
- Quick test endpoints:
  GET /api/factors
  POST /api/activity/add  { user_id, category, activity, value, unit, date }
  GET  /api/activity/summary?user_id=1&date=YYYY-MM-DD
  POST /api/suggestions { category, activity, value }
  GET /api/reports/monthly?user_id=1&year=2025&month=10

- If you want me to secure factor CRUD/admin endpoints with auth, tell me and I’ll add middleware.
