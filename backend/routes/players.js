/**
 * CourtIQ Analytics - Players CRUD Routes
 * Author: Tanmay Pawar (Backend Engineer)
 *
 * GET    /api/players          - List players with optional search & filters
 * GET    /api/players/:id      - Get single player with career stats
 * POST   /api/players          - Create a new player
 * PUT    /api/players/:id      - Update player details
 * DELETE /api/players/:id      - Delete a player record
 *
 * AI Assistance:
 *   Parameterized query patterns reviewed using Claude Sonnet 4.6 (Anthropic),
 *   accessed on 2026-04-04. All business logic by Tanmay Pawar.
 */

const express = require("express");
const router  = express.Router();
const pool    = require("../config/db");

// -------------------------------------------------------------------------
// GET /api/players
// Supports ?search=, ?position=, ?season=, ?page=, ?limit=
// Author: Tanmay Pawar
// -------------------------------------------------------------------------
router.get("/", async (req, res) => {
  const { search = "", position, season, page = 1, limit = 25 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Build dynamic WHERE clause with parameterized inputs (prevents SQL injection)
  const conditions = [];
  const params = [];
  let i = 1;

  if (search) {
    conditions.push(`p.full_name ILIKE $${i++}`);
    params.push(`%${search}%`);
  }
  if (position) {
    conditions.push(`p.position = $${i++}`);
    params.push(position);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  // If season filter provided, join with player_season_stats
  // Author: Tanmay Pawar
  let sql;
  if (season) {
    params.push(parseInt(season));
    sql = `
      SELECT DISTINCT
        p.player_id, p.full_name, p.birth_year, p.position,
        p.height_in, p.weight_lbs, p.draft_year, p.draft_pick, p.country,
        pss.pts_per_game, pss.ast_per_game, pss.reb_per_game,
        pss.per, pss.ws, t.abbreviation AS team_abbr
      FROM players p
      JOIN player_season_stats pss ON p.player_id = pss.player_id
      JOIN seasons s ON pss.season_id = s.season_id AND s.season_year = $${i++}
      JOIN teams   t ON pss.team_id   = t.team_id
      ${whereClause}
      ORDER BY pss.ws DESC NULLS LAST
      LIMIT $${i++} OFFSET $${i++}
    `;
  } else {
    sql = `
      SELECT p.player_id, p.full_name, p.birth_year, p.position,
             p.height_in, p.weight_lbs, p.draft_year, p.draft_pick, p.country
      FROM players p
      ${whereClause}
      ORDER BY p.full_name
      LIMIT $${i++} OFFSET $${i++}
    `;
  }
  params.push(parseInt(limit), offset);

  try {
    const { rows } = await pool.query(sql, params);
    res.json({ data: rows, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error("GET /players error:", err.message);
    res.status(500).json({ error: "Failed to fetch players" });
  }
});

// -------------------------------------------------------------------------
// GET /api/players/:id
// Returns player with all career season stats
// Author: Tanmay Pawar
// -------------------------------------------------------------------------
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const playerQ = await pool.query(
      "SELECT * FROM players WHERE player_id = $1",
      [parseInt(id)]
    );
    if (playerQ.rows.length === 0) {
      return res.status(404).json({ error: "Player not found" });
    }

    const statsQ = await pool.query(
      `SELECT pss.*, s.season_year, t.team_name, t.abbreviation
       FROM player_season_stats pss
       JOIN seasons s ON pss.season_id = s.season_id
       JOIN teams   t ON pss.team_id   = t.team_id
       WHERE pss.player_id = $1
       ORDER BY s.season_year`,
      [parseInt(id)]
    );

    res.json({ player: playerQ.rows[0], career_stats: statsQ.rows });
  } catch (err) {
    console.error("GET /players/:id error:", err.message);
    res.status(500).json({ error: "Failed to fetch player" });
  }
});

// -------------------------------------------------------------------------
// POST /api/players
// Create a new player record
// Author: Tanmay Pawar
// -------------------------------------------------------------------------
router.post("/", async (req, res) => {
  const { full_name, birth_year, position, height_in, weight_lbs,
          draft_year, draft_pick, country = "USA" } = req.body;

  if (!full_name) {
    return res.status(400).json({ error: "full_name is required" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO players
         (full_name, birth_year, position, height_in, weight_lbs, draft_year, draft_pick, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [full_name, birth_year, position, height_in, weight_lbs, draft_year, draft_pick, country]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /players error:", err.message);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Player already exists" });
    }
    res.status(500).json({ error: "Failed to create player" });
  }
});

// -------------------------------------------------------------------------
// PUT /api/players/:id
// Update player biographical data
// Author: Tanmay Pawar
// -------------------------------------------------------------------------
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { full_name, birth_year, position, height_in, weight_lbs,
          draft_year, draft_pick, country } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE players SET
         full_name   = COALESCE($1, full_name),
         birth_year  = COALESCE($2, birth_year),
         position    = COALESCE($3, position),
         height_in   = COALESCE($4, height_in),
         weight_lbs  = COALESCE($5, weight_lbs),
         draft_year  = COALESCE($6, draft_year),
         draft_pick  = COALESCE($7, draft_pick),
         country     = COALESCE($8, country)
       WHERE player_id = $9
       RETURNING *`,
      [full_name, birth_year, position, height_in, weight_lbs,
       draft_year, draft_pick, country, parseInt(id)]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Player not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("PUT /players/:id error:", err.message);
    res.status(500).json({ error: "Failed to update player" });
  }
});

// -------------------------------------------------------------------------
// DELETE /api/players/:id
// Author: Tanmay Pawar
// -------------------------------------------------------------------------
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM players WHERE player_id = $1",
      [parseInt(id)]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: "Player not found" });
    }
    res.json({ message: "Player deleted successfully" });
  } catch (err) {
    console.error("DELETE /players/:id error:", err.message);
    res.status(500).json({ error: "Failed to delete player" });
  }
});

module.exports = router;
