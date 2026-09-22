export const DEPARTMENTS = [
  "Programming",
  "Testing",
  "Design",
  "Development",
  "Human Resources",
  "Finance",
  "Operations",
];

export function loadData(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getEmployees() {
  return loadData("payroll_employees", []).filter(
    (employee) => employee && employee.deleted !== true && employee.department
  );
}

export function getEmployeeByUid(uid) {
  return getEmployees().find((employee) => employee.uid === uid);
}

export function getLeaves() {
  return loadData("payroll_leaves", []);
}

export function getAttendance() {
  return loadData("payroll_attendance", []);
}

export function getDocuments() {
  return loadData("payroll_documents", []);
}

export function getAnnouncements() {
  return loadData("payroll_announcements", []);
}

export function getApprovedLeaveDays(uid) {
  return getLeaves()
    .filter((leave) => {
      if (leave.status !== "Approved") return false;
      // match by employeeUid (new field) OR legacy uid field
      return leave.employeeUid === uid || leave.uid === uid;
    })
    .reduce((total, leave) => {
      // support both days field and calculated from/to
      if (leave.days) return total + Number(leave.days || 0);
      const from = leave.from ? new Date(leave.from) : null;
      const to   = leave.to   ? new Date(leave.to)   : null;
      if (!from || !to || to < from) return total;
      return total + Math.floor((to - from) / 86400000) + 1;
    }, 0);
}

export function getRemainingLeave(uid) {
  return Math.max(0, 12 - getApprovedLeaveDays(uid));
}

export function countAttendance(uid) {
  const items = getAttendance().filter((item) => item.uid === uid);
  const logins = items.filter((item) => item.action === "Login");
  const uniqueDays = new Set(logins.map((item) => item.date));
  return uniqueDays.size;
}

export function generateUsername(fullName, email) {
  const base = (fullName || email?.split("@")[0] || "employee")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 16) || "employee";

  const existing = getEmployees();
  if (!existing.some((e) => e.username === base)) return base;

  let n = 2;
  while (existing.some((e) => e.username === `${base}${n}`)) n += 1;
  return `${base}${n}`;
}

export function ensureEmployeeProfile(firebaseUser, department) {
  if (!firebaseUser?.uid || !department) return null;
  const employees = loadData("payroll_employees", []);
  const existing = employees.find((e) => e.uid === firebaseUser.uid);
  if (existing) return existing;

  const profile = {
    id: `EMP-${firebaseUser.uid.slice(0, 6).toUpperCase()}`,
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || "Employee",
    email: firebaseUser.email || "",
    username: generateUsername(firebaseUser.displayName, firebaseUser.email),
    department,
    designation: "Employee",
    branch: "Head Office",
    phone: "",
    address: "",
    bloodGroup: "",
    profilePic: "",
    signature: "",
    status: "Active",
    annualLeave: 12,
    createdAt: new Date().toISOString(),
  };
  saveData("payroll_employees", [...employees, profile]);
  return profile;
}
