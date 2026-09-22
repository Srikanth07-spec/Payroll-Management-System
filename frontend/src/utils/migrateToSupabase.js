/**
 * migrateToSupabase.js
 * Complete migration: export localStorage → Supabase
 * Run: window.exportAllData() to see what will be migrated
 * Run: window.migrateDataToSupabase() to actually migrate
 */
import { supabase } from "../lib/supabase";

export async function exportAllData() {
  const keys = Object.keys(localStorage);
  const data = {};
  keys.forEach(k => {
    data[k] = localStorage.getItem(k);
  });
  console.log("📊 ALL LOCALSTORAGE DATA:", data);
  copy(JSON.stringify(data, null, 2));
  alert(`Exported ${keys.length} items to clipboard!`);
  return data;
}

export async function migrateDataToSupabase() {
  try {
    console.log("🔄 Starting comprehensive migration...");

    // Get ALL localStorage data
    const employees = JSON.parse(localStorage.getItem("payroll_employees") || "[]");
    const leaves = JSON.parse(localStorage.getItem("payroll_leaves") || "[]");
    const holidays = JSON.parse(localStorage.getItem("payroll_holidays") || "[]");
    const salary_slips = JSON.parse(localStorage.getItem("payroll_salary_slips") || "[]");
    const chat_messages = JSON.parse(localStorage.getItem("payroll_chat_messages") || "[]");
    const announcements = JSON.parse(localStorage.getItem("payroll_announcements") || "[]");
    const attendance = JSON.parse(localStorage.getItem("payroll_attendance") || "[]");

    // Migrate employees (including profile pics/images)
    if (employees.length > 0) {
      console.log(`📥 Migrating ${employees.length} employees...`);
      const { error: empErr } = await supabase.from("employees").insert(employees);
      if (empErr) {
        console.error("Employee error:", empErr);
        throw new Error(`Employees: ${empErr.message}`);
      }
      console.log("✅ Employees migrated");
    }

    // Migrate leaves
    if (leaves.length > 0) {
      console.log(`📥 Migrating ${leaves.length} leaves...`);
      const leaveRows = leaves.map((l) => ({
        id: l.id,
        employee: l.employee,
        employee_email: l.employeeEmail,
        employee_uid: l.employeeUid || l.uid,
        employee_id: l.employeeId,
        type: l.type,
        from_date: l.from,
        to_date: l.to,
        reason: l.reason,
        status: l.status,
        admin_note: l.adminNote || "",
        submitted_at: l.submittedAt,
        reviewed_at: l.reviewedAt,
      }));
      const { error: lvErr } = await supabase.from("leaves").insert(leaveRows);
      if (lvErr) throw new Error(`Leaves: ${lvErr.message}`);
      console.log("✅ Leaves migrated");
    }

    // Migrate holidays
    if (holidays.length > 0) {
      console.log(`📥 Migrating ${holidays.length} holidays...`);
      const { error: holErr } = await supabase.from("holidays").insert(holidays);
      if (holErr) throw new Error(`Holidays: ${holErr.message}`);
      console.log("✅ Holidays migrated");
    }

    // Migrate salary slips
    if (salary_slips.length > 0) {
      console.log(`📥 Migrating ${salary_slips.length} salary slips...`);
      const slipRows = salary_slips.map((s) => ({
        id: s.id,
        uid: s.uid,
        employee: s.employee,
        username: s.username,
        employee_id: s.employeeId,
        department: s.department,
        designation: s.designation,
        employment_type: s.employmentType,
        month: s.month,
        year: s.year,
        basic: s.basic,
        allowances: s.allowances,
        deductions: s.deductions,
        gross: s.gross,
        net: s.net,
        created_at: s.createdAt,
      }));
      const { error: slipErr } = await supabase.from("salary_slips").insert(slipRows);
      if (slipErr) throw new Error(`Salary slips: ${slipErr.message}`);
      console.log("✅ Salary slips migrated");
    }

    // Migrate chat messages
    if (chat_messages.length > 0) {
      console.log(`📥 Migrating ${chat_messages.length} chat messages...`);
      const { error: chatErr } = await supabase.from("chat_messages").insert(chat_messages);
      if (chatErr) throw new Error(`Chat messages: ${chatErr.message}`);
      console.log("✅ Chat messages migrated");
    }

    // Migrate announcements
    if (announcements.length > 0) {
      console.log(`📥 Migrating ${announcements.length} announcements...`);
      const { error: annErr } = await supabase.from("announcements").insert(announcements);
      if (annErr) throw new Error(`Announcements: ${annErr.message}`);
      console.log("✅ Announcements migrated");
    }

    // Migrate attendance
    if (attendance.length > 0) {
      console.log(`📥 Migrating ${attendance.length} attendance records...`);
      const { error: attErr } = await supabase.from("attendance").insert(attendance);
      if (attErr) throw new Error(`Attendance: ${attErr.message}`);
      console.log("✅ Attendance records migrated");
    }

    console.log("✅ ✅ ✅ MIGRATION COMPLETE!");
    console.log(`
📊 Summary:
  • Employees: ${employees.length}
  • Leaves: ${leaves.length}
  • Holidays: ${holidays.length}
  • Salary slips: ${salary_slips.length}
  • Chat messages: ${chat_messages.length}
  • Announcements: ${announcements.length}
  • Attendance: ${attendance.length}
    `);
    alert("✅ Migration complete! Refresh Vercel to see data.");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    alert(`❌ Migration error: ${err.message}`);
  }
}

// Expose to window
window.exportAllData = exportAllData;
window.migrateDataToSupabase = migrateDataToSupabase;
