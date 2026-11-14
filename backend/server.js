/**
 * CourtIQ Analytics - Express API Server
 * Course: Applied Database Technologies (ADT) - Spring 2026
 * Team: Juman Das, Linthoi Laishram, Tanmay Pawar, Hiten Kataria
 *
 * Author: Tanmay Pawar (Backend Engineer)
 *
 * Start: node server.js (or npm start)
 * Dev:   npm run dev  (uses nodemon for auto-reload)
 *
 * AI Assistance:
 *   Express middleware structure reviewed using Claude Sonnet 4.6 (Anthropic),
 *   accessed on 2026-04-04.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const express   = require("express");
const cors      = require("cors");
const fs        = require("fs");
const path      = require("path");
const pool      = require("./config/db");

const playersRouter   = require("./routes/players");
const teamsRouter     = require("./routes/teams");
const statsRouter     = require("./routes/stats");
const analyticsRouter = require("./routes/analytics");

const app  = express();
const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// Middleware
// Author: Tanmay Pawar
// ---------------------------------------------------------------------------
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/api/players",   playersRouter);
app.use("/api/teams",     teamsRouter);
app.use("/api/stats",     statsRouter);
app.use("/api/analytics", analyticsRouter);

// Health check endpoint — liveness probe for Render.com deployment monitoring.
// It answers 200 whenever the process is up, so a database outage does not
// make Render restart the service in a loop. The database state is reported
// honestly in the body; data endpoints still fail fast with 500 when the DB
// is down. A one-time database probe runs at startup and logs the result.
// Author: Tanmay Pawar
app.get("/health", async (req, res) => {
  const dbCheck = pool.query("SELECT 1").then(
    () => "connected",
    () => "unreachable"
  );
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve("unreachable"), 2000)
  );
  const database = await Promise.race([dbCheck, timeout]);
  res.json({ status: "ok", database });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`CourtIQ API running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  // One-time database probe so the Render logs show the real DB state at boot.
  pool.query("SELECT 1").then(
    () => console.log("Database: connected"),
    (err) => console.error("Database: unreachable -", err.message)
  );
  // First-run setup: if this database has no CourtIQ tables yet (a fresh
  // free database shared with another demo, for example), create them and
  // load the seed data. Later boots see the tables and skip it, so this
  // never touches an already-seeded database.
  ensureSeeded().catch((err) =>
    console.error("Database seeding failed -", err.message)
  );
});

// Create the CourtIQ tables and load the seed data when they are missing.
// The SQL lives in scripts/ next to this file because Render deploys only
// the backend/ directory, so the repo-root database/ copies are not present
// inside the running service.
async function ensureSeeded() {
  const exists = await pool.query(
    "SELECT count(*) AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teams'"
  );
  if (Number(exists.rows[0].n) > 0) {
    const rows = await pool.query("SELECT count(*) AS n FROM teams");
    if (Number(rows.rows[0].n) > 0) {
      console.log(`Database: CourtIQ tables present (${rows.rows[0].n} teams).`);
      return;
    }
    console.log("Database: tables exist but are empty, loading seed data...");
    const seedSql = fs.readFileSync(path.join(__dirname, "scripts", "seed.sql"), "utf8");
    await pool.query(seedSql);
  } else {
    console.log("Database: no CourtIQ tables found, creating and seeding...");
    const schemaSql = fs.readFileSync(path.join(__dirname, "scripts", "schema.sql"), "utf8");
    await pool.query(schemaSql);
    const seedSql = fs.readFileSync(path.join(__dirname, "scripts", "seed.sql"), "utf8");
    await pool.query(seedSql);
  }
  const teams = await pool.query("SELECT count(*) AS n FROM teams");
  const players = await pool.query("SELECT count(*) AS n FROM players");
  console.log(`Database: seeded (${teams.rows[0].n} teams, ${players.rows[0].n} players).`);
}
