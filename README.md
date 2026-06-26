# Racket Ladder

A full-stack score tracking web app for racket sports — tennis, badminton, squash, pickleball, and anything else with a racket. Create leagues, register players, log Singles and Doubles results, and watch live leaderboards update in real time.

---

## Features

- **JWT Auth** — register/login; only league owners can add players or record results
- **League Management** — create named leagues and share them via a public League ID
- **Singles & Doubles** — flexible match recording for 1v1 or 2v2 with optional score strings (e.g. `21-18, 15-21, 21-19`)
- **Local Leaderboard** — per-league standings with W/L record and win rate, colour-coded by performance
- **Global Leaderboard** — cross-league rankings for every player who has played at least one match, sorted by total wins
- **Dark Glass UI** — teal/indigo gradient theme built with Tailwind CSS, no page reloads

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17 · Spring Boot 3.2 · Spring Data JPA |
| Database | H2 file DB (dev) · PostgreSQL (prod via env vars) |
| Build | Maven 3.8+ |
| Frontend | React 18 · TypeScript · Vite 5 |
| Styling | Tailwind CSS 3 · PostCSS · Autoprefixer |
| HTTP client | Axios (with JWT interceptor) |

---

## Project Structure

```
scoreBoardTracker/
├── backend/
│   ├── src/main/java/dev/racket/
│   │   ├── RacketApplication.java
│   │   ├── controller/
│   │   │   ├── ApiController.java      # leagues, players, matches, leaderboards
│   │   │   └── AuthController.java     # register, login, /me
│   │   ├── model/
│   │   │   ├── AppUser.java
│   │   │   ├── AuthToken.java
│   │   │   ├── League.java
│   │   │   ├── Match.java              # SINGLES or DOUBLES, up to 4 players
│   │   │   └── Player.java
│   │   └── repo/                       # Spring Data repositories (5 total)
│   ├── src/main/resources/
│   │   └── application.properties      # H2 by default, override with env vars for Postgres
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── App.tsx                     # single-page app, all UI state
│   │   ├── api.ts                      # typed Axios wrappers + auth interceptor
│   │   ├── index.css                   # Tailwind directives + custom glass utilities
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.cjs
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Java 17+
- Maven 3.8+
- Node.js 18+

### 1 — Run the backend

```bash
cd backend
mvn spring-boot:run
```

Starts on **http://localhost:8080** with an H2 file database at `./data/racketdb`.  
H2 console available at `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:file:./data/racketdb`).

### 2 — Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on **http://localhost:5173**, calling the backend at `http://localhost:8080/api`.

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Register `{ username, password }` → `{ token, userId, username }` |
| `POST` | `/api/auth/login` | — | Login → same response |
| `GET` | `/api/auth/me` | Bearer | Get current user |

### Leagues

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/leagues` | Bearer | Create league `{ name }` |

### Players

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/players` | Bearer (owner) | Add player `{ name, leagueId }` |

### Matches

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/matches` | Bearer (owner) | Record match — see payload below |
| `GET` | `/api/leagues/{id}/matches` | — | All matches for a league |

**Singles payload**
```json
{
  "leagueId": 1,
  "competitionType": "SINGLES",
  "playerAId": 2,
  "playerBId": 3,
  "winnerId": 2,
  "score": "21-18"
}
```

**Doubles payload**
```json
{
  "leagueId": 1,
  "competitionType": "DOUBLES",
  "playerAId": 2,
  "playerBId": 3,
  "playerCId": 4,
  "playerDId": 5,
  "winnerId": 2,
  "score": "21-18, 15-21, 21-19"
}
```

### Leaderboards

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/leagues/{id}/leaderboard` | — | Per-league standings sorted by wins |
| `GET` | `/api/leaderboard/global` | — | All players across all leagues sorted by total wins |

---

## Configuration

### Backend — `application.properties`

```properties
# Local dev (H2 file)
spring.datasource.url=jdbc:h2:file:./data/racketdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# Production (set these env vars to switch to PostgreSQL)
# DATABASE_URL=jdbc:postgresql://host:5432/dbname
# DB_DRIVER=org.postgresql.Driver
# DB_USERNAME=postgres
# DB_PASSWORD=secret
# DB_DIALECT=org.hibernate.dialect.PostgreSQLDialect

server.port=${PORT:8080}
```

### Frontend

The frontend reads `VITE_API_BASE_URL` at build time (defaults to `http://localhost:8080/api`).  
Create a `.env` file in `frontend/` to override:

```env
VITE_API_BASE_URL=https://your-backend.onrender.com/api
```

---

## Deployment

### Backend (e.g. Render)

```bash
cd backend
mvn clean package
# produces target/racket-backend-0.0.1-SNAPSHOT.jar
java -jar target/racket-backend-0.0.1-SNAPSHOT.jar
```

Set `DATABASE_URL`, `DB_DRIVER`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DIALECT`, and `PORT` as environment variables on your hosting platform.

### Frontend (e.g. Vercel / Netlify)

```bash
cd frontend
npm run build
# output in dist/
```

Set `VITE_API_BASE_URL` to your deployed backend URL before building.

---

## How It Works

1. **Sign up or sign in** to get a JWT token (stored in `localStorage`)
2. **Create a League** — you become its owner; share the League ID with others so they can load it as read-only
3. **Add Players** — only the league owner can register participants
4. **Record Matches** — pick Singles or Doubles, select players, optionally type a score string, choose the winner
5. **Leaderboards update immediately** — local standings show per-league W/L/win-rate; the Global tab ranks everyone across all leagues

---

## License

MIT
