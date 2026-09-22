import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Info,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";
import { insertLeave } from "../../services/supabaseService";
import "../LeaveManagement.css";

const LEAVE_TYPES = [
  "Casual Leave",
  "Sick Leave",
  "Earned Leave",
  "Emergency Leave",
];

const ANNUAL_LEAVE_DEFAULT = 12;

function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value) {
  const date = value instanceof Date ? value : parseLocalDate(value);
  if (!date) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDays(from, to) {
  const start = parseLocalDate(from);
  const end = parseLocalDate(to);
  if (!start || !end || end < start) return 0;

  return Math.floor((end - start) / 86400000) + 1;
}

function getEmployeeName(user) {
  return user?.displayName || user?.email?.split("@")[0] || "Employee";
}

function getEmployeeProfile(currentUser, employees) {
  const email = currentUser?.email?.toLowerCase();
  const name = getEmployeeName(currentUser).toLowerCase();

  return (
    employees.find(
      (employee) => employee.email?.toLowerCase() === email
    ) ||
    employees.find(
      (employee) => employee.name?.toLowerCase() === name
    ) ||
    null
  );
}

function getApprovedDays(leaves, currentUser, year) {
  const email = currentUser?.email?.trim().toLowerCase();
  const uid   = currentUser?.uid;
  const name  = getEmployeeName(currentUser);

  return leaves.reduce((total, leave) => {
    /* CRITICAL: Only "Approved" status counts — Rejected and Pending never count */
    if (leave.status !== "Approved") return total;

    const sameEmployee =
      (uid   && (leave.employeeUid === uid || leave.uid === uid)) ||
      (email && leave.employeeEmail?.trim().toLowerCase() === email) ||
      (!leave.employeeEmail && leave.employee === name);

    if (!sameEmployee) return total;

    const from = parseLocalDate(leave.from);
    if (!from || from.getFullYear() !== year) return total;

    return total + getDays(leave.from, leave.to);
  }, 0);
}

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function ApplyLeave({
  currentUser,
  leaves,
  setLeaves,
  employees = [],
  holidays = [],
}) {
  const today = new Date();
  const employeeName = getEmployeeName(currentUser);
  const employeeProfile = getEmployeeProfile(currentUser, employees);
  const annualAllowance =
    Number(employeeProfile?.leaveAllowance) || ANNUAL_LEAVE_DEFAULT;
  const currentYear = today.getFullYear();

  const approvedDays = useMemo(
    () => getApprovedDays(leaves, currentUser, currentYear),
    [leaves, currentUser, currentYear]
  );

  const remainingLeaves = Math.max(annualAllowance - approvedDays, 0);

  const myLeaves = useMemo(
    () =>
      leaves
        .filter((leave) => {
          const sameUid   = currentUser?.uid && (leave.employeeUid === currentUser.uid || leave.uid === currentUser.uid);
          const sameEmail = currentUser?.email && leave.employeeEmail?.trim().toLowerCase() === currentUser.email.trim().toLowerCase();
          const sameName  = !leave.employeeEmail && !leave.employeeUid && leave.employee === employeeName;
          return sameUid || sameEmail || sameName;
        })
        .sort((a, b) => String(b.submittedAt || b.from || "").localeCompare(String(a.submittedAt || a.from || ""))),
    [leaves, currentUser, employeeName]
  );

  /* Pending / rejected counts — must be declared AFTER myLeaves */
  const pendingCount  = useMemo(() => myLeaves.filter((l) => l.status === "Pending").length,  [myLeaves]);
  const rejectedCount = useMemo(() => myLeaves.filter((l) => l.status === "Rejected").length, [myLeaves]);

  const [form, setForm] = useState({
    type: "Casual Leave",
    from: "",
    to: "",
    reason: "",
  });
  const [message, setMessage] = useState(null);
  const [calendarDate, setCalendarDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const daysRequested = getDays(form.from, form.to);

  const calendarCells = buildCalendar(
    calendarDate.getFullYear(),
    calendarDate.getMonth()
  );

  const calendarMonthName = calendarDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const holidayMap = useMemo(() => {
    const map = new Map();
    holidays.forEach((holiday) => map.set(holiday.date, holiday.name));
    return map;
  }, [holidays]);

  const leaveMap = useMemo(() => {
    const map = new Map();
    myLeaves.forEach((leave) => {
      /* Only mark calendar cells for Pending and Approved.
         Rejected leaves do not color calendar days as active leave. */
      if (leave.status === "Rejected") return;

      const start = parseLocalDate(leave.from);
      const end   = parseLocalDate(leave.to);
      if (!start || !end) return;

      const cursor = new Date(start);
      while (cursor <= end) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
        /* If a day is already marked Approved, don't overwrite with Pending */
        if (!map.has(key) || leave.status === "Approved") {
          map.set(key, leave.status);
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    });
    return map;
  }, [myLeaves]);

  const getDateKey = (day) =>
    `${calendarDate.getFullYear()}-${String(
      calendarDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const changeMonth = (offset) => {
    setCalendarDate(
      new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth() + offset,
        1
      )
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage(null);

    if (!employeeProfile) {
      setMessage({
        type: "error",
        text: "Your employee profile is not available yet. Please return to Home and try again.",
      });
      return;
    }

    if (remainingLeaves <= 0) {
      setMessage({
        type: "error",
        text: `You have used all ${annualAllowance} leave days for ${currentYear}.`,
      });
      return;
    }

    if (!form.from || !form.to || !form.reason.trim()) {
      setMessage({
        type: "error",
        text: "Please complete Leave Type, From, To and Reason.",
      });
      return;
    }

    if (form.to < form.from) {
      setMessage({
        type: "error",
        text: "The To date cannot be before the From date.",
      });
      return;
    }

    if (daysRequested > remainingLeaves) {
      setMessage({
        type: "error",
        text: `You have only ${remainingLeaves} leave day${
          remainingLeaves === 1 ? "" : "s"
        } remaining for ${currentYear}. You cannot submit this request.`,
      });
      return;
    }

    const newLeave = {
      id: Date.now(),
      employee: employeeName,
      employeeEmail: currentUser?.email || "",
      employeeUid: currentUser?.uid || "",
      employeeId: employeeProfile?.id || "",
      type: form.type,
      from: form.from,
      to: form.to,
      reason: form.reason.trim(),
      status: "Pending",
      adminNote: "",
      submittedAt: new Date().toISOString(),
    };

    setLeaves([...leaves, newLeave]);
    insertLeave(newLeave).catch(() => {});

    setForm({
      type: "Casual Leave",
      from: "",
      to: "",
      reason: "",
    });

    setMessage({
      type: "success",
      text: "Leave request submitted successfully. It is now waiting for administrator approval.",
    });
  };

  return (
    <div className="leave-page employee-leave-page">
      <div className="leave-page-header employee-leave-header">
        <div>
          <div className="leave-eyebrow">
            <Sparkles size={15} /> EMPLOYEE SERVICES
          </div>
          <h1>Apply For Leave</h1>
          <p>Submit a leave request to your administrator</p>
        </div>

        <div className="employee-leave-balance-head">
          <div className="balance-ring">
            <strong>{remainingLeaves}</strong>
            <span>days</span>
          </div>
          <div>
            <span>Available Balance</span>
            <strong>{remainingLeaves} of {annualAllowance} days</strong>
          </div>
        </div>
      </div>

      <div className="leave-balance-strip">
        <div className="balance-item balance-blue">
          <div className="balance-icon"><CalendarDays size={20} /></div>
          <div><span>Annual Leave</span><strong>{annualAllowance}</strong></div>
        </div>
        <div className="balance-item balance-green">
          <div className="balance-icon"><CheckCircle2 size={20} /></div>
          <div><span>Taken / Approved</span><strong>{approvedDays}</strong></div>
        </div>
        <div className="balance-item balance-orange">
          <div className="balance-icon"><Clock3 size={20} /></div>
          <div><span>Remaining</span><strong>{remainingLeaves}</strong></div>
        </div>
        <div className="balance-item balance-purple">
          <div className="balance-icon"><FileText size={20} /></div>
          <div><span>My Requests</span><strong>{myLeaves.length}</strong></div>
        </div>
      </div>

      {message && (
        <div className={`leave-message ${message.type}`}>
          {message.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <div className="employee-leave-layout">
        <section className="leave-form-card">
          <div className="leave-card-heading">
            <div className="leave-heading-icon blue-heading"><CalendarDays size={22} /></div>
            <div>
              <h2>New Leave Request</h2>
              <p>Choose your dates and tell your administrator why you need leave.</p>
            </div>
          </div>

          {remainingLeaves === 0 ? (
            <div className="leave-limit-alert">
              <XCircle size={24} />
              <div>
                <strong>Leave balance exhausted</strong>
                <p>You have used all {annualAllowance} available leave days for {currentYear}. A new request cannot be submitted.</p>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="professional-leave-form">
            <div className="leave-form-grid">
              <label>
                <span>Leave Type</span>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {LEAVE_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>

              <label>
                <span>From</span>
                <input
                  type="date"
                  value={form.from}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setForm({ ...form, from: e.target.value })}
                />
              </label>

              <label>
                <span>To</span>
                <input
                  type="date"
                  value={form.to}
                  min={form.from || new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                />
              </label>

              <div className="days-preview">
                <span>Requested Days</span>
                <strong>{daysRequested || 0}</strong>
                <small>calendar day{daysRequested === 1 ? "" : "s"}</small>
              </div>
            </div>

            <label className="reason-field">
              <span>Reason</span>
              <textarea
                rows="5"
                maxLength={500}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Write a clear description for your leave request..."
              />
              <small>{form.reason.length}/500</small>
            </label>

            <div className="leave-form-footer">
              <div className="form-info">
                <Info size={17} />
                <span>Your request will remain <b>Pending</b> until the administrator reviews it.</span>
              </div>

              <button
                className="leave-submit-button"
                type="submit"
                disabled={remainingLeaves === 0 || !employeeProfile}
              >
                <Send size={18} />
                Submit Leave Request
              </button>
            </div>
          </form>
        </section>

        <section className="leave-calendar-card">
          <div className="leave-card-heading calendar-heading">
            <div className="leave-heading-icon purple-heading"><CalendarDays size={22} /></div>
            <div>
              <h2>Leave Calendar</h2>
              <p>View holidays and your submitted leave dates.</p>
            </div>
          </div>

          <div className="calendar-toolbar">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month"><ArrowLeft size={18} /></button>
            <strong>{calendarMonthName}</strong>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Next month"><ArrowRight size={18} /></button>
          </div>

          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}
          </div>

          <div className="calendar-grid">
            {calendarCells.map((day, index) => {
              if (!day) return <div key={`blank-${index}`} className="calendar-cell empty" />;

              const key = getDateKey(day);
              const holiday = holidayMap.get(key);
              const leaveStatus = leaveMap.get(key);
              const isToday = key === today.toISOString().slice(0, 10);

              return (
                <div
                  key={key}
                  className={`calendar-cell ${isToday ? "today" : ""} ${holiday ? "holiday" : ""} ${leaveStatus ? `leave-${leaveStatus.toLowerCase()}` : ""}`}
                  title={holiday || leaveStatus || ""}
                >
                  <span>{day}</span>
                  {holiday && <i className="calendar-dot holiday-dot" />}
                  {leaveStatus && <i className={`calendar-dot ${leaveStatus === "Approved" ? "approved-dot" : leaveStatus === "Rejected" ? "rejected-dot" : "pending-dot"}`} />}
                </div>
              );
            })}
          </div>

          <div className="calendar-legend">
            <span><i className="legend-dot holiday-dot" /> Holiday</span>
            <span><i className="legend-dot pending-dot" /> Pending</span>
            <span><i className="legend-dot approved-dot" /> Approved</span>
            <span><i className="legend-dot rejected-dot" /> Rejected</span>
          </div>
        </section>
      </div>

      <section className="my-leave-card">
        <div className="leave-card-heading">
          <div className="leave-heading-icon green-heading"><FileText size={22} /></div>
          <div>
            <h2>My Leave Requests</h2>
            <p>Track your submitted leave requests</p>
          </div>
        </div>

        <div className="leave-table-wrap">
          <table className="leave-management-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myLeaves.map((leave) => (
                <tr key={leave.id}>
                  <td>
                    <div className="leave-table-person">
                      <div className="leave-avatar">{employeeName.charAt(0).toUpperCase()}</div>
                      <div><strong>{employeeName}</strong><span>{leave.employeeEmail || currentUser?.email || "Employee"}</span></div>
                    </div>
                  </td>
                  <td><span className="type-pill">{leave.type}</span></td>
                  <td>{formatDate(leave.from)}</td>
                  <td>{formatDate(leave.to)}</td>
                  <td><div className="reason-preview">{leave.reason || "-"}</div></td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {/* Status badge — reads DIRECTLY from leave.status, never recalculated */}
                      <span className={`leave-status ${leave.status.toLowerCase()}`}>
                        <i />
                        {leave.status === "Approved" ? "✓ Approved" :
                         leave.status === "Rejected" ? "✗ Rejected" :
                         "⏳ Pending"}
                      </span>
                      {leave.adminNote ? (
                        <div className="admin-response">
                          <b>Admin:</b> {leave.adminNote}
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {myLeaves.length === 0 && (
            <div className="leave-empty-state">
              <FileText size={38} />
              <strong>No leave requests available.</strong>
              <span>Your submitted leave requests will appear here.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
