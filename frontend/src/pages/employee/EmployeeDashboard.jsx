import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Bell, CalendarDays, CheckCircle2, Clock3, FileText,
  Gift, MessageCircle, UserCheck, WalletCards, MapPin, Camera,
} from "lucide-react";
import { loadData, getEmployeeByUid, getRemainingLeave } from "../shared/payrollData";
import { fetchAttendance } from "../../services/attendanceService";
import "../Dashboard.css";

/* ─── Attendance time windows ───────────────────────────────── */
const MORNING_START = 8;   // 08:00
const MORNING_END   = 12;  // 12:00 PM
const EVENING_START = 17;  // 17:00
const EVENING_END   = 17;  // 17:30

function getWindowStatus(now) {
  const h = now.getHours();
  const m = now.getMinutes();
  const totalMin = h * 60 + m;
  const morningS = MORNING_START * 60;
  const morningE = MORNING_END   * 60;      // 09:00 = 540
  const eveningS = EVENING_START * 60;      // 17:00 = 1020
  const eveningE = EVENING_END   * 60 + 30; // 17:30 = 1050

  const morning =
    totalMin < morningS ? "before" :
    totalMin < morningE ? "open"   : "closed";

  const evening =
    totalMin < eveningS ? "before" :
    totalMin < eveningE ? "open"   : "closed";

  return { morning, evening };
}

/* ─── Professional SVG Analog Clock ─────────────────────────── */
function AnalogClock({ now }) {
  const sec   = now.getSeconds();
  const min   = now.getMinutes();
  const hr    = now.getHours() % 12;
  const sDeg  = sec * 6;
  const mDeg  = min * 6  + sec * 0.1;
  const hDeg  = hr  * 30 + min * 0.5;

  const cx = 80, cy = 80, r = 72;

  /* Hour tick marks */
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    const outer = r - 2;
    const inner = i % 3 === 0 ? r - 10 : r - 6;
    return {
      x1: cx + inner * Math.sin(angle),
      y1: cy - inner * Math.cos(angle),
      x2: cx + outer * Math.sin(angle),
      y2: cy - outer * Math.cos(angle),
      major: i % 3 === 0,
    };
  });

  const hand = (deg, length, width, color) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return {
      x2: cx + length * Math.cos(rad),
      y2: cy + length * Math.sin(rad),
      stroke: color,
      strokeWidth: width,
      strokeLinecap: "round",
    };
  };

  return (
    <svg width={160} height={160} viewBox="0 0 160 160" style={{ filter: "drop-shadow(0 4px 12px #0002)" }}>
      {/* Face */}
      <circle cx={cx} cy={cy} r={r} fill="white" stroke="#e2e8f0" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={r - 3} fill="white" stroke="#f1f5f9" strokeWidth={1} />
      {/* Ticks */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={t.major ? "#334155" : "#cbd5e1"}
          strokeWidth={t.major ? 2.5 : 1.5} strokeLinecap="round" />
      ))}
      {/* Hour numbers */}
      {[12,1,2,3,4,5,6,7,8,9,10,11].map((n, i) => {
        const angle = ((i * 30 - 90) * Math.PI) / 180;
        return (
          <text key={n}
            x={cx + (r - 20) * Math.cos(angle)}
            y={cy + (r - 20) * Math.sin(angle) + 4}
            textAnchor="middle" fontSize={i % 3 === 0 ? 10 : 8}
            fontWeight={i % 3 === 0 ? "700" : "500"}
            fill={i % 3 === 0 ? "#334155" : "#94a3b8"}
          >{n}</text>
        );
      })}
      {/* Hour hand */}
      <line x1={cx} y1={cy} {...hand(hDeg, 38, 4, "#1e293b")} />
      {/* Minute hand */}
      <line x1={cx} y1={cy} {...hand(mDeg, 52, 3, "#334155")} />
      {/* Second hand */}
      <line x1={cx} y1={cy} {...hand(sDeg, 58, 1.5, "#ef4444")} />
      {/* Centre dot */}
      <circle cx={cx} cy={cy} r={4} fill="#4f46e5" />
      <circle cx={cx} cy={cy} r={2} fill="white" />
    </svg>
  );
}

