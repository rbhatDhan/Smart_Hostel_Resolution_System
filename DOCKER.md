# Running the whole app with Docker

One command starts everything: **MongoDB + API (with SLA cron and live notifications) + the React app**.

```
Browser ──► web (nginx :8080) ──┬─ static React app
                                ├─ /api/*        ─► api (Express :5000) ─► mongo
                                └─ /socket.io/*  ─► api (WebSocket)
```
The browser only talks to one address, so there are no CORS or API-URL settings to fight with.

## Quick start

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + the Compose plugin).

```bash
cp .env.example .env          # Windows PowerShell: copy .env.example .env
docker compose up --build
```

Open **http://localhost:8080** once the logs settle (first build takes a few minutes).

| Account | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `ChangeMe123!` |
| Warden | `warden@example.com` | `Warden@123` |
| Student | `student@example.com` | `Student@123` |

These are created automatically by the one-shot `seed` service (it exits when done; that is normal).
Change the admin login in `.env` before the first start, and set `SEED_DEMO=false` if you do not want the demo accounts.

## What runs

| Service | What it is | Port |
|---|---|---|
| `mongo` | MongoDB 7, data kept in the `mongo-data` volume | internal |
| `api` | Express API, Socket.IO, SLA cron (every 10 min) | 5000 |
| `web` | nginx serving the React build + proxying `/api` and `/socket.io` | 8080 |
| `seed` | creates admin/demo users, then exits | - |

## Everyday commands

```bash
docker compose up -d --build      # start in the background
docker compose logs -f api        # follow API logs (SLA cron messages appear here)
docker compose ps                 # status + health
docker compose down               # stop (data is kept)
docker compose down -v            # stop AND delete the database
docker compose run --rm seed      # re-run the seed (existing users are kept)
docker compose exec api npm test  # run the unit/API tests inside the container
```
After changing code: `docker compose up -d --build`.

## Configuration (`.env`)

| Variable | Default | Notes |
|---|---|---|
| `JWT_SECRET` | - | **Required**, 32+ characters. `openssl rand -hex 32` |
| `WEB_PORT` | `8080` | Host port for the app. Keep `CLIENT_URL` in sync |
| `CLIENT_URL` | `http://localhost:8080,http://127.0.0.1:8080` | Address(es) you open the app at |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@example.com` / `ChangeMe123!` | Used by the seed |
| `SEED_DEMO` | `true` | Also create demo warden + student |
| `GEMINI_API_KEY` | empty | AI features turn off gracefully without it |
| `MONGO_URI` | bundled Mongo | Set to your Atlas URI to use Atlas instead |
| `CRON_SECRET` | empty | Only needed to call `/api/cron/sla` over HTTP |

### Using MongoDB Atlas instead of the bundled database
Set `MONGO_URI=mongodb+srv://...` in `.env`. The `mongo` container still starts but is simply unused.

## Troubleshooting

- **`JWT_SECRET` error on start**: you did not create `.env` (`cp .env.example .env`).
- **Port already in use**: change `WEB_PORT` (and `CLIENT_URL` to match) or stop whatever uses 8080 / 5000.
- **"Not allowed by CORS" / login fails**: you opened the app at an address not listed in `CLIENT_URL` (for example a LAN IP). Add it, comma separated, then `docker compose up -d`.
- **Cannot log in as admin/warden**: check `docker compose logs seed`; it must say `created`/`updated`.
- **Start fresh**: `docker compose down -v && docker compose up --build`.
- **Changed `VITE_API_URL`/frontend code but nothing changed**: rebuild with `docker compose build web --no-cache`.

## Deploying this for real

- Put HTTPS in front (Caddy, Traefik, or your cloud load balancer) and set `CLIENT_URL=https://your-domain`.
- Use strong `JWT_SECRET` / `ADMIN_PASSWORD`, set `SEED_DEMO=false`, do not publish ports 5000 and 27017.
- Back up the `mongo-data` volume, or use Atlas.
- The SLA scheduler runs inside the `api` container, so keep it running 24/7 (it is not suitable for serverless).
