/**
 * CourtIQ Analytics - Salary vs Win% Scatter Plot
 * Author: Juman Das (Frontend Lead)
 *
 * Analytical Q3: How does team spending correlate with performance?
 * Each dot = one team. X axis = total payroll ($M). Y axis = win percentage.
 * Color-coded by conference (Eastern = blue, Western = orange).
 *
 * Reference: Recharts ScatterChart — https://recharts.org/en-US/api/ScatterChart
 */
import React, { useEffect, useState } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import client from "../../api/client.js";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#1e2130", border: "1px solid #2d3148", borderRadius: 6,
                  padding: "0.6rem 0.9rem", fontSize: "0.82rem", minWidth: 180 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.team_name}</div>
      <div style={{ color: "#94a3b8" }}>Conference: {d.conference}</div>
      <div style={{ color: "#f97316", marginTop: 4 }}>
        Payroll: <strong>${d.payroll_millions}M</strong>
      </div>
      <div style={{ color: "#60a5fa" }}>
        Win %: <strong>{(d.win_pct * 100).toFixed(1)}%</strong> ({d.wins}W / {d.total_games}G)
      </div>
    </div>
  );
}

export default function SalaryVsWinScatter({ season = 2023 }) {
  const [eastern, setEastern] = useState([]);
  const [western, setWestern] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    client.get("/analytics/salary-vs-wins", { params: { season } })
      .then(r => {
        const all = r.data.data;
        setEastern(all.filter(d => d.conference === "Eastern"));
        setWestern(all.filter(d => d.conference === "Western"));
      })
      .catch(() => setError("Could not load salary data"))
      .finally(() => setLoading(false));
  }, [season]);

  if (loading) return <div style={{ color: "#64748b", padding: "2rem", textAlign: "center" }}>Loading chart...</div>;
  if (error)   return <div style={{ color: "#fca5a5", padding: "1rem" }}>{error}</div>;
  if (!eastern.length && !western.length)
    return <div style={{ color: "#64748b", padding: "1rem" }}>No data for season {season}</div>;

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ScatterChart margin={{ top: 10, right: 30, bottom: 30, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
        <XAxis
          type="number"
          dataKey="payroll_millions"
          name="Payroll"
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#2d3148" }}
          label={{ value: "Total Payroll ($M)", position: "insideBottom", offset: -15, fill: "#64748b", fontSize: 11 }}
          domain={["auto", "auto"]}
        />
        <YAxis
          type="number"
          dataKey="win_pct"
          name="Win %"
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#2d3148" }}
          tickFormatter={v => `${(v * 100).toFixed(0)}%`}
          label={{ value: "Win %", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }}
          domain={[0, 1]}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "#2d3148" }} />
        <Legend
          formatter={v => <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{v}</span>}
        />
        {/* .500 win rate reference line */}
        <ReferenceLine y={0.5} stroke="#64748b" strokeDasharray="4 4"
                       label={{ value: ".500", position: "right", fill: "#64748b", fontSize: 10 }} />
        <Scatter name="Eastern Conference" data={eastern} fill="#3b82f6" opacity={0.85} />
        <Scatter name="Western Conference" data={western} fill="#f97316" opacity={0.85} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
