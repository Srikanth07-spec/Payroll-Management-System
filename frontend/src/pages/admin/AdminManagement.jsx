import { useEffect, useMemo, useState } from "react";
import {
  Shield, ShieldCheck, ShieldOff, Users, Crown,
  AlertTriangle, X, Search, UserCog, Info,
} from "lucide-react";
import { upsertEmployee } from "../../services/supabaseService";

/* ──────────────────────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────────────────────── */
// The one permanent super-admin — can never be demoted or deleted.
const MAIN_ADMIN_EMAIL = "adminpayroll03@gmail.com";

/* ──────────────────────────────────────────────────────────────
   localStorage helpers
   ────────────────────────────────────────────────────────────── */
function loadData(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) ?? fallback) : fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("payroll-employees-updated"));
  window.dispatchEvent(new Event("storage"));
}

const norm = (e) => String(e || "").trim().toLowerCase();

/* ──────────────────────────────────────────────────────────────
   Role helpers — all checks use email/uid from the stored record,
   NOT a value the employee can edit from their browser.
   ────────────────────────────────────────────────────────────── */
function isMainAdmin(emp) {
  return norm(emp?.email) === norm(MAIN_ADMIN_EMAIL);
}

function isAdminUser(emp) {
  return (
    isMainAdmin(emp) ||
    emp?.role === "admin" ||
    emp?.isAdmin === true
  );
}

/* ──────────────────────────────────────────────────────────────
   Small UI helpers
   ────────────────────────────────────────────────────────────── */
function RoleBadge({ emp }) {
  if (isMainAdmin(emp)) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: "linear-gradient(135deg,#fef3c7,#fde68a)",
          color: "#92400e",
          borderRadius: 999,
          padding: "4px 10px",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        <Crown size={12} /> Main Admin
      </span>
    );
  }
  if (isAdminUser(emp)) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: "#ede9fe",
          color: "#6d28d9",
          borderRadius: 999,
          padding: "4px 10px",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        <Shield size={12} /> Admin
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "#f1f5f9",
        color: "#475569",
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      <Users size={12} /> Employee
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────
   Confirm dialog
   ────────────────────────────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────
   ConfirmDialog — supports two-step mode for dangerous actions.
   When twoStep={true}:
     Step 1 shows Cancel / Continue
     Step 2 shows Cancel / [confirmLabel]  ← only this fires onConfirm
   ────────────────────────────────────────────────────────────── */
