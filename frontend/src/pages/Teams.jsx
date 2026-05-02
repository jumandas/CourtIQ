/**
 * CourtIQ Analytics - Teams Page
 * Author: Juman Das (Frontend Lead)
 *
 * Lists all 30 NBA teams with salary history. Includes Create/Edit/Delete.
 */
import React, { useEffect, useState, useCallback } from "react";
import client from "../api/client.js";

const btnBase = { border: "none", borderRadius: 5, cursor: "pointer", fontSize: "0.85rem", padding: "0.4rem 0.85rem", fontWeight: 500 };
const btn = {
  primary: { ...btnBase, background: "#f97316", color: "#fff" },
  danger:  { ...btnBase, background: "#dc2626", color: "#fff" },
  ghost:   { ...btnBase, background: "#2d3148", color: "#e2e8f0" },
};
const inputStyle = {
  background: "#0f1117", border: "1px solid #2d3148", borderRadius: 5,
  color: "#e2e8f0", padding: "0.45rem 0.75rem", fontSize: "0.9rem", width: "100%",
};

function TeamModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    team_name: "", abbreviation: "", city: "", conference: "Eastern", division: "", founded_year: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex",
                    alignItems: "center", justifyContent: "center", zIndex: 200 };
  const modal   = { background: "#1e2130", border: "1px solid #2d3148", borderRadius: 10,
                    padding: "1.5rem", width: 440 };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <h2 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>{initial ? "Edit Team" : "Add Team"}</h2>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
          {[["Team Name*","team_name"],["Abbreviation*","abbreviation"],["City*","city"],["Founded Year","founded_year"]].map(([label, key]) => (
            <div key={key} style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: 3 }}>{label}</label>
              <input style={inputStyle} value={form[key] ?? ""} onChange={e => set(key, e.target.value)}
                     required={label.endsWith("*")} />
            </div>
          ))}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: 3 }}>Conference*</label>
              <select style={inputStyle} value={form.conference} onChange={e => set("conference", e.target.value)}>
                <option value="Eastern">Eastern</option>
                <option value="Western">Western</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: 3 }}>Division</label>
              <select style={inputStyle} value={form.division} onChange={e => set("division", e.target.value)}>
                {["Atlantic","Central","Southeast","Northwest","Pacific","Southwest"].map(d =>
                  <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button type="button" style={btn.ghost} onClick={onClose}>Cancel</button>
            <button type="submit" style={btn.primary}>{initial ? "Save Changes" : "Create Team"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Teams() {
  const [teams,     setTeams]     = useState([]);
  const [conf,      setConf]      = useState("");
  const [modal,     setModal]     = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [toast,     setToast]     = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTeams = useCallback(() => {
    setLoading(true);
    const params = conf ? { conference: conf } : {};
    client.get("/teams", { params })
      .then(r => setTeams(r.data))
      .catch(() => showToast("Failed to load teams", "error"))
      .finally(() => setLoading(false));
  }, [conf]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  async function handleSave(payload) {
    try {
      if (modal === "create") {
        await client.post("/teams", payload);
        showToast("Team created");
      } else {
        await client.put(`/teams/${modal.team_id}`, payload);
        showToast("Team updated");
      }
      setModal(null);
      fetchTeams();
    } catch { showToast("Save failed", "error"); }
  }

  async function handleDelete(team) {
    if (!window.confirm(`Delete ${team.team_name}?`)) return;
    try {
      await client.delete(`/teams/${team.team_id}`);
      showToast("Team deleted");
      fetchTeams();
    } catch { showToast("Delete failed", "error"); }
  }

  const confColor = c => c === "Eastern" ? "#3b82f6" : "#f97316";
  const thStyle   = { padding: "0.6rem 0.75rem", textAlign: "left", color: "#64748b",
                      fontSize: "0.78rem", fontWeight: 600, borderBottom: "1px solid #2d3148" };
  const tdStyle   = { padding: "0.6rem 0.75rem", fontSize: "0.88rem", borderBottom: "1px solid #1a1f35" };

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 300,
                      background: toast.type === "error" ? "#7f1d1d" : "#14532d",
                      border: `1px solid ${toast.type === "error" ? "#dc2626" : "#16a34a"}`,
                      color: "#fff", borderRadius: 7, padding: "0.75rem 1.25rem", fontSize: "0.9rem" }}>
          {toast.msg}
        </div>
      )}
      {modal && <TeamModal initial={modal === "create" ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Teams</h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem" }}>All 30 NBA franchises</p>
        </div>
        <button style={btn.primary} onClick={() => setModal("create")}>+ Add Team</button>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <select style={{ ...inputStyle, width: 160 }} value={conf} onChange={e => setConf(e.target.value)}>
          <option value="">All conferences</option>
          <option value="Eastern">Eastern</option>
          <option value="Western">Western</option>
        </select>
        <button style={btn.ghost} onClick={fetchTeams}>Refresh</button>
      </div>

      <div style={{ background: "#1e2130", border: "1px solid #2d3148", borderRadius: 8, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Team","Abbr","City","Conference","Division","Founded","Actions"].map(h =>
                <th key={h} style={thStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "#64748b", padding: "2rem" }}>Loading...</td></tr>
            ) : teams.map(t => (
              <tr key={t.team_id}
                  onMouseEnter={e => e.currentTarget.style.background = "#252840"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{t.team_name}</td>
                <td style={{ ...tdStyle, fontFamily: "monospace", color: "#94a3b8" }}>{t.abbreviation}</td>
                <td style={tdStyle}>{t.city}</td>
                <td style={tdStyle}>
                  <span style={{ background: confColor(t.conference) + "22", color: confColor(t.conference),
                                 borderRadius: 4, padding: "0.15rem 0.5rem", fontSize: "0.8rem" }}>
                    {t.conference}
                  </span>
                </td>
                <td style={tdStyle}>{t.division}</td>
                <td style={tdStyle}>{t.founded_year}</td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button style={btn.ghost} onClick={() => setModal(t)}>Edit</button>
                    <button style={btn.danger} onClick={() => handleDelete(t)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
