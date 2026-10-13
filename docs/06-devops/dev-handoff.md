# Developer → DevOps Handoff: Life-OS

> **From:** Developer | **To:** DevOps | **Date:** 2026-10-13 | **Jira:** HT-10
> **Status:** v2. Fixes applied 2026-10-13 for DB fallback, seed user, and API URL / CORS (issues #1, #2, #3, #5, #6, #9).

---

## 1. Build & start (production)

Monorepo with npm workspaces: `shared/` (types), `client/` (React + Vite), `server/` (Express + TypeScript).

| Step | Command (run from repo root) | Output |
|---|---|---|
| Install | `npm ci` | uses `package-lock.json`, so it is reproducible |
| Build all | `npm run build` | builds `shared` → `client` → `server` in that order |
| Frontend artifact | — | `client/dist/` holds **static files only** (HTML/JS/CSS) |
| Backend artifact | — | `server/dist/`; run it with Node |
| Start backend | `npm run start` (= `node server/dist/index.js`) | listens on `PORT` |

- ❌ **Never** use `npm run dev` or `./start.sh` on a server. They're for local development only (file watching, hot reload).
- The backend **does not serve the frontend**. `client/dist/` must be served by a web server or proxy (or a CDN later).
- The server imports the `shared` workspace at runtime, so `shared/dist` must exist next to it.

## 2. Node version

- Tested locally on **Node 18.20.8**, and `engines` says `>=18`.
- ⚠️ Node 18 is **end-of-life**, and some dependencies already warn: `Using NodeJS below 20.19.0`.
- ❌ **Server unit tests (`vitest`) do not start on Node 18** (`node:util` has no export `styleText`). They need Node 20+. Build and lint still work on 18.
- **Recommendation:** run on a current **LTS** release. Pinning the exact version for build and runtime is a DevOps decision.

## 3. Database

- **MongoDB** via Mongoose. Connection string comes from `MONGODB_URI`.
- Connection timeout: 5 seconds.
- ✅ **MongoDB only, no fallback (changed 2026-10-13, DevOps request).** If MongoDB is unreachable at startup, the app logs `💀 MongoDB connection failed. Shutting down.` and **exits with code 1**. Your process manager (Docker restart policy / systemd) is expected to restart it.
  - Local development now also needs a running MongoDB (for example a local container).
- If MongoDB drops **after** startup, Mongoose reconnects automatically. While it's down, API calls fail and `/health` returns **503**.
- **Auto-seed:** on first start, **if the DB is empty and both `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are set**, the app creates an admin user (username `admin`) plus demo habits, tasks and journal data. If either variable is missing, it logs a warning and skips seeding.
  - ⚠️ The app has **no roles**. "admin" is just a normal user named admin, with no extra permissions.
  - ⚠️ Login requires an **email address**, so `SEED_ADMIN_EMAIL` must be a valid email (e.g. `admin@example.com`).
  - ⚠️ `npm run seed --workspace=server` **deletes all existing data** before seeding. Never run it against production.

## 4. Environment variables

Config lives in `server/.env` (template: `server/.env.example`). Real env vars override the file.

| Variable | Required | Secret | Default if missing | Notes |
|---|---|---|---|---|
| `PORT` | no | no | `5000` | |
| `NODE_ENV` | **yes** in prod | no | (unset) | `production` changes logging (see §6) |
| `MONGODB_URI` | **yes** | **yes** (has credentials) | `mongodb://localhost:27017/life-os` | |
| `JWT_SECRET` | **yes** | **yes** | ⚠️ `dev-secret-change-in-production` | Signs login tokens |
| `CORS_ORIGIN` | only if frontend is on another domain | no | (unset = same-origin only) | Comma-separated, e.g. `https://app.example.com` |
| `SEED_ADMIN_EMAIL` | no | no | (unset = no seeding) | Valid email |
| `SEED_ADMIN_PASSWORD` | no | **yes** | (unset = no seeding) | Min 8 characters |

**Frontend (build-time, not runtime):**

| Variable | Required | Default | Notes |
|---|---|---|---|
| `VITE_API_URL` | no | `/api` (same domain) | Baked into `client/dist` during `npm run build`. Changing it means **rebuilding** the frontend |
| `AI_PROVIDER` | no | no | `huggingface` | `huggingface` or `gemini` |
| `HF_TOKEN` | if provider = huggingface | **yes** | — | |
| `HF_MODEL` | no | no | built-in default | |
| `GEMINI_API_KEY` | if provider = gemini | **yes** | — | |

⚠️ `docs/06-devops/deployment-runbook.md` lists different variables (`EMAIL_API_KEY`, `APP_BASE_URL`, `AI_PROVIDER_API_KEY`) that **the code does not use**. This doc is the source of truth (see HT-12).

## 5. Port & health check

| | Backend | Frontend (dev only) |
|---|---|---|
| Port | `5000` (`PORT`) | `5173` (Vite dev server, not used in prod) |
| Health | `GET /health` → `200 {"status":"ok","db":"up",...}` or **`503`** `{"status":"error","db":"down",...}` | — |
| API prefix | `/api/*` | — |

✅ `/health` now includes the database connection state, so it's safe to use for load balancer / container health checks.

## 6. Logs

- Logs go to **stdout/stderr** only, with no log files. Collect them from the process or container output.
- Format: plain text with `[INFO]`, `[WARN]`, `[ERROR]` and `[DEBUG]` prefixes, not JSON.
- ⚠️ With `NODE_ENV=production`, **INFO and DEBUG are suppressed**. You'll only see WARN and ERROR, not even the "Server running" line.

## 7. Frontend ↔ backend

✅ **Fixed 2026-10-13.** The hard-coded `http://localhost:5000/api` is gone. Both setups are now supported; DevOps chooses:

| | **A. Same domain (default)** | **B. Separate API domain** |
|---|---|---|
| Example | `https://clinic.local/` + `https://clinic.local/api` | `https://app.example.com` → `https://api.example.com/api` |
| Frontend build | nothing to set (uses `/api`) | `VITE_API_URL=https://api.example.com/api` **at build time** |
| Backend | `CORS_ORIGIN` unset | `CORS_ORIGIN=https://app.example.com` |
| Infra | reverse proxy routes `/api` → backend:5000, everything else → `client/dist` | two hostnames, the browser calls the API directly |

- **CORS** is now **locked down**: only origins listed in `CORS_ORIGIN` may call the API from a browser. Unset means same-origin only.
- In local dev, the Vite proxy forwards `/api` → `localhost:5000`, so no CORS setup is needed.

## 8. Known issues / risks

| # | Issue | Impact | Owner |
|---|---|---|---|
| 1 | ~~Hard-coded `localhost` API URL~~ | ✅ Fixed: `VITE_API_URL` / relative `/api` | — |
| 2 | ~~Silent in-memory DB fallback~~ | ✅ Fixed: app exits if MongoDB is unreachable | — |
| 3 | ~~`mongodb-memory-server` imported by prod code~~ | ✅ Fixed: package removed | — |
| 4 | `JWT_SECRET` falls back to a public default | Anyone could forge login tokens if the variable is missing | Dev: fail at startup if missing in prod |
| 5 | ~~Auto-seed demo user with a hard-coded password~~ | ✅ Fixed: seed credentials from env, seeding off unless set | — |
| 6 | ~~`/health` doesn't check the DB~~ | ✅ Fixed: 503 when the DB is down | — |
| 7 | No graceful shutdown on `SIGTERM` | In-flight requests dropped on deploy or stop | Dev |
| 8 | INFO logs hidden in production; plain-text format | Harder troubleshooting and log parsing | Dev + DevOps (agree on format) |
| 9 | ~~CORS open to all origins~~ | ✅ Fixed: `CORS_ORIGIN` allowlist | — |
| 10 | Node 18 EOL; server unit tests fail to start on Node 18 | No security patches; CI test stage will fail | DevOps (runtime) |
| 11 | AI endpoints rate-limited per IP (10/min) | Behind a proxy, every user may share one IP | Dev + DevOps (proxy headers) |
