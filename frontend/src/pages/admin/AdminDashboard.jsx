import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, CheckCircle2, Clock3, FileBarChart,
  Gift, TrendingUp, UserCheck, Users, WalletCards, XCircle,
} from "lucide-react";

function loadLocalData(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ── Mini bar chart for department distribution ── */
function DeptChart({ employees }) {
  const counts = useMemo(() => {
    const map = {};
    employees.forEach((e) => {
      const d = e.department || "Other";
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [employees]);

  const max = counts.length > 0 ? Math.max(...counts.map((c) => c[1])) : 1;
  const barColors = ["#4f46e5", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#a855f7"];

  return (
    <div className="panel" style={{ gridColumn: "1 / -1" }}>
      <div className="panel-header" style={{ marginBottom: 18 }}>
        <div><h3>Employee Distribution</h3><span>Headcount by department</span></div>
        <TrendingUp size={20} color="#4f46e5" />
      </div>
      {counts.length === 0 ? (
        <div style={{ textAlign: "center", color: "#94a3b8", padding: "30px 0", fontSize: 13 }}>No employee data available.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {counts.map(([dept, count], i) => (
            <div key={dept} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 120, fontSize: 12, fontWeight: 600, color: "#374151", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={dept}>{dept}</div>
              <div style={{ flex: 1, height: 28, background: "#f1f5f9", borderRadius: 8, overflow: "hidden", position: "relative" }}>
                <div style={{
                  height: "100%", borderRadius: 8,
                  width: `${Math.max(4, (count / max) * 100)}%`,
                  background: barColors[i % barColors.length],
                  transition: "width 0.6s ease",
                  display: "flex", alignItems: "center", paddingLeft: 10,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "white", whiteSpace: "nowrap" }}>{count}</span>
                </div>
              </div>
              <div style={{ width: 28, fontSize: 12, fontWeight: 700, color: "#64748b", textAlign: "right", flexShrink: 0 }}>{count}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
function AdminHome({ employees, leaves, holidays, setPage, currentUser }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const greeting =
    now.getHours() < 12 ? "Good Morning" :
    now.getHours() < 17 ? "Good Afternoon" : "Good Evening";

  /* ── Real stats ── */
  const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;
  const approvedLeaves = leaves.filter((l) => l.status === "Approved").length;

  const todayStr = now.toLocaleDateString();
  const attToday = useMemo(() => {
    const all = loadLocalData("payroll_attendance", []);
    const uidsPresent = new Set(
      all.filter((r) => {
        const recDate = r.date || (r.checkIn ? new Date(r.checkIn).toLocaleDateString() : null);
        return recDate === todayStr && (r.action === "Login" || r.status === "Present");
      }).map((r) => r.uid)
    );
    return uidsPresent.size;
  }, [todayStr]);

  const absentToday = Math.max(0, employees.length - attToday);

  /* ── Upcoming holidays ── */
  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  const upcomingHols = holidays
    .filter((h) => new Date(h.date) >= today0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  /* ── Recent activity from attendance log ── */
  const recentActivity = useMemo(() => {
    const all = loadLocalData("payroll_attendance", []);
    return all
      .filter((r) => r.time || r.checkIn)
      .sort((a, b) => new Date(b.time || b.checkIn) - new Date(a.time || a.checkIn))
      .slice(0, 6);
  }, []);

  return (
    <div style={{ paddingBottom: 40 }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <div className="page-eyebrow">ADMINISTRATION</div>
          <h1 style={{ margin: "6px 0 6px" }}>{greeting}, {currentUser?.displayName || "Admin"}</h1>
          <p style={{ margin: 0, color: "#697386" }}>
            {now.toLocaleDateString([], { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "white", border: "1px solid #e9edf4", borderRadius: 14, padding: "10px 16px", textAlign: "right", boxShadow: "0 2px 8px #0001" }}>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "0.05em", color: "#1e293b" }}>
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Current Time</div>
          </div>
          <div className="mini-profile">
            <div className="avatar">{(currentUser?.displayName || "A").charAt(0).toUpperCase()}</div>
            <div>
              <strong>{currentUser?.displayName || "Administrator"}</strong>
              <span>Administrator</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="stats-grid" style={{ marginBottom: 22 }}>
        <div className="stat-card blue">
          <div className="stat-icon"><Users size={21} /></div>
          <div className="stat-content"><span>Total Employees</span><strong>{employees.length}</strong><small>Active in system</small></div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><UserCheck size={21} /></div>
          <div className="stat-content"><span>Present Today</span><strong>{attToday}</strong><small>Verified attendance</small></div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><XCircle size={21} /></div>
          <div className="stat-content"><span>Absent Today</span><strong>{absentToday}</strong><small>Not marked present</small></div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon"><CalendarDays size={21} /></div>
          <div className="stat-content"><span>Pending Leaves</span><strong>{pendingLeaves}</strong><small>Awaiting your action</small></div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="section-title"><div><h2>Quick Operations</h2><p>Frequently used payroll operations</p></div></div>
      <div className="quick-grid" style={{ marginBottom: 24 }}>
        {[
          ["employees",  "Manage Employees",  Users,        "blue-card",   "Add, edit and manage"],
          ["leaves",     "Leave Requests",     CheckCircle2, "orange-card", `${pendingLeaves} pending`],
          ["salary",     "Calculate Salary",   WalletCards,  "green-card",  "Process payroll"],
          ["reports",    "Generate Reports",   FileBarChart, "purple-card", "Payroll & attendance"],
        ].map(([key, label, Icon, cls, sub]) => (
          <button key={key} className={`quick-card ${cls}`} onClick={() => setPage(key)}>
            <Icon size={22} /><div><strong>{label}</strong><span>{sub}</span></div>
          </button>
        ))}
      </div>

      {/* ── DEPT CHART + PANELS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 20 }}>
        <DeptChart employees={employees} />
      </div>

      <div className="home-two-column" style={{ marginBottom: 20 }}>
        {/* Recent employees */}
        <div className="panel">
          <div className="panel-header">
            <div><h3>Recent Employees</h3><span>Latest records</span></div>
            <button onClick={() => setPage("employees")}>View all</button>
          </div>
          {employees.length === 0
            ? <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No employees added yet.</div>
            : employees.slice(0, 5).map((emp) => (
                <div className="employee-row" key={emp.uid || emp.id}>
                  <div className="employee-avatar">{(emp.name || "E").charAt(0).toUpperCase()}</div>
                  <div className="employee-info">
                    <strong>{emp.name}</strong>
                    <span>{emp.department || "—"} · {emp.designation || "Employee"}</span>
                  </div>
                  <span className="status-badge active-badge">Active</span>
                </div>
              ))
          }
        </div>

        {/* Pending leave requests */}
        <div className="panel">
          <div className="panel-header">
            <div><h3>Pending Leave Requests</h3><span>Needs your attention</span></div>
            <button onClick={() => setPage("leaves")}>View all</button>
          </div>
          {leaves.filter((l) => l.status === "Pending").length === 0
            ? <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No pending requests.</div>
            : leaves.filter((l) => l.status === "Pending").slice(0, 5).map((l) => (
                <div className="leave-mini" key={l.id}>
                  <div style={{ flex: 1 }}>
                    <strong>{l.employee}</strong>
                    <span style={{ display: "block", fontSize: 11, color: "#7b8494", marginTop: 2 }}>{l.type} · {l.from} → {l.to}</span>
                  </div>
                  <span className="pending-badge">Pending</span>
                </div>
              ))
          }
        </div>
      </div>

      {/* ── UPCOMING HOLIDAYS + RECENT ACTIVITY ── */}
      <div className="home-two-column">
        <div className="panel">
          <div className="panel-header">
            <div><h3>Upcoming Holidays</h3><span>Company holiday calendar</span></div>
            <button onClick={() => setPage("holidays")}>View all</button>
          </div>
          {upcomingHols.length === 0
            ? <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No upcoming holidays.</div>
            : upcomingHols.map((h) => (
                <div className="holiday-row" key={h.id}>
                  <div className="holiday-date">
                    <strong>{new Date(h.date).getDate()}</strong>
                    <span>{new Date(h.date).toLocaleString("en", { month: "short" })}</span>
                  </div>
                  <div><strong>{h.name}</strong><span style={{ display: "block", fontSize: 11, color: "#7b8494" }}>{h.day}</span></div>
                  <Gift size={18} color="#f59e0b" style={{ marginLeft: "auto" }} />
                </div>
              ))
          }
        </div>

        <div className="panel">
          <div className="panel-header">
            <div><h3>Recent Attendance Activity</h3><span>Latest login / logout events</span></div>
            <Clock3 size={18} color="#4f46e5" />
          </div>
          {recentActivity.length === 0
            ? <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No activity recorded yet.</div>
            : recentActivity.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <strong style={{ fontSize: 13 }}>{r.employee || "Employee"}</strong>
                    <span style={{ display: "block", fontSize: 11, color: "#7b8494" }}>{r.action || r.status}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: (r.action || r.status || "").toLowerCase().includes("log") ? "#16a34a" : "#64748b" }}>
                      {fmtTime(r.time || r.checkIn)}
                    </span>
                    <span style={{ display: "block", fontSize: 10, color: "#94a3b8" }}>{r.date || new Date(r.time || r.checkIn).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

export default AdminHome;
