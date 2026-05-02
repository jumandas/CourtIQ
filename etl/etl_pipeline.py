"""
CourtIQ Analytics - ETL Pipeline
Course: Applied Database Technologies (ADT) - Spring 2026
Team: Juman Das, Linthoi Laishram, Tanmay Pawar, Hiten Kataria

Author: Hiten Kataria (Data Engineering Lead)

Purpose:
    Reads raw CSV files from the data/ directory, cleans and normalizes
    them into the 6-table relational schema, then bulk-loads into
    PostgreSQL (Supabase).

Data Sources:
    [1] NBA/ABA/BAA Stats (1950-2023): https://www.kaggle.com/datasets/sumitrodatta/nba-aba-baa-stats
        Files needed: Player Per Game.csv, Advanced.csv
    [3] NBA Team Salaries: https://www.kaggle.com/datasets/jamiewelsh2/nba-player-salaries-2022-23-nba-season
        (or scrape from https://hoopshype.com/salaries/)
    [4] NBA Games & Results: https://www.kaggle.com/datasets/nathanlauga/nba-games
        Files needed: games.csv, teams.csv

Download Instructions:
    1. Install Kaggle CLI: pip install kaggle
    2. Place your kaggle.json API key in ~/.kaggle/
    3. Run the following commands in the etl/data/ directory:
       kaggle datasets download -d sumitrodatta/nba-aba-baa-stats -p data/ --unzip
       kaggle datasets download -d nathanlauga/nba-games -p data/ --unzip

AI Assistance:
    pandas cleaning patterns and psycopg2 bulk insert logic reviewed using
    Claude Sonnet 4.6 (Anthropic), accessed on 2026-04-04.
    All business logic, column mappings, and data validation rules
    designed by Hiten Kataria.
"""

import os
import sys
import logging
from pathlib import Path

import numpy as np
import pandas as pd
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from rapidfuzz import process, fuzz

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
DATA_DIR = Path(__file__).parent / "data"

# Minimum games played to compute advanced metrics (avoid misleading aggregations)
# Author: Hiten Kataria — per proposal data handling rules
MIN_GAMES_FOR_ADVANCED = 10

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Database helpers
# Author: Hiten Kataria
# ---------------------------------------------------------------------------

def get_connection():
    """Return a psycopg2 connection to the Supabase PostgreSQL instance."""
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL not set. Copy .env.example to .env and fill in your "
            "Supabase connection string."
        )
    return psycopg2.connect(DATABASE_URL, connect_timeout=10)


def bulk_insert(conn, table: str, columns: list[str], rows: list[tuple],
                conflict_action: str = "DO NOTHING") -> int:
    """
    Bulk-inserts rows into a table using execute_values for performance.
    Returns number of rows inserted.
    Author: Hiten Kataria
    Reference: psycopg2 docs — https://www.psycopg.org/docs/extras.html#fast-exec
    """
    if not rows:
        log.info("No rows to insert into %s", table)
        return 0

    placeholders = ",".join(["%s"] * len(columns))
    col_list = ",".join(columns)
    sql = (
        f"INSERT INTO {table} ({col_list}) VALUES %s "
        f"ON CONFLICT {conflict_action}"
    )
    with conn.cursor() as cur:
        psycopg2.extras.execute_values(cur, sql, rows, page_size=500)
    conn.commit()
    log.info("Inserted %d rows into %s", len(rows), table)
    return len(rows)


# ---------------------------------------------------------------------------
# Step 1: Load and normalize teams
# Author: Hiten Kataria
# Source: Kaggle NBA Games dataset teams.csv [4]
# ---------------------------------------------------------------------------

