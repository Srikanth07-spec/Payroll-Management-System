/**
 * migrateToSupabase.js
 * One-time migration: localStorage → Supabase
 * Run in browser console: migrateDataToSupabase()
 */
import { createClient } from "@supabase/supabase-js";

const supabaseDirect = createClient(
  "https://kipiktutebzswskkobvx.supabase.co",
  "sb_publishable_qCXF9Shv5QvRpJFlBNgwkg_se5BRFEy"
);

export async function migrateDataToSupabase() {
  try {
    console.log("🔄 Starting migration...");

    const employees     = JSON.parse(localStorage.getItem("payroll_employees")     || "[]");
    const leaves        = JSON.parse(localStorage.getItem("payroll_leaves")        || "[]");
    const holidays      = JSON.parse(localStorage.getItem("payroll_holidays")      || "[]");
    const salary_slips  = JSON.parse(localStorage.getItem("payroll_salary_slips")  || "[]");
    const chat_messages = JSON.parse(localStorage.getItem("payroll_chat_messages") || "[]");
    const announcements = JSON.parse(localStorage.getItem("payroll_announcements") || "[]");
    const attendance    = JSON.parse(localStorage.getItem("payroll_attendance")    || "[]");

    // ── Employees ──
    if (employees.length > 0) {
      console.log(`📥 ${employees.length} employees...`);
      const rows = employees.filter(e => e.uid).map(e => ({
        uid: e.uid, name: e.name, email: e.email, username: e.username,
        department: e.department, designation: e.designation, shift: e.shift,
        employmentType: e.employmentType, branch: e.branch, joiningDate: e.joiningDate,
        bloodGroup: e.bloodGroup, phone: e.phone, mobile: e.mobile, address: e.address,
        employeeId: e.employeeId, reportingManager: e.reportingManager, status: e.status,
        profilePic: e.profilePic, profileImage: e.profileImage,
        isAdmin: e.isAdmin, role: e.role,
        created_at: e.created_at || new Date().toISOString(),
      }));
      await supabaseDirect.from("employees").delete().neq("uid","__none__");
      const { error } = await supabaseDirect.from("employees").insert(rows);
      if (error) throw new Error(`Employees: ${error.message}`);
      console.log("✅ Employees done");
    }

    // ── Leaves ──
    if (leaves.length > 0) {
      console.log(`📥 ${leaves.length} leaves...`);
      const rows = leaves.map(l => ({
        id: l.id, employee: l.employee,
        employee_email: l.employeeEmail,
        employee_uid: l.employeeUid || l.uid,
        employee_id: l.employeeId,
        type: l.type, from_date: l.from, to_date: l.to,
        reason: l.reason, status: l.status,
        admin_note: l.adminNote || "",
        submitted_at: l.submittedAt,
        reviewed_at: l.reviewedAt || null,
      }));
      await supabaseDirect.from("leaves").delete().neq("id", 0);
      const { error } = await supabaseDirect.from("leaves").insert(rows);
      if (error) throw new Error(`Leaves: ${error.message}`);
      console.log("✅ Leaves done");
    }

    // ── Holidays ──
    if (holidays.length > 0) {
      console.log(`📥 ${holidays.length} holidays...`);
      await supabaseDirect.from("holidays").delete().neq("id", 0);
      const { error } = await supabaseDirect.from("holidays").insert(
        holidays.map(h => ({ id: h.id, name: h.name, date: h.date, day: h.day, type: h.type }))
      );
      if (error) throw new Error(`Holidays: ${error.message}`);
      console.log("✅ Holidays done");
    }

    // ── Salary Slips ──
    if (salary_slips.length > 0) {
      console.log(`📥 ${salary_slips.length} salary slips...`);
      const rows = salary_slips.map(s => ({
        id: s.id, uid: s.uid, employee: s.employee, username: s.username,
        employee_id: s.employeeId, department: s.department,
        designation: s.designation, employment_type: s.employmentType,
        month: s.month, year: s.year, basic: s.basic,
        allowances: s.allowances, deductions: s.deductions,
        gross: s.gross, net: s.net, created_at: s.createdAt,
      }));
      await supabaseDirect.from("salary_slips").delete().neq("id", 0);
      const { error } = await supabaseDirect.from("salary_slips").insert(rows);
      if (error) throw new Error(`Salary slips: ${error.message}`);
      console.log("✅ Salary slips done");
    }

    // ── Announcements ──
    if (announcements.length > 0) {
      console.log(`📥 ${announcements.length} announcements...`);
      await supabaseDirect.from("announcements").delete().neq("id", 0);
      const { error } = await supabaseDirect.from("announcements").insert(
        announcements.map(a => ({ id: a.id, uid: a.uid || null, message: a.message, active: a.active !== false }))
      );
      if (error) throw new Error(`Announcements: ${error.message}`);
      console.log("✅ Announcements done");
    }

    // ── Attendance ──
    if (attendance.length > 0) {
      console.log(`📥 ${attendance.length} attendance records...`);
      await supabaseDirect.from("attendance").delete().neq("id", 0);
      const { error } = await supabaseDirect.from("attendance").insert(attendance);
      if (error) throw new Error(`Attendance: ${error.message}`);
      console.log("✅ Attendance done");
    }

    console.log("✅✅✅ MIGRATION COMPLETE!");
    alert(`✅ Migration complete!\n\nEmployees: ${employees.length}\nLeaves: ${leaves.length}\nHolidays: ${holidays.length}\nSalary Slips: ${salary_slips.length}\nAttendance: ${attendance.length}\n\nRefresh Vercel to see your data!`);

  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    alert(`❌ Error: ${err.message}`);
  }
}

window.migrateDataToSupabase = migrateDataToSupabase;