function ConfirmDialog({
  title, message,
  step2Title, step2Message,
  onCancel, onConfirm,
  confirmLabel = "Confirm",
  danger = false,
  twoStep = false,
}) {
  const [step, setStep] = useState(1);

  const iconColor = danger ? "#dc2626" : "#6d28d9";
  const iconBg    = danger ? "#fff1f2" : "#ede9fe";
  const btnBg     = danger
    ? "linear-gradient(135deg,#dc2626,#b91c1c)"
    : "linear-gradient(135deg,#4f46e5,#6d28d9)";

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "#11182788",
        display: "grid", placeItems: "center", zIndex: 60, padding: 20,
      }}
      onMouseDown={onCancel}
    >
      <div
        style={{
          background: "white", borderRadius: 20, padding: "28px 30px",
          width: "min(460px, 100%)", boxShadow: "0 25px 70px #0004",
          textAlign: "center",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: iconBg, color: iconColor,
          display: "grid", placeItems: "center", margin: "0 auto 14px",
        }}>
          {danger ? <ShieldOff size={24} /> : <ShieldCheck size={24} />}
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <>
            <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>{title}</h3>
            <p style={{ margin: "0 0 6px", color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
              {message}
            </p>
            {twoStep && (
              <p style={{ margin: "0 0 20px", fontSize: 11, color: "#94a3b8" }}>
                Step 1 of 2 — Click Continue to proceed.
              </p>
            )}
            {!twoStep && <div style={{ marginBottom: 20 }} />}
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={onCancel}
                style={{
                  border: "1px solid #e2e8f0", background: "white",
                  borderRadius: 10, padding: "10px 20px",
                  fontWeight: 600, cursor: "pointer", fontSize: 13,
                }}
              >
                Cancel
              </button>
              {twoStep ? (
                <button
                  onClick={() => setStep(2)}
                  style={{
                    border: "1px solid #fed7aa", background: "#fff7ed",
                    color: "#c2410c", borderRadius: 10, padding: "10px 20px",
                    fontWeight: 700, cursor: "pointer", fontSize: 13,
                  }}
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={onConfirm}
                  style={{
                    border: 0, background: btnBg, color: "white",
                    borderRadius: 10, padding: "10px 20px",
                    fontWeight: 700, cursor: "pointer", fontSize: 13,
                  }}
                >
                  {confirmLabel}
                </button>
              )}
            </div>
          </>
        )}

        {/* ── STEP 2 (two-step only) ── */}
        {step === 2 && twoStep && (
          <>
            <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>
              {step2Title || `Confirm ${confirmLabel}`}
            </h3>
            <p style={{ margin: "0 0 6px", color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
              {step2Message || message}
            </p>
            <p style={{ margin: "0 0 20px", fontSize: 11, color: "#94a3b8" }}>
              Step 2 of 2 — This is your final confirmation.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={onCancel}
                style={{
                  border: "1px solid #e2e8f0", background: "white",
                  borderRadius: 10, padding: "10px 20px",
                  fontWeight: 600, cursor: "pointer", fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                style={{
                  border: 0, background: btnBg, color: "white",
                  borderRadius: 10, padding: "10px 20px",
                  fontWeight: 700, cursor: "pointer", fontSize: 13,
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Main component
   ────────────────────────────────────────────────────────────── */
export default function AdminManagement({ currentUser }) {
  const currentEmail = norm(currentUser?.email);
  const currentUid = currentUser?.uid;
  const iAmMainAdmin = norm(currentEmail) === norm(MAIN_ADMIN_EMAIL);

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [confirmAction, setConfirmAction] = useState(null); // { type, emp }

  /* ── load ── */
  const reload = () => {
    const all = loadData("payroll_employees", []);
    setEmployees(Array.isArray(all) ? all : []);
  };

  useEffect(() => {
    reload();
    const events = ["payroll-employees-updated", "storage"];
    events.forEach((e) => window.addEventListener(e, reload));
    return () => events.forEach((e) => window.removeEventListener(e, reload));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  /* ── filtered list: show everyone including admins, exclude main-admin from actions ── */
  const displayList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((emp) => {
      if (!q) return true;
      return [emp.name, emp.fullName, emp.username, emp.email,
              emp.department, emp.designation, emp.branch,
              emp.employeeId, emp.id]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [employees, search]);

  /* ── counts ── */
  const adminCount = employees.filter(isAdminUser).length;
  const employeeCount = employees.filter((e) => !isAdminUser(e)).length;

  /* ── grant admin ── */
  const grantAdmin = (emp) => {
    // Only Main Admin can grant
    if (!iAmMainAdmin) {
      showToast("Only the Main Admin can grant admin access.");
      return;
    }
    setConfirmAction({ type: "grant", emp });
  };

  /* ── revoke admin ── */
  const revokeAdmin = (emp) => {
    // Cannot remove main admin ever
    if (isMainAdmin(emp)) {
      showToast("The Main Admin account cannot be demoted.");
      return;
    }
    // Cannot remove your own admin access
    if (
      (emp.uid && emp.uid === currentUid) ||
      norm(emp.email) === currentEmail
    ) {
      showToast("You cannot remove your own admin access.");
      return;
    }
    // Only Main Admin can revoke
    if (!iAmMainAdmin) {
      showToast("Only the Main Admin can remove admin access.");
      return;
    }
    setConfirmAction({ type: "revoke", emp });
  };

  /* ── execute confirmed action ── */
  const executeAction = async () => {
    if (!confirmAction) return;
    const { type, emp } = confirmAction;

    // Security: re-check permissions server-side equivalent
    if (!iAmMainAdmin) {
      showToast("Only the Main Admin can change roles.");
      setConfirmAction(null);
      return;
    }
    if (isMainAdmin(emp)) {
      showToast("The Main Admin account cannot be demoted.");
      setConfirmAction(null);
      return;
    }
    if ((emp.uid && emp.uid === currentUid) || norm(emp.email) === currentEmail) {
      showToast("You cannot remove your own admin access.");
      setConfirmAction(null);
      return;
    }

    const selUid   = emp.uid;
    const selEmail = norm(emp.email);

    const updatedEmp = employees.find((e) =>
      (selUid && e.uid === selUid) || norm(e.email) === selEmail
    );
    if (!updatedEmp) { setConfirmAction(null); return; }

    const changed = type === "grant"
      ? { ...updatedEmp, role: "admin",    isAdmin: true,  adminGrantedAt: new Date().toISOString(), adminGrantedBy: currentEmail }
      : { ...updatedEmp, role: "employee", isAdmin: false, adminRevokedAt: new Date().toISOString(), adminRevokedBy: currentEmail };

    const updated = employees.map((e) =>
      (selUid && e.uid === selUid) || norm(e.email) === selEmail ? changed : e
    );

    saveData("payroll_employees", updated);
    setEmployees(updated);
    setConfirmAction(null);

    // Sync role change to Supabase so website reflects it
    await upsertEmployee(changed).catch((err) =>
      console.warn("Role sync to Supabase failed:", err.message)
    );

    const empName = emp.name || emp.fullName || emp.username || emp.email;
    showToast(
      type === "grant"
        ? `Admin access granted to ${empName}.`
        : `Admin access removed from ${empName}.`
    );
  };

  /* ──────────────────────────────────────────────────────────────
     RENDER
     ────────────────────────────────────────────────────────────── */
  return (
    <div style={{ paddingBottom: 40 }}>
      {/* ── HEADER ── */}
      <div className="welcome-row">
        <div>
          <div className="page-eyebrow">ADMINISTRATION</div>
          <h1>Admin Management</h1>
          <p>Grant or revoke administrator access. Only the Main Admin can change roles.</p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: iAmMainAdmin
              ? "linear-gradient(135deg,#fef3c7,#fde68a)"
              : "#f1f5f9",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "10px 16px",
            fontSize: 12,
            color: iAmMainAdmin ? "#92400e" : "#475569",
            fontWeight: 700,
          }}
        >
          {iAmMainAdmin ? <Crown size={16} /> : <Shield size={16} />}
          {iAmMainAdmin ? "Main Admin" : "Admin (read-only)"}
        </div>
      </div>

      {/* ── PERMISSION NOTICE for non-main-admin ── */}
      {!iAmMainAdmin && (
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            background: "#fff7ed",
            border: "1px solid #fcd34d",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 20,
            fontSize: 13,
            color: "#92400e",
          }}
        >
          <Info size={17} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>View Only.</strong> You can view admin roles, but only the Main Admin (
            {MAIN_ADMIN_EMAIL}) can grant or revoke admin access.
          </span>
        </div>
      )}

      {/* ── STAT CARDS ── */}
      <div className="stats-grid" style={{ marginBottom: 22 }}>
        <div className="stat-card blue">
          <div className="stat-icon"><Users size={21} /></div>
          <div className="stat-content">
            <span>Total Users</span>
            <strong>{employees.length}</strong>
            <small>In the system</small>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon"><Shield size={21} /></div>
          <div className="stat-content">
            <span>Admins</span>
            <strong>{adminCount}</strong>
            <small>Including Main Admin</small>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><UserCog size={21} /></div>
          <div className="stat-content">
            <span>Employees</span>
            <strong>{employeeCount}</strong>
            <small>Standard access</small>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><Crown size={21} /></div>
          <div className="stat-content">
            <span>Main Admin</span>
            <strong>1</strong>
            <small>Permanent — protected</small>
          </div>
        </div>
      </div>

      {/* ── SEARCH ── */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "white",
            border: "1px solid #e1e6ef",
            borderRadius: 11,
            padding: "0 14px",
          }}
        >
          <Search size={17} color="#94a3b8" />
          <input
            style={{ border: 0, outline: 0, flex: 1, padding: "12px 0", fontSize: 13 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
          />
        </div>
        <span style={{ fontSize: 12, color: "#7b8494", whiteSpace: "nowrap" }}>
          {displayList.length} users
        </span>
      </div>

      {/* ── TABLE ── */}
      <section
        style={{
          background: "white",
          border: "1px solid #e9edf4",
          borderRadius: 18,
          padding: 20,
          boxShadow: "0 8px 25px #1f29370a",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 17 }}>User Role Management</h2>
          <p style={{ margin: "5px 0 0", color: "#7b8494", fontSize: 12 }}>
            Manage administrator access for all system users.
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["User", "Employee ID", "Department", "Current Role", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      fontSize: 10,
                      fontWeight: 800,
                      color: "#7b8494",
                      textTransform: "uppercase",
                      borderBottom: "1px solid #edf0f5",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayList.map((emp) => {
                const name = emp.name || emp.fullName || emp.username || "User";
                const empIsMainAdmin = isMainAdmin(emp);
                const empIsAdmin = isAdminUser(emp);
                const isSelf =
                  (emp.uid && emp.uid === currentUid) ||
                  norm(emp.email) === currentEmail;

                return (
                  <tr
                    key={emp.uid || emp.email}
                    style={{
                      background: empIsMainAdmin
                        ? "#fffbeb"
                        : isSelf
                        ? "#f8faff"
                        : "white",
                    }}
                  >
                    {/* User */}
                    <td style={{ padding: "12px", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 11,
                            background: empIsMainAdmin
                              ? "linear-gradient(135deg,#fef3c7,#fde68a)"
                              : empIsAdmin
                              ? "#ede9fe"
                              : "#eef2ff",
                            color: empIsMainAdmin
                              ? "#92400e"
                              : empIsAdmin
                              ? "#6d28d9"
                              : "#4f46e5",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 800,
                            fontSize: 14,
                          }}
                        >
                          {empIsMainAdmin ? (
                            <Crown size={17} />
                          ) : (
                            name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <strong style={{ display: "block", fontSize: 13 }}>
                            {name}
                            {isSelf && (
                              <span
                                style={{
                                  marginLeft: 6,
                                  fontSize: 10,
                                  color: "#4f46e5",
                                  fontWeight: 700,
                                }}
                              >
                                (You)
                              </span>
                            )}
                          </strong>
                          <span style={{ fontSize: 11, color: "#7b8494" }}>{emp.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Employee ID */}
                    <td
                      style={{
                        padding: "12px",
                        borderBottom: "1px solid #f1f5f9",
                        fontSize: 12,
                        color: "#475569",
                      }}
                    >
                      {emp.employeeId || emp.id || "—"}
                    </td>

                    {/* Department */}
                    <td
                      style={{
                        padding: "12px",
                        borderBottom: "1px solid #f1f5f9",
                        fontSize: 12,
                        color: "#475569",
                      }}
                    >
                      {emp.department || "—"}
                    </td>

                    {/* Role */}
                    <td style={{ padding: "12px", borderBottom: "1px solid #f1f5f9" }}>
                      <RoleBadge emp={emp} />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {/* MAIN ADMIN — permanently protected, no action */}
                        {empIsMainAdmin && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "#92400e",
                              background: "#fef3c7",
                              borderRadius: 8,
                              padding: "5px 10px",
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              fontWeight: 700,
                            }}
                          >
                            <ShieldCheck size={13} />
                            Protected
                          </span>
                        )}

                        {/* SELF — cannot remove own access */}
                        {!empIsMainAdmin && isSelf && empIsAdmin && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "#475569",
                              background: "#f1f5f9",
                              borderRadius: 8,
                              padding: "5px 10px",
                              fontWeight: 600,
                            }}
                          >
                            Cannot remove own access
                          </span>
                        )}

                        {/* GRANT ADMIN — only show if not already admin, not self, main admin acting */}
                        {!empIsMainAdmin && !isSelf && !empIsAdmin && (
                          <button
                            onClick={() => grantAdmin(emp)}
                            disabled={!iAmMainAdmin}
                            style={{
                              border: 0,
                              background: iAmMainAdmin ? "#ede9fe" : "#f1f5f9",
                              color: iAmMainAdmin ? "#6d28d9" : "#94a3b8",
                              borderRadius: 9,
                              padding: "7px 13px",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: iAmMainAdmin ? "pointer" : "not-allowed",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                            title={
                              iAmMainAdmin
                                ? "Grant Admin access"
                                : "Only Main Admin can grant access"
                            }
                          >
                            <ShieldCheck size={14} />
                            Grant Admin
                          </button>
                        )}

                        {/* REVOKE ADMIN — show if admin, not self, not main admin */}
                        {!empIsMainAdmin && !isSelf && empIsAdmin && (
                          <button
                            onClick={() => revokeAdmin(emp)}
                            disabled={!iAmMainAdmin}
                            style={{
                              border: 0,
                              background: iAmMainAdmin ? "#fff1f2" : "#f1f5f9",
                              color: iAmMainAdmin ? "#dc2626" : "#94a3b8",
                              borderRadius: 9,
                              padding: "7px 13px",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: iAmMainAdmin ? "pointer" : "not-allowed",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                            title={
                              iAmMainAdmin
                                ? "Remove Admin access"
                                : "Only Main Admin can remove access"
                            }
                          >
                            <ShieldOff size={14} />
                            Remove Admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {displayList.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "50px 20px",
                color: "#94a3b8",
              }}
            >
              <Users size={36} style={{ marginBottom: 10, opacity: 0.4 }} />
              <strong style={{ display: "block" }}>No users found</strong>
              <span style={{ fontSize: 12 }}>Add employees first from Employee Management.</span>
            </div>
          )}
        </div>
      </section>

      {/* ── SECURITY NOTES ── */}
      <div
        style={{
          marginTop: 20,
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: "16px 18px",
          fontSize: 12,
          color: "#64748b",
          lineHeight: 1.7,
        }}
      >
        <strong style={{ display: "flex", alignItems: "center", gap: 6, color: "#1e293b", marginBottom: 6 }}>
          <AlertTriangle size={14} color="#f59e0b" /> Role Management Rules
        </strong>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Only the <strong>Main Admin</strong> ({MAIN_ADMIN_EMAIL}) can grant or revoke admin access.</li>
          <li>The Main Admin account is <strong>permanently protected</strong> and cannot be demoted.</li>
          <li>An admin <strong>cannot remove their own admin access</strong>.</li>
          <li>An admin cannot change another admin's role — only the Main Admin can.</li>
          <li>Role assignments are stored with the employee record (uid + email verified server-side).</li>
        </ul>
      </div>

      {/* ── CONFIRM DIALOG ── */}
      {confirmAction && (
        <ConfirmDialog
          title={
            confirmAction.type === "grant"
              ? "Grant Admin Access?"
              : "Remove Admin Access?"
          }
          message={
            confirmAction.type === "grant"
              ? `Grant administrator access to ${
                  confirmAction.emp.name || confirmAction.emp.email
                }? They will be able to manage employees and payroll operations.`
              : `Are you sure you want to remove Admin access from ${
                  confirmAction.emp.name || confirmAction.emp.email
                }?`
          }
          step2Title={
            confirmAction.type === "revoke" ? "Confirm Remove Admin" : undefined
          }
          step2Message={
            confirmAction.type === "revoke"
              ? `This user will lose Admin privileges and become a regular Employee. This cannot be undone without Main Admin action.`
              : undefined
          }
          confirmLabel={confirmAction.type === "grant" ? "Grant Admin" : "Remove Admin"}
          danger={confirmAction.type === "revoke"}
          twoStep={confirmAction.type === "revoke"}
          onCancel={() => setConfirmAction(null)}
          onConfirm={executeAction}
        />
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1e293b",
            color: "white",
            padding: "12px 22px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            zIndex: 9999,
            boxShadow: "0 8px 24px #0004",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <ShieldCheck size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
