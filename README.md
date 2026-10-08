# lingoleap

A functional Duolingo-style web app: follow a skill path, play lessons built from five
interactive exercise types, earn XP, keep a daily streak alive and spend hearts when you get
things wrong. Next.js on the front, FastAPI + SQLite on the back.

> Full documentation (architecture, schema diagram, API reference, game rules) lands in the
> final pass. This file currently covers setup, environment and deployment.

- **Live demo:** _pending deployment_
- **API docs (OpenAPI):** _pending deployment_ (`/docs` on the backend host)

## Tech stack

| Layer    | Choice                                                                        |
| -------- | ----------------------------------------------------------------------------- |
| Frontend | Next.js 15 (App Router), TypeScript strict, Tailwind CSS, Framer Motion, TanStack Query v5 |
| Backend  | Python 3.11, FastAPI, SQLAlchemy 2.0 (typed `Mapped[]`), Pydantic v2            |
| Database | SQLite (schema created from the models at startup)                             |
| Tests    | pytest + httpx `TestClient`                                                    |
| Hosting  | Backend on Render (free web service), frontend on Vercel                       |

## Local setup

```bash
# backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000           # auto-seeds on first start; docs at /docs

# frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev                                          # http://localhost:3000
```

The database seeds itself the first time it comes up empty. To reseed explicitly:

```bash
cd backend
python -m app.seed.seed            # idempotent top-up
python -m app.seed.seed --reset    # drop every table and start over
```

### Running the checks

```bash
cd backend  && pytest
cd frontend && npm run lint && npm run build
```

## Environment variables

### `backend/.env`

| Key                   | Default                      | Purpose                                                        |
| --------------------- | ---------------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`        | `sqlite:///./duolingo.db`    | SQLAlchemy URL                                                  |
| `CORS_ORIGINS`        | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated allowed origins (trailing slashes are stripped) |
| `CORS_ORIGIN_REGEX`   | `https://.*\.vercel\.app`    | Also allows Vercel preview deployments                          |
| `APP_TIMEZONE`        | `Asia/Kolkata`               | Timezone every date rule (streak, daily goal, league) uses      |
| `HEART_REGEN_MINUTES` | `60`                         | Minutes per regenerated heart                                   |
| `DEBUG_TOOLS_ENABLED` | `true`                       | Exposes the `/api/debug/*` demo tools                           |

### `frontend/.env.local`

| Key                   | Default                 | Purpose                                      |
| --------------------- | ----------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000` | Backend base URL, no trailing slash          |

`NEXT_PUBLIC_*` values are inlined at build time, so changing one on Vercel requires a redeploy.

The local API URL uses the IPv4 literal rather than `localhost` on purpose: Chrome resolves
`localhost` to `::1` first, while uvicorn binds IPv4 only, which makes browser requests fail
even though `curl` succeeds.

## GitHub

One public monorepo, `frontend/` and `backend/` at the root, default branch `main`.

```bash
git branch -M main
git remote add origin https://github.com/<username>/duolingo-clone.git
git push -u origin main
```

## Deployment

Both halves run on free tiers and deploy automatically on every push to `main`.
Deploy the backend first — the frontend needs its URL.

### 1. Backend on Render

Render dashboard → **New** → **Web Service** → connect GitHub → select the repository.

| Setting           | Value                                            |
| ----------------- | ------------------------------------------------ |
| Root Directory    | `backend`                                        |
| Runtime           | Python 3                                         |
| Build Command     | `pip install -r requirements.txt`                |
| Start Command     | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Instance Type     | Free                                             |
| Health Check Path | `/health`                                        |
| Auto-Deploy       | On commit                                        |

Environment variables:

| Key                   | Value                      |
| --------------------- | -------------------------- |
| `PYTHON_VERSION`      | `3.11.9`                   |
| `DATABASE_URL`        | `sqlite:///./duolingo.db`  |
| `CORS_ORIGINS`        | `http://localhost:3000` (updated in step 3) |
| `CORS_ORIGIN_REGEX`   | `https://.*\.vercel\.app`  |
| `APP_TIMEZONE`        | `Asia/Kolkata`             |
| `HEART_REGEN_MINUTES` | `60`                       |
| `DEBUG_TOOLS_ENABLED` | `true`                     |

Verify: `https://<service>.onrender.com/health` returns `{"status":"ok"}`, `/api/path` returns
the seeded units, and `/docs` loads.

### 2. Frontend on Vercel

Vercel → **Add New** → **Project** → import the same repository.

| Setting                      | Value                            |
| ---------------------------- | -------------------------------- |
| Root Directory               | `frontend`                       |
| Framework Preset             | Next.js (auto-detected)          |
| Build / Install / Output     | defaults                         |
| Env `NEXT_PUBLIC_API_URL`    | `https://<service>.onrender.com` (no trailing slash) |

### 3. Connect the two

1. Copy the Vercel production URL.
2. Render → Environment → set `CORS_ORIGINS` to
   `https://<app>.vercel.app,http://localhost:3000` and save (this redeploys).
3. Open the Vercel URL, finish a lesson, refresh, and confirm XP and streak persisted with no
   CORS errors in the console.

### Free-tier behaviour

- Render's free web services have an **ephemeral filesystem**: the SQLite file is wiped on
  every redeploy, restart and idle spin-down (after 15 minutes without traffic). The app
  re-seeds itself on startup whenever the database comes up empty, so the demo always returns
  in a usable state with the default learner. All date-based seed data is generated relative to
  the current day, so it never looks stale.
- A cold start can take up to a minute. The UI shows a "Waking up the server…" banner once a
  request has been in flight for three seconds, and retries once on a network failure.
- The production fix (not needed for this assignment) is a paid Render instance with a
  persistent disk, or Postgres — a `DATABASE_URL` change, no code change.

### Troubleshooting

| Symptom                                   | Cause                                 | Fix                                              |
| ----------------------------------------- | ------------------------------------- | ------------------------------------------------ |
| Render: `requirements.txt not found`      | Root Directory unset                  | Set it to `backend`                               |
| Render: `ModuleNotFoundError: app`        | Wrong working directory               | Root Directory `backend` + the start command above |
| Render: "no open ports detected"          | Hard-coded port                       | `--host 0.0.0.0 --port $PORT`                     |
| Browser CORS error                        | Vercel URL missing or trailing slash  | Exact origin in `CORS_ORIGINS`, then redeploy      |
| Frontend calls `localhost` in production  | Env var set after the build           | Set `NEXT_PUBLIC_API_URL`, then **Redeploy**       |
| Vercel build fails fetching data          | Server component fetching at build    | All fetching is client-side; keep it that way      |
| Vercel: "No Next.js version detected"     | Root Directory not `frontend`         | Fix the Root Directory                            |
| Streak does not move after "Simulate next day" | Code bypassed the clock          | Use `app/core/clock.py` everywhere                |
| Local: browser shows "Failed to fetch", `curl` works | Chrome resolves `localhost` to `::1`, uvicorn binds IPv4 | Use `http://127.0.0.1:8000` in `NEXT_PUBLIC_API_URL` |

## AI usage

Built with AI assistance (Claude Code). All code was reviewed, understood and verified by the
author.
