import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as faceapi from "@vladmandic/face-api";
import {
  AlertTriangle, CalendarDays, Camera, CheckCircle2,
  Clock3, LogIn, LogOut, MapPin, ShieldCheck,
  UserCheck, XCircle, ScanFace,
} from "lucide-react";
import { getEmployeeByUid } from "../shared/payrollData";
import {
  fetchAttendance,
  saveCheckIn,
  saveCheckOut,
  saveAbsent,
} from "../../services/attendanceService";
import "../Dashboard.css";

/* ─────────────────────────────────────────────────────────────
   VVIT campus geofence — DO NOT CHANGE
   ───────────────────────────────────────────────────────────── */
const CAMPUS = {
  name: "VVIT University, Nambur",
  latitude: 16.3400,
  longitude: 80.4908,
  radiusMeters: 9000,
};

/* Face-recognition config
   ─────────────────────────────────────────────────────────────
   FACE_MATCH_THRESHOLD:
     face-api.js Euclidean distance between two face descriptors.
     Lower = stricter. Typical same-person: 0.2–0.4. Different
     people: 0.5–0.9. We use 0.42 — tight enough to reject
     different people, loose enough for lighting variation.
   CONSECUTIVE_MATCHES:
     Number of consecutive frames that must pass before confirming.
     3 frames × 700 ms = ~2.1 seconds of confirmed identity.
   REF_MIN_CONFIDENCE:
     Minimum face detection confidence required on the Admin's
     registered photo. Low confidence = blurry/partial face =
     noisy descriptor = false matches.
   LIVE_MIN_CONFIDENCE:
     Minimum confidence on each live camera frame.
   ───────────────────────────────────────────────────────────── */
const FACE_MATCH_THRESHOLD = 0.42;   // strict — rejects different people
const CONSECUTIVE_MATCHES  = 3;      // 3 consecutive frames required (~2 sec)
const SCAN_INTERVAL_MS     = 700;    // scan every 700 ms
const REF_MIN_CONFIDENCE   = 0.7;    // registered photo must have clear face
const LIVE_MIN_CONFIDENCE  = 0.65;   // live frame must have clear face
const MODELS_URL           = "/models";

/* ── Haversine — DO NOT CHANGE ── */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Date helpers ── */
function todayKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}
function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function fmtDate(key) {
  if (!key) return "—";
  const [y, m, d] = key.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

/* ─────────────────────────────────────────────────────────────
   Get face descriptor from the Admin-registered photo.
   Uses off-screen canvas for correct tensor decoding.
   Uses REF_MIN_CONFIDENCE so a blurry/partial reference photo
   is rejected rather than producing a noisy descriptor that
   would then incorrectly match other people.
   ───────────────────────────────────────────────────────────── */
async function descriptorFromSrc(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width  = img.naturalWidth  || 320;
        canvas.height = img.naturalHeight || 320;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

        const det = await faceapi
          .detectSingleFace(
            canvas,
            new faceapi.SsdMobilenetv1Options({ minConfidence: REF_MIN_CONFIDENCE })
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!det) {
          reject(new Error("NO_FACE"));
          return;
        }

        /* Extra quality guard: confidence must be high enough */
        if (det.detection.score < REF_MIN_CONFIDENCE) {
          reject(new Error("LOW_QUALITY"));
          return;
        }

        console.info(
          `[FaceRef] Registered photo descriptor computed.` +
          ` Detection score: ${det.detection.score.toFixed(3)}.` +
          ` Descriptor[0..3]: ${Array.from(det.descriptor).slice(0, 4).map((v) => v.toFixed(3)).join(", ")}`
        );

        resolve(det.descriptor);
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error("IMG_LOAD"));
    img.src = src;
  });
}