/* ─── Attendance Window Card ─────────────────────────────────── */
function AttendanceWindowCard({ label, timeRange, status, recordedTime, onAction, busy, actionLabel, disabled }) {
  const colors = {
    before: { bg: "#f8fafc", border: "#e2e8f0", badge: "#f1f5f9", badgeText: "#64748b", text: "Not yet open" },
    open:   { bg: "#f0fdf4", border: "#86efac", badge: "#dcfce7", badgeText: "#15803d", text: "Available now" },
    closed: { bg: "#fafafa", border: "#e2e8f0", badge: "#f1f5f9", badgeText: "#94a3b8", text: "Window closed" },
  }[status];

  return (
    <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 14, padding: "14px 16px", flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <strong style={{ display: "block", fontSize: 13, color: "#1e293b" }}>{label}</strong>
          <span style={{ fontSize: 11, color: "#7b8494" }}>{timeRange}</span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, background: colors.badge, color: colors.badgeText, borderRadius: 999, padding: "3px 9px" }}>
          {status === "open" ? "● OPEN" : status === "before" ? "UPCOMING" : "CLOSED"}
        </span>
      </div>
      {recordedTime ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#15803d", fontSize: 12, fontWeight: 700 }}>
          <CheckCircle2 size={14} /> Recorded: {recordedTime}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: colors.badgeText, marginBottom: status === "open" ? 10 : 0 }}>{colors.text}</div>
      )}
      {status === "open" && !recordedTime && (
        <button
          onClick={onAction}
          disabled={busy || disabled}
          style={{
            marginTop: 8, width: "100%", border: 0,
            background: busy ? "#e2e8f0" : "linear-gradient(135deg,#22c55e,#16a34a)",
            color: busy ? "#94a3b8" : "white", borderRadius: 10, padding: "9px",
            fontWeight: 700, fontSize: 12, cursor: busy ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <Camera size={14} /> {busy ? "Verifying…" : actionLabel}
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function EmployeeDashboard({ currentUser, setPage, holidays = [], leaves = [] }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const profile     = getEmployeeByUid(currentUser?.uid);
  const name        = profile?.name || currentUser?.displayName || currentUser?.email?.split("@")[0] || "Employee";
  const remaining   = getRemainingLeave(currentUser?.uid);
  const latestSalary = loadData("payroll_salary_slips", [])
    .filter((s) => s.uid === currentUser?.uid)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  const announcements = loadData("payroll_announcements", [])
    .filter((a) => !a.uid || a.uid === currentUser?.uid)
    .filter((a) => a.active !== false);

  const greeting =
    now.getHours() < 12 ? "Good Morning" :
    now.getHours() < 17 ? "Good Afternoon" : "Good Evening";

  /* ── My leaves ── */
  const myLeaves = useMemo(() =>
    leaves.filter((l) =>
      (currentUser?.uid && (l.employeeUid === currentUser.uid || l.uid === currentUser.uid)) ||
      (currentUser?.email && l.employeeEmail?.toLowerCase() === currentUser.email?.toLowerCase())
    ).sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || ""))),
    [leaves, currentUser]
  );
  const pendingCount = myLeaves.filter((l) => l.status === "Pending").length;
  const latestLeave  = myLeaves[0];

  /* ── Attendance from Supabase ── */
  const [attRecords, setAttRecords] = useState([]);
  const reloadAtt = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      const recs = await fetchAttendance(currentUser.uid);
      setAttRecords(recs);
    } catch {
      const cached = JSON.parse(localStorage.getItem("payroll_attendance") || "[]")
        .filter((r) => r.uid === currentUser.uid);
      setAttRecords(cached);
    }
  }, [currentUser?.uid]);
  useEffect(() => { reloadAtt(); }, [reloadAtt]);

  const todayKey = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
  })();

  const todayRec = useMemo(() => {
    const todays = attRecords.filter((r) => r.dateKey === todayKey);
    return todays.find((r) => r.status === "Present") || todays[0] || null;
  }, [attRecords, todayKey]);

  const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;

  /* ── Attendance windows ── */
  const { morning, evening } = getWindowStatus(now);

  /* ── Upcoming holiday ── */
  const nextHoliday = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return holidays
      .filter((h) => new Date(h.date) >= today)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
  }, [holidays]);

  /* ── Unread messages ── */
  const unreadMsgs = useMemo(() => {
    const msgs = loadData("payroll_chat_messages", []);
    return msgs.filter((m) => m.role === "admin").length;
  }, []);

  return (
    <div style={{ paddingBottom: 40 }}>

      {/* ── ANNOUNCEMENT BAR ── */}
      {announcements.length > 0 && (
        <div className="announcement-bar" style={{ marginBottom: 20 }}>
          <div className="announcement-label"><Bell size={17} /> IMPORTANT</div>
          <div className="announcement-marquee">
            <div className="announcement-track">
              {announcements.map((a) => <span key={a.id}>{a.message}</span>)}
              {announcements.map((a) => <span key={`${a.id}-dup`}>{a.message}</span>)}
            </div>
          </div>
        </div>
      )}

      {/* ── HERO SECTION ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 18, marginBottom: 20 }}>

        {/* Welcome */}
        <div style={{ background: "linear-gradient(135deg,#1e3a8a,#4f46e5)", borderRadius: 20, padding: "26px 28px", color: "white" }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.13em", opacity: 0.7, marginBottom: 8 }}>EMPLOYEE PORTAL</div>
          <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 800 }}>{greeting}, {name}</h1>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10 }}>
            {[
              ["Employee ID", profile?.employeeId || profile?.id || "—"],
              ["Department", profile?.department || "—"],
              ["Designation", profile?.designation || "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "7px 12px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.1em" }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 12, opacity: 0.8 }}>
            {now.toLocaleDateString([], { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </div>
        </div>

        {/* Clock */}
        <div style={{ background: "white", border: "1px solid #e9edf4", borderRadius: 20, padding: "20px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 200, boxShadow: "0 8px 25px #1f29370a" }}>
          <AnalogClock now={now} />
          <div style={{ marginTop: 10, textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", letterSpacing: "0.05em" }}>
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
              {now.toLocaleTimeString([], { second: "2-digit" }).replace(/.*:/, "")}{" "}sec
            </div>
          </div>
        </div>
      </div>

      {/* ── SUMMARY CARDS ── */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card green">
          <div className="stat-icon"><UserCheck size={20} /></div>
          <div className="stat-content">
            <span>Today's Attendance</span>
            <strong style={{ color: todayRec?.status === "Present" ? "#15803d" : todayRec?.status === "Absent" ? "#dc2626" : "#1e293b" }}>
              {!todayRec ? "Not Marked" : todayRec.status === "Absent" ? "Absent" :
               todayRec.checkIn && todayRec.checkOut ? "Complete" : "Checked In"}
            </strong>
            <small>{todayRec?.checkIn ? `In: ${fmtTime(todayRec.checkIn)}` : "Use attendance page"}</small>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><CalendarDays size={20} /></div>
          <div className="stat-content">
            <span>Leave Balance</span>
            <strong>{remaining}</strong>
            <small>{pendingCount > 0 ? `${pendingCount} pending request${pendingCount > 1 ? "s" : ""}` : "Available days"}</small>
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon"><WalletCards size={20} /></div>
          <div className="stat-content">
            <span>Latest Salary</span>
            <strong>{latestSalary ? `₹${Number(latestSalary.net).toLocaleString()}` : "—"}</strong>
            <small>{latestSalary ? `${latestSalary.month} ${latestSalary.year}` : "No slip yet"}</small>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon"><Gift size={20} /></div>
          <div className="stat-content">
            <span>Next Holiday</span>
            <strong style={{ fontSize: 14 }}>{nextHoliday?.name || "—"}</strong>
            <small>{nextHoliday ? new Date(nextHoliday.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "None upcoming"}</small>
          </div>
        </div>
      </div>

      {/* ── TODAY'S ATTENDANCE WINDOWS ── */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header" style={{ marginBottom: 14 }}>
          <div><h3>Today's Attendance</h3><span>Morning check-in · Evening check-out · Face + location verification required</span></div>
          <button onClick={() => setPage("attendance")} style={{ background: "#eef2ff", color: "#4f46e5", border: 0, borderRadius: 9, padding: "7px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            Open Attendance
          </button>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <AttendanceWindowCard
            label="Morning Check-in"
            timeRange="08:00 AM – 12:00 PM"
            status={morning}
            recordedTime={fmtTime(todayRec?.checkIn)}
            onAction={() => setPage("attendance")}
            actionLabel="Go to Attendance"
            busy={false}
            disabled={false}
          />
          <AttendanceWindowCard
            label="Evening Check-out"
            timeRange="05:00 PM – 05:30 PM"
            status={evening}
            recordedTime={fmtTime(todayRec?.checkOut)}
            onAction={() => setPage("attendance")}
            actionLabel="Go to Attendance"
            busy={false}
            disabled={!todayRec?.checkIn}
          />
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
          <MapPin size={12} /> VVIT campus location + face verification required · Visit the Attendance page to mark attendance
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="section-title"><div><h2>Quick Actions</h2><p>Access your services</p></div></div>
      <div className="quick-grid" style={{ marginBottom: 20 }}>
        <button className="quick-card blue-card" onClick={() => setPage("attendance")}>
          <UserCheck size={22} /><div><strong>Attendance</strong><span>Mark daily attendance</span></div>
        </button>
        <button className="quick-card orange-card" onClick={() => setPage("apply-leave")}>
          <CalendarDays size={22} /><div><strong>Apply Leave</strong><span>Submit a leave request</span></div>
        </button>
        <button className="quick-card green-card" onClick={() => setPage("salary-slip")}>
          <FileText size={22} /><div><strong>Payslips</strong><span>View & download payslips</span></div>
        </button>
        <button className="quick-card purple-card" onClick={() => setPage("chat")} style={{ position: "relative" }}>
          <MessageCircle size={22} />
          <div><strong>Chat with Admin</strong><span>Messages & requests</span></div>
          {unreadMsgs > 0 && <span style={{ position: "absolute", top: 12, right: 12, background: "#ef4444", color: "white", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 800, display: "grid", placeItems: "center" }}>{unreadMsgs}</span>}
        </button>
      </div>

      {/* ── LOWER ROW ── */}
      <div className="home-two-column">

        {/* Leave summary */}
        <div className="panel">
          <div className="panel-header">
            <div><h3>My Leave Requests</h3><span>Recent leave activity</span></div>
            <button onClick={() => setPage("apply-leave")}>Apply Leave</button>
          </div>
          {myLeaves.slice(0, 4).map((l) => {
            const statusColor = l.status === "Approved" ? { bg: "#dcfce7", c: "#15803d" } : l.status === "Rejected" ? { bg: "#fee2e2", c: "#dc2626" } : { bg: "#fef9c3", c: "#854d0e" };
            return (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: "block", fontSize: 13 }}>{l.type}</strong>
                  <span style={{ fontSize: 11, color: "#7b8494" }}>{l.from} → {l.to}</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, background: statusColor.bg, color: statusColor.c, borderRadius: 999, padding: "3px 9px" }}>
                  {l.status.toUpperCase()}
                </span>
              </div>
            );
          })}
          {myLeaves.length === 0 && <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No leave requests yet.</div>}
        </div>

        {/* Payslip + Holiday */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="panel">
            <div className="panel-header">
              <div><h3>Latest Payslip</h3><span>{latestSalary ? `${latestSalary.month} ${latestSalary.year}` : "No slip yet"}</span></div>
              <WalletCards size={20} />
            </div>
            {latestSalary ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 12 }}><span style={{ color: "#7b8494" }}>Net Salary</span><strong style={{ color: "#4f46e5", fontSize: 18 }}>₹{Number(latestSalary.net).toLocaleString()}</strong></div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button className="secondary-button" style={{ flex: 1, justifyContent: "center", padding: "9px", fontSize: 12 }} onClick={() => setPage("salary-slip")}>View Payslip</button>
                  <button className="primary-button" style={{ flex: 1, justifyContent: "center", padding: "9px", fontSize: 12 }} onClick={() => setPage("salary-slip")}>Download</button>
                </div>
              </>
            ) : (
              <div style={{ color: "#94a3b8", fontSize: 12, textAlign: "center", padding: "16px 0" }}>No salary slip generated yet.</div>
            )}
          </div>

          {nextHoliday && (
            <div className="panel" style={{ background: "linear-gradient(135deg,#fffbeb,#fef9c3)" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 48, height: 54, borderRadius: 12, background: "#fef3c7", display: "grid", placeItems: "center" }}>
                  <Gift size={22} color="#d97706" />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.1em" }}>Next Holiday</div>
                  <strong style={{ display: "block", fontSize: 15 }}>{nextHoliday.name}</strong>
                  <span style={{ fontSize: 11, color: "#78350f" }}>{new Date(nextHoliday.date).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long" })}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
