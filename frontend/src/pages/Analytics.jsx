/**
 * CourtIQ Analytics - Analytics Page
 * Author: Juman Das (Frontend Lead)
 *
 * Three visualization panels answering the three analytical questions
 * stated in the project proposal:
 *   Q1: Top players by Win Shares (bar chart)
 *   Q2: Player efficiency trends over seasons (line chart)
 *   Q3: Team salary vs win% correlation (scatter plot)
 */
import React, { useEffect, useState } from "react";
import client             from "../api/client.js";
import TopPlayersBar      from "../components/Charts/TopPlayersBar.jsx";
import SalaryVsWinScatter from "../components/Charts/SalaryVsWinScatter.jsx";
import EfficiencyTrendLine from "../components/Charts/EfficiencyTrendLine.jsx";

const panel = {
  background: "#1e2130",
  border: "1px solid #2d3148",
  borderRadius: 8,
  padding: "1.5rem",
  marginBottom: "1.5rem",
};
const selectStyle = {
  background: "#0f1117", border: "1px solid #2d3148", borderRadius: 5,
  color: "#e2e8f0", padding: "0.35rem 0.65rem", fontSize: "0.85rem",
};

export default function Analytics() {
  const [season,   setSeason]   = useState(2023);
  const [players,  setPlayers]  = useState([]);
  const [playerId, setPlayerId] = useState(null);

  // Load player list for the efficiency trends dropdown
  useEffect(() => {
    client.get("/players", { params: { season, limit: 50 } })
      .then(r => {
        const list = r.data.data || r.data;
        setPlayers(list);
        if (list.length && !playerId) setPlayerId(list[0].player_id);
      })
      .catch(() => {});
  }, [season]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Analytics</h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Advanced metrics & performance insights</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Season:</label>
          <select style={selectStyle} value={season} onChange={e => setSeason(parseInt(e.target.value))}>
            {[2023,2022,2021,2020,2019].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Panel 1: Top Players by Win Shares */}
      <div style={panel}>
        <div style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#e2e8f0" }}>
            Q1 — Top Players by Win Shares
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.8rem", marginTop: 2 }}>
            Win Shares (WS) quantifies each player's contribution to team victories.
            Formula from Oliver (2004); data via Basketball Reference.
          </p>
        </div>
        <TopPlayersBar season={season} limit={10} />
      </div>

      {/* Panel 2: Player Efficiency Trends */}
      <div style={panel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#e2e8f0" }}>
              Q2 — Player Efficiency Trends
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.8rem", marginTop: 2 }}>
              Track PER, Win Shares, and True Shooting % across seasons for a selected player.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Player:</label>
            <select
              style={{ ...selectStyle, minWidth: 200 }}
              value={playerId || ""}
              onChange={e => setPlayerId(parseInt(e.target.value))}
            >
              {players.map(p => (
                <option key={p.player_id} value={p.player_id}>{p.full_name}</option>
              ))}
            </select>
          </div>
        </div>
        <EfficiencyTrendLine playerId={playerId} />
      </div>

      {/* Panel 3: Salary vs Win% Scatter */}
      <div style={panel}>
        <div style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#e2e8f0" }}>
            Q3 — Team Payroll vs Win Percentage
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.8rem", marginTop: 2 }}>
            Each dot represents one team. Does spending more money win more games?
            Salary data from HoopsHype; game results from Kaggle NBA Games dataset.
            The dashed line marks the .500 win rate.
          </p>
        </div>
        <SalaryVsWinScatter season={season} />
      </div>
    </div>
  );
}
