# Deployment Checklist — Racket Ladder

Stack: **Neon** (Postgres) → **Render** (Spring Boot API) → **Cloudflare Pages** (React frontend)

---

## Step 1 — Push to GitHub ✅

- [x] Repo: https://github.com/divijbalotra0401-code/RacketLadder
- [x] `git push -u origin main` — done

---

## Step 2 — Neon (Database) ✅

- [x] Project created at https://neon.tech
- [x] `DATABASE_URL` → `jdbc:postgresql://ep-orange-recipe-atfnobx5.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require`
- [x] `DB_USERNAME` → `neondb_owner`
- [x] `DB_PASSWORD` → (saved separately — do not commit)

---

## Step 3 — Render (Backend API) ✅

- [x] Sign up at https://render.com
- [x] New → **Web Service** → connect GitHub repo → select `RacketLadder`
- [x] Fill in settings:

  | Setting | Value |
  |---|---|
  | Root Directory | `backend` |
  | Environment | `Docker` |
  | Instance Type | Free |

- [x] Environment variables added:
  - [x] `DATABASE_URL` = `jdbc:postgresql://ep-orange-recipe-atfnobx5.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require`
  - [x] `DB_DRIVER` = `org.postgresql.Driver`
  - [x] `DB_USERNAME` = `neondb_owner`
  - [x] `DB_PASSWORD` = (your Neon password)
  - [x] `DB_DIALECT` = `org.hibernate.dialect.PostgreSQLDialect`
  - [x] `H2_CONSOLE` = `false`
  - [ ] `CORS_ORIGIN` = your Cloudflare Pages URL (set this **after** Step 4, then redeploy)
- [x] Deployed — `RENDER_URL` = `https://racketladder.onrender.com`
- [x] Verified: `https://racketladder.onrender.com/api/leaderboard/global` returns `[]`

> Free tier spins down after 15 min idle (30s cold start). Upgrade to $7/mo Starter to avoid this.

---

## Step 4 — Cloudflare Pages (Frontend)

> **Note:** Deploy Cloudflare Pages first to get its URL, then go back and set `CORS_ORIGIN` on Render (Step 3) and trigger a redeploy.

- [ ] Sign up at https://pages.cloudflare.com
- [ ] Create a project → **Connect to Git** → select `RacketLadder` repo
- [ ] Fill in build settings:

  | Setting | Value |
  |---|---|
  | Root Directory | `frontend` |
  | Framework preset | `Vite` |
  | Build command | `npm run build` |
  | Build output directory | `dist` |

- [ ] Add environment variable:
  - [ ] `VITE_API_BASE_URL` = `https://racketladder.onrender.com/api`
- [ ] Click **Save and Deploy** (~2 min)
- [ ] Copy the Cloudflare Pages URL → save as `CF_URL`
  - Example: `https://racketladder.pages.dev`
- [ ] Go back to Render → **Environment** tab → set `CORS_ORIGIN` = `CF_URL` → **Save** (auto-redeploys)

---

## Step 5 — Smoke Test

- [ ] Open `CF_URL` in browser
- [ ] Register a new account
- [ ] Create a league
- [ ] Add players
- [ ] Record a match
- [ ] Check leaderboard updates correctly

---

## Saved Values (fill in as you go)

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `jdbc:postgresql://ep-orange-recipe-atfnobx5.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `DB_USERNAME` | `neondb_owner` |
| `DB_PASSWORD` | (do not commit) |
| `RENDER_URL` | `https://racketladder.onrender.com` |
| `CF_URL` | (fill in after Step 4) |
| `CORS_ORIGIN` | (same as `CF_URL`) |