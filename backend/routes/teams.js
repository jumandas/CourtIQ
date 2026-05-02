/**
 * CourtIQ Analytics - Teams CRUD Routes
 * Author: Tanmay Pawar (Backend Engineer)
 *
 * GET    /api/teams          - List all teams
 * GET    /api/teams/:id      - Get team with season salary data
 * POST   /api/teams          - Create a new team
 * PUT    /api/teams/:id      - Update team details
 * DELETE /api/teams/:id      - Delete a team record
 */

const express = require("express");
const router  = express.Router();
const pool    = require("../config/db");

// GET /api/teams — optionally filter by conference
// Author: Tanmay Pawar
router.get("/", async (req, res) => {
  const { conference } = req.query;
  const params = [];
  let sql = "SELECT * FROM teams";
  if (conference) {
    sql += " WHERE conference = $1";
    params.push(conference);
  }
  sql += " ORDER BY conference, team_name";

  try {
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("GET /teams error:", err.message);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// GET /api/teams/:id — team + salary history
// Author: Tanmay Pawar
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const teamQ = await pool.query("SELECT * FROM teams WHERE team_id = $1", [parseInt(id)]);
    if (teamQ.rows.length === 0) return res.status(404).json({ error: "Team not found" });

    const salaryQ = await pool.query(
      `SELECT ts.*, s.season_year FROM team_salaries ts
       JOIN seasons s ON ts.season_id = s.season_id
       WHERE ts.team_id = $1 ORDER BY s.season_year`,
      [parseInt(id)]
    );
    res.json({ team: teamQ.rows[0], salary_history: salaryQ.rows });
  } catch (err) {
    console.error("GET /teams/:id error:", err.message);
    res.status(500).json({ error: "Failed to fetch team" });
  }
});

// POST /api/teams — Author: Tanmay Pawar
router.post("/", async (req, res) => {
  const { team_name, abbreviation, city, conference, division, founded_year } = req.body;
  if (!team_name || !abbreviation || !conference) {
    return res.status(400).json({ error: "team_name, abbreviation, and conference are required" });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO teams (team_name, abbreviation, city, conference, division, founded_year)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [team_name, abbreviation, city, conference, division, founded_year]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Team already exists" });
    res.status(500).json({ error: "Failed to create team" });
  }
});

// PUT /api/teams/:id — Author: Tanmay Pawar
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { team_name, abbreviation, city, conference, division, founded_year } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE teams SET
         team_name    = COALESCE($1, team_name),
         abbreviation = COALESCE($2, abbreviation),
         city         = COALESCE($3, city),
         conference   = COALESCE($4, conference),
         division     = COALESCE($5, division),
         founded_year = COALESCE($6, founded_year)
       WHERE team_id = $7 RETURNING *`,
      [team_name, abbreviation, city, conference, division, founded_year, parseInt(id)]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Team not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update team" });
  }
});

// DELETE /api/teams/:id — Author: Tanmay Pawar
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query("DELETE FROM teams WHERE team_id = $1", [parseInt(id)]);
    if (rowCount === 0) return res.status(404).json({ error: "Team not found" });
    res.json({ message: "Team deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete team" });
  }
});

module.exports = router;
