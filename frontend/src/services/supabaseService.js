/**
 * supabaseService.js
 * Unified Supabase CRUD for all tables.
 * localStorage is used only as a read-cache / offline fallback.
 * Supabase is always the source of truth.
 */
import { supabase } from "../lib/supabase";

/* ── Generic cache helpers ── */
const cache = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
};

/* ════════════════════════════════════════════════════════════════
   EMPLOYEES
   ════════════════════════════════════════════════════════════════ */
export async function fetchEmployees() {
  try {
    const { data, error } = await supabase.from("employees").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    const rows = data || [];
    cache.set("payroll_employees", rows);
    return rows;
  } catch (err) {
    console.warn("[supabaseService] fetchEmployees error:", err.message);
    return cache.get("payroll_employees") || [];
  }
}

export async function upsertEmployee(emp) {
  if (!emp?.uid) return emp;
  // Only send columns that exist in the employees table schema
  const row = {
    uid:               emp.uid,
    name:              emp.name              || emp.fullName || null,
    fullName:          emp.fullName          || emp.name     || null,
    username:          emp.username          || null,
    email:             emp.email             || null,
    employeeId:        emp.employeeId        || emp.id       || null,
    department:        emp.department        || null,
    designation:       emp.designation       || null,
    branch:            emp.branch            || null,
    shift:             emp.shift             || null,
    employmentType:    emp.employmentType    || null,
    bloodGroup:        emp.bloodGroup        || null,
    phone:             emp.phone             || emp.mobile   || null,
    mobile:            emp.mobile            || emp.phone    || null,
    address:           emp.address           || null,
    profilePic:        emp.profilePic        || emp.profileImage || null,
    profileImage:      emp.profileImage      || emp.profilePic   || null,
    reportingManager:  emp.reportingManager  || null,
    joiningDate:       emp.joiningDate       || null,
    leaveAllowance:    emp.leaveAllowance     ?? 12,
    status:            emp.status            || "Active",
    role:              emp.role              || "employee",
    isAdmin:           emp.isAdmin           ?? false,
    biometricEnrolled: emp.biometricEnrolled ?? false,
    adminGrantedAt:    emp.adminGrantedAt    || null,
    adminGrantedBy:    emp.adminGrantedBy    || null,
    adminRevokedAt:    emp.adminRevokedAt    || null,
    adminRevokedBy:    emp.adminRevokedBy    || null,
    updated_at:        new Date().toISOString(),
  };
  // Don't overwrite created_at if updating
  if (!emp.created_at) row.created_at = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from("employees")
      .upsert([row], { onConflict: "uid" })
      .select()
      .single();
    if (error) throw error;
    // Update cache
    const all = cache.get("payroll_employees") || [];
    const updated = all.some((e) => e.uid === emp.uid)
      ? all.map((e) => (e.uid === emp.uid ? data : e))
      : [...all, data];
    cache.set("payroll_employees", updated);
    return data;
  } catch (err) {
    console.warn("[supabaseService] upsertEmployee error:", err.message);
    return emp;
  }
}

export async function deleteEmployee(uid) {
  try {
    const { error } = await supabase.from("employees").delete().eq("uid", uid);
    if (error) throw error;
  } catch (err) {
    console.warn("[supabaseService] deleteEmployee fallback:", err.message);
  }
  const all = cache.get("payroll_employees") || [];
  cache.set("payroll_employees", all.filter((e) => e.uid !== uid));
}

/* ════════════════════════════════════════════════════════════════
   LEAVES
   ════════════════════════════════════════════════════════════════ */
function leaveToRow(l) {
  return {
    id:            l.id,
    employee:      l.employee      || null,
    employee_email:l.employeeEmail || null,
    employee_uid:  l.employeeUid   || l.uid || null,
    employee_id:   l.employeeId    || null,
    type:          l.type          || null,
    from_date:     l.from          || null,
    to_date:       l.to            || null,
    reason:        l.reason        || null,
    status:        l.status        || "Pending",
    admin_note:    l.adminNote     || "",
    submitted_at:  l.submittedAt   || new Date().toISOString(),
    reviewed_at:   l.reviewedAt    || null,
  };
}
function rowToLeave(r) {
  return {
    id:           r.id,
    employee:     r.employee,
    employeeEmail:r.employee_email,
    employeeUid:  r.employee_uid,
    employeeId:   r.employee_id,
    type:         r.type,
    from:         r.from_date,
    to:           r.to_date,
    reason:       r.reason,
    status:       r.status,
    adminNote:    r.admin_note,
    submittedAt:  r.submitted_at,
    reviewedAt:   r.reviewed_at,
  };
}

