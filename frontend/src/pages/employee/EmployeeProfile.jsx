import { useEffect, useState } from "react";
import { BriefcaseBusiness, Lock, Mail, MapPin, Phone, Shield, User } from "lucide-react";
import { loadData } from "../shared/payrollData";
import "./EmployeeProfile.css";

const norm = (e) => String(e || "").trim().toLowerCase();

function getEmployee(currentUser) {
  if (!currentUser) return null;
  const list = loadData("payroll_employees", []);
  return (
    list.find((e) => e.uid && e.uid === currentUser.uid) ||
    list.find((e) => norm(e.email) === norm(currentUser.email)) ||
    null
  );
}

/* ── Only show a field if the value exists ── */
function Field({ label, value, full = false }) {
  if (!value) return null;
  return (
    <div style={{
      gridColumn: full ? "1 / -1" : undefined,
      background: "var(--bg-hover, #f8fafc)",
      borderRadius: 10,
      padding: "11px 14px",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary, #1e293b)", lineHeight: 1.4 }}>{value}</div>
    </div>
  );
}

function LockedField({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ background: "var(--bg-hover, #f8fafc)", borderRadius: 10, padding: "11px 14px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary, #1e293b)" }}>{value}</div>
        <Lock size={12} color="#94a3b8" style={{ flexShrink: 0 }} />
      </div>
    </div>
  );
}

function SectionHeading({ icon, title, subtitle, badge }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent-light, #eef2ff)", color: "var(--accent, #4f46e5)", display: "grid", placeItems: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: 0, fontSize: 14, color: "var(--text-primary, #1e293b)" }}>{title}</h3>
        {subtitle && <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>{subtitle}</p>}
      </div>
      {badge}
    </div>
  );
}

