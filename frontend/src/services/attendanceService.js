/**
 * attendanceService.js
 *
 * Permanent attendance storage via Supabase.
 * localStorage is used as a fast read-cache only — Supabase is
 * always the source of truth.
 *
 * Table: public.attendance
 * Columns: id, uid, employee_id, employee_name, email,
 *          date_key, date_display, check_in, check_out,
 *          status, action, source, created_at, updated_at
 */

import { supabase } from "../lib/supabase";

const LOCAL_KEY = "payroll_attendance";

/* ── local cache helpers ── */
function cacheGet() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); }
  catch { return []; }
}
function cacheSet(rows) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
}

/* ── map Supabase row → app record ── */
function fromRow(row) {
  return {
    id:          row.id,
    uid:         row.uid,
    employeeId:  row.employee_id,
    employee:    row.employee_name,
    email:       row.email,
    dateKey:     row.date_key,
    date:        row.date_display,
    checkIn:     row.check_in,
    checkOut:    row.check_out,
    status:      row.status,
    action:      row.action,
    source:      row.source,
    createdAt:   row.created_at,
  };
}

/* ── map app record → Supabase row ── */
function toRow(rec) {
  return {
    uid:           rec.uid,
    employee_id:   rec.employeeId   || null,
    employee_name: rec.employee     || null,
    email:         rec.email        || null,
    date_key:      rec.dateKey,
    date_display:  rec.date         || null,
    check_in:      rec.checkIn      || null,
    check_out:     rec.checkOut     || null,
    status:        rec.status       || "Present",
    action:        rec.action       || null,
    source:        rec.source       || null,
  };
}

/* ════════════════════════════════════════════════════════
   PUBLIC API
   ════════════════════════════════════════════════════════ */

/**
 * Fetch all attendance records for a given uid.
 * Updates local cache on success.
 */
export async function fetchAttendance(uid) {
  try {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("uid", uid)
      .order("date_key", { ascending: false });

    if (error) throw error;

    const records = (data || []).map(fromRow);

    /* refresh local cache with authoritative Supabase data */
    const allCached   = cacheGet().filter((r) => r.uid !== uid);
    cacheSet([...allCached, ...records]);

    return records;
  } catch (err) {
    console.warn("[attendanceService] fetchAttendance fallback to cache:", err.message);
    /* fallback: return cached records for this uid */
    return cacheGet().filter((r) => r.uid === uid);
  }
}

/**
 * Save a new check-in record.
 * Removes any existing Absent record for the same uid+dateKey first.
 * Returns the saved record.
 */
export async function saveCheckIn(rec) {
  try {
    /* 1 — delete any existing Absent record for same uid+dateKey */
    await supabase
      .from("attendance")
      .delete()
      .eq("uid",      rec.uid)
      .eq("date_key", rec.dateKey)
      .eq("status",   "Absent");

    /* 2 — insert new Present/check-in record */
    const { data, error } = await supabase
      .from("attendance")
      .insert([toRow(rec)])
      .select()
      .single();

    if (error) throw error;

    const saved = fromRow(data);

    /* update local cache */
    const cached = cacheGet()
      .filter((r) => !(r.uid === rec.uid && r.dateKey === rec.dateKey && r.status === "Absent"));
    cacheSet([...cached, saved]);

    return saved;
  } catch (err) {
    console.warn("[attendanceService] saveCheckIn fallback to cache:", err.message);

    /* fallback: write to localStorage only */
    const cached = cacheGet()
      .filter((r) => !(r.uid === rec.uid && r.dateKey === rec.dateKey && r.status === "Absent"));
    const local = { ...rec, id: Date.now() };
    cacheSet([...cached, local]);
    return local;
  }
}

/**
 * Save check-out time onto the existing check-in record for uid+dateKey.
 * Returns the updated record.
 */
export async function saveCheckOut(uid, dateKey, checkOutTime) {
  try {
    const { data, error } = await supabase
      .from("attendance")
      .update({ check_out: checkOutTime, action: "Logout", updated_at: new Date().toISOString() })
      .eq("uid",      uid)
      .eq("date_key", dateKey)
      .eq("status",   "Present")
      .is("check_out", null)
      .select()
      .single();

    if (error) throw error;

    const saved = fromRow(data);

    /* update local cache */
    const cached = cacheGet().map((r) => {
      if (r.uid === uid && r.dateKey === dateKey && r.status === "Present" && !r.checkOut)
        return { ...r, checkOut: checkOutTime, action: "Logout" };
      return r;
    });
    cacheSet(cached);

    return saved;
  } catch (err) {
    console.warn("[attendanceService] saveCheckOut fallback to cache:", err.message);

    const cached = cacheGet().map((r) => {
      if (r.uid === uid && r.dateKey === dateKey && r.status === "Present" && !r.checkOut)
        return { ...r, checkOut: checkOutTime, action: "Logout" };
      return r;
    });
    cacheSet(cached);
    return cached.find((r) => r.uid === uid && r.dateKey === dateKey) || null;
  }
}

/**
 * Save a self-reported Absent record (no verification required).
 * Does NOT overwrite an existing Present record.
 */
export async function saveAbsent(rec) {
  try {
    /* check if Present already exists for this day */
    const { data: existing } = await supabase
      .from("attendance")
      .select("id")
      .eq("uid",      rec.uid)
      .eq("date_key", rec.dateKey)
      .eq("status",   "Present")
      .maybeSingle();

    if (existing) return null; /* Present takes priority — don't overwrite */

    /* check if Absent already exists */
    const { data: alreadyAbsent } = await supabase
      .from("attendance")
      .select("id")
      .eq("uid",      rec.uid)
      .eq("date_key", rec.dateKey)
      .eq("status",   "Absent")
      .maybeSingle();

    if (alreadyAbsent) return null;

    const { data, error } = await supabase
      .from("attendance")
      .insert([toRow(rec)])
      .select()
      .single();

    if (error) throw error;

    const saved = fromRow(data);
    cacheSet([...cacheGet(), saved]);
    return saved;
  } catch (err) {
    console.warn("[attendanceService] saveAbsent fallback to cache:", err.message);
    const cached = cacheGet();
    const alreadyPresent = cached.find(
      (r) => r.uid === rec.uid && r.dateKey === rec.dateKey && r.status === "Present"
    );
    if (alreadyPresent) return null;
    const alreadyAbsent = cached.find(
      (r) => r.uid === rec.uid && r.dateKey === rec.dateKey && r.status === "Absent"
    );
    if (alreadyAbsent) return null;
    const local = { ...rec, id: Date.now() };
    cacheSet([...cached, local]);
    return local;
  }
}

/**
 * Get all attendance records for admin view (all employees).
 * Falls back to full local cache if Supabase fails.
 */
export async function fetchAllAttendance() {
  try {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .order("date_key", { ascending: false });

    if (error) throw error;
    return (data || []).map(fromRow);
  } catch (err) {
    console.warn("[attendanceService] fetchAllAttendance fallback:", err.message);
    return cacheGet();
  }
}
