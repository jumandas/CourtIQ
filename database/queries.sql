-- =============================================================================
-- CourtIQ Analytics - Analytical Queries & CRUD Demonstrations
-- Course: Applied Database Technologies (ADT) - Spring 2026
-- Team: Juman Das, Linthoi Laishram, Tanmay Pawar, Hiten Kataria
--
-- Run schema.sql and seed.sql before executing these queries.
--
-- AI Assistance:
--   Window function syntax and query optimization reviewed using
--   Claude Sonnet 4.6 (Anthropic), accessed on 2026-04-04.
--   All analytical logic and business rules designed by the team.
-- =============================================================================


-- =============================================================================
-- SECTION 1: READ QUERIES (SELECT)
-- =============================================================================

-- -------------------------------------------------------------------------
-- Query 1: Top 10 Players by Win Shares in a Given Season
-- Analytical Question 1: Which players contribute most to team victories?
-- Uses Win Shares (WS) as defined by Basketball Reference [2] and Oliver (2004) [10]
-- Author: Tanmay Pawar
-- -------------------------------------------------------------------------
SELECT
    RANK() OVER (ORDER BY pss.ws DESC NULLS LAST) AS rank,
    p.full_name,
    t.team_name,
    t.abbreviation,
    p.position,
    pss.games_played,
    pss.pts_per_game,
    pss.ast_per_game,
    pss.reb_per_game,
    ROUND(pss.per, 2)       AS per,
    ROUND(pss.ws, 2)        AS win_shares,
    ROUND(pss.bpm, 2)       AS box_plus_minus,
    ROUND(pss.vorp, 2)      AS vorp
FROM player_season_stats pss
JOIN players p ON pss.player_id = p.player_id
JOIN teams   t ON pss.team_id   = t.team_id
JOIN seasons s ON pss.season_id = s.season_id
WHERE s.season_year = 2023           -- Change year to explore different seasons
  AND pss.games_played >= 20         -- Filter out injury-shortened seasons
ORDER BY pss.ws DESC NULLS LAST
LIMIT 10;


-- -------------------------------------------------------------------------
-- Query 2: Team Salary vs Win Percentage (Salary ROI Analysis)
-- Analytical Question 3: How does team spending correlate with performance?
-- Author: Tanmay Pawar
-- Source: Salary data from HoopsHype [3], game results from Kaggle [4]
-- -------------------------------------------------------------------------
SELECT
    t.team_name,
    t.abbreviation,
    t.conference,
    ROUND(sal.total_payroll_usd / 1e6, 2)          AS payroll_millions,
    COUNT(g.game_id)                                AS total_games,
    COUNT(g.game_id) FILTER (
        WHERE (g.home_team_id = t.team_id AND g.home_pts > g.away_pts)
           OR (g.away_team_id = t.team_id AND g.away_pts > g.home_pts)
    )                                               AS wins,
    ROUND(
        COUNT(g.game_id) FILTER (
            WHERE (g.home_team_id = t.team_id AND g.home_pts > g.away_pts)
               OR (g.away_team_id = t.team_id AND g.away_pts > g.home_pts)
        )::NUMERIC / NULLIF(COUNT(g.game_id), 0), 3
    )                                               AS win_pct
FROM teams t
JOIN team_salaries sal ON t.team_id = sal.team_id
JOIN seasons s          ON sal.season_id = s.season_id
LEFT JOIN games g       ON (g.home_team_id = t.team_id OR g.away_team_id = t.team_id)
                        AND g.season_id = sal.season_id
WHERE s.season_year = 2023
GROUP BY t.team_id, t.team_name, t.abbreviation, t.conference, sal.total_payroll_usd
HAVING COUNT(g.game_id) > 0
ORDER BY win_pct DESC;


-- -------------------------------------------------------------------------
-- Query 3: Player Efficiency Trends Across Seasons (Line Chart Data)
-- Analytical Question 2: How does player efficiency change over seasons?
-- Uses LAG() window function to show year-over-year PER change
-- Author: Tanmay Pawar
-- Source: Basketball Reference advanced metrics [2]
-- -------------------------------------------------------------------------
SELECT
    p.full_name,
    s.season_year,
    t.team_name,
    t.abbreviation,
    pss.games_played,
    ROUND(pss.pts_per_game, 1)  AS pts_per_game,
    ROUND(pss.ts_pct * 100, 1)  AS ts_pct,
    ROUND(pss.per, 2)            AS per,
    ROUND(pss.ws, 2)             AS win_shares,
    ROUND(pss.vorp, 2)           AS vorp,
    -- Year-over-year PER change using LAG window function
    ROUND(
        pss.per - LAG(pss.per) OVER (
            PARTITION BY pss.player_id
            ORDER BY s.season_year
        ), 2
    )                            AS per_change_yoy
