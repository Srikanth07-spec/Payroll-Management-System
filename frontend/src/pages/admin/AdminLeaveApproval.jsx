import { useMemo, useState } from "react";
import {
  CalendarDays, CheckCircle2, ChevronDown, Clock3, FileText,
  Search, UserCheck, Users, X, XCircle, AlertTriangle, Building2,
} from "lucide-react";
import { updateLeaveStatus } from "../../services/supabaseService";
import "../LeaveManagement.css";

/* ─────────────────────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────────────────────── */
const ANNUAL_LEAVE = 12;
const STATUSES = ["All", "Pending", "Approved", "Rejected"];
const LEAVE_TYPES = ["All Types", "Casual Leave", "Sick Leave", "Earned Leave", "Emergency Leave"];

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */
function parseDate(v) {
  if (!v) return null;
  const [y, m, d] = String(v).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getDays(from, to) {
  const s = parseDate(from), e = parseDate(to);
  if (!s || !e || e < s) return 0;
  return Math.floor((e - s) / 86400000) + 1;
}

function fmtDate(v) {
  const d = parseDate(v);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getApprovedDays(leaves, employeeName, email, uid) {
  const yr = new Date().getFullYear();
  return leaves
    .filter((l) => {
      if (l.status !== "Approved") return false;
      const d = parseDate(l.from);
      if (!d || d.getFullYear() !== yr) return false;
      return (
        (uid  && (l.employeeUid === uid || l.uid === uid)) ||
        (email && l.employeeEmail?.toLowerCase() === email?.toLowerCase()) ||
        l.employee === employeeName
      );
    })
    .reduce((t, l) => t + getDays(l.from, l.to), 0);
}

/* ─────────────────────────────────────────────────────────────
   Status badge
   ───────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = {
    Pending:  { bg: "#fef9c3", color: "#854d0e", dot: "#f59e0b" },
    Approved: { bg: "#dcfce7", color: "#14532d", dot: "#22c55e" },
    Rejected: { bg: "#fee2e2", color: "#7f1d1d", dot: "#ef4444" },
  }[status] || { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" };

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: cfg.bg, color: cfg.color,
      borderRadius: 999, padding: "4px 11px",
      fontSize: 11, fontWeight: 800, letterSpacing: 0.3,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {status.toUpperCase()}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Summary card
   ───────────────────────────────────────────────────────────── */
function SummaryCard({ icon, label, value, color, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        background: active ? color + "18" : "white",
        border: `1.5px solid ${active ? color : "#e9edf4"}`,
        borderRadius: 16, padding: "16px 20px",
        cursor: "pointer", textAlign: "left", flex: 1,
        transition: "all 0.18s",
        boxShadow: active ? `0 0 0 3px ${color}22` : "0 2px 8px #1f29370a",
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 13,
        background: color + "18", color,
        display: "grid", placeItems: "center", flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: "#7b8494", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: active ? color : "#1e293b", lineHeight: 1.2 }}>{value}</div>
      </div>
    </button>
  );
}