def load_teams(conn) -> dict[str, int]:
    """
    Load teams from CSV or use defaults. Returns {abbreviation: team_id} map.
    """
    teams_file = DATA_DIR / "teams.csv"

    if teams_file.exists():
        df = pd.read_csv(teams_file)
        log.info("Loaded teams.csv (%d rows)", len(df))
        # Column mapping from Kaggle NBA Games teams.csv [4]
        df = df.rename(columns={
            "TEAM_ID": "kaggle_id",
            "ABBREVIATION": "abbreviation",
            "NICKNAME": "team_name",
            "CITY": "city",
            "ARENA": "arena",
            "ARENACAPACITY": "capacity",
        })
        # Add conference/division — not in Kaggle file, must be mapped
        conference_map = _get_conference_map()
        df["conference"] = df["abbreviation"].map(
            lambda a: conference_map.get(a, {}).get("conference", "Eastern")
        )
        df["division"] = df["abbreviation"].map(
            lambda a: conference_map.get(a, {}).get("division", "Atlantic")
        )
        df["founded_year"] = df["abbreviation"].map(
            lambda a: conference_map.get(a, {}).get("founded_year", 1990)
        )
        rows = [
            (row.team_name, row.abbreviation, row.city,
             row.conference, row.division, row.founded_year)
            for row in df.itertuples()
        ]
        bulk_insert(
            conn, "teams",
            ["team_name", "abbreviation", "city", "conference", "division", "founded_year"],
            rows,
            conflict_action="(abbreviation) DO UPDATE SET city = EXCLUDED.city"
        )
    else:
        log.warning(
            "teams.csv not found in %s. Using seed.sql data. "
            "Download from: https://www.kaggle.com/datasets/nathanlauga/nba-games",
            DATA_DIR
        )

    # Build abbreviation → team_id lookup from DB
    with conn.cursor() as cur:
        cur.execute("SELECT abbreviation, team_id FROM teams")
        return {row[0]: row[1] for row in cur.fetchall()}


# ---------------------------------------------------------------------------
# Step 2: Load seasons
# Author: Hiten Kataria
# ---------------------------------------------------------------------------

def load_seasons(conn) -> dict[int, int]:
    """Load seasons 2000-2023. Returns {season_year: season_id} map."""
    # Generate seasons that aren't already in DB
    seasons = [
        (year, None, None, 82 if year not in (2020, 2021) else 72)
        for year in range(2000, 2024)
    ]
    bulk_insert(
        conn, "seasons",
        ["season_year", "start_date", "end_date", "num_games"],
        seasons,
        conflict_action="(season_year) DO NOTHING"
    )
    with conn.cursor() as cur:
        cur.execute("SELECT season_year, season_id FROM seasons")
        return {row[0]: row[1] for row in cur.fetchall()}


# ---------------------------------------------------------------------------
# Step 3: Load players from NBA stats CSV
# Author: Hiten Kataria
# Source: Kaggle sumitrodatta/nba-aba-baa-stats "Player Per Game.csv" [1]
# ---------------------------------------------------------------------------

def load_players(conn) -> dict[str, int]:
    """
    Normalize player biographical data.
    Returns {normalized_name: player_id} map for cross-dataset matching.
    """
    stats_file = DATA_DIR / "Player Per Game.csv"

    if not stats_file.exists():
        log.warning(
            "Player Per Game.csv not found. Using seed.sql players. "
            "Download from: https://www.kaggle.com/datasets/sumitrodatta/nba-aba-baa-stats"
        )
        with conn.cursor() as cur:
            cur.execute("SELECT full_name, player_id FROM players")
            return {row[0]: row[1] for row in cur.fetchall()}

    df = pd.read_csv(stats_file)
    log.info("Loaded Player Per Game.csv (%d rows)", len(df))

    # Column names from the Kaggle dataset [1]
    # Author: Hiten Kataria
    df = df[["player", "birth_year", "pos"]].drop_duplicates(subset=["player"])
    df["birth_year"] = pd.to_numeric(df["birth_year"], errors="coerce").astype("Int64")
    df["pos"] = df["pos"].str.strip().str[:5]  # Truncate to VARCHAR(10)

    # Standardize position codes to match our CHECK constraint
    pos_map = {
        "PG": "PG", "SG": "SG", "SF": "SF", "PF": "PF", "C": "C",
        "G": "G", "F": "F", "G-F": "G-F", "F-C": "F-C", "F-G": "F-G", "C-F": "C-F",
        "PG-SG": "G", "SG-SF": "G-F", "SF-PF": "F", "PF-C": "F-C",
    }
    df["pos"] = df["pos"].map(pos_map).fillna("F")

    rows = [
        (row.player, int(row.birth_year) if pd.notna(row.birth_year) else None,
         row.pos, None, None, None, None, "USA")
        for row in df.itertuples()
    ]
    bulk_insert(
        conn, "players",
        ["full_name", "birth_year", "position", "height_in", "weight_lbs",
         "draft_year", "draft_pick", "country"],
        rows,
        conflict_action="DO NOTHING"
    )

    with conn.cursor() as cur:
        cur.execute("SELECT full_name, player_id FROM players")
        return {row[0]: row[1] for row in cur.fetchall()}


