import { useEffect, useMemo, useState } from "react";
import { Clock3, Plus, Search, Pencil, Trash2, X, ShieldCheck, Users } from "lucide-react";
import { fetchShifts, upsertShift, deleteShift } from "../../services/supabaseService";

const EMPTY_FORM = { name: "", code: "", start_time: "", end_time: "", break_time: "", working_hours: "", status: "Active" };

function Toast({ msg }) {
  if (!msg) return null;
  return <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1e293b", color: "white", padding: "11px 22px", borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 9999, whiteSpace: "nowrap" }}>{msg}</div>;
}

function fmt(t) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function ShiftPage({ employees = [] }) {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [delTarget, setDelTarget] = useState(null);
  const [delStep, setDelStep] = useState(1);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  useEffect(() => { fetchShifts().then((s) => { setShifts(s); setLoading(false); }); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shifts.filter((s) => {
      if (statusFilter !== "All" && s.status !== statusFilter) return false;
      if (!q) return true;
      return [s.name, s.code, s.start_time, s.end_time, s.break_time].filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [shifts, search, statusFilter]);

  const empCount = (name) => employees.filter((e) => e.shift === name).length;

  const openAdd = () => { setForm(EMPTY_FORM); setEditing(null); setShowModal(true); };
  const openEdit = (s) => { setForm({ ...s }); setEditing(s.id); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(EMPTY_FORM); };

  const save = async () => {
    if (!form.name?.trim()) { showToast("Shift name is required."); return; }
    if (!form.code?.trim()) { showToast("Shift code is required."); return; }
    if (shifts.some((s) => s.code.toLowerCase() === form.code.trim().toLowerCase() && s.id !== editing)) {
      showToast("Shift code already exists."); return;
    }
    setSaving(true);
    const row = editing
      ? { ...form, id: editing, updated_at: new Date().toISOString() }
      : { ...form, name: form.name.trim(), code: form.code.trim().toUpperCase() };
    const saved = await upsertShift(row);
    setShifts((prev) => editing ? prev.map((s) => s.id === editing ? saved : s) : [...prev, saved]);
    showToast(editing ? "Shift updated." : "Shift added.");
    setSaving(false);
    closeModal();
  };

  const startDelete = (s) => { setDelTarget(s); setDelStep(1); };
  const cancelDelete = () => { setDelTarget(null); setDelStep(1); };
  const confirmDelete = async () => {
    await deleteShift(delTarget.id);
    setShifts((prev) => prev.filter((s) => s.id !== delTarget.id));
    showToast("Shift deleted.");
    cancelDelete();
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading shifts…</div>;

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="welcome-row">
        <div>
          <div className="page-eyebrow">ORGANIZATION</div>
          <h1>Shift Management</h1>
          <p>Manage company work shifts and schedules.</p>
        </div>
        <button className="primary-button" onClick={openAdd}><Plus size={16} /> Add Shift</button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 22 }}>
        <div className="stat-card blue"><div className="stat-icon"><Clock3 size={20} /></div><div className="stat-content"><span>Total Shifts</span><strong>{shifts.length}</strong><small>Configured</small></div></div>
        <div className="stat-card green"><div className="stat-icon"><ShieldCheck size={20} /></div><div className="stat-content"><span>Active</span><strong>{shifts.filter((s) => s.status !== "Inactive").length}</strong><small>Operational</small></div></div>
        <div className="stat-card purple"><div className="stat-icon"><Users size={20} /></div><div className="stat-content"><span>Total Employees</span><strong>{employees.length}</strong><small>Across all shifts</small></div></div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1px solid #e2e8f0", borderRadius: 11, padding: "0 14px", flex: 1, minWidth: 200 }}>
          <Search size={16} color="#94a3b8" />
          <input style={{ border: 0, outline: 0, padding: "11px 0", fontSize: 13, width: "100%", background: "transparent" }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, code, time…" />
          {search && <button onClick={() => setSearch("")} style={{ border: 0, background: "none", cursor: "pointer", color: "#94a3b8" }}><X size={14} /></button>}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ border: "1px solid #e2e8f0", borderRadius: 11, padding: "0 14px", fontSize: 13, background: "white", cursor: "pointer", height: 44 }}>
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <span style={{ fontSize: 12, color: "#7b8494", alignSelf: "center" }}>{filtered.length} shift{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 0.8fr 0.8fr 120px", padding: "11px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
          {["Shift", "Code", "Start", "End", "Break", "Hours", "Status", "Actions"].map((h) => (
            <div key={h} style={{ fontSize: 10, fontWeight: 800, color: "#7b8494", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#94a3b8" }}>
            <Clock3 size={38} style={{ opacity: 0.3, marginBottom: 12 }} />
            <strong style={{ display: "block", color: "#475569", marginBottom: 4 }}>No shifts found</strong>
            <span style={{ fontSize: 12 }}>{search ? "Try a different search term." : "Click \"Add Shift\" to create one."}</span>
          </div>
        ) : filtered.map((s, idx) => (
          <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 0.8fr 0.8fr 120px", padding: "14px 20px", borderBottom: idx < filtered.length - 1 ? "1px solid #f8fafc" : "none", alignItems: "center" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
            onMouseLeave={(e) => e.currentTarget.style.background = "white"}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: "#fff7ed", color: "#c2410c", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 15, flexShrink: 0 }}><Clock3 size={18} /></div>
              <div>
                <strong style={{ display: "block", fontSize: 13, color: "#1e293b" }}>{s.name}</strong>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{empCount(s.name)} emp.</span>
              </div>
            </div>
            <div><span style={{ background: "#f1f5f9", color: "#475569", borderRadius: 7, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>{s.code}</span></div>
            <div style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>{fmt(s.start_time)}</div>
            <div style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>{fmt(s.end_time)}</div>
            <div style={{ fontSize: 12, color: "#7b8494" }}>{s.break_time || "—"}</div>
            <div style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>{s.working_hours || "—"}</div>
            <div><span style={{ fontSize: 11, fontWeight: 700, background: s.status === "Inactive" ? "#f1f5f9" : "#dcfce7", color: s.status === "Inactive" ? "#475569" : "#15803d", borderRadius: 999, padding: "3px 10px" }}>{s.status || "Active"}</span></div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => openEdit(s)} style={{ border: "1px solid #e2e8f0", background: "white", color: "#475569", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}><Pencil size={13} /></button>
              <button onClick={() => startDelete(s)} style={{ border: 0, background: "#fff1f2", color: "#dc2626", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "#11182780", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }} onMouseDown={closeModal}>
          <div style={{ background: "white", borderRadius: 18, width: "min(520px,100%)", padding: 28, boxShadow: "0 25px 70px #0005", maxHeight: "90vh", overflowY: "auto" }} onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>{editing ? "Edit Shift" : "Add Shift"}</h3>
              <button onClick={closeModal} style={{ border: 0, background: "#f1f5f9", borderRadius: 8, padding: 8, cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>Shift Name <em style={{ color: "#ef4444" }}>*</em></label>
                <input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. General Shift" style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} onFocus={(e) => e.target.style.borderColor = "#4f46e5"} onBlur={(e) => e.target.style.borderColor = "#e2e8f0"} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>Shift Code <em style={{ color: "#ef4444" }}>*</em></label>
                <input value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. GS001" style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} onFocus={(e) => e.target.style.borderColor = "#4f46e5"} onBlur={(e) => e.target.style.borderColor = "#e2e8f0"} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>Start Time</label>
                  <input type="time" value={form.start_time || ""} onChange={(e) => setForm({ ...form, start_time: e.target.value })} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>End Time</label>
                  <input type="time" value={form.end_time || ""} onChange={(e) => setForm({ ...form, end_time: e.target.value })} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>Break Time</label>
                  <input value={form.break_time || ""} onChange={(e) => setForm({ ...form, break_time: e.target.value })} placeholder="e.g. 13:00-14:00" style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>Working Hours</label>
                  <input value={form.working_hours || ""} onChange={(e) => setForm({ ...form, working_hours: e.target.value })} placeholder="e.g. 8 hrs" style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>Status</label>
                <select value={form.status || "Active"} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "9px 12px", fontSize: 13 }}>
                  <option>Active</option><option>Inactive</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
              <button onClick={closeModal} style={{ border: "1px solid #e2e8f0", background: "white", color: "#475569", borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ border: 0, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "white", borderRadius: 10, padding: "10px 24px", fontWeight: 700, cursor: "pointer" }}>{saving ? "Saving…" : editing ? "Update Shift" : "Add Shift"}</button>
            </div>
          </div>
        </div>
      )}

      {delTarget && (
        <div style={{ position: "fixed", inset: 0, background: "#11182780", display: "grid", placeItems: "center", zIndex: 60, padding: 20 }} onMouseDown={cancelDelete}>
          <div style={{ background: "white", borderRadius: 18, width: "min(420px,100%)", padding: 28, boxShadow: "0 25px 70px #0005", textAlign: "center" }} onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: "#fff1f2", color: "#dc2626", display: "grid", placeItems: "center", margin: "0 auto 14px" }}><Trash2 size={22} /></div>
            {delStep === 1 ? (
              <>
                <h3 style={{ margin: "0 0 8px" }}>Delete Shift?</h3>
                <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 6px" }}>Delete <strong>{delTarget.name}</strong>?</p>
                {empCount(delTarget.name) > 0 && <p style={{ color: "#f59e0b", fontSize: 12, background: "#fffbeb", borderRadius: 8, padding: "8px 12px", margin: "0 0 10px" }}>⚠ {empCount(delTarget.name)} employee(s) on this shift.</p>}
                <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 18px" }}>Step 1 of 2</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={cancelDelete} style={{ border: "1px solid #e2e8f0", background: "white", color: "#475569", borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                  <button onClick={() => setDelStep(2)} style={{ border: "1px solid #fca5a5", background: "#fff1f2", color: "#dc2626", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>Continue →</button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ margin: "0 0 8px" }}>Confirm Delete</h3>
                <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 18px" }}>Permanently remove <strong>{delTarget.name}</strong>.</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={cancelDelete} style={{ border: "1px solid #e2e8f0", background: "white", color: "#475569", borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                  <button onClick={confirmDelete} style={{ border: 0, background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "white", borderRadius: 10, padding: "10px 22px", fontWeight: 700, cursor: "pointer" }}>Delete Shift</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <Toast msg={toast} />
    </div>
  );
}
