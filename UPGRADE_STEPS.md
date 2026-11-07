# Upgrade steps (read me first)

## 1. Copy the files
Extract this zip **over** your project folder and accept overwrite.
Then **delete** these two unused files from your project:
- `frontend/App2.jsx`
- `frontend/src/components/Notifications.jsx`   (replaced by the shared notification context + `NotificationBell`)

## 2. Install the new packages
```bash
cd backend  && npm install
cd ../frontend && npm install
```

## 3. Backend environment
Keep your existing `backend/.env` and add what is new (see `backend/.env.example`):
```
JWT_SECRET=<at least 32 random characters>
CLIENT_URL=http://localhost:5173
CRON_SECRET=<any random string>          # only needed for the HTTP cron trigger
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=<a strong password>
```
`MONGO_URI` and `GEMINI_API_KEY` stay as they are.

## 4. Create your admin / warden accounts
Registration only creates students now, so create staff with:
```bash
cd backend
npm run seed          # admin from ADMIN_EMAIL / ADMIN_PASSWORD
npm run seed:demo     # + warden@example.com (Warden@123) and student@example.com (Student@123)
```
Existing users keep working. If you previously had warden/admin users in the database they are unchanged.

## 5. Run
```bash
cd backend  && npm run dev
cd frontend && npm run dev
```
Backend tests: `cd backend && npm test`

## Deploying (where does the SLA cron run?)
- Render / Railway / VPS / Docker: nothing to do - the scheduler starts with the server.
- Vercel (serverless) cannot keep a scheduler running. Host the API on Render/Railway and the frontend on Vercel,
  or call `GET /api/cron/sla` (header `Authorization: Bearer <CRON_SECRET>`) from Vercel Cron / the included GitHub Action.

## Docker (optional)
To run everything in containers instead, see `DOCKER.md`:
```bash
cp .env.example .env
docker compose up --build
```