# ---------------------------------------------------------------------------
# Step 4: Load player season stats + advanced metrics
# Author: Hiten Kataria
# Source: "Player Per Game.csv" [1] and "Advanced.csv" [2]
# ---------------------------------------------------------------------------

def load_player_stats(conn, team_map: dict, season_map: dict, player_map: dict):
    """
    Merge per-game and advanced stats CSVs, normalize, and load.
    Uses fuzzy matching to align player names across datasets.
    Author: Hiten Kataria
    Reference: rapidfuzz docs — https://rapidfuzz.github.io/RapidFuzz/
    """
    pg_file  = DATA_DIR / "Player Per Game.csv"
    adv_file = DATA_DIR / "Advanced.csv"

    if not pg_file.exists() or not adv_file.exists():
        log.warning("Stats CSVs not found — skipping player stats ETL. "
                    "Using seed.sql data.")
        return

    # Load both files
    # Author: Hiten Kataria
    pg  = pd.read_csv(pg_file)
    adv = pd.read_csv(adv_file)

    # Filter to seasons 2000-2023
    pg  = pg[pg["season"].between(2000, 2023)].copy()
    adv = adv[adv["season"].between(2000, 2023)].copy()

    # Column mapping from Kaggle NBA/ABA/BAA dataset [1]
    pg = pg.rename(columns={
        "player": "full_name", "season": "season_year", "tm": "team_abbr",
        "g": "games_played", "gs": "games_started", "mp": "minutes_pg",
        "pts": "pts_per_game", "ast": "ast_per_game", "trb": "reb_per_game",
        "stl": "stl_per_game", "blk": "blk_per_game", "ts%": "ts_pct",
    })
    adv = adv.rename(columns={
        "player": "full_name", "season": "season_year", "tm": "team_abbr",
        "per": "per", "ws": "ws", "bpm": "bpm", "vorp": "vorp", "usg%": "usg_pct",
    })

    # Merge on player + season + team
    # Author: Hiten Kataria
    merge_cols = ["full_name", "season_year", "team_abbr"]
    df = pd.merge(
        pg[merge_cols + ["games_played", "games_started", "minutes_pg",
                         "pts_per_game", "ast_per_game", "reb_per_game",
                         "stl_per_game", "blk_per_game", "ts_pct"]],
        adv[merge_cols + ["per", "ws", "bpm", "vorp", "usg_pct"]],
        on=merge_cols, how="left"
    )

    # Null out advanced metrics for players with < MIN_GAMES_FOR_ADVANCED games
    # Per proposal: "set to NULL rather than 0 to avoid misleading aggregations"
    # Author: Hiten Kataria
    mask = df["games_played"] < MIN_GAMES_FOR_ADVANCED
    for col in ["per", "ws", "bpm", "vorp", "usg_pct", "ts_pct"]:
        df.loc[mask, col] = None

    # Resolve player IDs via fuzzy name matching
    # Author: Hiten Kataria
    # Reference: rapidfuzz WRatio scorer handles abbreviations (L. James vs LeBron James)
    known_names = list(player_map.keys())

    def resolve_player_id(name: str) -> int | None:
        match, score, _ = process.extractOne(
            name, known_names, scorer=fuzz.WRatio
        )
        return player_map[match] if score >= 85 else None

    df["player_id"] = df["full_name"].map(
        lambda n: player_map.get(n) or resolve_player_id(n)
    )

    # Map team abbreviations and season years to FK IDs
    # "TOT" rows are traded players' combined season — skip to avoid ambiguity
    df = df[df["team_abbr"] != "TOT"].copy()
    df["team_id"]   = df["team_abbr"].map(team_map)
    df["season_id"] = df["season_year"].map(season_map)

    # Drop rows with unresolved FKs
    df = df.dropna(subset=["player_id", "team_id", "season_id"])
    df[["player_id", "team_id", "season_id"]] = df[
        ["player_id", "team_id", "season_id"]
    ].astype(int)

    # Replace NaN with None for SQL NULL
    df = df.where(pd.notna(df), None)

    rows = [
        (row.player_id, row.season_id, row.team_id,
         row.games_played, row.games_started, row.minutes_pg,
         row.pts_per_game, row.ast_per_game, row.reb_per_game,
         row.stl_per_game, row.blk_per_game,
         row.ts_pct, row.per, row.ws, row.bpm, row.vorp, row.usg_pct)
        for row in df.itertuples()
    ]

    bulk_insert(
        conn, "player_season_stats",
        ["player_id", "season_id", "team_id",
         "games_played", "games_started", "minutes_pg",
         "pts_per_game", "ast_per_game", "reb_per_game",
         "stl_per_game", "blk_per_game",
         "ts_pct", "per", "ws", "bpm", "vorp", "usg_pct"],
        rows,
        conflict_action=(
            "(player_id, season_id, team_id) DO UPDATE SET "
            "pts_per_game = EXCLUDED.pts_per_game, "
            "ws = EXCLUDED.ws, bpm = EXCLUDED.bpm, vorp = EXCLUDED.vorp"
        )
    )


