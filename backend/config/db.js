/**
 * CourtIQ Analytics - PostgreSQL Connection Pool
 * Author: Tanmay Pawar (Backend Engineer)
 *
 * Uses node-postgres (pg) connection pool connected to Supabase PostgreSQL.
 * The DATABASE_URL environment variable must be set in .env.
 *
 * Reference: node-postgres docs — https://node-postgres.com/features/pooling
 *
 * AI Assistance:
 *   Connection pool configuration reviewed using Claude Sonnet 4.6 (Anthropic),
 *   accessed on 2026-04-04.
 */

const { Pool } = require("pg");
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

// Author: Tanmay Pawar
// SSL is required for Supabase connections (rejectUnauthorized:false for self-signed certs).
// Enable SSL whenever the host is remote (Supabase, Render, etc.), not just in production.
const isLocalHost = /(?:@|\/\/)(localhost|127\.0\.0\.1)(?::|\/)/.test(process.env.DATABASE_URL || "");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocalHost ? false : { rejectUnauthorized: false },
  max: 10,              // Max concurrent connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err.message);
});

module.exports = pool;