export default function EmployeeProfile({ currentUser }) {
  const [employee, setEmployee] = useState(null);

  const load = () => setEmployee(getEmployee(currentUser));
  useEffect(() => {
    load();
    ["payroll-employees-updated", "payroll-profile-updated", "storage"].forEach((e) => window.addEventListener(e, load));
    return () => ["payroll-employees-updated", "payroll-profile-updated", "storage"].forEach((e) => window.removeEventListener(e, load));
  }, [currentUser?.uid]);

  const name     = employee?.name || employee?.fullName || currentUser?.displayName || "Employee";
  const photo    = employee?.profilePic || employee?.profileImage || "";
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  const isAdmin  = employee?.isAdmin || employee?.role === "admin";

  return (
    <div style={{ paddingBottom: 40 }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <div className="page-eyebrow">EMPLOYEE PORTAL</div>
          <h1 style={{ margin: "6px 0 6px" }}>My Profile</h1>
          <p style={{ margin: 0, color: "#697386" }}>Your official employee record maintained by the Administrator.</p>
        </div>
        <span style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "#f0fdf4", border: "1px solid #86efac",
          borderRadius: 10, padding: "8px 14px", fontSize: 12, color: "#15803d", fontWeight: 700,
        }}>
          <Shield size={14} /> View Only
        </span>
      </div>

      {/* ── PROFILE HERO CARD ── */}
      <div style={{
        background: "white", border: "1px solid #e9edf4", borderRadius: 20,
        marginBottom: 20, overflow: "hidden", boxShadow: "0 4px 20px #1f29370a",
      }}>
        {/* Top colour band */}
        <div style={{ height: 90, background: "linear-gradient(135deg,#1e3a8a,#4f46e5)" }} />

        {/* Photo + name row */}
        <div style={{ padding: "0 28px 24px", position: "relative" }}>
          {/* Avatar */}
          <div style={{
            width: 100, height: 100, borderRadius: 20,
            background: photo ? "transparent" : "linear-gradient(135deg,#4f46e5,#7c3aed)",
            border: "4px solid white",
            overflow: "hidden", marginTop: -50, marginBottom: 14,
            display: "grid", placeItems: "center",
            color: "white", fontSize: 32, fontWeight: 900,
            boxShadow: "0 8px 24px #0003",
          }}>
            {photo
              ? <img src={photo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials || <User size={40} />
            }
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>{name}</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {employee?.designation && (
                  <span style={{ fontSize: 12, color: "#4f46e5", fontWeight: 700 }}>{employee.designation}</span>
                )}
                {employee?.department && (
                  <>
                    <span style={{ color: "#e2e8f0" }}>·</span>
                    <span style={{ fontSize: 12, color: "#7b8494" }}>{employee.department}</span>
                  </>
                )}
                {employee?.employeeId || employee?.id ? (
                  <>
                    <span style={{ color: "#e2e8f0" }}>·</span>
                    <span style={{ fontSize: 12, color: "#7b8494" }}>ID: {employee.employeeId || employee.id}</span>
                  </>
                ) : null}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 11, fontWeight: 800,
                background: isAdmin ? "#ede9fe" : "#dcfce7",
                color: isAdmin ? "#6d28d9" : "#15803d",
                borderRadius: 999, padding: "5px 12px",
              }}>
                {isAdmin ? "Administrator" : "Employee"}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 800,
                background: employee?.status === "Inactive" ? "#fee2e2" : "#dcfce7",
                color: employee?.status === "Inactive" ? "#dc2626" : "#15803d",
                borderRadius: 999, padding: "5px 12px",
              }}>
                ● {employee?.status || "Active"}
              </span>
            </div>
          </div>

          {/* Quick contact row */}
          <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
            {(employee?.email || currentUser?.email) && (
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
                <Mail size={14} color="#4f46e5" />
                {employee?.email || currentUser?.email}
              </span>
            )}
            {employee?.phone && (
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
                <Phone size={14} color="#4f46e5" />
                {employee.phone}
              </span>
            )}
            {employee?.address && (
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", maxWidth: 300 }}>
                <MapPin size={14} color="#4f46e5" style={{ flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{employee.address}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── TWO COLUMN DETAILS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

        {/* PERSONAL DETAILS */}
        <div style={{ background: "white", border: "1px solid #e9edf4", borderRadius: 18, padding: "20px 22px", boxShadow: "0 4px 20px #1f29370a" }}>
          <SectionHeading icon={<User size={17} />} title="Personal Details" subtitle="Basic personal information" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Full Name"    value={name} />
            <Field label="Blood Group"  value={employee?.bloodGroup} />
            <Field label="Email"        value={employee?.email || currentUser?.email} />
            <Field label="Phone"        value={employee?.phone || employee?.mobile} />
            <Field label="Address"      value={employee?.address} full />
          </div>
        </div>

        {/* EMPLOYMENT DETAILS */}
        <div style={{ background: "white", border: "1px solid #e9edf4", borderRadius: 18, padding: "20px 22px", boxShadow: "0 4px 20px #1f29370a" }}>
          <SectionHeading
            icon={<BriefcaseBusiness size={17} />}
            title="Employment Details"
            subtitle="Admin-managed employment information"
            badge={
              <span style={{ display: "flex", alignItems: "center", gap: 5, background: "#f1f5f9", borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 800, color: "#64748b" }}>
                <Lock size={11} /> Admin Managed
              </span>
            }
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <LockedField label="Employee ID"     value={employee?.employeeId || employee?.id} />
            <LockedField label="Department"      value={employee?.department} />
            <LockedField label="Designation"     value={employee?.designation} />
            <LockedField label="Shift"           value={employee?.shift} />
            <LockedField label="Employee Type"   value={employee?.employmentType} />
            <LockedField label="Branch"          value={employee?.branch} />
            <LockedField label="Reporting Mgr"   value={employee?.reportingManager} />
            <LockedField label="Joining Date"    value={employee?.joiningDate} />
          </div>
        </div>
      </div>

      {/* ── ADMIN NOTE ── */}
      <div style={{ marginTop: 16, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Lock size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong style={{ fontSize: 13, color: "#92400e" }}>Profile is read-only</strong>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#78350f" }}>
            All information is managed by your Payroll Administrator. If any detail is incorrect, please contact Admin to request a correction.
          </p>
        </div>
      </div>
    </div>
  );
}