# ---------------------------------------------------------------------------
# Step 5: Load games
# Author: Hiten Kataria
# Source: Kaggle NBA Games dataset "games.csv" [4]
# ---------------------------------------------------------------------------

def load_games(conn, team_map: dict, season_map: dict):
    """Load game results from Kaggle NBA Games dataset."""
    games_file = DATA_DIR / "games.csv"

    if not games_file.exists():
        log.warning("games.csv not found — using seed.sql games. "
                    "Download from: https://www.kaggle.com/datasets/nathanlauga/nba-games")
        return

    df = pd.read_csv(games_file, parse_dates=["GAME_DATE_EST"])
    log.info("Loaded games.csv (%d rows)", len(df))

    # Column mapping from Kaggle NBA Games dataset [4]
    # Author: Hiten Kataria
    df = df.rename(columns={
        "GAME_DATE_EST": "game_date",
        "HOME_TEAM_ID":  "home_kaggle_id",
        "VISITOR_TEAM_ID": "away_kaggle_id",
        "PTS_home":      "home_pts",
        "PTS_away":      "away_pts",
        "SEASON":        "season_year",
    })

    # Build kaggle team_id → abbreviation → our team_id map
    teams_file = DATA_DIR / "teams.csv"
    if teams_file.exists():
        tdf = pd.read_csv(teams_file)[["TEAM_ID", "ABBREVIATION"]]
        kaggle_to_abbr = dict(zip(tdf["TEAM_ID"], tdf["ABBREVIATION"]))
        df["home_team_abbr"] = df["home_kaggle_id"].map(kaggle_to_abbr)
        df["away_team_abbr"] = df["away_kaggle_id"].map(kaggle_to_abbr)
        df["home_team_id"] = df["home_team_abbr"].map(team_map)
        df["away_team_id"] = df["away_team_abbr"].map(team_map)
    else:
        log.warning("teams.csv needed to map Kaggle team IDs for games. Skipping.")
        return

    df["season_id"] = df["season_year"].map(season_map)
    df = df.dropna(subset=["home_team_id", "away_team_id", "season_id"])
    df = df[df["home_pts"].notna() & df["away_pts"].notna()]
    df[["home_team_id", "away_team_id", "season_id",
        "home_pts", "away_pts"]] = df[
        ["home_team_id", "away_team_id", "season_id",
         "home_pts", "away_pts"]
    ].astype(int)

    rows = [
        (row.season_id, row.game_date.date(), row.home_team_id,
         row.away_team_id, row.home_pts, row.away_pts, None)
        for row in df.itertuples()
    ]
    bulk_insert(
        conn, "games",
        ["season_id", "game_date", "home_team_id", "away_team_id",
         "home_pts", "away_pts", "attendance"],
        rows,
        conflict_action="DO NOTHING"
    )


# ---------------------------------------------------------------------------
# Helper: NBA team conference/division/founding year lookup
# Author: Hiten Kataria
# Source: NBA official franchise history [2]
# ---------------------------------------------------------------------------