FROM player_season_stats pss
JOIN players p ON pss.player_id = p.player_id
JOIN teams   t ON pss.team_id   = t.team_id
JOIN seasons s ON pss.season_id = s.season_id
WHERE pss.player_id = 5           -- Change to any player_id (5 = Nikola Jokic)
ORDER BY s.season_year;


-- -------------------------------------------------------------------------
-- Query 4: Conference Leaderboard by Average Win Shares
-- Bonus analytical query comparing Eastern vs Western conferences
-- Author: Hiten Kataria
-- -------------------------------------------------------------------------
SELECT
    t.conference,
    t.division,
    COUNT(DISTINCT p.player_id)    AS num_players,
    ROUND(AVG(pss.pts_per_game), 2) AS avg_pts,
    ROUND(AVG(pss.per), 2)         AS avg_per,
    ROUND(AVG(pss.ws), 2)          AS avg_win_shares,
    ROUND(MAX(pss.ws), 2)          AS max_win_shares
FROM player_season_stats pss
JOIN players p ON pss.player_id = p.player_id
JOIN teams   t ON pss.team_id   = t.team_id
JOIN seasons s ON pss.season_id = s.season_id
WHERE s.season_year = 2023
  AND pss.games_played >= 20
GROUP BY t.conference, t.division
ORDER BY t.conference, avg_win_shares DESC;


-- =============================================================================
-- SECTION 2: INSERT (CREATE) OPERATIONS
-- =============================================================================

-- -------------------------------------------------------------------------
-- Insert a new player (e.g., Victor Wembanyama drafted 2023)
-- Author: Tanmay Pawar
-- -------------------------------------------------------------------------
INSERT INTO players (full_name, birth_year, position, height_in, weight_lbs, draft_year, draft_pick, country)
VALUES ('Victor Wembanyama', 2004, 'C', 88, 210, 2023, 1, 'France')
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Insert a new season
-- Author: Tanmay Pawar
-- -------------------------------------------------------------------------
INSERT INTO seasons (season_year, start_date, end_date, num_games)
VALUES (2024, '2023-10-24', '2024-06-17', 82)
ON CONFLICT (season_year) DO NOTHING;


-- =============================================================================
-- SECTION 3: UPDATE OPERATIONS
-- =============================================================================

-- -------------------------------------------------------------------------
-- Update a player's stats after a trade (team change mid-season)
-- Author: Tanmay Pawar
-- -------------------------------------------------------------------------
UPDATE player_season_stats
SET
    pts_per_game  = 27.5,
    ast_per_game  = 7.2,
    reb_per_game  = 9.1,
    ws            = 8.9,
    bpm           = 6.1,
    games_played  = 58
WHERE player_id  = 8           -- Luka Doncic
  AND season_id  = 5           -- 2022-23 season
  AND team_id    = 16;         -- Dallas Mavericks

-- -------------------------------------------------------------------------
-- Update team salary data for a season
-- Author: Hiten Kataria
-- -------------------------------------------------------------------------
UPDATE team_salaries
SET
    total_payroll_usd = 200000000,
    luxury_tax_bill   = 30000000
WHERE team_id   = 2            -- Boston Celtics
  AND season_id = 5;           -- 2022-23 season


-- =============================================================================
-- SECTION 4: DELETE OPERATIONS
-- =============================================================================

-- -------------------------------------------------------------------------
-- Delete a player's season stats (e.g., season entry error)
-- Uses conditional delete to avoid accidental mass deletion
-- Author: Tanmay Pawar
-- -------------------------------------------------------------------------
DELETE FROM player_season_stats
WHERE player_id = (SELECT player_id FROM players WHERE full_name = 'Victor Wembanyama')
  AND season_id = 5;    -- Only removes a specific season entry, not the player record

-- -------------------------------------------------------------------------
-- Delete a team salary record (if data was entered for wrong season)
-- Author: Hiten Kataria
-- -------------------------------------------------------------------------
DELETE FROM team_salaries
WHERE team_id   = 28           -- Sacramento Kings
  AND season_id = 5;           -- 2022-23 season


-- =============================================================================
-- SECTION 5: INDEX USAGE VERIFICATION
-- Shows query plan confirming indexes are being used
-- Author: Linthoi Laishram
-- =============================================================================
EXPLAIN ANALYZE
SELECT p.full_name, pss.ws
FROM player_season_stats pss
JOIN players p ON pss.player_id = p.player_id
WHERE pss.season_id = 5
ORDER BY pss.ws DESC NULLS LAST
LIMIT 10;

-- =============================================================================
-- End of Queries
-- =============================================================================
