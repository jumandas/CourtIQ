/**
 * CourtIQ Analytics - Analytics Query Routes
 * Author: Tanmay Pawar (Backend Engineer)
 *
 * These endpoints back the three visualization panels in the frontend.
 * They correspond directly to the three analytical questions in the proposal.
 *
 * GET /api/analytics/top-players?season=2023&limit=10
 * GET /api/analytics/salary-vs-wins?season=2023
 * GET /api/analytics/efficiency-trends?player_id=5
 * GET /api/analytics/summary                          (dashboard cards)
 *
 * AI Assistance:
 *   Window function SQL reviewed using Claude Sonnet 4.6 (Anthropic), 2026-04-04.
 */

const express = require("express");
const router  = express.Router();
const pool    = require("../config/db");

// -------------------------------------------------------------------------
// GET /api/analytics/top-players
// Analytical Q1: Which players contribute most to team victories? (Win Shares)
// Author: Tanmay Pawar
// Reference: Oliver (2004) [10]; Basketball Reference [2]
// -------------------------------------------------------------------------
router.get("/top-players", async (req, res) => {
  const season = parseInt(req.query.season) || 2023;
  const limit  = Math.min(parseInt(req.query.limit) || 10, 30);

  try {
    const { rows } = await pool.query(
      `SELECT
         RANK() OVER (ORDER BY pss.ws DESC NULLS LAST) AS rank,
         p.player_id,
         p.full_name,
         p.position,
         t.team_name,
         t.abbreviation,
         pss.games_played,
         ROUND(pss.pts_per_game::numeric, 1) AS pts_per_game,
         ROUND(pss.ast_per_game::numeric, 1) AS ast_per_game,
         ROUND(pss.reb_per_game::numeric, 1) AS reb_per_game,
         ROUND(pss.per::numeric, 1)          AS per,
         ROUND(pss.ws::numeric, 2)           AS win_shares,
         ROUND(pss.bpm::numeric, 2)          AS bpm,
         ROUND(pss.vorp::numeric, 2)         AS vorp
       FROM player_season_stats pss
       JOIN players p ON pss.player_id = p.player_id
       JOIN teams   t ON pss.team_id   = t.team_id
       JOIN seasons s ON pss.season_id = s.season_id
       WHERE s.season_year = $1 AND pss.games_played >= 20
       ORDER BY pss.ws DESC NULLS LAST
       LIMIT $2`,
      [season, limit]
    );
    res.json({ season, data: rows });
  } catch (err) {
    console.error("GET /analytics/top-players error:", err.message);
    res.status(500).json({ error: "Failed to fetch top players" });
  }
});

// -------------------------------------------------------------------------
// GET /api/analytics/salary-vs-wins
// Analytical Q3: How does team spending correlate with win percentage?
// Author: Tanmay Pawar
// Source: Salary data from HoopsHype [3]; game results from Kaggle [4]
// -------------------------------------------------------------------------
router.get("/salary-vs-wins", async (req, res) => {
  const season = parseInt(req.query.season) || 2023;

  try {
    const { rows } = await pool.query(
      `SELECT
         t.team_id,
         t.team_name,
         t.abbreviation,
         t.conference,
         ROUND((sal.total_payroll_usd / 1000000.0)::numeric, 2) AS payroll_millions,
         COUNT(g.game_id) AS total_games,
         COUNT(g.game_id) FILTER (
           WHERE (g.home_team_id = t.team_id AND g.home_pts > g.away_pts)
              OR (g.away_team_id = t.team_id AND g.away_pts > g.home_pts)
         ) AS wins,
         ROUND(
           (COUNT(g.game_id) FILTER (
             WHERE (g.home_team_id = t.team_id AND g.home_pts > g.away_pts)
                OR (g.away_team_id = t.team_id AND g.away_pts > g.home_pts)
           ))::numeric / NULLIF(COUNT(g.game_id), 0), 3
         ) AS win_pct
       FROM teams t
       JOIN team_salaries sal ON t.team_id = sal.team_id
       JOIN seasons s ON sal.season_id = s.season_id AND s.season_year = $1
       LEFT JOIN games g ON (g.home_team_id = t.team_id OR g.away_team_id = t.team_id)
                         AND g.season_id = sal.season_id
       GROUP BY t.team_id, t.team_name, t.abbreviation, t.conference, sal.total_payroll_usd
       HAVING COUNT(g.game_id) > 0
       ORDER BY sal.total_payroll_usd DESC`,
      [season]
    );
    res.json({ season, data: rows });
  } catch (err) {
    console.error("GET /analytics/salary-vs-wins error:", err.message);
    res.status(500).json({ error: "Failed to fetch salary data" });
  }
});

// -------------------------------------------------------------------------
// GET /api/analytics/efficiency-trends
// Analytical Q2: How does player efficiency change over seasons?
// Author: Tanmay Pawar
// -------------------------------------------------------------------------
router.get("/efficiency-trends", async (req, res) => {
  const player_id = parseInt(req.query.player_id);
  if (!player_id) {
    return res.status(400).json({ error: "player_id query param is required" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT
         p.full_name,
         s.season_year,
         t.team_name,
         t.abbreviation,
         pss.games_played,
         ROUND(pss.pts_per_game::numeric, 1) AS pts_per_game,
         ROUND((pss.ts_pct * 100)::numeric, 1) AS ts_pct,
         ROUND(pss.per::numeric, 2)            AS per,
         ROUND(pss.ws::numeric, 2)             AS win_shares,
         ROUND(pss.vorp::numeric, 2)           AS vorp,
         ROUND(pss.usg_pct::numeric * 100, 1)  AS usg_pct
       FROM player_season_stats pss
       JOIN players p ON pss.player_id = p.player_id
       JOIN seasons s ON pss.season_id = s.season_id
       JOIN teams   t ON pss.team_id   = t.team_id
       WHERE pss.player_id = $1
       ORDER BY s.season_year`,
      [player_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No stats found for this player" });
    }
    res.json({ player: rows[0].full_name, data: rows });
  } catch (err) {
    console.error("GET /analytics/efficiency-trends error:", err.message);
    res.status(500).json({ error: "Failed to fetch efficiency trends" });
  }
});

// -------------------------------------------------------------------------
// GET /api/analytics/summary
// Dashboard summary counts for stat cards
// Author: Tanmay Pawar
// -------------------------------------------------------------------------
router.get("/summary", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM players)              AS total_players,
        (SELECT COUNT(*) FROM teams)                AS total_teams,
        (SELECT COUNT(*) FROM seasons)              AS total_seasons,
        (SELECT COUNT(*) FROM games)                AS total_games,
        (SELECT MAX(season_year) FROM seasons)      AS latest_season
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

module.exports = router;