def _get_conference_map() -> dict:
    return {
        "ATL": {"conference": "Eastern", "division": "Southeast", "founded_year": 1946},
        "BOS": {"conference": "Eastern", "division": "Atlantic",  "founded_year": 1946},
        "BKN": {"conference": "Eastern", "division": "Atlantic",  "founded_year": 1976},
        "CHA": {"conference": "Eastern", "division": "Southeast", "founded_year": 1988},
        "CHI": {"conference": "Eastern", "division": "Central",   "founded_year": 1966},
        "CLE": {"conference": "Eastern", "division": "Central",   "founded_year": 1970},
        "DET": {"conference": "Eastern", "division": "Central",   "founded_year": 1941},
        "IND": {"conference": "Eastern", "division": "Central",   "founded_year": 1967},
        "MIA": {"conference": "Eastern", "division": "Southeast", "founded_year": 1988},
        "MIL": {"conference": "Eastern", "division": "Central",   "founded_year": 1968},
        "NYK": {"conference": "Eastern", "division": "Atlantic",  "founded_year": 1946},
        "ORL": {"conference": "Eastern", "division": "Southeast", "founded_year": 1989},
        "PHI": {"conference": "Eastern", "division": "Atlantic",  "founded_year": 1946},
        "TOR": {"conference": "Eastern", "division": "Atlantic",  "founded_year": 1995},
        "WAS": {"conference": "Eastern", "division": "Southeast", "founded_year": 1961},
        "DAL": {"conference": "Western", "division": "Southwest", "founded_year": 1980},
        "DEN": {"conference": "Western", "division": "Northwest", "founded_year": 1967},
        "GSW": {"conference": "Western", "division": "Pacific",   "founded_year": 1946},
        "HOU": {"conference": "Western", "division": "Southwest", "founded_year": 1967},
        "LAC": {"conference": "Western", "division": "Pacific",   "founded_year": 1970},
        "LAL": {"conference": "Western", "division": "Pacific",   "founded_year": 1947},
        "MEM": {"conference": "Western", "division": "Southwest", "founded_year": 1995},
        "MIN": {"conference": "Western", "division": "Northwest", "founded_year": 1989},
        "NOP": {"conference": "Western", "division": "Southwest", "founded_year": 2002},
        "OKC": {"conference": "Western", "division": "Northwest", "founded_year": 1967},
        "PHX": {"conference": "Western", "division": "Pacific",   "founded_year": 1968},
        "POR": {"conference": "Western", "division": "Northwest", "founded_year": 1970},
        "SAC": {"conference": "Western", "division": "Pacific",   "founded_year": 1945},
        "SAS": {"conference": "Western", "division": "Southwest", "founded_year": 1967},
        "UTA": {"conference": "Western", "division": "Northwest", "founded_year": 1974},
    }


# ---------------------------------------------------------------------------
# Main ETL Runner
# Author: Hiten Kataria
# ---------------------------------------------------------------------------

def run_etl():
    """Run the full ETL pipeline: connect → load all tables in FK order."""
    log.info("=== CourtIQ Analytics ETL Pipeline ===")
    log.info("Connecting to Supabase PostgreSQL...")

    try:
        conn = get_connection()
    except Exception as e:
        log.error("Failed to connect to database: %s", e)
        log.error("Ensure DATABASE_URL is set in .env (see .env.example)")
        sys.exit(1)

    log.info("Connected successfully.")

    try:
        log.info("Step 1/5: Loading teams...")
        team_map = load_teams(conn)
        log.info("  → %d teams loaded", len(team_map))

        log.info("Step 2/5: Loading seasons...")
        season_map = load_seasons(conn)
        log.info("  → %d seasons loaded", len(season_map))

        log.info("Step 3/5: Loading players...")
        player_map = load_players(conn)
        log.info("  → %d players loaded", len(player_map))

        log.info("Step 4/5: Loading player season stats...")
        load_player_stats(conn, team_map, season_map, player_map)

        log.info("Step 5/5: Loading games...")
        load_games(conn, team_map, season_map)

        log.info("=== ETL complete ===")

    except Exception as e:
        conn.rollback()
        log.error("ETL failed: %s", e)
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    run_etl()