/* ── Step indicator ── */
function VerifyStep({ num, label, sub, state }) {
  const C = {
    success: { bg: "#ecfdf5", border: "#86efac", text: "#15803d" },
    error:   { bg: "#fff1f2", border: "#fca5a5", text: "#dc2626" },
    active:  { bg: "#eff6ff", border: "#93c5fd", text: "#2563eb" },
    idle:    { bg: "#f8fafc", border: "#e2e8f0", text: "#94a3b8" },
  }[state] || { bg: "#f8fafc", border: "#e2e8f0", text: "#94a3b8" };
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 14px", borderRadius: 12, background: C.bg, border: `1px solid ${C.border}` }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.text, color: "white", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12, flexShrink: 0, marginTop: 1 }}>
        {state === "success" ? <CheckCircle2 size={14} /> : state === "error" ? <XCircle size={14} /> : num}
      </div>
      <div>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text, display: "block" }}>{label}</span>
        {sub && <span style={{ fontSize: 11, color: C.text, opacity: 0.85, lineHeight: 1.4 }}>{sub}</span>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function EmployeeAttendance({ currentUser }) {
  const profile         = getEmployeeByUid(currentUser?.uid);
  const empName         = profile?.name || currentUser?.displayName || currentUser?.email?.split("@")[0] || "Employee";
  const employeeId      = profile?.employeeId || profile?.id || "N/A";
  const registeredPhoto = profile?.profilePic || profile?.profileImage || null;

  /* live clock */
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Attendance records — loaded from Supabase (permanent) ── */
  const [allRecords, setAllRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const reload = useCallback(async () => {
    if (!currentUser?.uid) return;
    setLoadingRecords(true);
    try {
      const records = await fetchAttendance(currentUser.uid);
      setAllRecords(records);
    } catch {
      /* fetchAttendance already falls back to cache internally */
    } finally {
      setLoadingRecords(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    reload();
  }, [reload]);

  /* ── Today's record — Present always wins over Absent ── */
  const today       = todayKey();
  const todayRecord = useMemo(() => {
    const todays = allRecords.filter((r) => r.dateKey === today);
    return (
      todays.find((r) => r.status === "Present") ||
      todays.find((r) => r.checkIn) ||
      todays[0] ||
      null
    );
  }, [allRecords, today]);

  /* How many actions today: 0 = none, 1 = checked-in, 2 = checked-out */
  const actionsTakenToday = useMemo(() => {
    if (!todayRecord || todayRecord.status === "Absent") return 0;
    if (todayRecord.checkIn && todayRecord.checkOut) return 2;
    if (todayRecord.checkIn) return 1;
    return 0;
  }, [todayRecord]);

  const isCheckedIn = actionsTakenToday === 1;
  const isDone      = actionsTakenToday >= 2;

  /* ── Face-API models ── */
  const modelsLoadedRef = useRef(false);
  const [modelsLoading, setModelsLoading] = useState(false);

  /* ── Camera ── */
  const videoRef       = useRef(null);
  const streamRef      = useRef(null);
  const scanLoopRef    = useRef(null);
  const refDescRef     = useRef(null);
  const consecutiveRef = useRef(0);
  const scanActiveRef  = useRef(false);

  const [camState,  setCamState]  = useState("idle");
  const [scanState, setScanState] = useState("idle");
  const [scanMsg,   setScanMsg]   = useState("");
  const [scanPct,   setScanPct]   = useState(0);

  /* ── Step states ── */
  const [locState,  setLocState]  = useState("idle");
  const [locSub,    setLocSub]    = useState("");
  const [faceState, setFaceState] = useState("idle");
  const [faceSub,   setFaceSub]   = useState("");

  /* ── Phase ── */
  const [phase, setPhase] = useState("idle"); // idle | locating | scanning | done
  const [busy,  setBusy]  = useState(false);

  const [toast, setToast] = useState({ msg: "", ok: true });
  const showToast = useCallback((msg, ok = false) => {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: "", ok: true }), 5000);
  }, []);

  useEffect(() => () => { stopScanLoop(); stopCamera(); }, []);

  /* ── Load face-api models once per session ── */
  async function ensureModels() {
    if (modelsLoadedRef.current) return true;
    if (modelsLoading) {
      await new Promise((r) => {
        const t = setInterval(() => { if (modelsLoadedRef.current) { clearInterval(t); r(); } }, 200);
      });
      return true;
    }
    setModelsLoading(true);
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
      ]);
      modelsLoadedRef.current = true;
      setModelsLoading(false);
      return true;
    } catch {
      setModelsLoading(false);
      showToast("Failed to load face AI models. Check internet connection.");
      return false;
    }
  }

  /* ── Camera helpers ── */
  async function startCamera() {
    if (streamRef.current) return true;
    setCamState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamState("ready");
      return true;
    } catch (err) {
      setCamState("error");
      showToast(err?.name === "NotAllowedError" ? "Camera permission denied." : "Cannot open camera.");
      return false;
    }
  }

  function stopCamera() {
    stopScanLoop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamState("idle");
    refDescRef.current    = null;
    consecutiveRef.current = 0;
    scanActiveRef.current  = false;
  }

  function stopScanLoop() {
    if (scanLoopRef.current) { clearInterval(scanLoopRef.current); scanLoopRef.current = null; }
    scanActiveRef.current = false;
  }

  /* ── Single scan frame ── */
  async function doScanFrame(refDesc, onMatch) {
    if (scanActiveRef.current) return;
    if (!videoRef.current || !streamRef.current) return;
    scanActiveRef.current = true;
    try {
      /* Detect ALL faces with strict confidence so partial/blurry faces
         are not accidentally accepted as a valid identity */
      const detections = await faceapi
        .detectAllFaces(
          videoRef.current,
          new faceapi.SsdMobilenetv1Options({ minConfidence: LIVE_MIN_CONFIDENCE })
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        consecutiveRef.current = 0;
        setScanState("noface");
        setScanMsg("No face detected. Position your face clearly in the camera.");
        setScanPct(0);

      } else if (detections.length > 1) {
        consecutiveRef.current = 0;
        setScanState("multiface");
        setScanMsg("Multiple faces detected. Only the registered employee should be visible.");
        setScanPct(0);

      } else {
        /* CRITICAL: compare ONLY against the CURRENT EMPLOYEE'S registered
           descriptor (refDesc). Never compare against any other employee.
           refDesc was computed exclusively from the Admin-uploaded photo
           of the currently logged-in employee. */
        const dist = faceapi.euclideanDistance(refDesc, detections[0].descriptor);
        const pct  = Math.max(0, Math.round((1 - dist) * 100));
        setScanPct(pct);

        /* Log every frame to browser console for debugging */
        console.debug(
          `[FaceScan] dist=${dist.toFixed(4)} | pct=${pct}% | ` +
          `threshold=${FACE_MATCH_THRESHOLD} | ` +
          `${dist <= FACE_MATCH_THRESHOLD ? "MATCH" : "NO MATCH"} | ` +
          `consecutive=${consecutiveRef.current}`
        );

        if (dist <= FACE_MATCH_THRESHOLD) {
          consecutiveRef.current += 1;
          setScanState("scanning");
          setScanMsg(
            `Verifying identity… (${consecutiveRef.current}/${CONSECUTIVE_MATCHES} confirmed, ${pct}% similarity)`
          );

          if (consecutiveRef.current >= CONSECUTIVE_MATCHES) {
            stopScanLoop();
            setScanState("matched");
            setScanMsg(`Identity confirmed — face matched! (${pct}% similarity)`);
            setFaceState("success");
            setFaceSub(`Identity confirmed — ${pct}% match with Admin-registered photo.`);
            console.info(`[FaceScan] MATCH confirmed after ${CONSECUTIVE_MATCHES} consecutive frames. dist=${dist.toFixed(4)}`);
            onMatch(pct);
          }
        } else {
          /* Face detected but does NOT match the registered employee */
          consecutiveRef.current = 0;
          setScanState("nomatch");
          setScanMsg(
            `Face does not match the registered employee (${pct}% similarity, need ${Math.round((1 - FACE_MATCH_THRESHOLD) * 100)}%+). ` +
            `Try better lighting or move closer.`
          );
        }
      }
    } catch (err) {
      console.warn("[FaceScan] Frame error:", err.message);
      /* skip bad frame silently */
    } finally {
      scanActiveRef.current = false;
    }
  }

  function startScanLoop(refDesc, onMatch) {
    stopScanLoop();
    consecutiveRef.current = 0;
    setScanState("scanning");
    setScanMsg("Scanning — please look at the camera…");
    scanLoopRef.current = setInterval(() => doScanFrame(refDesc, onMatch), SCAN_INTERVAL_MS);
  }

  /* ── Location check — DO NOT CHANGE ── */
  async function verifyLocation() {
    setLocState("active"); setLocSub("Requesting GPS location…");
    if (!navigator.geolocation) {
      setLocState("error"); setLocSub("Geolocation not supported."); return false;
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const dist = Math.round(haversine(
            pos.coords.latitude, pos.coords.longitude,
            CAMPUS.latitude, CAMPUS.longitude
          ));
          if (dist <= CAMPUS.radiusMeters) {
            setLocState("success");
            setLocSub(`Inside ${CAMPUS.name} — ${dist} m from campus centre.`);
            resolve(true);
          } else {
            setLocState("error");
            setLocSub(`You are ${dist} m away. Must be within ${CAMPUS.radiusMeters / 1000} km.`);
            resolve(false);
          }
        },
        (err) => {
          setLocState("error");
          setLocSub({ 1: "Location permission denied.", 2: "Location unavailable.", 3: "Location timed out." }[err.code] || "Location error.");
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }

  /* ── Core verification (location → models → camera → face scan) ── */
  async function runVerification(onMatch) {
    setBusy(true);
    setPhase("locating");
    setLocState("idle"); setLocSub("");
    setFaceState("idle"); setFaceSub("");
    setScanState("idle"); setScanMsg(""); setScanPct(0);
    stopScanLoop();

    /* 1 — Location */
    const locOk = await verifyLocation();
    if (!locOk) { setBusy(false); setPhase("idle"); return; }

    /* 2 — Models */
    setFaceState("active"); setFaceSub("Loading face AI models…"); setPhase("scanning");
    const modOk = await ensureModels();
    if (!modOk) { setFaceState("error"); setFaceSub("Models failed to load."); setBusy(false); setPhase("idle"); return; }

    /* 3 — Registered photo */
    if (!registeredPhoto) {
      setFaceState("error"); setFaceSub("No face photo registered. Ask Admin to upload your photo.");
      setBusy(false); setPhase("idle"); return;
    }

    /* 4 — Camera */
    setFaceSub("Opening camera…");
    const camOk = await startCamera();
    if (!camOk) { setFaceState("error"); setFaceSub("Camera not available."); setBusy(false); setPhase("idle"); return; }

    /* 5 — Compute registered photo descriptor fresh every verification.
           IMPORTANT: We always recompute from the Admin-uploaded photo of
           the CURRENT logged-in employee. We never use a cached descriptor
           because the photo may have changed, or the previous descriptor
           may have been computed from a different employee's session. */
    setFaceSub("Analysing registered face photo…");
    refDescRef.current = null; // always clear — never reuse stale descriptor
    try {
      refDescRef.current = await descriptorFromSrc(registeredPhoto);
    } catch (e) {
      setFaceState("error");
      if (e.message === "NO_FACE") {
        setFaceSub(
          "No face detected in the registered photo. " +
          "Ask Admin to upload a clear, well-lit, front-facing photo of this employee."
        );
      } else if (e.message === "LOW_QUALITY") {
        setFaceSub(
          "Registered photo quality is too low. " +
          "Ask Admin to upload a clearer photo."
        );
      } else {
        setFaceSub("Could not read the registered photo. Ask Admin to re-upload it.");
      }
      setBusy(false); setPhase("idle"); return;
    }

    /* 6 — Stabilise camera, then start continuous scan */
    await new Promise((r) => setTimeout(r, 1000));
    setFaceSub("Scanning your face — look at the camera…");
    startScanLoop(refDescRef.current, onMatch);
  }

  /* ══════════════════════════════════════════════════════════════
     TIME WINDOW HELPERS
     Morning check-in:  08:00 – 09:00
     Evening check-out: 17:00 – 17:30
     ══════════════════════════════════════════════════════════════ */
  function getAttendanceWindow() {
    const n = new Date();
    const totalMin = n.getHours() * 60 + n.getMinutes();
    const inMorning  = totalMin >= 8 * 60  && totalMin < 12 * 60;
    const inEvening  = totalMin >= 17 * 60 && totalMin < 17 * 60 + 30;
    return { inMorning, inEvening };
  }

  function windowMessage(action) {
    const n = new Date();
    const totalMin = n.getHours() * 60 + n.getMinutes();
    if (action === "checkIn") {
      if (totalMin < 8 * 60)   return "Morning attendance opens at 08:00 AM.";
      if (totalMin >= 12 * 60) return "Morning attendance window has ended (08:00 AM–12:00 PM).";
    }
    if (action === "checkOut") {
      if (totalMin < 17 * 60)       return "Evening check-out opens at 05:00 PM.";
      if (totalMin >= 17 * 60 + 30) return "Evening check-out window has ended (05:00–05:30 PM).";
    }
    return null;
  }

  /* ══════════════════════════════════════════════════════════════
     CHECK ATTENDANCE — single button, max 2 uses per day
     1st press = Check In (saved to Supabase as Present)
     2nd press = Check Out (updated in Supabase)
     After 2 uses → locked until midnight
     ══════════════════════════════════════════════════════════════ */
  async function handleCheckAttendance() {
    if (isDone || busy) return;

    const { inMorning, inEvening } = getAttendanceWindow();

    if (!isCheckedIn) {
      /* ── FIRST PRESS: CHECK IN — must be in morning window ── */
      const blocked = windowMessage("checkIn");
      if (blocked) { showToast(blocked); return; }
      if (!inMorning) { showToast("Morning attendance is available 08:00 AM–12:00 PM only."); return; }

      await runVerification(async (matchPct) => {
        const now    = new Date();
        const newRec = {
          uid:        currentUser.uid,
          employeeId,
          employee:   empName,
          email:      currentUser.email || "",
          dateKey:    today,
          date:       now.toLocaleDateString("en-IN"),
          checkIn:    now.toISOString(),
          checkOut:   null,
          status:     "Present",
          action:     "Login",
          source:     `Location + Face Match (${matchPct}%)`,
        };

        await saveCheckIn(newRec);
        await reload();
        stopCamera();
        setPhase("done");
        setBusy(false);
        showToast("✓ Face matched! Check-in recorded — Present.", true);
      });

    } else {
      /* ── SECOND PRESS: CHECK OUT — must be in evening window ── */
      const blocked = windowMessage("checkOut");
      if (blocked) { showToast(blocked); return; }
      if (!inEvening) { showToast("Evening check-out is available 05:00–05:30 PM only."); return; }

      await runVerification(async () => {
        const checkOutTime = new Date().toISOString();

        /* Update Supabase record permanently */
        await saveCheckOut(currentUser.uid, today, checkOutTime);

        /* Reload from Supabase */
        await reload();

        stopCamera();
        setPhase("done");
        setBusy(false);
        showToast("✓ Check-out recorded.", true);
      });
    }
  }

  /* ── Mark Absent (no verification — writes to Supabase) ── */
  async function handleMarkAbsent() {
    if (!currentUser?.uid) return;
    if (isCheckedIn || isDone) {
      showToast("Already checked in today. Cannot mark absent."); return;
    }
    const rec = {
      uid:        currentUser.uid,
      employeeId,
      employee:   empName,
      email:      currentUser.email || "",
      dateKey:    today,
      date:       new Date().toLocaleDateString("en-IN"),
      checkIn:    null,
      checkOut:   null,
      status:     "Absent",
      action:     "Absent",
      source:     "Self-report",
    };
    const saved = await saveAbsent(rec);
    if (!saved) { showToast("Already marked for today."); return; }
    await reload();
    showToast("Marked absent for today.");
  }

  /* ── Cancel scan ── */
  function handleCancel() {
    stopScanLoop(); stopCamera();
    setPhase("idle"); setBusy(false);
    setLocState("idle"); setLocSub("");
    setFaceState("idle"); setFaceSub("");
    setScanState("idle"); setScanMsg(""); setScanPct(0);
  }

  /* ── History — deduplicated by day, Present always wins ── */
  const historyRows = useMemo(() => {
    const byDay = new Map();
    for (const r of allRecords) {
      if (!byDay.has(r.dateKey)) {
        byDay.set(r.dateKey, { ...r });
      } else {
        const ex = byDay.get(r.dateKey);
        if (r.status === "Present" && ex.status !== "Present") {
          byDay.set(r.dateKey, { ...r });
        } else if (ex.status === "Present" && !ex.checkOut && r.checkOut) {
          byDay.set(r.dateKey, { ...ex, checkOut: r.checkOut });
        }
      }
    }
    return [...byDay.values()].sort((a, b) => String(b.dateKey).localeCompare(String(a.dateKey)));
  }, [allRecords]);

  const presentDays = historyRows.filter((r) => r.status === "Present").length;
  const isScanning  = phase === "scanning";

  const scanOverlay = {
    noface:    { color: "#f59e0b", border: "#fcd34d", label: "👁 No face detected" },
    multiface: { color: "#ef4444", border: "#fca5a5", label: "⚠ Multiple faces" },
    scanning:  { color: "#3b82f6", border: "#93c5fd", label: "🔍 Scanning…" },
    nomatch:   { color: "#ef4444", border: "#fca5a5", label: "✗ Face does not match" },
    matched:   { color: "#22c55e", border: "#86efac", label: "✓ Face matched!" },
    idle:      { color: "#64748b", border: "#e2e8f0", label: "" },
  }[scanState] || { color: "#64748b", border: "#e2e8f0", label: "" };

  const btnLabel = (() => {
    if (phase === "locating") return "Checking location…";
    if (phase === "scanning") return "Scanning face — stay still…";
    if (isDone)               return "Attendance Complete for Today ✓";
    if (isCheckedIn) {
      const { inEvening } = getAttendanceWindow();
      return inEvening ? "Check Out (Evening Window Open)" : "Check Out (available 05:00–05:30 PM)";
    }
    const { inMorning } = getAttendanceWindow();
    return inMorning ? "Check Attendance (Morning Window Open)" : "Check Attendance (available 08:00 AM–12:00 PM)";
  })();

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ paddingBottom: 40 }}>

      {/* HEADER */}
      <div className="welcome-row">
        <div>
          <div className="page-eyebrow">EMPLOYEE SERVICES</div>
          <h1>Attendance</h1>
          <p>Location + face match → automatic Present. Records saved permanently.</p>
        </div>
        <div className="mini-profile">
          <div className="avatar">{empName.charAt(0).toUpperCase()}</div>
          <div><strong>{empName}</strong><span>{profile?.department || "Employee"}</span></div>
        </div>
      </div>

      {/* CLOCK */}
      <div className="clock-card" style={{ marginBottom: 22 }}>
        <div className="clock-left">
          <div className="clock-icon"><Clock3 size={25} /></div>
          <div>
            <span className="clock-label">TODAY</span>
            <div className="live-time">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
            <p>{now.toLocaleDateString([], { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>
        </div>
        <div className="clock-actions">
          <span className={actionsTakenToday > 0 ? "clock-status active" : "clock-status"}>
            <i />
            {isDone ? "Attendance Complete" : isCheckedIn ? "Checked In" : "Not Marked"}
          </span>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stats-grid" style={{ marginBottom: 22 }}>
        <div className="stat-card green">
          <div className="stat-icon"><UserCheck size={21} /></div>
          <div className="stat-content">
            <span>Today's Status</span>
            <strong style={{ fontSize: 15, color: todayRecord?.status === "Present" ? "#15803d" : todayRecord?.status === "Absent" ? "#dc2626" : "#1e293b" }}>
              {!todayRecord ? "Not Marked" :
               todayRecord.status === "Absent" ? "Absent" :
               isDone ? "Present ✓" : "Present"}
            </strong>
            <small>{today}</small>
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon"><LogIn size={21} /></div>
          <div className="stat-content">
            <span>Check-in</span>
            <strong style={{ fontSize: 15 }}>{fmtTime(todayRecord?.checkIn)}</strong>
            <small>Today's check-in time</small>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><LogOut size={21} /></div>
          <div className="stat-content">
            <span>Check-out</span>
            <strong style={{ fontSize: 15 }}>{fmtTime(todayRecord?.checkOut)}</strong>
            <small>Today's check-out time</small>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon"><CalendarDays size={21} /></div>
          <div className="stat-content">
            <span>Present Days</span>
            <strong style={{ fontSize: 15 }}>{presentDays}</strong>
            <small>Total days recorded</small>
          </div>
        </div>
      </div>

      {/* USES COUNTER */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14, marginBottom: 18,
        background: isDone ? "#ecfdf5" : "#f8fafc",
        border: `1px solid ${isDone ? "#86efac" : "#e2e8f0"}`,
        borderRadius: 14, padding: "12px 18px",
      }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2].map((n) => (
            <div key={n} style={{
              width: 36, height: 36, borderRadius: "50%",
              background: actionsTakenToday >= n ? "#22c55e" : "#e2e8f0",
              color: actionsTakenToday >= n ? "white" : "#94a3b8",
              display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13,
            }}>
              {actionsTakenToday >= n ? <CheckCircle2 size={18} /> : n}
            </div>
          ))}
        </div>
        <div>
          <strong style={{ display: "block", fontSize: 13, color: isDone ? "#15803d" : "#1e293b" }}>
            {isDone    ? "Both check-in and check-out recorded — attendance complete" :
             isCheckedIn ? "1/2 — Checked in. Press button again to check out." :
                          "0/2 — Press 'Check Attendance' to check in."}
          </strong>
          <span style={{ fontSize: 11, color: "#64748b" }}>
            Morning check-in: 08:00 AM–12:00 PM · Evening check-out: 05:00–05:30 PM · Resets at midnight.
          </span>
        </div>
      </div>

      {/* MAIN PANEL */}
      {!isDone && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 22 }}>

          {/* LEFT — camera */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Live Camera</h3>
                <span>{isScanning ? "Scanning active — keep face visible" : "Camera opens when you press Check Attendance"}</span>
              </div>
              <Camera size={20} color="#4f46e5" />
            </div>

            {registeredPhoto ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#ecfdf5", border: "1px solid #86efac", borderRadius: 10, padding: "9px 12px", marginBottom: 12 }}>
                <img src={registeredPhoto} alt="Registered" style={{ width: 40, height: 40, borderRadius: 9, objectFit: "cover", border: "2px solid #22c55e" }} />
                <div>
                  <strong style={{ display: "block", fontSize: 11, color: "#15803d" }}>Registered face photo on file</strong>
                  <span style={{ fontSize: 10, color: "#16a34a" }}>Admin-uploaded · used for comparison</span>
                </div>
                <CheckCircle2 size={16} color="#16a34a" style={{ marginLeft: "auto" }} />
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, background: "#fff7ed", border: "1px solid #fcd34d", borderRadius: 10, padding: "9px 12px", marginBottom: 12, fontSize: 11, color: "#92400e" }}>
                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>No face photo. Ask Admin → Employee Management → Edit Employee → upload photo.</span>
              </div>
            )}

            {/* Camera box */}
            <div style={{ background: "#0f172a", borderRadius: 14, overflow: "hidden", aspectRatio: "4/3", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <video
                ref={videoRef}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: camState === "ready" ? "block" : "none", transform: "scaleX(-1)" }}
                autoPlay muted playsInline
              />
              {camState !== "ready" && (
                <div style={{ textAlign: "center", color: "#475569" }}>
                  <Camera size={44} style={{ opacity: 0.25, display: "block", margin: "0 auto 10px" }} />
                  <span style={{ fontSize: 12 }}>
                    {camState === "starting" ? "Opening camera…" : camState === "error" ? "Camera error — check permissions" : "Camera opens on Check Attendance"}
                  </span>
                </div>
              )}
              {camState === "ready" && scanState !== "idle" && (
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, #000b)", padding: "18px 14px 10px" }}>
                  {scanPct > 0 && (
                    <div style={{ marginBottom: 5 }}>
                      <div style={{ height: 4, background: "#ffffff25", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 4, width: `${scanPct}%`, background: scanPct >= Math.round((1 - FACE_MATCH_THRESHOLD) * 100) ? "#22c55e" : "#ef4444", transition: "width 0.3s" }} />
                      </div>
                      <span style={{ fontSize: 10, color: "white", opacity: 0.75 }}>Similarity: {scanPct}%</span>
                    </div>
                  )}
                  <div style={{ fontSize: 12, fontWeight: 700, color: "white", display: "flex", alignItems: "center", gap: 6 }}>
                    <ScanFace size={14} /> {scanOverlay.label}
                  </div>
                </div>
              )}
              {camState === "ready" && (
                <div style={{ position: "absolute", inset: 0, border: `3px solid ${scanOverlay.color}`, borderRadius: 14, pointerEvents: "none", transition: "border-color 0.4s" }} />
              )}
            </div>

            {scanMsg && (
              <div style={{
                padding: "8px 12px", borderRadius: 9, fontSize: 11,
                background: scanState === "matched" ? "#ecfdf5" : scanState === "nomatch" || scanState === "multiface" ? "#fff1f2" : "#eff6ff",
                color: scanState === "matched" ? "#15803d" : scanState === "nomatch" || scanState === "multiface" ? "#dc2626" : "#1d4ed8",
                border: `1px solid ${scanOverlay.border}`, marginBottom: 8, lineHeight: 1.5,
              }}>
                {scanMsg}
              </div>
            )}

            <div style={{ padding: "7px 10px", background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 9, fontSize: 10, color: "#7c3aed" }}>
              <ShieldCheck size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
              128-dim AI matching — only your registered face accepted. Saved to Supabase permanently.
            </div>
          </div>

          {/* RIGHT — steps + button */}
          <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="panel-header" style={{ marginBottom: 0 }}>
              <div><h3>Verification</h3><span>Location → face scan → auto Present → saved to database</span></div>
              <ShieldCheck size={20} color="#4f46e5" />
            </div>

            <VerifyStep num={1} label="Campus Location" sub={locSub || `Within ${CAMPUS.radiusMeters / 1000} km of ${CAMPUS.name}`} state={locState} />
            <VerifyStep num={2} label="Face Match (live scan)" sub={faceSub || "Continuously compares live face against registered photo"} state={faceState} />

            {modelsLoading && (
              <div style={{ fontSize: 11, color: "#6d28d9", background: "#f5f3ff", borderRadius: 8, padding: "8px 12px" }}>
                ⏳ Loading face AI models (first time only)…
              </div>
            )}

            {isScanning && (
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: "#1e40af" }}>
                <strong style={{ display: "block", marginBottom: 4 }}>Tips for best results:</strong>
                <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
                  <li>Face the camera directly</li>
                  <li>Good lighting on your face</li>
                  <li>Only one person in frame</li>
                  <li>Hold still for 2 seconds</li>
                </ul>
              </div>
            )}

            <div style={{ marginTop: "auto", display: "grid", gap: 10 }}>
              {/* SINGLE CHECK ATTENDANCE BUTTON */}
              <button
                className={isCheckedIn ? "secondary-button" : "primary-button"}
                style={{
                  justifyContent: "center", padding: "15px", fontSize: 15, fontWeight: 800,
                  borderRadius: 14,
                  background: isDone ? "#f1f5f9" : !isCheckedIn ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : undefined,
                  color: isDone ? "#94a3b8" : undefined,
                  opacity: busy && !isScanning ? 0.7 : 1,
                  cursor: isDone ? "not-allowed" : "pointer",
                }}
                disabled={isDone || (busy && !isScanning)}
                onClick={handleCheckAttendance}
              >
                {isCheckedIn ? <LogOut size={18} /> : <LogIn size={18} />}
                {btnLabel}
              </button>

              {isScanning && (
                <button
                  style={{ border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", borderRadius: 10, padding: "10px", fontWeight: 600, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
                  onClick={handleCancel}
                >
                  <XCircle size={14} /> Cancel
                </button>
              )}

              {/* Mark Absent — only before check-in */}
              {!isCheckedIn && !isDone && (
                <button
                  style={{ border: "1px solid #fca5a5", background: "#fff1f2", color: "#dc2626", borderRadius: 10, padding: "10px", fontWeight: 700, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
                  onClick={handleMarkAbsent}
                  disabled={busy}
                >
                  <XCircle size={14} /> Mark Absent (no verification needed)
                </button>
              )}
            </div>

            <div style={{ padding: "9px 11px", background: "#f8fafc", borderRadius: 9, fontSize: 11, color: "#64748b", display: "flex", gap: 7 }}>
              <MapPin size={12} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Zone: {CAMPUS.name} · {CAMPUS.radiusMeters / 1000} km · Records saved permanently in Supabase.</span>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS BANNER */}
      {isDone && (
        <div style={{ background: "linear-gradient(135deg,#ecfdf5,#f0fdf4)", border: "1px solid #86efac", borderRadius: 18, padding: "22px 26px", marginBottom: 22, display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#dcfce7", color: "#15803d", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <CheckCircle2 size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ display: "block", fontSize: 16, color: "#15803d" }}>Attendance Complete — Present ✓</strong>
            <span style={{ fontSize: 13, color: "#16a34a" }}>
              Check-in: {fmtTime(todayRecord?.checkIn)}
              {todayRecord?.checkOut && ` · Check-out: ${fmtTime(todayRecord.checkOut)}`}
            </span>
          </div>
          <span style={{ fontSize: 11, color: "#15803d", background: "#dcfce7", borderRadius: 9, padding: "5px 12px", fontWeight: 700 }}>
            Saved to Database
          </span>
        </div>
      )}

      {/* ATTENDANCE HISTORY */}
      <div className="section-title">
        <div>
          <h2>Attendance History</h2>
          <p>
            {loadingRecords ? "Loading from database…" : `${historyRows.length} records — saved permanently in Supabase.`}
          </p>
        </div>
      </div>

      <div className="panel">
        {loadingRecords ? (
          <div className="empty-result">
            <CalendarDays size={36} style={{ opacity: 0.4 }} />
            <strong>Loading attendance records…</strong>
            <span>Fetching from Supabase database</span>
          </div>
        ) : historyRows.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee ID</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Status</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((r) => (
                  <tr key={r.id || r.dateKey}>
                    <td>{r.date || fmtDate(r.dateKey)}</td>
                    <td style={{ color: "#475569", fontSize: 12 }}>{r.employeeId || employeeId}</td>
                    <td>{fmtTime(r.checkIn)}</td>
                    <td>{fmtTime(r.checkOut)}</td>
                    <td>
                      <span className="status-badge" style={
                        r.status === "Present"
                          ? { background: "#dcfce7", color: "#15803d" }
                          : { background: "#fff1f2", color: "#dc2626" }
                      }>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: "#7b8494" }}>{r.source || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-result">
            <CalendarDays size={40} />
            <strong>No attendance records yet</strong>
            <span>Press Check Attendance to start. Records save permanently to Supabase.</span>
          </div>
        )}
      </div>

      {/* TOAST */}
      {toast.msg && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.ok ? "#15803d" : "#1e293b", color: "white",
          padding: "12px 24px", borderRadius: 12, fontSize: 13, fontWeight: 600,
          zIndex: 9999, boxShadow: "0 8px 24px #0004",
          display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
        }}>
          {toast.ok ? <CheckCircle2 size={16} /> : <ShieldCheck size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
