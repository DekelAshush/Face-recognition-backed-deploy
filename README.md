# Backend (SmartBrain) - Deploying to Render

This repository is an Express/Node backend prepared for deployment on Render.

What's been changed to support Render:
- `package.json` start script now uses `node server.js` (Render runs `npm start`).
- `server.js` now binds to `process.env.PORT` and prefers `DATABASE_URL` with SSL when available.
- CORS origins can be configured via `CORS_ALLOWED_ORIGINS` (comma-separated). In production with no CORS config, all origins are allowed.
- Added a simple health check endpoint at `/`.

Quick Render deployment steps

1. Create a new Web Service on Render
   - Connect your GitHub repo and pick this project folder.
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node` (choose a recent Node version; Node 18+ recommended)

2. Set required Environment Variables (in the Render Dashboard -> Environment):
   - `DATABASE_URL` = `postgres://USER:PASSWORD@HOST:PORT/DBNAME` (preferred)
     - If you don't use `DATABASE_URL`, set: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
   - `JWT_SECRET` (must be set)
   - `CLARIFAI_USER_ID`, `CLARIFAI_APP_ID`, `CLARIFAI_PAT`, `CLARIFAI_WORKFLOW_ID` (for Clarifai API)
   - `REDIS_URL` (optional; if not provided, Redis-based features will fail)
   - `CORS_ALLOWED_ORIGINS` (optional, comma-separated list of allowed origins)
   - `NODE_ENV=production` (recommended)

3. Postgres on Render
   - If you use Render's Postgres managed DB, copy the `DATABASE_URL` value into the service env.
   - The server uses SSL for `DATABASE_URL` so the connection should work without additional changes.

4. Redis on Render
   - Render doesn't offer managed Redis; you can use Upstash or another provider and set `REDIS_URL` accordingly.

5. Verify
   - After deployment, open the service URL and check `GET /` returns `{ status: 'ok' }`.
   - Use your frontend app with the deployed backend base URL.

Notes & Troubleshooting
- Start script: Render runs `npm start` — ensure `start` in `package.json` is `node server.js` (already set).
- Port binding: the app listens on `process.env.PORT` or 3000 locally.
- Database SSL: when `DATABASE_URL` is detected, SSL is enabled with `rejectUnauthorized: false` to support Render's certs.
- CORS: if you need to restrict origins, set `CORS_ALLOWED_ORIGINS` to a comma-separated list (e.g. `https://my-app.onrender.com,https://example.com`).
- Redis: ensure `REDIS_URL` is reachable from Render if you rely on token sessions.

Files changed
- `package.json` — start script and dev script
- `server.js` — port binding, DATABASE_URL + SSL support, CORS improvements, health route

If you'd like, I can also:
- add `engines.node` to `package.json` to pin Node version
- add a `render.yaml` manifest for Infrastructure-as-Code
- create a small smoke-test script to run after deployment