export async function fetchLeaves() {
  try {
    const { data, error } = await supabase.from("leaves").select("*").order("submitted_at", { ascending: false });
    if (error) throw error;
    const rows = (data || []).map(rowToLeave);
    cache.set("payroll_leaves", rows);
    return rows;
  } catch (err) {
    console.warn("[supabaseService] fetchLeaves error:", err.message);
    return cache.get("payroll_leaves") || [];
  }
}

export async function insertLeave(leave) {
  try {
    const { data, error } = await supabase.from("leaves").insert([leaveToRow(leave)]).select().single();
    if (error) throw error;
    const saved = rowToLeave(data);
    const all = cache.get("payroll_leaves") || [];
    cache.set("payroll_leaves", [saved, ...all]);
    return saved;
  } catch (err) {
    console.warn("[supabaseService] insertLeave fallback:", err.message);
    const all = cache.get("payroll_leaves") || [];
    cache.set("payroll_leaves", [leave, ...all]);
    return leave;
  }
}

export async function updateLeaveStatus(id, status, adminNote, reviewedAt) {
  try {
    const { data, error } = await supabase
      .from("leaves")
      .update({ status, admin_note: adminNote || "", reviewed_at: reviewedAt || new Date().toISOString() })
      .eq("id", id)
      .select().single();
    if (error) throw error;
    const saved = rowToLeave(data);
    const all = cache.get("payroll_leaves") || [];
    cache.set("payroll_leaves", all.map((l) => (l.id === id ? saved : l)));
    return saved;
  } catch (err) {
    console.warn("[supabaseService] updateLeaveStatus fallback:", err.message);
    const all = cache.get("payroll_leaves") || [];
    const updated = all.map((l) => l.id === id ? { ...l, status, adminNote: adminNote || "", reviewedAt: reviewedAt || new Date().toISOString() } : l);
    cache.set("payroll_leaves", updated);
    return updated.find((l) => l.id === id);
  }
}

/* ════════════════════════════════════════════════════════════════
   HOLIDAYS
   ════════════════════════════════════════════════════════════════ */
function holToRow(h) {
  return { id: h.id, name: h.name, date: h.date, day: h.day, type: h.type || "Public Holiday" };
}
function rowToHol(r) {
  return { id: r.id, name: r.name, date: r.date, day: r.day, type: r.type };
}

export async function fetchHolidays() {
  try {
    const { data, error } = await supabase.from("holidays").select("*").order("date", { ascending: true });
    if (error) throw error;
    const rows = (data || []).map(rowToHol);
    cache.set("payroll_holidays", rows);
    return rows;
  } catch (err) {
    console.warn("[supabaseService] fetchHolidays error:", err.message);
    return cache.get("payroll_holidays") || [];
  }
}

export async function upsertHoliday(h) {
  try {
    const { data, error } = await supabase.from("holidays").upsert([holToRow(h)], { onConflict: "id" }).select().single();
    if (error) throw error;
    return rowToHol(data);
  } catch (err) {
    console.warn("[supabaseService] upsertHoliday fallback:", err.message);
    return h;
  }
}

export async function deleteHoliday(id) {
  try {
    const { error } = await supabase.from("holidays").delete().eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.warn("[supabaseService] deleteHoliday fallback:", err.message);
  }
  const all = cache.get("payroll_holidays") || [];
  cache.set("payroll_holidays", all.filter((h) => h.id !== id));
}

/* ════════════════════════════════════════════════════════════════
   SALARY SLIPS
   ════════════════════════════════════════════════════════════════ */
function slipToRow(s) {
  return {
    id:           s.id,
    uid:          s.uid,
    employee:     s.employee     || null,
    username:     s.username     || null,
    employee_id:  s.employeeId   || null,
    department:   s.department   || null,
    designation:  s.designation  || null,
    employment_type: s.employmentType || null,
    month:        s.month        || null,
    year:         s.year         || null,
    basic:        s.basic        || 0,
    allowances:   s.allowances   || 0,
    deductions:   s.deductions   || 0,
    gross:        s.gross        || 0,
    net:          s.net          || 0,
    created_at:   s.createdAt    || new Date().toISOString(),
  };
}
function rowToSlip(r) {
  return {
    id: r.id, uid: r.uid, employee: r.employee, username: r.username,
    employeeId: r.employee_id, department: r.department,
    designation: r.designation, employmentType: r.employment_type,
    month: r.month, year: r.year, basic: r.basic,
    allowances: r.allowances, deductions: r.deductions,
    gross: r.gross, net: r.net, createdAt: r.created_at,
  };
}

