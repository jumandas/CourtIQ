# CourtIQ Analytics

**NBA Player & Team Performance Analytics Platform**  
Applied Database Technologies (ADT) — Spring 2026  
Team: Juman Das · Tanmay Pawar · Hiten Kataria

---

## Live Demo

| Resource | URL |
|---|---|
| Public Dashboard | https://court-iq-xi.vercel.app/ |
| REST API | https://courtiq-backend-ck8v.onrender.com |
| Health check | https://courtiq-backend-ck8v.onrender.com/health |
| Sample analytics | https://courtiq-backend-ck8v.onrender.com/api/analytics/summary |

> The backend runs on Render's free tier and sleeps after ~15 min of inactivity.
> First request after a cold start takes 20–30 seconds; refresh once if the dashboard appears empty.

---

## Project Overview

CourtIQ Analytics answers three core NBA analytics questions through an interactive dashboard backed by a normalized PostgreSQL database:

1. **Player Win Contribution** — Which players contribute most to team victories? (Win Shares leaderboard)
2. **Seasonal Efficiency Trends** — How does player efficiency change over seasons? (PER, TS%, WS line chart)
3. **Salary-to-Performance ROI** — How does team spending correlate with win percentage? (scatter plot)

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Database | PostgreSQL 15 on Supabase           |
| ETL      | Python 3.11 · pandas · psycopg2     |
| Backend  | Node.js · Express · node-postgres   |
| Frontend | React 18 · Vite · Recharts          |

---

## Quick Start

### 1. Database Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Copy your connection string from **Settings → Database → URI**
3. Copy `.env.example` → `.env` and fill in `DATABASE_URL`
4. Run the schema and seed data against your Supabase project:

```bash
# Using psql (install PostgreSQL tools if needed)
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seed.sql
```

Or paste the contents of `schema.sql` and `seed.sql` into the **Supabase SQL Editor**.

### 2. Load Full Dataset (Optional)

Download the CSV files from Kaggle and place them in `etl/data/`:

| File | Source |
|------|--------|
| `Player Per Game.csv` | [sumitrodatta/nba-aba-baa-stats](https://www.kaggle.com/datasets/sumitrodatta/nba-aba-baa-stats) |
| `Advanced.csv` | Same dataset |
| `games.csv` | [nathanlauga/nba-games](https://www.kaggle.com/datasets/nathanlauga/nba-games) |
| `teams.csv` | Same dataset |

Then run:
```bash
cd etl
pip install -r requirements.txt
python etl_pipeline.py
```

### 3. Backend API

```bash
cd backend
npm install
npm run dev        # starts on http://localhost:3001
```

Test the connection: `curl http://localhost:3001/health`

### 4. Frontend

```bash
cd frontend
npm install
npm run dev        # opens http://localhost:5173
```

---

## API Endpoints

### Players
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/players?search=&position=&season=` | List/search players |
| GET | `/api/players/:id` | Player + career stats |
| POST | `/api/players` | Create player |
| PUT | `/api/players/:id` | Update player |
| DELETE | `/api/players/:id` | Delete player |

### Teams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams?conference=` | List teams |
| GET | `/api/teams/:id` | Team + salary history |
| POST/PUT/DELETE | `/api/teams[/:id]` | CRUD |

### Analytics
| Endpoint | Chart |
|----------|-------|
| `GET /api/analytics/top-players?season=2023` | Win Shares bar chart |
| `GET /api/analytics/salary-vs-wins?season=2023` | Salary scatter plot |
| `GET /api/analytics/efficiency-trends?player_id=5` | Efficiency line chart |
| `GET /api/analytics/summary` | Dashboard stat cards |

---

## Database Schema

Six tables in Third Normal Form (3NF):

```
players ──< player_season_stats >── teams
                    │
                 seasons
teams ──< games >── seasons
teams ──< team_salaries >── seasons
```

See `database/schema.sql` for full DDL with constraints and indexes.

---

## Contribution Summary

| Name | Role | Contributions |
|------|------|---------------|
| Juman Das | Frontend Lead | React dashboard, Recharts visualizations, CRUD modals, responsive UI |
| Linthoi Laishram | Database Architect | PostgreSQL schema design, DDL, indexes, data constraints |
| Tanmay Pawar | Backend Engineer | Express REST API, parameterized queries, CRUD routes, analytics endpoints |
| Hiten Kataria | Data Engineer | Python ETL pipeline, CSV preprocessing, data normalization, seed data |

---

## Acknowledgements

- Player statistics and team data sourced from **Basketball Reference** (Sports Reference LLC), used under fair academic use for a non-commercial course project.
- Salary data courtesy of **HoopsHype** publicly accessible historical records.
- Game-level data from the **Kaggle NBA Games dataset** by Nathan Lauga.
- Player stats from the **Kaggle NBA/ABA/BAA Stats dataset** by Sumit Rodatta.

## AI Assistance

Portions of this project were developed with assistance from **Claude Sonnet 4.6** (Anthropic), accessed on 2026-04-04 and 2026-04-05, for:
- SQL schema constraint suggestions and query formatting
- Python ETL pipeline structure (psycopg2 bulk insert patterns)
- Express middleware and route organization
- React component and Recharts configuration

All analytical logic, database design decisions, business rules, and data mappings were designed by the project team.
