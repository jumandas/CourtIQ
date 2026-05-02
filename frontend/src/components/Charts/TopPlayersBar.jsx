/**
 * CourtIQ Analytics - Top Players Bar Chart (Win Shares)
 * Author: Juman Das (Frontend Lead)
 *
 * Analytical Q1: Which players contribute most to team victories?
 * Renders a horizontal bar chart of Win Shares for the top N players in a season.
 *
 * Reference: Recharts docs — https://recharts.org/en-US/api/BarChart
 * AI Assistance: Chart configuration reviewed using Claude Sonnet 4.6 (Anthropic), 2026-04-04.
 */
import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import client from "../../api/client.js";

const COLORS = ["#f97316","#fb923c","#fdba74","#fed7aa","#fef3c7",
                "#fde68a","#fcd34d","#fbbf24","#f59e0b","#d97706"];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#1e2130", border: "1px solid #2d3148", borderRadius: 6,
                  padding: "0.6rem 0.9rem", fontSize: "0.82rem" }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.full_name}</div>
      <div style={{ color: "#94a3b8" }}>{d.team_name} · {d.position}</div>
      <div style={{ color: "#f97316", marginTop: 4 }}>Win Shares: <strong>{d.win_shares}</strong></div>
      <div style={{ color: "#94a3b8" }}>PTS: {d.pts_per_game} | AST: {d.ast_per_game} | REB: {d.reb_per_game}</div>
      <div style={{ color: "#94a3b8" }}>PER: {d.per} | BPM: {d.bpm}</div>
    </div>
  );
}

export default function TopPlayersBar({ season = 2023, limit = 10 }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    client.get("/analytics/top-players", { params: { season, limit } })
      .then(r => setData(r.data.data))
      .catch(() => setError("Could not load top players data"))
      .finally(() => setLoading(false));
  }, [season, limit]);

  if (loading) return <div style={{ color: "#64748b", padding: "2rem", textAlign: "center" }}>Loading chart...</div>;
  if (error)   return <div style={{ color: "#fca5a5", padding: "1rem" }}>{error}</div>;
  if (!data.length) return <div style={{ color: "#64748b", padding: "1rem" }}>No data for season {season}</div>;

  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 30, left: 140, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, "auto"]}
          tick={{ fill: "#64748b", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "#2d3148" }}
          label={{ value: "Win Shares", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 11 }}
        />
        <YAxis
          type="category"
          dataKey="full_name"
          tick={{ fill: "#e2e8f0", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={135}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="win_shares" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
