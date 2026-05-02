/**
 * CourtIQ Analytics - Player Efficiency Trend Line Chart
 * Author: Juman Das (Frontend Lead)
 *
 * Analytical Q2: How does player efficiency change over seasons?
 * Plots PER, Win Shares, and True Shooting % across available seasons for one player.
 *
 * Reference: Recharts LineChart — https://recharts.org/en-US/api/LineChart
 */
import React, { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import client from "../../api/client.js";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e2130", border: "1px solid #2d3148", borderRadius: 6,
                  padding: "0.6rem 0.9rem", fontSize: "0.82rem" }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: "#e2e8f0" }}>{label} Season</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value ?? "N/A"}</strong>
        </div>
      ))}
      {payload[0]?.payload?.team_name && (
        <div style={{ color: "#64748b", marginTop: 4, fontSize: "0.78rem" }}>
          Team: {payload[0].payload.team_name}
        </div>
      )}
    </div>
  );
}

export default function EfficiencyTrendLine({ playerId }) {
  const [data,       setData]       = useState([]);
  const [playerName, setPlayerName] = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    if (!playerId) return;
    setLoading(true);
    setError(null);
    client.get("/analytics/efficiency-trends", { params: { player_id: playerId } })
      .then(r => {
        setPlayerName(r.data.player);
        setData(r.data.data);
      })
      .catch(() => setError("Could not load efficiency data for this player"))
      .finally(() => setLoading(false));
  }, [playerId]);

  if (!playerId) return (
    <div style={{ color: "#64748b", padding: "2rem", textAlign: "center", fontSize: "0.9rem" }}>
      Select a player from the dropdown above
    </div>
  );
  if (loading) return <div style={{ color: "#64748b", padding: "2rem", textAlign: "center" }}>Loading chart...</div>;
  if (error)   return <div style={{ color: "#fca5a5", padding: "1rem" }}>{error}</div>;
  if (!data.length) return <div style={{ color: "#64748b", padding: "1rem" }}>No trend data available</div>;

  return (
    <div>
      {playerName && (
        <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
          Showing {data.length} season{data.length !== 1 ? "s" : ""} for <strong style={{ color: "#f97316" }}>{playerName}</strong>
        </p>
      )}
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
          <XAxis
            dataKey="season_year"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#2d3148" }}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#2d3148" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={v => <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{v}</span>} />
          {/* League average PER reference line */}
          <ReferenceLine y={15} stroke="#2d3148" strokeDasharray="4 4"
                         label={{ value: "Avg PER (15)", position: "right", fill: "#64748b", fontSize: 10 }} />
          <Line type="monotone" dataKey="per"         name="PER"         stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} connectNulls />
          <Line type="monotone" dataKey="win_shares"  name="Win Shares"  stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} connectNulls />
          <Line type="monotone" dataKey="ts_pct"      name="TS%"         stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} connectNulls />
          <Line type="monotone" dataKey="pts_per_game" name="PPG"        stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
