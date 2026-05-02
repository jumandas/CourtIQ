-- =============================================================================
-- CourtIQ Analytics - Database Schema (DDL)
-- Course: Applied Database Technologies (ADT) - Spring 2026
-- Team: Juman Das, Linthoi Laishram, Tanmay Pawar, Hiten Kataria
--
-- Database: PostgreSQL 15 (hosted on Supabase)
-- Run this script first to initialize the full schema.
--
-- AI Assistance:
--   Schema structure and constraint logic designed by the team;
--   portions reviewed and refined using Claude Sonnet 4.6 (Anthropic),
--   accessed on 2026-04-04, for formatting and constraint suggestions.
-- =============================================================================

-- Drop tables in reverse dependency order for clean re-runs
-- Author: Linthoi Laishram (Database Architect)
DROP TABLE IF EXISTS team_salaries      CASCADE;
DROP TABLE IF EXISTS games              CASCADE;
DROP TABLE IF EXISTS player_season_stats CASCADE;
DROP TABLE IF EXISTS seasons            CASCADE;
DROP TABLE IF EXISTS players            CASCADE;
DROP TABLE IF EXISTS teams              CASCADE;

-- =============================================================================
-- TABLE: teams
-- Stores NBA franchise information.
-- Author: Linthoi Laishram
-- Source: Basketball Reference [2], Kaggle NBA Stats dataset [1]
-- =============================================================================
CREATE TABLE teams (
    team_id      SERIAL       PRIMARY KEY,
    team_name    VARCHAR(100) NOT NULL,
    abbreviation CHAR(3)      NOT NULL,
    city         VARCHAR(100) NOT NULL,
    -- Constraint: Only valid NBA conferences allowed
    conference   VARCHAR(10)  NOT NULL CHECK (conference IN ('Eastern', 'Western')),
    division     VARCHAR(20)  NOT NULL,
    founded_year INT          CHECK (founded_year >= 1940 AND founded_year <= 2010),

    -- Uniqueness constraints: team names and abbreviations must be unique
    CONSTRAINT uq_team_name    UNIQUE (team_name),
    CONSTRAINT uq_abbreviation UNIQUE (abbreviation)
);

-- Index for frequent lookups by conference/division (used in analytics queries)
-- Author: Linthoi Laishram
CREATE INDEX idx_teams_conference ON teams (conference);

