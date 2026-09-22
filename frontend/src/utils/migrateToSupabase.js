/**
 * migrateToSupabase.js
 * One-time script to export localStorage data and insert into Supabase
 * Run this once in browser console on localhost to populate Supabase
 */
import { supabase } from "../lib/supabase";

export async function migrateDataToSupabase() {
  try {
    console.log("🔄 Starting migration...");

    // Get data from localStorage
    const employees = JSON.parse(localStorage.getItem("payroll_employees") || "[]");
    const leaves = JSON.parse(localStorage.getItem("payroll_leaves") || "[]");
    const holidays = JSON.parse(localStorage.getItem("payroll_holidays") || "[]");
    const salary_slips = JSON.parse(localStorage.getItem("payroll_salary_slips") || "[]");
    const chat_messages = JSON.parse(localStorage.getItem("payroll_chat_messages") || "[]");
    const announcements = JSON.parse(localStorage.getItem("payroll_announcements") || "[]");

    // Migrate employees
    if (employees.length > 0) {
      console.log(`📥 Migrating ${employees.length} employees...`);
      const { error: empErr } = await supabase.from("employees").upsert(employees, { onConflict: "uid" });
      if (empErr) throw new Error(`Employees: ${empErr.message}`);
      console.log("✅ Employees migrated");
    }

    // Migrate leaves (convert format)
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
      const { error: lvErr } = await supabase.from("leaves").upsert(leaveRows, { onConflict: "id" });
      if (lvErr) throw new Error(`Leaves: ${lvErr.message}`);
      console.log("✅ Leaves migrated");
    }

    // Migrate holidays
    if (holidays.length > 0) {
      console.log(`📥 Migrating ${holidays.length} holidays...`);
      const { error: holErr } = await supabase.from("holidays").upsert(holidays, { onConflict: "id" });
      if (holErr) throw new Error(`Holidays: ${holErr.message}`);
      console.log("✅ Holidays migrated");
    }

    // Migrate salary slips (convert format)
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
      const { error: slipErr } = await supabase.from("salary_slips").upsert(slipRows, { onConflict: "id" });
      if (slipErr) throw new Error(`Salary slips: ${slipErr.message}`);
      console.log("✅ Salary slips migrated");
    }

    // Migrate chat messages
    if (chat_messages.length > 0) {
      console.log(`📥 Migrating ${chat_messages.length} chat messages...`);
      const { error: chatErr } = await supabase.from("chat_messages").upsert(chat_messages, { onConflict: "id" });
      if (chatErr) throw new Error(`Chat messages: ${chatErr.message}`);
      console.log("✅ Chat messages migrated");
    }

    // Migrate announcements
    if (announcements.length > 0) {
      console.log(`📥 Migrating ${announcements.length} announcements...`);
      const { error: annErr } = await supabase.from("announcements").upsert(announcements, { onConflict: "id" });
      if (annErr) throw new Error(`Announcements: ${annErr.message}`);
      console.log("✅ Announcements migrated");
    }

    console.log("✅ ✅ ✅ MIGRATION COMPLETE! All data is now in Supabase.");
    console.log("Employees:", employees.length);
    console.log("Leaves:", leaves.length);
    console.log("Holidays:", holidays.length);
    console.log("Salary slips:", salary_slips.length);
    console.log("Chat messages:", chat_messages.length);
    console.log("Announcements:", announcements.length);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  }
}

// Export for manual calling in console
window.migrateDataToSupabase = migrateDataToSupabase;