/* ═════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════════════════════════ */
export default function AdminLeaveApproval({ leaves, setLeaves, employees = [] }) {

  /* ── filters ── */
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter,   setTypeFilter]   = useState("All Types");
  const [deptFilter,   setDeptFilter]   = useState("All Departments");
  const [search,       setSearch]       = useState("");

  /* ── modals ── */
  const [viewLeave,    setViewLeave]    = useState(null);  // view-only modal
  const [actionLeave,  setActionLeave]  = useState(null);  // approve/reject
  const [actionType,   setActionType]   = useState(null);  // "Approved" | "Rejected"
  const [rejectStep,   setRejectStep]   = useState(1);     // 1 or 2
  const [adminNote,    setAdminNote]    = useState("");
  const [toast,        setToast]        = useState({ msg: "", ok: true });

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: "", ok: true }), 3500);
  };

  /* ── employee map ── */
  const empMap = useMemo(() => {
    const m = new Map();
    employees.forEach((e) => {
      if (e.name)  m.set(e.name.toLowerCase(), e);
      if (e.email) m.set(e.email.toLowerCase(), e);
      if (e.uid)   m.set(e.uid, e);
    });
    return m;
  }, [employees]);

  const getProfile = (leave) =>
    empMap.get(leave.employeeUid) ||
    empMap.get(leave.employeeEmail?.toLowerCase()) ||
    empMap.get(leave.employee?.toLowerCase()) ||
    { name: leave.employee || "Employee", email: leave.employeeEmail || "", department: "—", designation: "Employee", id: leave.employeeId || "—" };

  /* ── departments list ── */
  const departments = useMemo(() => {
    const deps = new Set(employees.map((e) => e.department).filter(Boolean));
    return ["All Departments", ...Array.from(deps).sort()];
  }, [employees]);

  /* ── counts ── */
  const counts = useMemo(() => ({
    total:    leaves.length,
    pending:  leaves.filter((l) => l.status === "Pending").length,
    approved: leaves.filter((l) => l.status === "Approved").length,
    rejected: leaves.filter((l) => l.status === "Rejected").length,
  }), [leaves]);

  /* ── filtered list ── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leaves.filter((l) => {
      const p = getProfile(l);
      if (statusFilter !== "All" && l.status !== statusFilter) return false;
      if (typeFilter   !== "All Types" && l.type !== typeFilter) return false;
      if (deptFilter   !== "All Departments" && p.department !== deptFilter) return false;
      if (q && !`${l.employee} ${l.employeeEmail} ${l.type} ${p.department} ${l.reason}`
        .toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));
  }, [leaves, statusFilter, typeFilter, deptFilter, search, empMap]);

  /* ── open approve/reject ── */
  const openAction = (leave, type) => {
    setActionLeave(leave);
    setActionType(type);
    setRejectStep(1);
    setAdminNote(leave.adminNote || "");
    setViewLeave(null);
  };

  /* ── execute decision ── */
  const executeDecision = async () => {
    if (!actionLeave || !actionType) return;
    const updated = leaves.map((l) =>
      l.id === actionLeave.id
        ? { ...l, status: actionType, adminNote: adminNote.trim(), reviewedAt: new Date().toISOString() }
        : l
    );
    setLeaves(updated);
    await updateLeaveStatus(actionLeave.id, actionType, adminNote.trim(), new Date().toISOString()).catch(() => {});
    setActionLeave(null);
    setActionType(null);
    setAdminNote("");
    setRejectStep(1);
    showToast(
      actionType === "Approved"
        ? "Leave request approved successfully."
        : "Leave request rejected.",
      actionType === "Approved"
    );
  };

  /* ── close all ── */
  const closeAll = () => {
    setViewLeave(null);
    setActionLeave(null);
    setActionType(null);
    setAdminNote("");
    setRejectStep(1);
  };

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */
  return (
    <div style={{ paddingBottom: 40 }}>

      {/* ── HEADER ── */}
      <div className="welcome-row">
        <div>
          <div className="page-eyebrow">ADMINISTRATION</div>
          <h1>Leave Management</h1>
          <p>Review employee leave requests and manage approvals.</p>
        </div>
      </div>

      {/* ── SUMMARY CARDS ── */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        <SummaryCard
          icon={<FileText size={20} />}
          label="Total Requests"
          value={counts.total}
          color="#6366f1"
          active={statusFilter === "All"}
          onClick={() => setStatusFilter("All")}
        />
        <SummaryCard
          icon={<Clock3 size={20} />}
          label="Pending"
          value={counts.pending}
          color="#f59e0b"
          active={statusFilter === "Pending"}
          onClick={() => setStatusFilter("Pending")}
        />
        <SummaryCard
          icon={<CheckCircle2 size={20} />}
          label="Approved"
          value={counts.approved}
          color="#22c55e"
          active={statusFilter === "Approved"}
          onClick={() => setStatusFilter("Approved")}
        />
        <SummaryCard
          icon={<XCircle size={20} />}
          label="Rejected"
          value={counts.rejected}
          color="#ef4444"
          active={statusFilter === "Rejected"}
          onClick={() => setStatusFilter("Rejected")}
        />
      </div>

      {/* ── FILTERS TOOLBAR ── */}
      <div style={{
        display: "flex", gap: 10, alignItems: "center",
        background: "white", border: "1px solid #e9edf4",
        borderRadius: 14, padding: "12px 16px",
        marginBottom: 20, flexWrap: "wrap",
        boxShadow: "0 2px 8px #1f29370a",
      }}>
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#f8fafc", border: "1px solid #e2e8f0",
          borderRadius: 10, padding: "0 12px", flex: 1, minWidth: 180,
        }}>
          <Search size={16} color="#94a3b8" />
          <input
            style={{ border: 0, outline: 0, background: "transparent", padding: "9px 0", fontSize: 13, width: "100%" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee, type, department…"
          />
        </div>

        {/* Leave type filter */}
        <div style={{ position: "relative" }}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              border: "1px solid #e2e8f0", borderRadius: 10,
              padding: "9px 32px 9px 12px", fontSize: 12, fontWeight: 600,
              background: "white", appearance: "none", cursor: "pointer", color: "#475569",
            }}
          >
            {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8" }} />
        </div>

        {/* Department filter */}
        <div style={{ position: "relative" }}>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{
              border: "1px solid #e2e8f0", borderRadius: 10,
              padding: "9px 32px 9px 12px", fontSize: 12, fontWeight: 600,
              background: "white", appearance: "none", cursor: "pointer", color: "#475569",
            }}
          >
            {departments.map((d) => <option key={d}>{d}</option>)}
          </select>
          <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8" }} />
        </div>

        {/* Status tabs */}
        <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 3 }}>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "6px 14px", borderRadius: 8, border: 0,
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: statusFilter === s ? "white" : "transparent",
                color: statusFilter === s ? "#1e293b" : "#7b8494",
                boxShadow: statusFilter === s ? "0 1px 4px #0002" : "none",
                transition: "all 0.15s",
              }}
            >
              {s}
              {s !== "All" && (
                <span style={{
                  marginLeft: 5, fontSize: 10, fontWeight: 800,
                  background: statusFilter === s ? "#4f46e5" : "#e2e8f0",
                  color: statusFilter === s ? "white" : "#7b8494",
                  borderRadius: 999, padding: "1px 6px",
                }}>
                  {s === "Pending" ? counts.pending : s === "Approved" ? counts.approved : counts.rejected}
                </span>
              )}
            </button>
          ))}
        </div>

        <span style={{ fontSize: 12, color: "#7b8494", whiteSpace: "nowrap" }}>
          {filtered.length} request{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── TABLE ── */}
      <div style={{
        background: "white", border: "1px solid #e9edf4",
        borderRadius: 18, overflow: "hidden",
        boxShadow: "0 4px 16px #1f29370a",
      }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1.2fr 1fr 1fr 110px",
          gap: 0, borderBottom: "1px solid #f1f5f9",
          padding: "11px 20px",
          background: "#f8fafc",
        }}>
          {["Employee", "Leave Type", "Duration", "Dates", "Submitted", "Status", "Actions"].map((h) => (
            <div key={h} style={{ fontSize: 10, fontWeight: 800, color: "#7b8494", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 20px", color: "#94a3b8" }}>
            <FileText size={38} style={{ marginBottom: 12, opacity: 0.3 }} />
            <strong style={{ display: "block", fontSize: 15, color: "#475569" }}>No leave requests found</strong>
            <span style={{ fontSize: 12 }}>Adjust your filters or wait for employees to submit requests.</span>
          </div>
        ) : filtered.map((leave, idx) => {
          const p       = getProfile(leave);
          const days    = getDays(leave.from, leave.to);
          const taken   = getApprovedDays(leaves, p.name, p.email, leave.employeeUid || leave.uid);
          const balance = Math.max(0, ANNUAL_LEAVE - taken);
          const isPending = leave.status === "Pending";

          return (
            <div
              key={leave.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1.2fr 1fr 1fr 110px",
                gap: 0, padding: "14px 20px",
                borderBottom: idx < filtered.length - 1 ? "1px solid #f8fafc" : "none",
                background: isPending ? "#fffbeb08" : "white",
                alignItems: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={(e) => e.currentTarget.style.background = isPending ? "#fffbeb08" : "white"}
            >
              {/* Employee */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                  background: "#eef2ff", color: "#4f46e5",
                  display: "grid", placeItems: "center",
                  fontWeight: 800, fontSize: 15,
                }}>
                  {p.name?.charAt(0).toUpperCase() || "E"}
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: 13, color: "#1e293b" }}>{p.name}</strong>
                  <span style={{ fontSize: 11, color: "#7b8494" }}>
                    {p.id || leave.employeeId || "—"} · {p.department || "—"}
                  </span>
                </div>
              </div>

              {/* Leave type */}
              <div>
                <span style={{
                  background: "#f1f5f9", color: "#475569",
                  borderRadius: 8, padding: "4px 9px",
                  fontSize: 11, fontWeight: 700,
                }}>
                  {leave.type}
                </span>
              </div>

              {/* Duration */}
              <div>
                <strong style={{ fontSize: 14, color: "#1e293b" }}>{days}</strong>
                <span style={{ fontSize: 11, color: "#7b8494" }}> day{days !== 1 ? "s" : ""}</span>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>Balance: {balance} left</div>
              </div>

              {/* Dates */}
              <div style={{ fontSize: 12, color: "#475569" }}>
                <div>{fmtDate(leave.from)}</div>
                <div style={{ color: "#94a3b8", fontSize: 10 }}>to {fmtDate(leave.to)}</div>
              </div>

              {/* Submitted */}
              <div style={{ fontSize: 12, color: "#7b8494" }}>
                {fmtDateTime(leave.submittedAt)}
              </div>

              {/* Status */}
              <div>
                <StatusBadge status={leave.status} />
                {leave.adminNote && (
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {leave.adminNote}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setViewLeave(leave)}
                  style={{
                    border: "1px solid #e2e8f0", background: "white", color: "#475569",
                    borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  View
                </button>
                {isPending && (
                  <>
                    <button
                      type="button"
                      onClick={() => openAction(leave, "Approved")}
                      style={{
                        border: 0, background: "#dcfce7", color: "#15803d",
                        borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => openAction(leave, "Rejected")}
                      style={{
                        border: 0, background: "#fee2e2", color: "#dc2626",
                        borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════
          VIEW DETAILS MODAL
          ══════════════════════════════════════════ */}
      {viewLeave && !actionLeave && (() => {
        const p     = getProfile(viewLeave);
        const days  = getDays(viewLeave.from, viewLeave.to);
        const taken = getApprovedDays(leaves, p.name, p.email, viewLeave.employeeUid || viewLeave.uid);
        const bal   = Math.max(0, ANNUAL_LEAVE - taken);
        return (
          <div style={{ position: "fixed", inset: 0, background: "#11182780", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }} onMouseDown={closeAll}>
            <div style={{ background: "white", borderRadius: 20, width: "min(560px,100%)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 70px #0005" }} onMouseDown={(e) => e.stopPropagation()}>
              {/* Header */}
              <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#7b8494", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>LEAVE REQUEST DETAILS</div>
                  <h2 style={{ margin: 0, fontSize: 20 }}>{p.name}</h2>
                  <span style={{ fontSize: 12, color: "#7b8494" }}>{p.id || "—"} · {p.department || "—"} · {p.designation || "Employee"}</span>
                </div>
                <button type="button" onClick={closeAll} style={{ border: 0, background: "none", cursor: "pointer", color: "#7b8494" }}><X size={20} /></button>
              </div>

              <div style={{ padding: "20px 24px" }}>
                {/* Employee stats strip */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                  {[
                    ["Annual Leave", ANNUAL_LEAVE + " days"],
                    ["Taken / Approved", taken + " days"],
                    ["Remaining", bal + " days"],
                    ["Requested", days + " day" + (days !== 1 ? "s" : "")],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: "#7b8494", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginTop: 2 }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Leave info */}
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      ["Leave Type", viewLeave.type],
                      ["Duration",   days + " day" + (days !== 1 ? "s" : "")],
                      ["From Date",  fmtDate(viewLeave.from)],
                      ["To Date",    fmtDate(viewLeave.to)],
                      ["Submitted",  fmtDateTime(viewLeave.submittedAt)],
                      ["Employee ID", p.id || viewLeave.employeeId || "—"],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div style={{ fontSize: 10, color: "#7b8494", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: "#7b8494", fontWeight: 800, textTransform: "uppercase", marginBottom: 6 }}>Reason</div>
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                    {viewLeave.reason || "No reason provided."}
                  </div>
                </div>

                {/* Admin note */}
                {viewLeave.adminNote && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: "#7b8494", fontWeight: 800, textTransform: "uppercase", marginBottom: 6 }}>Admin Note</div>
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#78350f" }}>
                      {viewLeave.adminNote}
                    </div>
                  </div>
                )}

                {/* Status */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Current Status:</span>
                  <StatusBadge status={viewLeave.status} />
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button type="button" onClick={closeAll} style={{ border: "1px solid #e2e8f0", background: "white", color: "#475569", borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                    Close
                  </button>
                  {viewLeave.status === "Pending" && (
                    <>
                      <button type="button" onClick={() => openAction(viewLeave, "Rejected")}
                        style={{ border: 0, background: "#fee2e2", color: "#dc2626", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                        <XCircle size={15} style={{ verticalAlign: "middle", marginRight: 5 }} />Reject
                      </button>
                      <button type="button" onClick={() => openAction(viewLeave, "Approved")}
                        style={{ border: 0, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                        <CheckCircle2 size={15} style={{ verticalAlign: "middle", marginRight: 5 }} />Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════
          APPROVE CONFIRMATION MODAL (single step)
          ══════════════════════════════════════════ */}
      {actionLeave && actionType === "Approved" && (
        <div style={{ position: "fixed", inset: 0, background: "#11182780", display: "grid", placeItems: "center", zIndex: 60, padding: 20 }} onMouseDown={closeAll}>
          <div style={{ background: "white", borderRadius: 20, width: "min(480px,100%)", padding: "28px 28px", boxShadow: "0 25px 70px #0005" }} onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "#dcfce7", color: "#15803d", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
              <CheckCircle2 size={26} />
            </div>
            <h3 style={{ textAlign: "center", margin: "0 0 6px", fontSize: 18 }}>Approve Leave Request?</h3>
            <p style={{ textAlign: "center", color: "#64748b", fontSize: 13, margin: "0 0 18px", lineHeight: 1.6 }}>
              You are approving <strong>{getDays(actionLeave.from, actionLeave.to)}-day</strong> {actionLeave.type} for <strong>{getProfile(actionLeave).name}</strong> ({fmtDate(actionLeave.from)} → {fmtDate(actionLeave.to)}).
            </p>
            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>Admin Note <em style={{ fontStyle: "normal", color: "#94a3b8" }}>(optional)</em></span>
              <textarea
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add a note for the employee (optional)…"
                style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", fontSize: 13, resize: "vertical", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
            </label>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={closeAll} style={{ border: "1px solid #e2e8f0", background: "white", color: "#475569", borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Cancel</button>
              <button type="button" onClick={executeDecision} style={{ border: 0, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", borderRadius: 10, padding: "10px 22px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                <CheckCircle2 size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />Approve Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          REJECT TWO-STEP MODAL
          ══════════════════════════════════════════ */}
      {actionLeave && actionType === "Rejected" && (
        <div style={{ position: "fixed", inset: 0, background: "#11182780", display: "grid", placeItems: "center", zIndex: 60, padding: 20 }} onMouseDown={closeAll}>
          <div style={{ background: "white", borderRadius: 20, width: "min(480px,100%)", padding: "28px 28px", boxShadow: "0 25px 70px #0005" }} onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "#fee2e2", color: "#dc2626", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
              <XCircle size={26} />
            </div>

            {rejectStep === 1 ? (
              <>
                <h3 style={{ textAlign: "center", margin: "0 0 6px", fontSize: 18 }}>Reject Leave Request?</h3>
                <p style={{ textAlign: "center", color: "#64748b", fontSize: 13, margin: "0 0 6px", lineHeight: 1.6 }}>
                  Are you sure you want to reject this leave request for <strong>{getProfile(actionLeave).name}</strong>?
                </p>
                <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", margin: "0 0 20px" }}>Step 1 of 2 — Click Continue to proceed.</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button type="button" onClick={closeAll} style={{ border: "1px solid #e2e8f0", background: "white", color: "#475569", borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Cancel</button>
                  <button type="button" onClick={() => setRejectStep(2)} style={{ border: "1px solid #fca5a5", background: "#fff1f2", color: "#dc2626", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                    Continue →
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ textAlign: "center", margin: "0 0 6px", fontSize: 18 }}>Confirm Leave Rejection</h3>
                <p style={{ textAlign: "center", color: "#64748b", fontSize: 13, margin: "0 0 6px", lineHeight: 1.6 }}>
                  <strong>{getDays(actionLeave.from, actionLeave.to)}-day</strong> {actionLeave.type} ({fmtDate(actionLeave.from)} → {fmtDate(actionLeave.to)}) will be permanently rejected. The employee will see REJECTED status.
                </p>
                <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", margin: "0 0 16px" }}>Step 2 of 2 — This is your final confirmation.</p>
                <label style={{ display: "block", marginBottom: 16 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>Reason for rejection <em style={{ fontStyle: "normal", color: "#94a3b8" }}>(optional)</em></span>
                  <textarea
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Explain why the request is being rejected…"
                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", fontSize: 13, resize: "vertical", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                  />
                </label>
                <div style={{ background: "#fff1f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 12px", marginBottom: 16, fontSize: 12, color: "#dc2626", display: "flex", gap: 8 }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>The employee will immediately see this request as <strong>REJECTED</strong>. This cannot be undone without manually changing it.</span>
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button type="button" onClick={closeAll} style={{ border: "1px solid #e2e8f0", background: "white", color: "#475569", borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Cancel</button>
                  <button type="button" onClick={executeDecision} style={{ border: 0, background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "white", borderRadius: 10, padding: "10px 22px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                    <XCircle size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />Reject Leave
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast.msg && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.ok ? "#15803d" : "#1e293b", color: "white",
          padding: "12px 22px", borderRadius: 12, fontSize: 13, fontWeight: 600,
          zIndex: 9999, boxShadow: "0 8px 24px #0004",
          display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
        }}>
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
