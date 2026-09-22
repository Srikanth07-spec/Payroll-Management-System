import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Pencil,
  Eye,
  X,
  Save,
  User,
  Building2,
  BriefcaseBusiness,
  Users,
  ShieldCheck,
  Clock3,
  UserPlus,
  Trash2,
  Shield,
  Camera,
} from "lucide-react";
import { createEmployeeFirebaseAccount } from "../../lib/employeeAuth";
import "./Employees.css";

/* ──────────────────────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────────────────────── */
const ADMIN_EMAIL = "adminpayroll03@gmail.com";

const DEPARTMENTS = [
  "IT", "HR", "Finance", "Marketing", "Sales", "Operations", "Administration",
];
const DESIGNATIONS = [
  "Software Developer", "Senior Software Developer", "HR Executive", "HR Manager",
  "Accountant", "Finance Manager", "Marketing Executive", "Sales Executive",
  "Operations Executive", "Project Manager", "Team Lead",
];
const BRANCHES = ["Hyderabad", "Bangalore", "Chennai", "Mumbai", "Delhi", "Pune"];
const SHIFTS = ["General Shift", "Morning Shift", "Evening Shift", "Night Shift"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Intern"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/* ──────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────── */
const norm = (e) => String(e || "").trim().toLowerCase();

function loadData(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) ?? fallback) : fallback;
  } catch {
    return fallback;
  }
}

function persist(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("payroll-employees-updated"));
  window.dispatchEvent(new Event("payroll-profile-updated"));
  window.dispatchEvent(new Event("storage"));
}

const loadEmployees = () => loadData("payroll_employees", []);

/* ──────────────────────────────────────────────────────────────
   Small reusable form fields
   ────────────────────────────────────────────────────────────── */
