# Deployment Checklist — Racket Ladder

Stack: **Neon** (Postgres) → **Render** (Spring Boot API) → **Vercel** (React frontend)

---

## Step 1 — Push to GitHub

- [ ] Create a repo at github.com (e.g. `scoreBoardTracker`)
- [ ] `git remote add origin https://github.com/YOUR_USERNAME/scoreBoardTracker.git`
- [ ] `git push -u origin main`

---

## Step 2 — Neon (Database)

- [ ] Sign up at https://neon.tech
- [ ] Create project → name it `racket-ladder`
- [ ] Go to **Connection Details** → switch dropdown to **JDBC**
- [ ] Copy and save:
  - `DATABASE_URL` → `jdbc:postgresql://ep-xxx...neon.tech/neondb?sslmode=require`
  - `DB_USERNAME` → (shown in connection details)
  - `DB_PASSWORD` → (shown in connection details)

---

## Step 3 — Render (Backend API)

- [ ] Sign up at https://render.com
- [ ] New → **Blueprint** → connect GitHub repo
- [ ] Render auto-detects `render.yaml` and builds via Docker (`backend/Dockerfile`) → creates service `racket-ladder-api`
- [ ] Go to service **Environment** tab → add secrets:
  - [ ] `DATABASE_URL` = Neon JDBC URL from Step 2
  - [ ] `DB_USERNAME` = Neon username
  - [ ] `DB_PASSWORD` = Neon password
  - [ ] `CORS_ORIGIN` = your Vercel URL (set this **after** Step 4, then redeploy)
- [ ] Click **Deploy** (first Docker build takes ~5–7 min)
- [ ] After deploy, copy the service URL → save as `RENDER_URL`
  - Example: `https://racket-ladder-api.onrender.com`
- [ ] Verify: open `RENDER_URL/api/leaderboard/global` in browser — should return `[]`

> Free tier spins down after 15 min idle (30s cold start). Upgrade to $7/mo Starter to avoid this.

---

## Step 4 — Vercel (Frontend)

> **Note:** Deploy Vercel first to get its URL, then go back and set `CORS_ORIGIN` on Render (Step 3) and trigger a redeploy.



- [ ] Sign up at https://vercel.com
- [ ] New Project → import GitHub repo
- [ ] Set **Root Directory** to `frontend`
- [ ] Framework preset auto-detected as **Vite**
- [ ] Add environment variable:
  - [ ] `VITE_API_BASE_URL` = `https://racket-ladder-api.onrender.com/api`
    (replace with your actual `RENDER_URL/api`)
- [ ] Click **Deploy** (~2 min)
- [ ] Copy the Vercel URL → save as `VERCEL_URL`
  - Example: `https://racket-ladder.vercel.app`

---

## Step 5 — Smoke Test

- [ ] Open `VERCEL_URL` in browser
- [ ] Register a new account
- [ ] Create a league
- [ ] Add players
- [ ] Record a match
- [ ] Check leaderboard updates correctly

---

## Saved Values (fill in as you go)

| Key | Value |
|-----|-------|
| `DATABASE_URL` | |
| `DB_USERNAME` | |
| `DB_PASSWORD` | |
| `RENDER_URL` | |
| `VERCEL_URL` | |
| `CORS_ORIGIN` | (same as `VERCEL_URL`) |
