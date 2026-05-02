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

// Health check endpoint — useful for Render.com deployment monitoring
// Author: Tanmay Pawar
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "unreachable" });
  }
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
});