export async function fetchSalarySlips(uid) {
  try {
    let query = supabase.from("salary_slips").select("*").order("created_at", { ascending: false });
    if (uid) query = query.eq("uid", uid);
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data || []).map(rowToSlip);
    cache.set("payroll_salary_slips", rows);
    return rows;
  } catch (err) {
    console.warn("[supabaseService] fetchSalarySlips error:", err.message);
    const all = cache.get("payroll_salary_slips") || [];
    return uid ? all.filter((s) => s.uid === uid) : all;
  }
}

export async function upsertSalarySlip(slip) {
  try {
    const { data, error } = await supabase
      .from("salary_slips")
      .upsert([slipToRow(slip)], { onConflict: "id" })
      .select().single();
    if (error) throw error;
    const saved = rowToSlip(data);
    const all = cache.get("payroll_salary_slips") || [];
    const updated = all.some((s) => s.id === slip.id)
      ? all.map((s) => (s.id === slip.id ? saved : s))
      : [saved, ...all];
    cache.set("payroll_salary_slips", updated);
    return saved;
  } catch (err) {
    console.warn("[supabaseService] upsertSalarySlip fallback:", err.message);
    const all = cache.get("payroll_salary_slips") || [];
    const updated = all.some((s) => s.id === slip.id)
      ? all.map((s) => (s.id === slip.id ? slip : s))
      : [slip, ...all];
    cache.set("payroll_salary_slips", updated);
    return slip;
  }
}

/* ════════════════════════════════════════════════════════════════
   ANNOUNCEMENTS
   ════════════════════════════════════════════════════════════════ */
