/**
 * CourtIQ Analytics - Dashboard Page
 * Author: Juman Das (Frontend Lead)
 *
 * Shows summary stat cards + featured Top Players bar chart.
 */
import React, { useEffect, useState } from "react";
import client from "../api/client.js";
import TopPlayersBar from "../components/Charts/TopPlayersBar.jsx";

const cardStyle = {
  background: "#1e2130",
  border: "1px solid #2d3148",
  borderRadius: 8,
  padding: "1.2rem 1.6rem",
  flex: 1,
  minWidth: 160,
};

function StatCard({ label, value, sub }) {
  return (
    <div style={cardStyle}>
      <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f1f5f9" }}>{value ?? "—"}</div>
      {sub && <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    client.get("/analytics/summary")
      .then(r => setSummary(r.data))
      .catch(() => setError("Could not connect to API. Is the backend running?"));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.4rem" }}>
        NBA Analytics Dashboard
      </h1>
      <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
        CourtIQ Analytics — Advanced Database Technologies, Spring 2026
      </p>

      {error && (
        <div style={{ background: "#3b1a1a", border: "1px solid #7f1d1d", borderRadius: 6,
                      padding: "0.75rem 1rem", color: "#fca5a5", marginBottom: "1.5rem" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <StatCard label="Players"      value={summary?.total_players} sub="across all seasons" />
        <StatCard label="Teams"        value={summary?.total_teams}   sub="NBA franchises" />
        <StatCard label="Seasons"      value={summary?.total_seasons} sub="1950 – present" />
        <StatCard label="Games"        value={summary?.total_games}   sub="regular season" />
        <StatCard label="Latest Season" value={summary?.latest_season} sub="most recent data" />
      </div>

      <div style={{ background: "#1e2130", border: "1px solid #2d3148", borderRadius: 8, padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "#e2e8f0" }}>
          Top Players by Win Shares — 2023 Season
        </h2>
        <TopPlayersBar season={2023} />
      </div>
    </div>
  );
}