function FormField({ label, value, onChange, placeholder, type = "text", required = true }) {
  return (
    <div className="employee-form-field">
      <label>
        {label}
        {required && <em>*</em>}
      </label>
      <input
        type={type}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange, required = true }) {
  return (
    <div className="employee-form-field">
      <label>
        {label}
        {required && <em>*</em>}
      </label>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select {label}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
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

/* ──────────────────────────────────────────────────────────────
   View section helpers
   ────────────────────────────────────────────────────────────── */
function ViewSection({ title, icon, children }) {
  return (
    <section className="view-section">
      <div className="view-section-heading">
        <div className="form-section-icon">{icon}</div>
        <h3>{title}</h3>
      </div>
      <div className="view-grid">{children}</div>
    </section>
  );
}

function ViewItem({ label, value }) {
  return (
    <div className="view-item">
      <span>{label}</span>
      <strong>{value || "Not assigned"}</strong>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="employee-summary-card">
      <div className="summary-card-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Delete confirmation modal
   ────────────────────────────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────
   TWO-STEP Delete Confirmation
   Step 1: Cancel / Continue
   Step 2: Cancel / Delete Employee  (only this performs deletion)
   ────────────────────────────────────────────────────────────── */
function DeleteConfirmationModal({ employee, onCancel, onConfirm }) {
  const [step, setStep] = useState(1);
  const name = employee?.name || employee?.fullName || employee?.username || "this employee";

  return (
    <div
      className="employee-modal-overlay delete-confirm-overlay"
      onMouseDown={onCancel}
    >
      <div
        className="delete-confirm-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="delete-confirm-icon">
          <Trash2 size={25} />
        </div>

        {step === 1 ? (
          <>
            <h2>Delete Employee?</h2>
            <p>
              Are you sure you want to delete <strong>{name}</strong>?
            </p>
            <span className="delete-warning">Step 1 of 2 — Click Continue to proceed.</span>
            <div className="delete-confirm-actions">
              <button type="button" className="modal-cancel-button" onClick={onCancel}>
                <X size={16} /> Cancel
              </button>
              <button
                type="button"
                className="secondary-button"
                style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}
                onClick={() => setStep(2)}
              >
                Continue →
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Confirm Delete Employee</h2>
            <p>
              Deleting <strong>{name}</strong> will permanently remove their
              employee record and related access. This action cannot be undone.
            </p>
            <span className="delete-warning">Step 2 of 2 — This is your final confirmation.</span>
            <div className="delete-confirm-actions">
              <button type="button" className="modal-cancel-button" onClick={onCancel}>
                <X size={16} /> Cancel
              </button>
              <button type="button" className="delete-permanent-button" onClick={onConfirm}>
                <Trash2 size={16} /> Delete Employee
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   View employee modal
   ────────────────────────────────────────────────────────────── */
function ViewEmployeeModal({ employee, onClose, onEdit, onDelete }) {
  const name =
    employee.name || employee.fullName || employee.username || "Employee";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="employee-modal-overlay" onMouseDown={onClose}>
      <div className="employee-view-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="employee-modal-header">
          <div>
            <span>EMPLOYEE ACCOUNT</span>
            <h2>{name}</h2>
            <p>Employee information</p>
          </div>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="employee-view-body">
          <div className="employee-view-summary">
            <div className="view-avatar">
              {employee.profileImage || employee.profilePic ? (
                <img src={employee.profileImage || employee.profilePic} alt="" />
              ) : (
                initials || "E"
              )}
            </div>
            <div>
              <h3>{name}</h3>
              <p>{employee.designation || "Employee"}</p>
              <span>{employee.email}</span>
            </div>
            <span className="view-active-status">
              <i />
              {employee.status || "Active"}
            </span>
          </div>

          <ViewSection title="Employment Information" icon={<BriefcaseBusiness size={17} />}>
            <ViewItem label="Employee ID" value={employee.employeeId || employee.id} />
            <ViewItem label="Department" value={employee.department} />
            <ViewItem label="Shift" value={employee.shift} />
            <ViewItem label="Employee Type" value={employee.employmentType} />
            <ViewItem label="Blood Group" value={employee.bloodGroup} />
            <ViewItem label="Annual Leave" value="12 Days" />
          </ViewSection>

          <ViewSection title="Contact Details" icon={<User size={17} />}>
            <ViewItem label="Full Name" value={name} />
            <ViewItem label="Email" value={employee.email} />
            <ViewItem label="Phone Number" value={employee.phone} />
            <ViewItem label="Address" value={employee.address} />
            <ViewItem label="Firebase UID" value={employee.uid} />
          </ViewSection>

          <ViewSection title="Account Access" icon={<ShieldCheck size={17} />}>
            <ViewItem
              label="Role"
              value={
                employee.isAdmin || employee.role === "admin"
                  ? "Administrator"
                  : "Employee"
              }
            />
            <ViewItem label="Account Status" value={employee.status || "Active"} />
          </ViewSection>
        </div>

        <div className="employee-modal-footer">
          <button type="button" className="modal-cancel-button" onClick={onClose}>
            Close
          </button>
          <button type="button" className="request-reject-button" onClick={onDelete}>
            <Trash2 size={16} /> Delete
          </button>
          <button type="button" className="modal-save-button" onClick={onEdit}>
            <Pencil size={16} /> Edit Employee
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function Employees({ employees: employeesFromParent, setEmployees: setEmployeesFromParent }) {
  const [employees, setEmployees] = useState(
    Array.isArray(employeesFromParent) ? employeesFromParent : loadEmployees()
  );
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [form, setForm] = useState({});
  const [toast, setToast] = useState("");

  /* ── sync with parent + storage events ── */
  useEffect(() => {
    const refresh = () => {
      const stored = loadEmployees();
      setEmployees(Array.isArray(stored) ? stored : []);
      if (setEmployeesFromParent) setEmployeesFromParent(Array.isArray(stored) ? stored : []);
    };
    refresh();
    const events = ["payroll-employees-updated", "storage"];
    events.forEach((e) => window.addEventListener(e, refresh));
    return () => events.forEach((e) => window.removeEventListener(e, refresh));
  }, [setEmployeesFromParent]);

  /* ── filter out the hard-coded admin account ── */
  const registeredEmployees = useMemo(
    () =>
      employees.filter((emp) => {
        const email = norm(emp.email);
        if (!email) return false;
        if (email === norm(ADMIN_EMAIL)) return false;
        return Boolean(emp.uid || emp.email);
      }),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return registeredEmployees;
    return registeredEmployees.filter((emp) =>
      [emp.name, emp.fullName, emp.username, emp.email, emp.employeeId,
        emp.id, emp.department, emp.designation, emp.branch, emp.shift]
        .filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [registeredEmployees, search]);

  /* ── helpers ── */
  const empName = (e) =>
    e?.name || e?.fullName || e?.username || "Employee";

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const updateForm = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const syncAndClose = (updated) => {
    persist("payroll_employees", updated);
    setEmployees(updated);
    if (setEmployeesFromParent) setEmployeesFromParent(updated);
  };

  /* ── OPEN ADD ── */
  const openAdd = () => {
    setForm({
      fullName: "",
      email: "",
      password: "",
      employeeId: "",
      department: "",
      shift: "",
      employmentType: "",
      bloodGroup: "",
      address: "",
      phone: "",
      profilePic: "",   // base64 face photo for attendance verification
    });
    setShowAddModal(true);
  };

  /* ── PHOTO UPLOAD helper — converts file to base64 data URL ── */
  const handlePhotoUpload = (file, field) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file (JPG, PNG, etc.).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Photo must be smaller than 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => updateForm(field, e.target.result);
    reader.readAsDataURL(file);
  };

  /* ── ADD EMPLOYEE ── */
  const addEmployee = async () => {
    const { fullName, email, password, employeeId, department,
      shift, employmentType, bloodGroup, address, phone } = form;

    if (!fullName?.trim() || !email?.trim() || !password?.trim() ||
      !employeeId?.trim() || !department || !shift ||
      !employmentType || !bloodGroup || !address?.trim() || !phone?.trim()) {
      showToast("Please complete all required fields.");
      return;
    }
    const emailNorm = norm(email);
    if (emailNorm === norm(ADMIN_EMAIL)) {
      showToast("This email belongs to the main administrator.");
      return;
    }
    if (form.password.length < 6) {
      showToast("Temporary password must be at least 6 characters.");
      return;
    }
    if (employees.some((e) => norm(e.email) === emailNorm)) {
      showToast("An employee with this email already exists.");
      return;
    }
    if (employees.some(
      (e) => String(e.employeeId || e.id || "").toLowerCase() ===
        String(employeeId).trim().toLowerCase()
    )) {
      showToast("This Employee ID is already in use.");
      return;
    }

    try {
      const fbAccount = await createEmployeeFirebaseAccount({
        email: emailNorm,
        password: form.password,
        displayName: fullName.trim(),
      });

      const newEmp = {
        id: employeeId.trim(),
        employeeId: employeeId.trim(),
        uid: fbAccount.uid,
        name: fullName.trim(),
        fullName: fullName.trim(),
        username: emailNorm.split("@")[0],
        email: emailNorm,
        department,
        shift,
        employmentType,
        bloodGroup,
        address: address.trim(),
        phone: phone.trim(),
        profilePic: form.profilePic || "",   // face photo for attendance verification
        // preserved defaults for other parts of the system
        designation: "",
        branch: "",
        reportingManager: "",
        leaveAllowance: 12,
        status: "Active",
        role: "employee",
        isAdmin: false,
        biometricEnrolled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [...employees, newEmp];
      syncAndClose(updated);
      setShowAddModal(false);
      setForm({});
      showToast("Employee account created successfully.");
    } catch (err) {
      let msg = "Unable to create employee account.";
      if (err?.code === "auth/email-already-in-use") msg = "This email already has a Firebase account.";
      else if (err?.code === "auth/invalid-email") msg = "Please enter a valid email address.";
      else if (err?.code === "auth/weak-password") msg = "Password is too weak (min 6 characters).";
      else if (err?.code === "auth/network-request-failed") msg = "Network error. Check your internet connection.";
      else if (err?.message) msg = err.message;
      showToast(msg);
    }
  };

  /* ── OPEN EDIT ── */
  const openEdit = (emp) => {
    setSelectedEmployee(emp);
    setForm({
      fullName: emp.name || emp.fullName || "",
      username: emp.username || "",
      email: emp.email || "",
      employeeId: emp.employeeId || emp.id || "",
      department: emp.department || "",
      designation: emp.designation || "",
      branch: emp.branch || "",
      shift: emp.shift || "",
      employmentType: emp.employmentType || "",
      reportingManager: emp.reportingManager || "",
      bloodGroup: emp.bloodGroup || "",
      address: emp.address || "",
      phone: emp.phone || "",
      profilePic: emp.profilePic || emp.profileImage || "",
      status: emp.status || "Active",
    });
    setShowEditModal(true);
  };

  /* ── SAVE EDIT ── */
  const saveEdit = () => {
    if (!selectedEmployee) return;
    const { fullName, email, employeeId, department, designation,
      branch, shift, employmentType } = form;

    if (!fullName?.trim() || !email?.trim() || !employeeId?.trim() ||
      !department || !designation || !branch || !shift || !employmentType) {
      showToast("Please complete all required fields.");
      return;
    }

    const emailNorm = norm(email);

    // Check for duplicate email on a DIFFERENT employee
    const emailConflict = employees.some(
      (e) =>
        norm(e.email) === emailNorm &&
        (e.uid !== selectedEmployee.uid ||
          norm(e.email) !== norm(selectedEmployee.email))
        && e.uid !== selectedEmployee.uid
    );
    if (emailConflict) {
      showToast("Another employee already uses this email.");
      return;
    }

    const selId = selectedEmployee.uid || norm(selectedEmployee.email);
    const updated = employees.map((emp) => {
      const empId = emp.uid || norm(emp.email);
      if (empId !== selId) return emp;
      return {
        ...emp,
        name: fullName.trim(),
        fullName: fullName.trim(),
        username: form.username?.trim() || emp.username,
        email: emailNorm,
        employeeId: employeeId.trim(),
        id: employeeId.trim(),
        department,
        designation,
        branch,
        shift,
        employmentType,
        reportingManager: form.reportingManager?.trim() || "",
        bloodGroup: form.bloodGroup || emp.bloodGroup || "",
        address: form.address?.trim() || emp.address || "",
        phone: form.phone?.trim() || emp.phone || "",
        profilePic: form.profilePic || emp.profilePic || emp.profileImage || "",
        status: form.status || "Active",
        updatedAt: new Date().toISOString(),
      };
    });

    syncAndClose(updated);
    setShowEditModal(false);
    setSelectedEmployee(null);
    setForm({});
    showToast("Employee information updated successfully.");
  };

  /* ── VIEW ── */
  const openView = (emp) => { setSelectedEmployee(emp); setShowViewModal(true); };

  /* ── DELETE ── */
  const openDelete = (emp) => { setSelectedEmployee(emp); setShowDeleteModal(true); };
  const closeDelete = () => { setShowDeleteModal(false); setSelectedEmployee(null); };

  const confirmDelete = () => {
    if (!selectedEmployee) return;
    const selUid = selectedEmployee.uid;
    const selEmail = norm(selectedEmployee.email);

    const updated = employees.filter((emp) => {
      if (selUid && emp.uid === selUid) return false;
      if (selEmail && norm(emp.email) === selEmail) return false;
      return true;
    });

    // Also clean up attendance records for this employee
    const att = loadData("payroll_attendance", []);
    const attUpdated = att.filter(
      (r) => !(r.uid === selUid || norm(r.email) === selEmail)
    );
    localStorage.setItem("payroll_attendance", JSON.stringify(attUpdated));

    syncAndClose(updated);
    closeDelete();
    showToast(`${empName(selectedEmployee)} was permanently deleted.`);
  };

  /* ── close modals ── */
  const closeModals = () => {
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedEmployee(null);
    setForm({});
  };

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div className="employees-page">

      {/* HEADER */}
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

      {/* ADMIN NOTE */}
      <div className="employee-management-note">
        <ShieldCheck size={18} />
        <div>
          <strong>Administrator controlled employee management</strong>
          <p>Employees are created and managed by the administrator. Employee self-registration is not used.</p>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="employee-summary">
        <SummaryCard icon={<Users size={19} />} label="Employees" value={registeredEmployees.length} />
        <SummaryCard
          icon={<ShieldCheck size={19} />}
          label="Active"
          value={registeredEmployees.filter((e) => e.status !== "Inactive").length}
        />
        <SummaryCard
          icon={<Building2 size={19} />}
          label="Departments"
          value={new Set(registeredEmployees.map((e) => e.department).filter(Boolean)).size}
        />
        <SummaryCard icon={<Clock3 size={19} />} label="Total" value={registeredEmployees.length} />
      </div>

      {/* SEARCH */}
      <div className="employees-toolbar">
        <div className="employee-search">
          <Search size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees…"
          />
        </div>
        <span className="employee-count">{filteredEmployees.length} employees</span>
      </div>

      {/* TABLE */}
      <section className="employees-table-card">
        <div className="table-heading">
          <div>
            <h2>Employee Accounts</h2>
            <p>Manage employee information and account access.</p>
          </div>
        </div>

        <div className="employees-table-wrapper">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Branch</th>
                <th>Shift</th>
                <th>Employment</th>
                <th>Status</th>
                <th>Actions</th>
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
                          {emp.profileImage || emp.profilePic ? (
                            <img src={emp.profileImage || emp.profilePic} alt="" />
                          ) : (
                            n.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <strong>{n}</strong>
                          <span>{emp.email}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="employee-id">{emp.employeeId || emp.id || "—"}</span></td>
                    <td>{emp.department || "—"}</td>
                    <td>{emp.designation || "—"}</td>
                    <td>{emp.branch || "—"}</td>
                    <td>{emp.shift || "—"}</td>
                    <td>{emp.employmentType || "—"}</td>
                    <td>
                      <span className={`employee-status ${emp.status === "Inactive" ? "inactive" : "active"}`}>
                        <i />{emp.status || "Active"}
                      </span>
                    </td>
                    <td>
                      <div className="employee-actions">
                        <button type="button" className="action-view" title="View" onClick={() => openView(emp)}>
                          <Eye size={16} />
                        </button>
                        <button type="button" className="action-edit" title="Edit" onClick={() => openEdit(emp)}>
                          <Pencil size={16} />
                        </button>
                        <button type="button" className="action-delete" title="Delete" onClick={() => openDelete(emp)}>
                          <Trash2 size={16} />
                        </button>
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
              <p>Add an employee to begin managing your payroll team.</p>
              <button type="button" onClick={openAdd}>
                <UserPlus size={15} /> Add Employee
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          ADD EMPLOYEE MODAL
          ════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="employee-modal-overlay" onMouseDown={() => setShowAddModal(false)}>
          <div className="employee-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="employee-modal-header">
              <div>
                <span>ADMINISTRATOR</span>
                <h2>Add Employee</h2>
                <p>Create a new employee profile.</p>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>

            <div className="employee-modal-body">
              {/* ── Section 1: Account credentials ── */}
              <section className="employee-form-section">
                <div className="employee-form-section-header">
                  <div className="form-section-icon"><User size={17} /></div>
                  <div><h3>Account Information</h3><p>Login credentials for the employee</p></div>
                </div>

                {/* ── Face Photo Upload ── */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 16,
                  background: "#f8faff", border: "1.5px dashed #a5b4fc",
                  borderRadius: 14, padding: "16px 18px", marginBottom: 18,
                }}>
                  {/* Preview */}
                  <div style={{
                    width: 72, height: 72, borderRadius: 14, flexShrink: 0,
                    background: "#eef2ff", border: "2px solid #c7d2fe",
                    overflow: "hidden", display: "grid", placeItems: "center",
                  }}>
                    {form.profilePic ? (
                      <img src={form.profilePic} alt="Face" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Camera size={28} color="#a5b4fc" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: "block", fontSize: 13, marginBottom: 3 }}>
                      Face Photo for Attendance Verification
                    </strong>
                    <span style={{ fontSize: 11, color: "#7b8494", display: "block", marginBottom: 10 }}>
                      Upload a clear front-facing photo. This photo is used to verify the employee's identity during attendance check-in.
                    </span>
                    <label style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: form.profilePic ? "#ecfdf5" : "#4f46e5",
                      color: form.profilePic ? "#15803d" : "white",
                      border: form.profilePic ? "1px solid #86efac" : "none",
                      borderRadius: 9, padding: "8px 14px",
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}>
                      <Camera size={14} />
                      {form.profilePic ? "Change Photo" : "Upload Photo"}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => handlePhotoUpload(e.target.files?.[0], "profilePic")}
                      />
                    </label>
                    {form.profilePic && (
                      <button
                        type="button"
                        onClick={() => updateForm("profilePic", "")}
                        style={{
                          marginLeft: 8, background: "none", border: "none",
                          color: "#ef4444", fontSize: 12, cursor: "pointer", fontWeight: 600,
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div className="employee-form-grid">
                  <FormField
                    label="Full Name"
                    value={form.fullName}
                    onChange={(v) => updateForm("fullName", v)}
                    placeholder="Enter full name"
                  />
                  <FormField
                    label="Email"
                    value={form.email}
                    onChange={(v) => updateForm("email", v)}
                    placeholder="employee@example.com"
                    type="email"
                  />
                  <FormField
                    label="Temporary Password"
                    value={form.password}
                    onChange={(v) => updateForm("password", v)}
                    placeholder="Min 6 characters"
                    type="password"
                  />
                  <FormField
                    label="Employee ID"
                    value={form.employeeId}
                    onChange={(v) => updateForm("employeeId", v)}
                    placeholder="e.g. IT001, HR001, FIN001"
                  />
                </div>
              </section>

              {/* ── Section 2: Employment details ── */}
              <section className="employee-form-section">
                <div className="employee-form-section-header">
                  <div className="form-section-icon"><BriefcaseBusiness size={17} /></div>
                  <div><h3>Employment Details</h3><p>Department and work schedule</p></div>
                </div>
                <div className="employee-form-grid">
                  <SelectField
                    label="Department"
                    value={form.department}
                    options={DEPARTMENTS}
                    onChange={(v) => updateForm("department", v)}
                  />
                  <SelectField
                    label="Shift"
                    value={form.shift}
                    options={SHIFTS}
                    onChange={(v) => updateForm("shift", v)}
                  />
                  <SelectField
                    label="Employee Type"
                    value={form.employmentType}
                    options={EMPLOYMENT_TYPES}
                    onChange={(v) => updateForm("employmentType", v)}
                  />
                  <SelectField
                    label="Blood Group"
                    value={form.bloodGroup}
                    options={BLOOD_GROUPS}
                    onChange={(v) => updateForm("bloodGroup", v)}
                  />
                </div>
              </section>

              {/* ── Section 3: Contact ── */}
              <section className="employee-form-section">
                <div className="employee-form-section-header">
                  <div className="form-section-icon"><ShieldCheck size={17} /></div>
                  <div><h3>Contact Information</h3><p>Employee contact details</p></div>
                </div>
                <div className="employee-form-grid">
                  <FormField
                    label="Phone Number"
                    value={form.phone}
                    onChange={(v) => updateForm("phone", v)}
                    placeholder="Enter phone number"
                    type="tel"
                  />
                  <div className="employee-form-field" style={{ gridColumn: "1 / -1" }}>
                    <label>Address <em>*</em></label>
                    <textarea
                      value={form.address || ""}
                      onChange={(e) => updateForm("address", e.target.value)}
                      placeholder="Enter full address"
                      rows={3}
                      style={{
                        width: "100%", padding: "10px 14px",
                        border: "1.5px solid #e1e6ef", borderRadius: 10,
                        fontSize: 13, resize: "vertical",
                        fontFamily: "inherit", outline: "none",
                        boxSizing: "border-box",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#4f46e5"}
                      onBlur={(e) => e.target.style.borderColor = "#e1e6ef"}
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="employee-modal-footer">
              <button type="button" className="modal-cancel-button" onClick={() => setShowAddModal(false)}>
                <X size={16} /> Cancel
              </button>
              <button type="button" className="modal-save-button" onClick={addEmployee}>
                <UserPlus size={16} /> Add Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          EDIT EMPLOYEE MODAL — all fields editable
          ════════════════════════════════════════════════ */}
      {showEditModal && selectedEmployee && (
        <div className="employee-modal-overlay" onMouseDown={closeModals}>
          <div className="employee-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="employee-modal-header">
              <div>
                <span>MANAGE EMPLOYEE</span>
                <h2>{empName(selectedEmployee)}</h2>
                <p>Update employee information.</p>
              </div>
              <button type="button" onClick={closeModals}><X size={20} /></button>
            </div>

            <div className="employee-modal-body">
              {/* Personal / Account */}
              <section className="employee-form-section">
                <div className="employee-form-section-header">
                  <div className="form-section-icon"><User size={17} /></div>
                  <div><h3>Account Information</h3><p>Update employee account details</p></div>
                </div>

                {/* Face Photo */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 16,
                  background: "#f8faff", border: "1.5px dashed #a5b4fc",
                  borderRadius: 14, padding: "16px 18px", marginBottom: 18,
                }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: 14, flexShrink: 0,
                    background: "#eef2ff", border: "2px solid #c7d2fe",
                    overflow: "hidden", display: "grid", placeItems: "center",
                  }}>
                    {form.profilePic ? (
                      <img src={form.profilePic} alt="Face" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Camera size={28} color="#a5b4fc" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: "block", fontSize: 13, marginBottom: 3 }}>
                      Face Photo for Attendance Verification
                    </strong>
                    <span style={{ fontSize: 11, color: "#7b8494", display: "block", marginBottom: 10 }}>
                      This photo is shown to the employee during attendance check-in for face verification.
                    </span>
                    <label style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: form.profilePic ? "#ecfdf5" : "#4f46e5",
                      color: form.profilePic ? "#15803d" : "white",
                      border: form.profilePic ? "1px solid #86efac" : "none",
                      borderRadius: 9, padding: "8px 14px",
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}>
                      <Camera size={14} />
                      {form.profilePic ? "Change Photo" : "Upload Photo"}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => handlePhotoUpload(e.target.files?.[0], "profilePic")}
                      />
                    </label>
                    {form.profilePic && (
                      <button
                        type="button"
                        onClick={() => updateForm("profilePic", "")}
                        style={{
                          marginLeft: 8, background: "none", border: "none",
                          color: "#ef4444", fontSize: 12, cursor: "pointer", fontWeight: 600,
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div className="employee-form-grid">
                  <FormField label="Full Name" value={form.fullName} onChange={(v) => updateForm("fullName", v)} placeholder="Enter full name" />
                  <FormField label="Username" value={form.username} onChange={(v) => updateForm("username", v)} placeholder="Enter username" required={false} />
                  <FormField label="Email" value={form.email} onChange={(v) => updateForm("email", v)} placeholder="employee@example.com" />
                  <ReadOnlyField label="Firebase UID" value={selectedEmployee.uid} />
                </div>
              </section>

              {/* Employment */}
              <section className="employee-form-section">
                <div className="employee-form-section-header">
                  <div className="form-section-icon"><BriefcaseBusiness size={17} /></div>
                  <div><h3>Employment Information</h3><p>Admin-managed employment details</p></div>
                </div>
                <div className="employee-form-grid">
                  <FormField label="Employee ID" value={form.employeeId} onChange={(v) => updateForm("employeeId", v)} placeholder="e.g. IT001, HR001" />
                  <SelectField label="Department" value={form.department} options={DEPARTMENTS} onChange={(v) => updateForm("department", v)} />
                  <SelectField label="Designation" value={form.designation} options={DESIGNATIONS} onChange={(v) => updateForm("designation", v)} required={false} />
                  <SelectField label="Branch" value={form.branch} options={BRANCHES} onChange={(v) => updateForm("branch", v)} required={false} />
                  <SelectField label="Shift" value={form.shift} options={SHIFTS} onChange={(v) => updateForm("shift", v)} />
                  <SelectField label="Employee Type" value={form.employmentType} options={EMPLOYMENT_TYPES} onChange={(v) => updateForm("employmentType", v)} />
                  <SelectField label="Blood Group" value={form.bloodGroup} options={BLOOD_GROUPS} onChange={(v) => updateForm("bloodGroup", v)} required={false} />
                  <FormField label="Phone Number" value={form.phone} onChange={(v) => updateForm("phone", v)} placeholder="Enter phone number" type="tel" required={false} />
                  <FormField label="Reporting Manager" value={form.reportingManager} onChange={(v) => updateForm("reportingManager", v)} placeholder="Enter reporting manager" required={false} />
                </div>
                <div className="employee-form-field" style={{ marginTop: 8 }}>
                  <label>Address</label>
                  <textarea
                    value={form.address || ""}
                    onChange={(e) => updateForm("address", e.target.value)}
                    placeholder="Enter full address"
                    rows={3}
                    style={{
                      width: "100%", padding: "10px 14px",
                      border: "1.5px solid #e1e6ef", borderRadius: 10,
                      fontSize: 13, resize: "vertical",
                      fontFamily: "inherit", outline: "none",
                      boxSizing: "border-box", transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#4f46e5"}
                    onBlur={(e) => e.target.style.borderColor = "#e1e6ef"}
                  />
                </div>
              </section>

              {/* Status */}
              <section className="employee-form-section">
                <div className="employee-form-section-header">
                  <div className="form-section-icon"><ShieldCheck size={17} /></div>
                  <div><h3>Account Status</h3><p>Employee account status</p></div>
                </div>
                <div className="employee-form-grid">
                  <SelectField label="Status" value={form.status} options={["Active", "Inactive"]} onChange={(v) => updateForm("status", v)} />
                </div>
              </section>
            </div>

            <div className="employee-modal-footer">
              <button type="button" className="modal-cancel-button" onClick={closeModals}>
                <X size={16} /> Cancel
              </button>
              <button type="button" className="modal-save-button" onClick={saveEdit}>
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {showViewModal && selectedEmployee && (
        <ViewEmployeeModal
          employee={selectedEmployee}
          onClose={closeModals}
          onEdit={() => { setShowViewModal(false); openEdit(selectedEmployee); }}
          onDelete={() => { setShowViewModal(false); openDelete(selectedEmployee); }}
        />
      )}

      {/* DELETE CONFIRMATION */}
      {showDeleteModal && selectedEmployee && (
        <DeleteConfirmationModal
          employee={selectedEmployee}
          onCancel={closeDelete}
          onConfirm={confirmDelete}
        />
      )}

      {/* TOAST */}
      {toast && (
        <div className="employee-toast">
          <ShieldCheck size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
