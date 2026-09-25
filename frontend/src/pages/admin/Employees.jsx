import { useEffect, useMemo, useState } from "react";
import {
  Search, Pencil, Eye, X, User, Building2, BriefcaseBusiness,
  Users, ShieldCheck, Clock3, UserPlus, Trash2, Camera,
} from "lucide-react";
import { createEmployeeFirebaseAccount } from "../../lib/employeeAuth";
import {
  upsertEmployee, deleteEmployee as deleteEmployeeFromDB,
  fetchBranches, fetchDepartments, fetchDesignations, fetchShifts,
} from "../../services/supabaseService";
import "./Employees.css";

/* ── Constants ── */
const ADMIN_EMAIL      = "adminpayroll03@gmail.com";
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Intern"];
const BLOOD_GROUPS     = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const norm = (e) => String(e || "").trim().toLowerCase();

/* ── Signal Dashboard to re-fetch employees from Supabase ── */
function signalRefresh() {
  window.dispatchEvent(new Event("payroll-employees-updated"));
}

/* ── Reusable form fields ── */
function FormField({ label, value, onChange, placeholder, type = "text", required = true }) {
  return (
    <div className="employee-form-field">
      <label>{label}{required && <em>*</em>}</label>
      <input type={type} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function SelectField({ label, value, options, onChange, required = true, disabled = false }) {
  return (
    <div className="employee-form-field">
      <label>{label}{required && <em>*</em>}</label>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        <option value="">Select {label}</option>
        {options.map((o) => <option key={typeof o === "string" ? o : o.id} value={typeof o === "string" ? o : o.name}>{typeof o === "string" ? o : o.name}</option>)}
      </select>
    </div>
  );
}
function ReadOnlyField({ label, value }) {
  return (
    <div className="employee-form-field">
      <label>{label}</label>
      <input type="text" value={value || "Not available"} disabled readOnly />
    </div>
  );
}

/* ── View helpers ── */
function ViewSection({ title, icon, children }) {
  return (
    <section className="view-section">
      <div className="view-section-heading"><div className="form-section-icon">{icon}</div><h3>{title}</h3></div>
      <div className="view-grid">{children}</div>
    </section>
  );
}
function ViewItem({ label, value }) {
  return <div className="view-item"><span>{label}</span><strong>{value || "Not assigned"}</strong></div>;
}
function SummaryCard({ icon, label, value }) {
  return (
    <div className="employee-summary-card">
      <div className="summary-card-icon">{icon}</div>
      <div><span>{label}</span><strong>{value}</strong></div>
    </div>
  );
}

/* ── Delete confirmation ── */
function DeleteConfirmationModal({ employee, onCancel, onConfirm }) {
  const [step, setStep] = useState(1);
  const name = employee?.name || employee?.fullName || employee?.username || "this employee";
  return (
    <div className="employee-modal-overlay delete-confirm-overlay" onMouseDown={onCancel}>
      <div className="delete-confirm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="delete-confirm-icon"><Trash2 size={25} /></div>
        {step === 1 ? (
          <>
            <h2>Delete Employee?</h2>
            <p>Are you sure you want to delete <strong>{name}</strong>?</p>
            <span className="delete-warning">Step 1 of 2 — Click Continue to proceed.</span>
            <div className="delete-confirm-actions">
              <button type="button" className="modal-cancel-button" onClick={onCancel}><X size={16} /> Cancel</button>
              <button type="button" className="secondary-button" style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }} onClick={() => setStep(2)}>Continue →</button>
            </div>
          </>
        ) : (
          <>
            <h2>Confirm Delete Employee</h2>
            <p>Deleting <strong>{name}</strong> will permanently remove their record. This cannot be undone.</p>
            <span className="delete-warning">Step 2 of 2 — Final confirmation.</span>
            <div className="delete-confirm-actions">
              <button type="button" className="modal-cancel-button" onClick={onCancel}><X size={16} /> Cancel</button>
              <button type="button" className="delete-permanent-button" onClick={onConfirm}><Trash2 size={16} /> Delete Employee</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── View employee modal ── */
function ViewEmployeeModal({ employee, onClose, onEdit, onDelete }) {
  const name = employee.name || employee.fullName || employee.username || "Employee";
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("");
  return (
    <div className="employee-modal-overlay" onMouseDown={onClose}>
      <div className="employee-view-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="employee-modal-header">
          <div><span>EMPLOYEE ACCOUNT</span><h2>{name}</h2><p>Employee information</p></div>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="employee-view-body">
          <div className="employee-view-summary">
            <div className="view-avatar">
              {employee.profileImage || employee.profilePic
                ? <img src={employee.profileImage || employee.profilePic} alt="" />
                : initials || "E"}
            </div>
            <div>
              <h3>{name}</h3>
              <p>{employee.designation || "Employee"}</p>
              <span>{employee.email}</span>
            </div>
            <span className="view-active-status"><i />{employee.status || "Active"}</span>
          </div>
          <ViewSection title="Employment Information" icon={<BriefcaseBusiness size={17} />}>
            <ViewItem label="Employee ID"  value={employee.employeeId || employee.id} />
            <ViewItem label="Branch"       value={employee.branch} />
            <ViewItem label="Department"   value={employee.department} />
            <ViewItem label="Designation"  value={employee.designation} />
            <ViewItem label="Shift"        value={employee.shift} />
            <ViewItem label="Employee Type" value={employee.employmentType} />
            <ViewItem label="Blood Group"  value={employee.bloodGroup} />
            <ViewItem label="Annual Leave" value="12 Days" />
          </ViewSection>
          <ViewSection title="Contact Details" icon={<User size={17} />}>
            <ViewItem label="Full Name"    value={name} />
            <ViewItem label="Email"        value={employee.email} />
            <ViewItem label="Phone Number" value={employee.phone} />
            <ViewItem label="Address"      value={employee.address} />
            <ViewItem label="Firebase UID" value={employee.uid} />
          </ViewSection>
          <ViewSection title="Account Access" icon={<ShieldCheck size={17} />}>
            <ViewItem label="Role"   value={employee.isAdmin || employee.role === "admin" ? "Administrator" : "Employee"} />
            <ViewItem label="Status" value={employee.status || "Active"} />
          </ViewSection>
        </div>
        <div className="employee-modal-footer">
          <button type="button" className="modal-cancel-button" onClick={onClose}>Close</button>
          <button type="button" className="request-reject-button" onClick={onDelete}><Trash2 size={16} /> Delete</button>
          <button type="button" className="modal-save-button" onClick={onEdit}><Pencil size={16} /> Edit Employee</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function Employees({ employees: employeesFromParent = [], setEmployees: setEmployeesFromParent }) {
  // employees come from Dashboard (fetched from Supabase) — no localStorage
  const [employees,    setEmployees]    = useState(Array.isArray(employeesFromParent) ? employeesFromParent : []);
  const [search,       setSearch]       = useState("");
  const [deptFilter,   setDeptFilter]   = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [selectedEmployee,  setSelectedEmployee]  = useState(null);
  const [showEditModal,     setShowEditModal]     = useState(false);
  const [showViewModal,     setShowViewModal]     = useState(false);
  const [showAddModal,      setShowAddModal]      = useState(false);
  const [showDeleteModal,   setShowDeleteModal]   = useState(false);
  const [form,    setForm]    = useState({});
  const [toast,   setToast]   = useState("");
  const [saving,  setSaving]  = useState(false);

  /* ── Master data from Supabase ── */
  const [masterBranches,     setMasterBranches]     = useState([]);
  const [masterDepartments,  setMasterDepartments]  = useState([]);
  const [masterDesignations, setMasterDesignations] = useState([]);
  const [masterShifts,       setMasterShifts]       = useState([]);

  /* Designations filtered by selected department */
  const availableDesignations = useMemo(() =>
    form.department
      ? masterDesignations.filter((d) => d.department === form.department && d.status !== "Inactive")
      : masterDesignations.filter((d) => d.status !== "Inactive"),
    [masterDesignations, form.department]
  );

  // Sync when Dashboard re-fetches from Supabase
  useEffect(() => {
    if (Array.isArray(employeesFromParent)) setEmployees(employeesFromParent);
  }, [employeesFromParent]);

  // Load master data from Supabase on mount
  useEffect(() => {
    Promise.all([fetchBranches(), fetchDepartments(), fetchDesignations(), fetchShifts()])
      .then(([br, de, di, sh]) => {
        setMasterBranches(br.filter((b) => b.status !== "Inactive"));
        setMasterDepartments(de.filter((d) => d.status !== "Inactive"));
        setMasterDesignations(di);
        setMasterShifts(sh.filter((s) => s.status !== "Inactive"));
      });
  }, []);

  /* ── Filter out admin account ── */
  const registeredEmployees = useMemo(() =>
    employees.filter((emp) => {
      const email = norm(emp.email);
      if (!email) return false;
      if (email === norm(ADMIN_EMAIL)) return false;
      return Boolean(emp.uid || emp.email);
    }), [employees]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return registeredEmployees.filter((emp) => {
      if (deptFilter   !== "All" && emp.department !== deptFilter)   return false;
      if (branchFilter !== "All" && emp.branch     !== branchFilter) return false;
      if (!q) return true;
      return [emp.name, emp.fullName, emp.username, emp.email, emp.employeeId,
        emp.id, emp.department, emp.designation, emp.branch, emp.shift]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [registeredEmployees, search, deptFilter, branchFilter]);

  const empName   = (e) => e?.name || e?.fullName || e?.username || "Employee";
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };
  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  /* ── Photo upload ── */
  const handlePhotoUpload = (file, field) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("Please select an image file."); return; }
    if (file.size > 2 * 1024 * 1024)    { showToast("Photo must be smaller than 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = (e) => updateForm(field, e.target.result);
    reader.readAsDataURL(file);
  };

  /* ── Open Add ── */
  const openAdd = () => {
    setForm({ fullName: "", email: "", password: "", employeeId: "", branch: "", department: "", designation: "", shift: "", employmentType: "", bloodGroup: "", address: "", phone: "", profilePic: "" });
    setShowAddModal(true);
  };

  /* ── Add Employee ── */
  const addEmployee = async () => {
    const { fullName, email, password, employeeId, branch, department, designation, shift, employmentType, bloodGroup, address, phone } = form;
    if (!fullName?.trim() || !email?.trim() || !password?.trim() || !employeeId?.trim() ||
        !branch || !department || !designation || !shift || !employmentType || !bloodGroup || !address?.trim() || !phone?.trim()) {
      showToast("Please complete all required fields."); return;
    }
    const emailNorm = norm(email);
    if (emailNorm === norm(ADMIN_EMAIL)) { showToast("This email belongs to the main administrator."); return; }
    if (password.length < 6)            { showToast("Temporary password must be at least 6 characters."); return; }
    if (employees.some((e) => norm(e.email) === emailNorm)) { showToast("An employee with this email already exists."); return; }
    if (employees.some((e) => String(e.employeeId || e.id || "").toLowerCase() === employeeId.trim().toLowerCase())) {
      showToast("This Employee ID is already in use."); return;
    }
    try {
      const fbAccount = await createEmployeeFirebaseAccount({ email: emailNorm, password, displayName: fullName.trim() });
      const newEmp = {
        id: employeeId.trim(), employeeId: employeeId.trim(),
        uid: fbAccount.uid, name: fullName.trim(), fullName: fullName.trim(),
        username: emailNorm.split("@")[0], email: emailNorm,
        branch, department, designation, shift, employmentType, bloodGroup,
        address: address.trim(), phone: phone.trim(),
        profilePic: form.profilePic || "",
        reportingManager: "", leaveAllowance: 12, status: "Active",
        role: "employee", isAdmin: false, biometricEnrolled: false,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      // Save to Supabase — source of truth
      await upsertEmployee(newEmp);
      // Signal Dashboard to re-fetch from Supabase
      signalRefresh();
      setShowAddModal(false);
      setForm({});
      showToast("Employee account created successfully.");
    } catch (err) {
      let msg = "Unable to create employee account.";
      if (err?.code === "auth/email-already-in-use") msg = "This email already has a Firebase account.";
      else if (err?.code === "auth/invalid-email")   msg = "Please enter a valid email address.";
      else if (err?.code === "auth/weak-password")   msg = "Password is too weak (min 6 characters).";
      else if (err?.message) msg = err.message;
      showToast(msg);
    }
    setSaving(false);
  };

  /* ── Open Edit ── */
  const openEdit = (emp) => {
    setSelectedEmployee(emp);
    setForm({
      fullName: emp.name || emp.fullName || "", username: emp.username || "",
      email: emp.email || "", employeeId: emp.employeeId || emp.id || "",
      branch: emp.branch || "", department: emp.department || "",
      designation: emp.designation || "", shift: emp.shift || "",
      employmentType: emp.employmentType || "", reportingManager: emp.reportingManager || "",
      bloodGroup: emp.bloodGroup || "", address: emp.address || "",
      phone: emp.phone || "", profilePic: emp.profilePic || emp.profileImage || "",
      status: emp.status || "Active",
    });
    setShowEditModal(true);
  };

  /* ── Save Edit — saves to Supabase ── */
  const saveEdit = async () => {
    if (!selectedEmployee) return;
    const { fullName, email, employeeId, branch, department, designation, shift, employmentType } = form;
    if (!fullName?.trim() || !email?.trim() || !employeeId?.trim() ||
        !branch || !department || !designation || !shift || !employmentType) {
      showToast("Please complete all required fields."); return;
    }
    const emailNorm = norm(email);
    if (employees.some((e) => norm(e.email) === emailNorm && e.uid !== selectedEmployee.uid)) {
      showToast("Another employee already uses this email."); return;
    }
    setSaving(true);
    const updated = {
      ...selectedEmployee,
      name: fullName.trim(), fullName: fullName.trim(),
      username: form.username?.trim() || selectedEmployee.username,
      email: emailNorm, employeeId: employeeId.trim(), id: employeeId.trim(),
      branch, department, designation, shift, employmentType,
      reportingManager: form.reportingManager?.trim() || "",
      bloodGroup: form.bloodGroup || selectedEmployee.bloodGroup || "",
      address: form.address?.trim() || selectedEmployee.address || "",
      phone:   form.phone?.trim()   || selectedEmployee.phone   || "",
      profilePic: form.profilePic || selectedEmployee.profilePic || selectedEmployee.profileImage || "",
      status: form.status || "Active",
      updated_at: new Date().toISOString(),
    };
    // Save to Supabase — source of truth
    await upsertEmployee(updated);
    // Signal Dashboard to re-fetch
    signalRefresh();
    setShowEditModal(false);
    setSelectedEmployee(null);
    setForm({});
    setSaving(false);
    showToast("Employee information updated successfully.");
  };

  const openView  = (emp) => { setSelectedEmployee(emp); setShowViewModal(true); };
  const openDelete = (emp) => { setSelectedEmployee(emp); setShowDeleteModal(true); };
  const closeDelete = () => { setShowDeleteModal(false); setSelectedEmployee(null); };

  /* ── Delete — removes from Supabase ── */
  const confirmDelete = async () => {
    if (!selectedEmployee) return;
    await deleteEmployeeFromDB(selectedEmployee.uid);
    signalRefresh();
    closeDelete();
    showToast(`${empName(selectedEmployee)} was permanently deleted.`);
  };

  const closeModals = () => { setShowEditModal(false); setShowViewModal(false); setSelectedEmployee(null); setForm({}); };

  /* ── Photo upload UI ── */
  const PhotoUpload = ({ field }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#f8faff", border: "1.5px dashed #a5b4fc", borderRadius: 14, padding: "16px 18px", marginBottom: 18 }}>
      <div style={{ width: 72, height: 72, borderRadius: 14, flexShrink: 0, background: "#eef2ff", border: "2px solid #c7d2fe", overflow: "hidden", display: "grid", placeItems: "center" }}>
        {form.profilePic ? <img src={form.profilePic} alt="Face" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Camera size={28} color="#a5b4fc" />}
      </div>
      <div style={{ flex: 1 }}>
        <strong style={{ display: "block", fontSize: 13, marginBottom: 3 }}>Face Photo for Attendance Verification</strong>
        <span style={{ fontSize: 11, color: "#7b8494", display: "block", marginBottom: 10 }}>Upload a clear front-facing photo used for identity verification during attendance check-in.</span>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, background: form.profilePic ? "#ecfdf5" : "#4f46e5", color: form.profilePic ? "#15803d" : "white", border: form.profilePic ? "1px solid #86efac" : "none", borderRadius: 9, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          <Camera size={14} />{form.profilePic ? "Change Photo" : "Upload Photo"}
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handlePhotoUpload(e.target.files?.[0], field)} />
        </label>
        {form.profilePic && <button type="button" onClick={() => updateForm(field, "")} style={{ marginLeft: 8, background: "none", border: "none", color: "#ef4444", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Remove</button>}
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div className="employees-page">

      {/* Header */}
      <div className="employees-header">
        <div>
          <div className="employees-eyebrow"><Users size={14} /> ADMINISTRATION</div>
          <h1>Employee Management</h1>
          <p>Create, manage and control employee accounts.</p>
        </div>
        <button type="button" className="add-employee-button" onClick={openAdd}>
          <UserPlus size={17} /> Add Employee
        </button>
      </div>

      {/* Admin note */}
      <div className="employee-management-note">
        <ShieldCheck size={18} />
        <div>
          <strong>Administrator controlled employee management</strong>
          <p>Employees are created and managed by the administrator. Employee self-registration is not used.</p>
        </div>
      </div>

      {/* Summary */}
      <div className="employee-summary">
        <SummaryCard icon={<Users size={19} />}      label="Employees"   value={registeredEmployees.length} />
        <SummaryCard icon={<ShieldCheck size={19} />} label="Active"      value={registeredEmployees.filter((e) => e.status !== "Inactive").length} />
        <SummaryCard icon={<Building2 size={19} />}   label="Departments" value={new Set(registeredEmployees.map((e) => e.department).filter(Boolean)).size} />
        <SummaryCard icon={<Clock3 size={19} />}      label="Total"       value={registeredEmployees.length} />
      </div>

      {/* Toolbar: search + filters */}
      <div className="employees-toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
        <div className="employee-search">
          <Search size={18} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, ID, email, dept, branch…" />
          {search && <button onClick={() => setSearch("")} style={{ border: 0, background: "none", cursor: "pointer", color: "#94a3b8" }}><X size={14} /></button>}
        </div>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 12px", fontSize: 13, background: "white", cursor: "pointer", height: 42 }}>
          <option value="All">All Departments</option>
          {masterDepartments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 12px", fontSize: 13, background: "white", cursor: "pointer", height: 42 }}>
          <option value="All">All Branches</option>
          {masterBranches.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
        </select>
        <span className="employee-count">{filteredEmployees.length} employee{filteredEmployees.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <section className="employees-table-card">
        <div className="table-heading">
          <div><h2>Employee Accounts</h2><p>Manage employee information and account access.</p></div>
        </div>
        <div className="employees-table-wrapper">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Employee</th><th>Employee ID</th><th>Branch</th><th>Department</th>
                <th>Designation</th><th>Shift</th><th>Type</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const n = empName(emp);
                return (
                  <tr key={emp.uid || emp.email || emp.id}>
                    <td>
                      <div className="employee-table-person">
                        <div className="employee-small-avatar">
                          {emp.profileImage || emp.profilePic
                            ? <img src={emp.profileImage || emp.profilePic} alt="" />
                            : n.charAt(0).toUpperCase()}
                        </div>
                        <div><strong>{n}</strong><span>{emp.email}</span></div>
                      </div>
                    </td>
                    <td><span className="employee-id">{emp.employeeId || emp.id || "—"}</span></td>
                    <td>{emp.branch      || "—"}</td>
                    <td>{emp.department  || "—"}</td>
                    <td>{emp.designation || "—"}</td>
                    <td>{emp.shift       || "—"}</td>
                    <td>{emp.employmentType || "—"}</td>
                    <td>
                      <div className="employee-actions">
                        <button type="button" className="action-view"   title="View"   onClick={() => openView(emp)}><Eye size={16} /></button>
                        <button type="button" className="action-edit"   title="Edit"   onClick={() => openEdit(emp)}><Pencil size={16} /></button>
                        <button type="button" className="action-delete" title="Delete" onClick={() => openDelete(emp)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredEmployees.length === 0 && (
            <div className="employees-empty">
              <Users size={38} />
              <h3>No employees found</h3>
              <p>{search || deptFilter !== "All" || branchFilter !== "All" ? "Try different search or filters." : "Add an employee to begin managing your payroll team."}</p>
              <button type="button" onClick={openAdd}><UserPlus size={15} /> Add Employee</button>
            </div>
          )}
        </div>
      </section>

      {/* ════════ ADD EMPLOYEE MODAL ════════ */}
      {showAddModal && (
        <div className="employee-modal-overlay" onMouseDown={() => setShowAddModal(false)}>
          <div className="employee-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="employee-modal-header">
              <div><span>ADMINISTRATOR</span><h2>Add Employee</h2><p>Create a new employee profile.</p></div>
              <button type="button" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <div className="employee-modal-body">

              {/* PERSONAL INFORMATION */}
              <section className="employee-form-section">
                <div className="employee-form-section-header">
                  <div className="form-section-icon"><User size={17} /></div>
                  <div><h3>Personal Information</h3><p>Identity and contact details</p></div>
                </div>
                <PhotoUpload field="profilePic" />
                <div className="employee-form-grid">
                  <FormField label="Full Name"          value={form.fullName}  onChange={(v) => updateForm("fullName", v)}  placeholder="Enter full name" />
                  <FormField label="Email"              value={form.email}     onChange={(v) => updateForm("email", v)}     placeholder="employee@example.com" type="email" />
                  <FormField label="Temporary Password" value={form.password}  onChange={(v) => updateForm("password", v)}  placeholder="Min 6 characters" type="password" />
                  <FormField label="Phone Number"       value={form.phone}     onChange={(v) => updateForm("phone", v)}     placeholder="Enter phone number" type="tel" />
                  <SelectField label="Blood Group" value={form.bloodGroup} options={BLOOD_GROUPS} onChange={(v) => updateForm("bloodGroup", v)} />
                  <div className="employee-form-field" style={{ gridColumn: "1 / -1" }}>
                    <label>Address <em>*</em></label>
                    <textarea value={form.address || ""} onChange={(e) => updateForm("address", e.target.value)} placeholder="Enter full address" rows={2} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e1e6ef", borderRadius: 10, fontSize: 13, resize: "vertical", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} onFocus={(e) => e.target.style.borderColor = "#4f46e5"} onBlur={(e) => e.target.style.borderColor = "#e1e6ef"} />
                  </div>
                </div>
              </section>

              {/* EMPLOYMENT INFORMATION */}
              <section className="employee-form-section">
                <div className="employee-form-section-header">
                  <div className="form-section-icon"><BriefcaseBusiness size={17} /></div>
                  <div><h3>Employment Information</h3><p>Role and organizational assignment</p></div>
                </div>
                <div className="employee-form-grid">
                  <FormField label="Employee ID" value={form.employeeId} onChange={(v) => updateForm("employeeId", v)} placeholder="e.g. EMP001" />
                  <SelectField label="Branch"      value={form.branch}     options={masterBranches}     onChange={(v) => updateForm("branch", v)} />
                  <SelectField label="Department"  value={form.department} options={masterDepartments}  onChange={(v) => { updateForm("department", v); updateForm("designation", ""); }} />
                  <SelectField
                    label="Designation"
                    value={form.designation}
                    options={availableDesignations}
                    onChange={(v) => updateForm("designation", v)}
                    disabled={!form.department}
                  />
                  <SelectField label="Shift"          value={form.shift}          options={masterShifts}   onChange={(v) => updateForm("shift", v)} />
                  <SelectField label="Employee Type"  value={form.employmentType} options={EMPLOYMENT_TYPES} onChange={(v) => updateForm("employmentType", v)} />
                </div>
                {!form.department && <p style={{ fontSize: 11, color: "#94a3b8", marginTop: -8, marginBottom: 8 }}>Select a Department first to load available Designations.</p>}
              </section>

            </div>
            <div className="employee-modal-footer">
              <button type="button" className="modal-cancel-button" onClick={() => setShowAddModal(false)}><X size={16} /> Cancel</button>
              <button type="button" className="modal-save-button" onClick={addEmployee}><UserPlus size={16} /> Add Employee</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ EDIT EMPLOYEE MODAL ════════ */}
      {showEditModal && selectedEmployee && (
        <div className="employee-modal-overlay" onMouseDown={closeModals}>
          <div className="employee-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="employee-modal-header">
              <div><span>MANAGE EMPLOYEE</span><h2>{empName(selectedEmployee)}</h2><p>Update employee information.</p></div>
              <button type="button" onClick={closeModals}><X size={20} /></button>
            </div>
            <div className="employee-modal-body">

              {/* Account */}
              <section className="employee-form-section">
                <div className="employee-form-section-header">
                  <div className="form-section-icon"><User size={17} /></div>
                  <div><h3>Account Information</h3><p>Update employee account details</p></div>
                </div>
                <PhotoUpload field="profilePic" />
                <div className="employee-form-grid">
                  <FormField label="Full Name"    value={form.fullName}  onChange={(v) => updateForm("fullName", v)}  placeholder="Enter full name" />
                  <FormField label="Username"     value={form.username}  onChange={(v) => updateForm("username", v)}  placeholder="Enter username" required={false} />
                  <FormField label="Email"        value={form.email}     onChange={(v) => updateForm("email", v)}     placeholder="employee@example.com" type="email" />
                  <ReadOnlyField label="Firebase UID" value={selectedEmployee.uid} />
                </div>
              </section>

              {/* Employment */}
              <section className="employee-form-section">
                <div className="employee-form-section-header">
                  <div className="form-section-icon"><BriefcaseBusiness size={17} /></div>
                  <div><h3>Employment Information</h3><p>Organizational assignment</p></div>
                </div>
                <div className="employee-form-grid">
                  <FormField label="Employee ID" value={form.employeeId} onChange={(v) => updateForm("employeeId", v)} placeholder="e.g. EMP001" />
                  <SelectField label="Branch"     value={form.branch}     options={masterBranches}    onChange={(v) => updateForm("branch", v)} />
                  <SelectField label="Department" value={form.department} options={masterDepartments} onChange={(v) => { updateForm("department", v); updateForm("designation", ""); }} />
                  <SelectField
                    label="Designation"
                    value={form.designation}
                    options={availableDesignations}
                    onChange={(v) => updateForm("designation", v)}
                    disabled={!form.department}
                  />
                  <SelectField label="Shift"         value={form.shift}          options={masterShifts}    onChange={(v) => updateForm("shift", v)} />
                  <SelectField label="Employee Type" value={form.employmentType} options={EMPLOYMENT_TYPES} onChange={(v) => updateForm("employmentType", v)} />
                  <SelectField label="Blood Group"   value={form.bloodGroup}     options={BLOOD_GROUPS}    onChange={(v) => updateForm("bloodGroup", v)} required={false} />
                  <FormField   label="Phone Number"  value={form.phone}          onChange={(v) => updateForm("phone", v)} placeholder="Enter phone number" type="tel" required={false} />
                  <FormField   label="Reporting Manager" value={form.reportingManager} onChange={(v) => updateForm("reportingManager", v)} placeholder="Manager name" required={false} />
                  <div className="employee-form-field" style={{ gridColumn: "1 / -1" }}>
                    <label>Address</label>
                    <textarea value={form.address || ""} onChange={(e) => updateForm("address", e.target.value)} placeholder="Enter full address" rows={2} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e1e6ef", borderRadius: 10, fontSize: 13, resize: "vertical", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} onFocus={(e) => e.target.style.borderColor = "#4f46e5"} onBlur={(e) => e.target.style.borderColor = "#e1e6ef"} />
                  </div>
                </div>
              </section>

              {/* Status */}
              <section className="employee-form-section">
                <div className="employee-form-section-header">
                  <div className="form-section-icon"><ShieldCheck size={17} /></div>
                  <div><h3>Account Status</h3><p>Activate or deactivate this employee</p></div>
                </div>
                <div className="employee-form-grid">
                  <SelectField label="Status" value={form.status} options={["Active", "Inactive"]} onChange={(v) => updateForm("status", v)} />
                </div>
              </section>

            </div>
            <div className="employee-modal-footer">
              <button type="button" className="modal-cancel-button" onClick={closeModals}><X size={16} /> Cancel</button>
              <button type="button" className="modal-save-button"   onClick={saveEdit}><Pencil size={16} /> Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* View, Delete modals */}
      {showViewModal && selectedEmployee && (
        <ViewEmployeeModal
          employee={selectedEmployee}
          onClose={closeModals}
          onEdit={() => { closeModals(); openEdit(selectedEmployee); }}
          onDelete={() => { setShowViewModal(false); setShowDeleteModal(true); }}
        />
      )}
      {showDeleteModal && selectedEmployee && (
        <DeleteConfirmationModal employee={selectedEmployee} onCancel={closeDelete} onConfirm={confirmDelete} />
      )}

      {/* Toast */}
      {toast && <div className="employee-toast">{toast}</div>}
    </div>
  );
}
