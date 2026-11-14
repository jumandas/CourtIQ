/**
 * CourtIQ Analytics - one-time database seed for the Render deployment.
 *
 * Renders free tier allows only one free PostgreSQL database, and it is
 * shared with the TickPulse demo, so CourtIQ's tables live in that same
 * database (table names do not collide). This script creates the CourtIQ
 * tables and loads the seed data, using the DATABASE_URL environment
 * variable the backend itself uses.
 *
 * The schema.sql and seed.sql files next to this script are copies of
 * database/schema.sql and database/seed.sql at the repo root; they are
 * kept here because Render deploys only the backend/ directory, so the
 * repo-root copies are not present inside the running service.
 *
 * Run once from the Render Shell on the courtiq-backend service:
 *   node scripts/seed-db.js
 * It is safe to run again: if the tables already exist with data, it
 * exits without changing anything.
 */

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Nothing to do.");
  process.exit(1);
}

const isLocalHost = /(?:@|\/\/)(localhost|127\.0\.0\.1)(?::|\/)/.test(connectionString);
const pool = new Pool({
  connectionString,
  ssl: isLocalHost ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

const TABLES = ["teams", "players", "seasons", "player_season_stats", "games", "team_salaries"];

async function main() {
  const client = await pool.connect();
  try {
    const existing = await client.query(
      "SELECT count(*) AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teams'"
    );
    if (Number(existing.rows[0].n) > 0) {
      const rows = await client.query("SELECT count(*) AS n FROM teams");
      if (Number(rows.rows[0].n) > 0) {
        console.log(`teams table already exists with ${rows.rows[0].n} rows. Nothing to do.`);
        return;
      }
      console.log("teams table exists but is empty. Seeding data only.");
      const seedSql = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");
      await client.query(seedSql);
    } else {
      console.log("Creating CourtIQ tables...");
      const schemaSql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
      await client.query(schemaSql);
      console.log("Loading seed data...");
      const seedSql = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");
      await client.query(seedSql);
    }

    console.log("Row counts after seeding:");
    for (const table of TABLES) {
      const res = await client.query(`SELECT count(*) AS n FROM ${table}`);
      console.log(`  ${table}: ${res.rows[0].n}`);
    }
    console.log("Done.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