-- =============================================================================
-- TABLE: players
-- Stores NBA player biographical and draft information.
-- Author: Linthoi Laishram
-- Source: Kaggle NBA/ABA/BAA Stats dataset [1], Basketball Reference [2]
-- =============================================================================
CREATE TABLE players (
    player_id   SERIAL       PRIMARY KEY,
    full_name   VARCHAR(150) NOT NULL,
    birth_year  INT          CHECK (birth_year >= 1920 AND birth_year <= 2010),
    -- Constraint: Position must be one of the standard NBA positions
    position    VARCHAR(10)  CHECK (position IN ('PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'G-F', 'F-C', 'F-G', 'C-F')),
    height_in   INT          CHECK (height_in >= 60 AND height_in <= 96),   -- 5'0" to 8'0"
    weight_lbs  INT          CHECK (weight_lbs >= 130 AND weight_lbs <= 400),
    draft_year  INT          CHECK (draft_year >= 1946),
    draft_pick  INT          CHECK (draft_pick >= 1 AND draft_pick <= 100),
    -- Undrafted players will have NULL draft_year and draft_pick (not 0)
    country     VARCHAR(100) DEFAULT 'USA'
);

-- Index for name-based searches (full-text search uses ILIKE in queries)
-- Author: Linthoi Laishram
CREATE INDEX idx_players_name ON players (full_name);

-- =============================================================================
-- TABLE: seasons
-- Stores NBA season metadata.
-- Author: Linthoi Laishram
-- Source: Basketball Reference [2], Kaggle NBA Stats dataset [1]
-- =============================================================================
CREATE TABLE seasons (
    season_id   SERIAL PRIMARY KEY,
    season_year INT    NOT NULL CHECK (season_year >= 1950 AND season_year <= 2030),
    start_date  DATE,
    end_date    DATE,
    num_games   INT    CHECK (num_games >= 1 AND num_games <= 82),

    CONSTRAINT uq_season_year UNIQUE (season_year),
    -- End date must be after start date
    CONSTRAINT chk_season_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date)
);

-- =============================================================================
-- TABLE: player_season_stats
-- Stores per-player, per-season, per-team statistics.
-- Composite PK handles mid-season trades (player on multiple teams in one season).
-- Author: Linthoi Laishram
-- Source: Kaggle NBA Stats [1], Basketball Reference advanced metrics [2]
-- =============================================================================
CREATE TABLE player_season_stats (
    player_id      INT           NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    season_id      INT           NOT NULL REFERENCES seasons(season_id) ON DELETE CASCADE,
    team_id        INT           NOT NULL REFERENCES teams(team_id)     ON DELETE CASCADE,

    -- Basic per-game stats
    games_played   INT           CHECK (games_played >= 0 AND games_played <= 82),
    games_started  INT           CHECK (games_started >= 0 AND games_started <= 82),
    minutes_pg     NUMERIC(5,2)  CHECK (minutes_pg >= 0),
    pts_per_game   NUMERIC(5,2)  CHECK (pts_per_game >= 0),
    ast_per_game   NUMERIC(5,2)  CHECK (ast_per_game >= 0),
    reb_per_game   NUMERIC(5,2)  CHECK (reb_per_game >= 0),
    stl_per_game   NUMERIC(5,2)  CHECK (stl_per_game >= 0),
    blk_per_game   NUMERIC(5,2)  CHECK (blk_per_game >= 0),

    -- Advanced metrics (Oliver, 2004 [10]) — NULL for players with < 10 games
    -- to avoid misleading aggregations per proposal data handling rules
    ts_pct         NUMERIC(5,4)  CHECK (ts_pct IS NULL OR (ts_pct >= 0 AND ts_pct <= 1)),
    per            NUMERIC(6,2),  -- Player Efficiency Rating; league avg ~15
    ws             NUMERIC(6,2),  -- Win Shares
    bpm            NUMERIC(6,2),  -- Box Plus/Minus
    vorp           NUMERIC(6,2),  -- Value Over Replacement Player
    usg_pct        NUMERIC(5,4)  CHECK (usg_pct IS NULL OR (usg_pct >= 0 AND usg_pct <= 1)),

    PRIMARY KEY (player_id, season_id, team_id)
);

-- Indexes for analytical query performance
-- Author: Linthoi Laishram
CREATE INDEX idx_pss_season   ON player_season_stats (season_id);
CREATE INDEX idx_pss_player   ON player_season_stats (player_id);
CREATE INDEX idx_pss_ws       ON player_season_stats (ws DESC NULLS LAST);  -- Win Shares leaderboard

-- =============================================================================
-- TABLE: games
-- Stores individual game results.
-- Author: Linthoi Laishram
-- Source: Kaggle NBA Games dataset [4], Basketball Reference [2]
-- =============================================================================
CREATE TABLE games (
    game_id      SERIAL  PRIMARY KEY,
    season_id    INT     NOT NULL REFERENCES seasons(season_id) ON DELETE CASCADE,
    game_date    DATE    NOT NULL,
    home_team_id INT     NOT NULL REFERENCES teams(team_id),
    away_team_id INT     NOT NULL REFERENCES teams(team_id),
    home_pts     INT     NOT NULL CHECK (home_pts >= 0),
    away_pts     INT     NOT NULL CHECK (away_pts >= 0),
    attendance   INT     CHECK (attendance >= 0 AND attendance <= 25000),

    -- A team cannot play itself
    CONSTRAINT chk_different_teams CHECK (home_team_id <> away_team_id)
);

-- Indexes for date range queries and season-level aggregations
-- Author: Linthoi Laishram
CREATE INDEX idx_games_date       ON games (game_date);
CREATE INDEX idx_games_season     ON games (season_id);
CREATE INDEX idx_games_home_team  ON games (home_team_id);
CREATE INDEX idx_games_away_team  ON games (away_team_id);

-- =============================================================================
-- TABLE: team_salaries
-- Stores team payroll data per season.
-- Composite PK (team_id, season_id) — one payroll record per team per year.
-- Author: Linthoi Laishram
-- Source: HoopsHype team salaries [3]
-- =============================================================================
CREATE TABLE team_salaries (
    team_id           INT            NOT NULL REFERENCES teams(team_id)   ON DELETE CASCADE,
    season_id         INT            NOT NULL REFERENCES seasons(season_id) ON DELETE CASCADE,

    -- All salary values in USD; NULL allowed if data unavailable for that season
    total_payroll_usd  BIGINT         CHECK (total_payroll_usd IS NULL OR total_payroll_usd >= 0),
    luxury_tax_bill    BIGINT         CHECK (luxury_tax_bill IS NULL OR luxury_tax_bill >= 0),
    avg_contract_usd   BIGINT         CHECK (avg_contract_usd IS NULL OR avg_contract_usd >= 0),
    max_contract_usd   BIGINT         CHECK (max_contract_usd IS NULL OR max_contract_usd >= 0),

    PRIMARY KEY (team_id, season_id)
);

-- Index for season-level salary analytics (salary vs win% queries)
-- Author: Linthoi Laishram
CREATE INDEX idx_salaries_season ON team_salaries (season_id);

-- =============================================================================
-- End of Schema
-- =============================================================================