export async function fetchAnnouncements(uid) {
  try {
    let query = supabase.from("announcements").select("*").eq("active", true).order("created_at", { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data || []).filter((a) => !a.uid || a.uid === uid);
    cache.set("payroll_announcements", data || []);
    return rows;
  } catch (err) {
    console.warn("[supabaseService] fetchAnnouncements fallback:", err.message);
    const all = cache.get("payroll_announcements") || [];
    return all.filter((a) => !a.uid || a.uid === uid);
  }
}

export async function insertAnnouncement(ann) {
  try {
    const { data, error } = await supabase.from("announcements").insert([{
      id: ann.id, uid: ann.uid || null, message: ann.message, active: ann.active !== false,
    }]).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("[supabaseService] insertAnnouncement fallback:", err.message);
    const all = cache.get("payroll_announcements") || [];
    cache.set("payroll_announcements", [...all, ann]);
    return ann;
  }
}

/* ════════════════════════════════════════════════════════════════
   CHAT MESSAGES
   ════════════════════════════════════════════════════════════════ */
export async function fetchChatMessages() {
  try {
    const { data, error } = await supabase.from("chat_messages").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    cache.set("payroll_chat_messages", data || []);
    return data || [];
  } catch (err) {
    console.warn("[supabaseService] fetchChatMessages fallback:", err.message);
    return cache.get("payroll_chat_messages") || [];
  }
}

export async function insertChatMessage(msg) {
  try {
    const { data, error } = await supabase.from("chat_messages").insert([{
      id: msg.id, sender: msg.sender, email: msg.email,
      role: msg.role, message: msg.message,
      is_request: msg.isRequest || false,
      request_type: msg.requestType || null,
      recipient_uid: msg.recipientUid || null,
    }]).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("[supabaseService] insertChatMessage fallback:", err.message);
    const all = cache.get("payroll_chat_messages") || [];
    cache.set("payroll_chat_messages", [...all, msg]);
    return msg;
  }
}

/* ════════════════════════════════════════════════════════════════
   BRANCHES
   ════════════════════════════════════════════════════════════════ */
export async function fetchBranches() {
  try {
    const { data, error } = await supabase.from("branches").select("*").order("name");
    if (error) throw error;
    cache.set("org_branches", data || []);
    return data || [];
  } catch (err) {
    console.warn("[supabaseService] fetchBranches:", err.message);
    return cache.get("org_branches") || [];
  }
}
export async function upsertBranch(row) {
  try {
    let data, error;
    if (row.id) {
      // existing — update
      ({ data, error } = await supabase.from("branches").update(row).eq("id", row.id).select().single());
    } else {
      // new — insert
      ({ data, error } = await supabase.from("branches").insert([row]).select().single());
    }
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("[supabaseService] upsertBranch:", err.message);
    return row;
  }
}
export async function deleteBranch(id) {
  try {
    const { error } = await supabase.from("branches").delete().eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.warn("[supabaseService] deleteBranch:", err.message);
  }
}

/* ════════════════════════════════════════════════════════════════
   DEPARTMENTS
   ════════════════════════════════════════════════════════════════ */
export async function fetchDepartments() {
  try {
    const { data, error } = await supabase.from("departments").select("*").order("name");
    if (error) throw error;
    cache.set("org_departments", data || []);
    return data || [];
  } catch (err) {
    console.warn("[supabaseService] fetchDepartments:", err.message);
    return cache.get("org_departments") || [];
  }
}
export async function upsertDepartment(row) {
  try {
    let data, error;
    if (row.id) {
      ({ data, error } = await supabase.from("departments").update(row).eq("id", row.id).select().single());
    } else {
      ({ data, error } = await supabase.from("departments").insert([row]).select().single());
    }
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("[supabaseService] upsertDepartment:", err.message);
    return row;
  }
}
export async function deleteDepartment(id) {
  try {
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.warn("[supabaseService] deleteDepartment:", err.message);
  }
}

/* ════════════════════════════════════════════════════════════════
   DESIGNATIONS
   ════════════════════════════════════════════════════════════════ */
export async function fetchDesignations(department) {
  try {
    let q = supabase.from("designations").select("*").order("name");
    if (department) q = q.eq("department", department);
    const { data, error } = await q;
    if (error) throw error;
    cache.set("org_designations", data || []);
    return data || [];
  } catch (err) {
    console.warn("[supabaseService] fetchDesignations:", err.message);
    const all = cache.get("org_designations") || [];
    return department ? all.filter((d) => d.department === department) : all;
  }
}
export async function upsertDesignation(row) {
  try {
    let data, error;
    if (row.id) {
      ({ data, error } = await supabase.from("designations").update(row).eq("id", row.id).select().single());
    } else {
      ({ data, error } = await supabase.from("designations").insert([row]).select().single());
    }
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("[supabaseService] upsertDesignation:", err.message);
    return row;
  }
}
export async function deleteDesignation(id) {
  try {
    const { error } = await supabase.from("designations").delete().eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.warn("[supabaseService] deleteDesignation:", err.message);
  }
}

/* ════════════════════════════════════════════════════════════════
   SHIFTS
   ════════════════════════════════════════════════════════════════ */
export async function fetchShifts() {
  try {
    const { data, error } = await supabase.from("shifts").select("*").order("name");
    if (error) throw error;
    cache.set("org_shifts", data || []);
    return data || [];
  } catch (err) {
    console.warn("[supabaseService] fetchShifts:", err.message);
    return cache.get("org_shifts") || [];
  }
}
export async function upsertShift(row) {
  try {
    let data, error;
    if (row.id) {
      ({ data, error } = await supabase.from("shifts").update(row).eq("id", row.id).select().single());
    } else {
      ({ data, error } = await supabase.from("shifts").insert([row]).select().single());
    }
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("[supabaseService] upsertShift:", err.message);
    return row;
  }
}
export async function deleteShift(id) {
  try {
    const { error } = await supabase.from("shifts").delete().eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.warn("[supabaseService] deleteShift:", err.message);
  }
}

/* ════════════════════════════════════════════════════════════════
   DOCUMENTS
   ════════════════════════════════════════════════════════════════ */
const DOC_BUCKET = "payroll-documents";

export async function uploadDocument(file, employeeUid, title) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${employeeUid}/${Date.now()}-${safe}`;
  const { error: uploadErr } = await supabase.storage
    .from(DOC_BUCKET).upload(path, file, { upsert: false, contentType: file.type });
  if (uploadErr) throw uploadErr;
  const { data: { publicUrl } } = supabase.storage.from(DOC_BUCKET).getPublicUrl(path);
  const { data, error } = await supabase.from("documents").insert([{
    uid: employeeUid, title: title || file.name,
    file_name: file.name, file_path: path,
    file_type: file.type, file_size: file.size,
    public_url: publicUrl, created_at: new Date().toISOString(),
  }]).select().single();
  if (error) throw error;
  return data;
}

export async function fetchDocuments(uid) {
  let q = supabase.from("documents").select("*").order("created_at", { ascending: false });
  if (uid) q = q.eq("uid", uid);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function deleteDocument(id, filePath) {
  await supabase.storage.from(DOC_BUCKET).remove([filePath]).catch(() => {});
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}

export function getDocumentUrl(filePath) {
  const { data: { publicUrl } } = supabase.storage.from(DOC_BUCKET).getPublicUrl(filePath);
  return publicUrl;
}

/* ════════════════════════════════════════════════════════════════
   PRIVATE CHAT
   ════════════════════════════════════════════════════════════════ */
export async function sendPrivateMessage({ sender, email, role, message, recipientUid, isRequest, requestType }) {
  const { data, error } = await supabase.from("chat_messages").insert([{
    id: Date.now(), sender, email, role, message,
    recipient_uid: recipientUid || null,
    is_request: isRequest || false,
    request_type: requestType || null,
    created_at: new Date().toISOString(),
  }]).select().single();
  if (error) throw error;
  return data;
}
