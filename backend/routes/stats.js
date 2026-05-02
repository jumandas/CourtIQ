/**
 * CourtIQ Analytics - Player Season Stats CRUD Routes
 * Author: Tanmay Pawar (Backend Engineer)
 *
 * GET    /api/stats?player_id=&season=  - Query stats with filters
 * POST   /api/stats                     - Add a stat record
 * PUT    /api/stats/:player_id/:season_id/:team_id - Update stats
 * DELETE /api/stats/:player_id/:season_id/:team_id - Delete stats
 */

const express = require("express");
const router  = express.Router();
const pool    = require("../config/db");

// GET /api/stats — Author: Tanmay Pawar
router.get("/", async (req, res) => {
  const { player_id, season, team_id } = req.query;
  const conditions = [];
  const params = [];
  let i = 1;

  if (player_id) { conditions.push(`pss.player_id = $${i++}`); params.push(parseInt(player_id)); }
  if (season)    { conditions.push(`s.season_year = $${i++}`); params.push(parseInt(season)); }
  if (team_id)   { conditions.push(`pss.team_id = $${i++}`);   params.push(parseInt(team_id)); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const { rows } = await pool.query(
      `SELECT pss.*, p.full_name, s.season_year, t.team_name, t.abbreviation
       FROM player_season_stats pss
       JOIN players p ON pss.player_id = p.player_id
       JOIN seasons s ON pss.season_id = s.season_id
       JOIN teams   t ON pss.team_id   = t.team_id
       ${where}
       ORDER BY s.season_year DESC, pss.ws DESC NULLS LAST`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// POST /api/stats — Author: Tanmay Pawar
router.post("/", async (req, res) => {
  const { player_id, season_id, team_id, games_played, games_started, minutes_pg,
          pts_per_game, ast_per_game, reb_per_game, stl_per_game, blk_per_game,
          ts_pct, per, ws, bpm, vorp, usg_pct } = req.body;

  if (!player_id || !season_id || !team_id) {
    return res.status(400).json({ error: "player_id, season_id, and team_id are required" });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO player_season_stats
         (player_id, season_id, team_id, games_played, games_started, minutes_pg,
          pts_per_game, ast_per_game, reb_per_game, stl_per_game, blk_per_game,
          ts_pct, per, ws, bpm, vorp, usg_pct)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (player_id, season_id, team_id) DO UPDATE SET
         pts_per_game = EXCLUDED.pts_per_game,
         ws = EXCLUDED.ws, bpm = EXCLUDED.bpm
       RETURNING *`,
      [player_id, season_id, team_id, games_played, games_started, minutes_pg,
       pts_per_game, ast_per_game, reb_per_game, stl_per_game, blk_per_game,
       ts_pct, per, ws, bpm, vorp, usg_pct]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create stat record" });
  }
});

// PUT /api/stats/:player_id/:season_id/:team_id — Author: Tanmay Pawar
router.put("/:player_id/:season_id/:team_id", async (req, res) => {
  const { player_id, season_id, team_id } = req.params;
  const updates = req.body;
  const setClauses = Object.keys(updates)
    .map((k, i) => `${k} = $${i + 4}`)
    .join(", ");

  if (!setClauses) return res.status(400).json({ error: "No fields to update" });

  try {
    const { rows } = await pool.query(
      `UPDATE player_season_stats SET ${setClauses}
       WHERE player_id = $1 AND season_id = $2 AND team_id = $3
       RETURNING *`,
      [parseInt(player_id), parseInt(season_id), parseInt(team_id), ...Object.values(updates)]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Stat record not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update stats" });
  }
});

// DELETE /api/stats/:player_id/:season_id/:team_id — Author: Tanmay Pawar
router.delete("/:player_id/:season_id/:team_id", async (req, res) => {
  const { player_id, season_id, team_id } = req.params;
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM player_season_stats WHERE player_id=$1 AND season_id=$2 AND team_id=$3",
      [parseInt(player_id), parseInt(season_id), parseInt(team_id)]
    );
    if (rowCount === 0) return res.status(404).json({ error: "Stat record not found" });
    res.json({ message: "Stat record deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete stats" });
  }
});

module.exports = router;
