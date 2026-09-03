# Riverbells Resort — Deployment Guide

This guide deploys the **full stack** (React frontend + Express/MongoDB backend) to
Railway **or** Render, using MongoDB Atlas (or Render's managed Mongo) for the database.

> All the code-level work is already done. Backend reads `PORT`, `MONGODB_URI`,
> `JWT_SECRET`, `CLIENT_URL` and the admin seed credentials from environment variables.
> The frontend reads its API URL from `VITE_API_URL` at **build time**.
> A repo is initialized and `.env` files are git-ignored so secrets never get committed.

---

## Prerequisites (do these once)

1. **A GitHub account** — both hosts deploy straight from GitHub.
2. **A MongoDB database** — either:
   - **MongoDB Atlas** (free M0 tier): https://www.mongodb.com/cloud/atlas
     - Create a cluster → Database Access → add a DB user (read/write)
     - Network Access → **Allow access from anywhere** (`0.0.0.0/0`) so the host can connect
     - Connect → Drivers → copy the connection string
       `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`
   - **OR Render's managed MongoDB** (`Mongo` service, adds ~$7/mo) and copy its internal URL.
3. Push this repo to GitHub:
   ```bash
   cd Riverbells-Resort
   git add -A
   git commit -m "Prepare Riverbells Resort for deployment"
   git branch -M main
   git remote add origin https://github.com/<your-username>/riverbells-resort.git
   git push -u origin main
   ```

Generate the app secrets now (you'll paste these into the host):
```bash
# JWT secret (any length — the longer/random the better):
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# And pick a STRONG ADMIN_PASSWORD for your admin login.
```

---

## Option A — Render (easiest, uses the included `render.yaml` blueprint)

1. Go to https://render.com → **New + → Blueprint**.
2. Connect your GitHub repo. Render reads `render.yaml` and creates **two services**:
   - `riverbells-backend` (Express API)
   - `riverbells-frontend` (static Vite build)
3. Open the **backend** service → **Environment** and set the `sync: false` values:
   - `MONGODB_URI` = your Atlas connection string
   - `JWT_SECRET` = long random string
   - `ADMIN_PASSWORD` = your strong admin password
   - `CLIENT_URL` = your **frontend** public URL (no trailing slash)
   - (Optional) Mail: `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASS`, `RESORT_EMAIL`
4. Open the **frontend** service → **Environment** and set:
   - `VITE_API_URL` = your **backend** public URL **including `/api`**, e.g.
     `https://riverbells-backend.onrender.com/api`
5. **Deploy** → wait for both to go **Live**.
6. Verify: open `https://<backend-url>/api/health` → should return
   `{ "success": true, "message": "Riverbells Resort API is running" }`.

> On first start, the backend auto-seeds the properties (if empty) and creates the
> admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

---

## Option B — Railway

1. Go to https://railway.app → **New Project** → **Deploy from GitHub repo**.
2. Railway uses one service per app. Create **two services** from the same repo, using
   **Root Directory** to point each at the right folder:
   - **Backend service** → Root Directory: `BackEnd`
     - Start command: `npm start`
     - Env: `MONGODB_URI`, `JWT_SECRET`, `ADMIN_PASSWORD`, `CLIENT_URL`, `ADMIN_EMAIL`
     - Optionally a Healthcheck on `/api/health`.
   - **Frontend service** → Root Directory: `FrontEnd`
     - Build command: `npm run build`
     - Publish directory: `dist`
     - **Env:** `VITE_API_URL = <backend-public-url>/api` — this MUST be set, and the build
       re-runs when it changes (Vite bakes it in at build time).
3. Railway auto-injects `PORT`; the backend reads it from the environment.
4. **Networking**: give each service a public domain (Railway → Deployments → Generate Domain).
5. Verify the backend health endpoint and load the frontend domain.

> On Railway, set `CLIENT_URL` to your **frontend** public domain (the frontend calls the API
> from the browser, so the backend must allow that origin via CORS).

---

## Environment variable reference (backend)

| Variable         | Required | Purpose                                                            |
|------------------|----------|--------------------------------------------------------------------|
| `MONGODB_URI`    | Yes      | Mongo connection string                                             |
| `JWT_SECRET`     | Yes      | Signs auth tokens (long random string)                              |
| `CLIENT_URL`     | Yes      | Frontend origin allowed by CORS (no trailing slash)                 |
| `ADMIN_EMAIL`    | No       | Default admin email, only used if no user exists (default `admin@riverbells.com`) |
| `ADMIN_PASSWORD` | Yes*     | **Strong** password for the first admin (seed)                      |
| `JWT_EXPIRES_IN` | No       | `7d` default                                                         |
| `MAIL_*`, `RESORT_EMAIL` | No | SMTP for invoice/email sending — optional                           |

\* Required only at first start (before any user exists).

---

## Common issues

- **403 CORS in the browser** → `CLIENT_URL` must exactly match the frontend domain
  (the one in the address bar, including scheme, no trailing slash).
- **Admin can't log in** → the DB user may not exist. The seed only runs when the `User`
  collection is empty. If a partial seed happened, either seed again
  (`npm run seed` in `BackEnd` against prod) or delete the user from the DB and restart.
- **Frontend shows local fallback URL** → `VITE_API_URL` wasn't set during the build;
  set it on the frontend service and trigger a rebuild.
- **Backend crashes on start** → check the service logs; usually a missing/wrong
  `MONGODB_URI` or a network-access restriction in Atlas.

---

## Production checklist

- [ ] `MONGODB_URI` set & Atlas network access is open
- [ ] `JWT_SECRET` is a long random value
- [ ] `ADMIN_PASSWORD` is strong
- [ ] `CLIENT_URL` matches the frontend domain
- [ ] `VITE_API_URL` set on the frontend build
- [ ] `/api/health` returns 200
- [ ] Frontend loads and the booking form talks to the live API
