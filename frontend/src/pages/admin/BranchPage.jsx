import { useEffect, useMemo, useState } from "react";
import { Building2, Plus, Search, Pencil, Trash2, X, MapPin, Phone, ShieldCheck, Users } from "lucide-react";
import { fetchBranches, upsertBranch, deleteBranch } from "../../services/supabaseService";

const EMPTY_FORM = { name: "", code: "", location: "", address: "", contact: "", status: "Active" };

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1e293b", color: "white", padding: "11px 22px", borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 9999, whiteSpace: "nowrap", boxShadow: "0 8px 30px #0003" }}>
      {msg}
    </div>
  );
}

export default function BranchPage({ employees = [] }) {
  const [branches, setBranches] = useState([]);
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

  useEffect(() => {
    fetchBranches().then((data) => { setBranches(data); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return branches.filter((b) => {
      if (statusFilter !== "All" && b.status !== statusFilter) return false;
      if (!q) return true;
      return [b.name, b.code, b.location, b.address, b.contact]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [branches, search, statusFilter]);

  const empCount = (name) => employees.filter((e) => e.branch === name).length;

  const openAdd = () => { setForm(EMPTY_FORM); setEditing(null); setShowModal(true); };
  const openEdit = (b) => { setForm({ ...b }); setEditing(b.id); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(EMPTY_FORM); };

  const save = async () => {
    if (!form.name?.trim()) { showToast("Branch name is required."); return; }
    if (!form.code?.trim()) { showToast("Branch code is required."); return; }
    const codeConflict = branches.some((b) => b.code.toLowerCase() === form.code.trim().toLowerCase() && b.id !== editing);
    if (codeConflict) { showToast("Branch code already exists."); return; }
    setSaving(true);
    const row = editing
      ? { ...form, id: editing, updated_at: new Date().toISOString() }
      : { ...form, name: form.name.trim(), code: form.code.trim().toUpperCase() };
    const saved = await upsertBranch(row);
    setBranches((prev) => editing ? prev.map((b) => b.id === editing ? saved : b) : [...prev, saved]);
    showToast(editing ? "Branch updated." : "Branch added.");
    setSaving(false);
    closeModal();
  };

  const startDelete = (b) => { setDelTarget(b); setDelStep(1); };
  const cancelDelete = () => { setDelTarget(null); setDelStep(1); };
  const confirmDelete = async () => {
    await deleteBranch(delTarget.id);
    setBranches((prev) => prev.filter((b) => b.id !== delTarget.id));
    showToast("Branch deleted.");
    cancelDelete();
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading branches…</div>;

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div className="welcome-row">
        <div>
          <div className="page-eyebrow">ORGANIZATION</div>
          <h1>Branch Management</h1>
          <p>Manage company branches and office locations.</p>
        </div>
        <button className="primary-button" onClick={openAdd}><Plus size={16} /> Add Branch</button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 22 }}>
        <div className="stat-card blue"><div className="stat-icon"><Building2 size={20} /></div><div className="stat-content"><span>Total Branches</span><strong>{branches.length}</strong><small>Configured</small></div></div>
        <div className="stat-card green"><div className="stat-icon"><ShieldCheck size={20} /></div><div className="stat-content"><span>Active</span><strong>{branches.filter((b) => b.status !== "Inactive").length}</strong><small>Operational</small></div></div>
        <div className="stat-card purple"><div className="stat-icon"><Users size={20} /></div><div className="stat-content"><span>Total Employees</span><strong>{employees.length}</strong><small>Across all branches</small></div></div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1px solid #e2e8f0", borderRadius: 11, padding: "0 14px", flex: 1, minWidth: 200 }}>
          <Search size={16} color="#94a3b8" />
          <input style={{ border: 0, outline: 0, padding: "11px 0", fontSize: 13, width: "100%", background: "transparent" }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, code, location…" />
          {search && <button onClick={() => setSearch("")} style={{ border: 0, background: "none", cursor: "pointer", color: "#94a3b8" }}><X size={14} /></button>}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ border: "1px solid #e2e8f0", borderRadius: 11, padding: "0 14px", fontSize: 13, background: "white", cursor: "pointer", height: 44 }}>
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <span style={{ fontSize: 12, color: "#7b8494", alignSelf: "center" }}>{filtered.length} branch{filtered.length !== 1 ? "es" : ""}</span>
      </div>

      {/* Table */}
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr 0.8fr 120px", padding: "11px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
          {["Branch", "Code", "Location", "Contact", "Status", "Actions"].map((h) => (
            <div key={h} style={{ fontSize: 10, fontWeight: 800, color: "#7b8494", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#94a3b8" }}>
            <Building2 size={38} style={{ opacity: 0.3, marginBottom: 12 }} />
            <strong style={{ display: "block", color: "#475569", marginBottom: 4 }}>No branches found</strong>
            <span style={{ fontSize: 12 }}>{search ? "Try a different search term." : "Click \"Add Branch\" to create one."}</span>
          </div>
        ) : filtered.map((b, idx) => (
          <div key={b.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr 0.8fr 120px", padding: "14px 20px", borderBottom: idx < filtered.length - 1 ? "1px solid #f8fafc" : "none", alignItems: "center" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
            onMouseLeave={(e) => e.currentTarget.style.background = "white"}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: "#eef2ff", color: "#4f46e5", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{b.name.charAt(0)}</div>
              <div>
                <strong style={{ display: "block", fontSize: 13, color: "#1e293b" }}>{b.name}</strong>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{empCount(b.name)} employee{empCount(b.name) !== 1 ? "s" : ""}</span>
              </div>
            </div>
            <div><span style={{ background: "#f1f5f9", color: "#475569", borderRadius: 7, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>{b.code}</span></div>
            <div style={{ fontSize: 13, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} color="#94a3b8" />{b.location || "—"}</div>
            <div style={{ fontSize: 12, color: "#7b8494", display: "flex", alignItems: "center", gap: 4 }}><Phone size={12} color="#94a3b8" />{b.contact || "—"}</div>
            <div><span style={{ fontSize: 11, fontWeight: 700, background: b.status === "Inactive" ? "#f1f5f9" : "#dcfce7", color: b.status === "Inactive" ? "#475569" : "#15803d", borderRadius: 999, padding: "3px 10px" }}>{b.status || "Active"}</span></div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => openEdit(b)} style={{ border: "1px solid #e2e8f0", background: "white", color: "#475569", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}><Pencil size={13} /></button>
              <button onClick={() => startDelete(b)} style={{ border: 0, background: "#fff1f2", color: "#dc2626", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "#11182780", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }} onMouseDown={closeModal}>
          <div style={{ background: "white", borderRadius: 18, width: "min(520px,100%)", padding: 28, boxShadow: "0 25px 70px #0005", maxHeight: "90vh", overflowY: "auto" }} onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17 }}>{editing ? "Edit Branch" : "Add Branch"}</h3>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#7b8494" }}>{editing ? "Update branch information" : "Create a new company branch"}</p>
              </div>
              <button onClick={closeModal} style={{ border: 0, background: "#f1f5f9", borderRadius: 8, padding: 8, cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              {[
                { key: "name", label: "Branch Name", placeholder: "e.g. Head Office", required: true },
                { key: "code", label: "Branch Code", placeholder: "e.g. HO001", required: true },
                { key: "location", label: "City / Location", placeholder: "e.g. Guntur" },
                { key: "address", label: "Full Address", placeholder: "Street, City, State" },
                { key: "contact", label: "Contact Number", placeholder: "e.g. +91 98765 43210" },
              ].map(({ key, label, placeholder, required }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>{label}{required && <em style={{ color: "#ef4444", marginLeft: 3 }}>*</em>}</label>
                  <input value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} onFocus={(e) => e.target.style.borderColor = "#4f46e5"} onBlur={(e) => e.target.style.borderColor = "#e2e8f0"} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>Status</label>
                <select value={form.status || "Active"} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none" }}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
              <button onClick={closeModal} style={{ border: "1px solid #e2e8f0", background: "white", color: "#475569", borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ border: 0, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "white", borderRadius: 10, padding: "10px 24px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : editing ? "Update Branch" : "Add Branch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {delTarget && (
        <div style={{ position: "fixed", inset: 0, background: "#11182780", display: "grid", placeItems: "center", zIndex: 60, padding: 20 }} onMouseDown={cancelDelete}>
          <div style={{ background: "white", borderRadius: 18, width: "min(420px,100%)", padding: 28, boxShadow: "0 25px 70px #0005", textAlign: "center" }} onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: "#fff1f2", color: "#dc2626", display: "grid", placeItems: "center", margin: "0 auto 14px" }}><Trash2 size={22} /></div>
            {delStep === 1 ? (
              <>
                <h3 style={{ margin: "0 0 8px" }}>Delete Branch?</h3>
                <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 6px" }}>Delete <strong>{delTarget.name}</strong>?</p>
                {empCount(delTarget.name) > 0 && <p style={{ color: "#f59e0b", fontSize: 12, margin: "0 0 10px", background: "#fffbeb", borderRadius: 8, padding: "8px 12px" }}>⚠ {empCount(delTarget.name)} employee(s) are assigned to this branch.</p>}
                <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 18px" }}>Step 1 of 2</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={cancelDelete} style={{ border: "1px solid #e2e8f0", background: "white", color: "#475569", borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                  <button onClick={() => setDelStep(2)} style={{ border: "1px solid #fca5a5", background: "#fff1f2", color: "#dc2626", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>Continue →</button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ margin: "0 0 8px" }}>Confirm Delete</h3>
                <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 18px" }}>Permanently remove <strong>{delTarget.name}</strong>. This cannot be undone.</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={cancelDelete} style={{ border: "1px solid #e2e8f0", background: "white", color: "#475569", borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                  <button onClick={confirmDelete} style={{ border: 0, background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "white", borderRadius: 10, padding: "10px 22px", fontWeight: 700, cursor: "pointer" }}>Delete Branch</button>
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
