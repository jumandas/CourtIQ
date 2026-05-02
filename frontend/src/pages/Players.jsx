/**
 * CourtIQ Analytics - Players Page (full CRUD)
 * Author: Juman Das (Frontend Lead)
 *
 * Features:
 * - Searchable, filterable player table
 * - Create / Edit / Delete modals
 */
import React, { useEffect, useState, useCallback } from "react";
import client from "../api/client.js";

/* ---- shared styles ---- */
const btnBase = { border: "none", borderRadius: 5, cursor: "pointer", fontSize: "0.85rem", padding: "0.4rem 0.85rem", fontWeight: 500 };
const btn = {
  primary:  { ...btnBase, background: "#f97316", color: "#fff" },
  danger:   { ...btnBase, background: "#dc2626", color: "#fff" },
  ghost:    { ...btnBase, background: "#2d3148", color: "#e2e8f0" },
  success:  { ...btnBase, background: "#16a34a", color: "#fff" },
};
const inputStyle = {
  background: "#0f1117", border: "1px solid #2d3148", borderRadius: 5,
  color: "#e2e8f0", padding: "0.45rem 0.75rem", fontSize: "0.9rem", width: "100%",
};

/* ---- Player Form Modal ---- */
function PlayerModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    full_name: "", birth_year: "", position: "", height_in: "",
    weight_lbs: "", draft_year: "", draft_pick: "", country: "USA",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      birth_year: form.birth_year ? parseInt(form.birth_year) : null,
      height_in:  form.height_in  ? parseInt(form.height_in)  : null,
      weight_lbs: form.weight_lbs ? parseInt(form.weight_lbs) : null,
      draft_year: form.draft_year ? parseInt(form.draft_year) : null,
      draft_pick: form.draft_pick ? parseInt(form.draft_pick) : null,
    };
    await onSave(payload);
  }

  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex",
                    alignItems: "center", justifyContent: "center", zIndex: 200 };
  const modal   = { background: "#1e2130", border: "1px solid #2d3148", borderRadius: 10,
                    padding: "1.5rem", width: 480, maxHeight: "90vh", overflowY: "auto" };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <h2 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
          {initial ? "Edit Player" : "Add Player"}
        </h2>
        <form onSubmit={handleSubmit}>
          {[
            ["Full Name*", "full_name", "text", true],
            ["Birth Year", "birth_year", "number"],
            ["Height (inches)", "height_in", "number"],
            ["Weight (lbs)", "weight_lbs", "number"],
            ["Draft Year", "draft_year", "number"],
            ["Draft Pick", "draft_pick", "number"],
            ["Country", "country", "text"],
          ].map(([label, key, type, required]) => (
            <div key={key} style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: 3 }}>
                {label}
              </label>
              <input
                style={inputStyle}
                type={type}
                value={form[key] ?? ""}
                onChange={e => set(key, e.target.value)}
                required={!!required}
              />
            </div>
          ))}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: 3 }}>
              Position
            </label>
            <select style={{ ...inputStyle }} value={form.position} onChange={e => set("position", e.target.value)}>
              <option value="">— select —</option>
              {["PG","SG","SF","PF","C","G","F","G-F","F-C","F-G","C-F"].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button type="button" style={btn.ghost} onClick={onClose}>Cancel</button>
            <button type="submit" style={btn.primary}>{initial ? "Save Changes" : "Create Player"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---- Main Players Page ---- */
export default function Players() {
  const [players, setPlayers]     = useState([]);
  const [search, setSearch]       = useState("");
  const [position, setPosition]   = useState("");
  const [season, setSeason]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [modal, setModal]         = useState(null); // null | "create" | player object
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPlayers = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search)   params.search   = search;
    if (position) params.position = position;
    if (season)   params.season   = season;

    client.get("/players", { params })
      .then(r => setPlayers(r.data.data || r.data))
      .catch(() => showToast("Failed to load players", "error"))
      .finally(() => setLoading(false));
  }, [search, position, season]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  async function handleCreate(payload) {
    try {
      await client.post("/players", payload);
      showToast("Player created");
      setModal(null);
      fetchPlayers();
    } catch { showToast("Failed to create player", "error"); }
  }

  async function handleEdit(payload) {
    try {
      await client.put(`/players/${modal.player_id}`, payload);
      showToast("Player updated");
      setModal(null);
      fetchPlayers();
    } catch { showToast("Failed to update player", "error"); }
  }

  async function handleDelete(player) {
    if (!window.confirm(`Delete ${player.full_name}? This also removes their stats.`)) return;
    try {
      await client.delete(`/players/${player.player_id}`);
      showToast("Player deleted");
      fetchPlayers();
    } catch { showToast("Failed to delete player", "error"); }
  }

  const thStyle = { padding: "0.6rem 0.75rem", textAlign: "left", color: "#64748b",
                    fontSize: "0.78rem", fontWeight: 600, borderBottom: "1px solid #2d3148" };
  const tdStyle = { padding: "0.6rem 0.75rem", fontSize: "0.88rem", borderBottom: "1px solid #1a1f35" };

  return (
    <div>
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 300,
          background: toast.type === "error" ? "#7f1d1d" : "#14532d",
          border: `1px solid ${toast.type === "error" ? "#dc2626" : "#16a34a"}`,
          color: "#fff", borderRadius: 7, padding: "0.75rem 1.25rem",
          fontSize: "0.9rem", boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        }}>{toast.msg}</div>
      )}

      {modal && (
        <PlayerModal
          initial={modal === "create" ? null : modal}
          onSave={modal === "create" ? handleCreate : handleEdit}
          onClose={() => setModal(null)}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Players</h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Search, filter, and manage player records</p>
        </div>
        <button style={btn.primary} onClick={() => setModal("create")}>+ Add Player</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input
          style={{ ...inputStyle, width: 250 }}
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select style={{ ...inputStyle, width: 120 }} value={position} onChange={e => setPosition(e.target.value)}>
          <option value="">All positions</option>
          {["PG","SG","SF","PF","C","G","F"].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select style={{ ...inputStyle, width: 130 }} value={season} onChange={e => setSeason(e.target.value)}>
          <option value="">All seasons</option>
          {[2023,2022,2021,2020,2019].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button style={btn.ghost} onClick={fetchPlayers}>Refresh</button>
      </div>

      {/* Table */}
      <div style={{ background: "#1e2130", border: "1px solid #2d3148", borderRadius: 8, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Name","Position","Born","Height","Weight","Draft Year","Pick","Country","Actions"].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ ...tdStyle, textAlign: "center", color: "#64748b", padding: "2rem" }}>Loading...</td></tr>
            ) : players.length === 0 ? (
              <tr><td colSpan={9} style={{ ...tdStyle, textAlign: "center", color: "#64748b", padding: "2rem" }}>No players found</td></tr>
            ) : players.map(p => (
              <tr key={p.player_id} style={{ transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#252840"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{p.full_name}</td>
                <td style={{ ...tdStyle, color: "#f97316" }}>{p.position || "—"}</td>
                <td style={tdStyle}>{p.birth_year || "—"}</td>
                <td style={tdStyle}>{p.height_in ? `${Math.floor(p.height_in/12)}'${p.height_in%12}"` : "—"}</td>
                <td style={tdStyle}>{p.weight_lbs ? `${p.weight_lbs} lbs` : "—"}</td>
                <td style={tdStyle}>{p.draft_year || "—"}</td>
                <td style={tdStyle}>{p.draft_pick || "Undrafted"}</td>
                <td style={tdStyle}>{p.country || "—"}</td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button style={btn.ghost} onClick={() => setModal(p)}>Edit</button>
                    <button style={btn.danger} onClick={() => handleDelete(p)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "0.5rem" }}>
        {players.length} player{players.length !== 1 ? "s" : ""} shown
      </p>
    </div>
  );
}
