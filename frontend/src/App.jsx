/**
 * CourtIQ Analytics - Root App with routing
 * Author: Juman Das (Frontend Lead)
 */
import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard  from "./pages/Dashboard.jsx";
import Players    from "./pages/Players.jsx";
import Teams      from "./pages/Teams.jsx";
import Analytics  from "./pages/Analytics.jsx";

const navStyle = {
  display: "flex",
  gap: "1.5rem",
  alignItems: "center",
};

const linkStyle = ({ isActive }) => ({
  color: isActive ? "#f97316" : "#94a3b8",
  textDecoration: "none",
  fontWeight: isActive ? 600 : 400,
  fontSize: "0.95rem",
  transition: "color 0.15s",
});

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{
        background: "#1e2130",
        padding: "0.85rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #2d3148",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#f97316", letterSpacing: "-0.5px" }}>
          CourtIQ Analytics
        </span>
        <div style={navStyle}>
          <NavLink to="/"          style={linkStyle}>Dashboard</NavLink>
          <NavLink to="/players"   style={linkStyle}>Players</NavLink>
          <NavLink to="/teams"     style={linkStyle}>Teams</NavLink>
          <NavLink to="/analytics" style={linkStyle}>Analytics</NavLink>
        </div>
      </nav>

      <main style={{ padding: "1.5rem 2rem", maxWidth: 1400, margin: "0 auto" }}>
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/players"   element={<Players />} />
          <Route path="/teams"     element={<Teams />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
