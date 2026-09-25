import { useEffect, useState } from "react";
import { ArrowDownToLine, FileText, Send, Trash2, Upload, X } from "lucide-react";
import { uploadDocument, fetchDocuments, deleteDocument, getDocumentUrl } from "../../services/supabaseService";

export default function AdminDocuments({ employees = [] }) {
  const [uid,     setUid]     = useState(employees[0]?.uid || "");
  const [file,    setFile]    = useState(null);
  const [title,   setTitle]   = useState("");
  const [status,  setStatus]  = useState({ msg: "", ok: true });
  const [sending, setSending] = useState(false);
  const [docs,    setDocs]    = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Load all documents (admin sees all)
  const loadDocs = async () => {
    setLoadingDocs(true);
    try { setDocs(await fetchDocuments()); }
    catch { setDocs([]); }
    setLoadingDocs(false);
  };

  useEffect(() => { loadDocs(); }, []);

  const selectedEmployee = employees.find((e) => e.uid === uid);

  const send = async () => {
    if (!selectedEmployee || !file) {
      setStatus({ msg: "Select an employee and a document file.", ok: false }); return;
    }
    setSending(true);
    try {
      await uploadDocument(file, selectedEmployee.uid, title.trim() || file.name);
      setStatus({ msg: `Document sent to ${selectedEmployee.name}.`, ok: true });
      setFile(null); setTitle("");
      await loadDocs();
    } catch (err) {
      setStatus({ msg: err.message || "Upload failed.", ok: false });
    }
    setSending(false);
  };

  const remove = async (doc) => {
    if (!window.confirm(`Delete "${doc.title}"?`)) return;
    try {
      await deleteDocument(doc.id, doc.file_path);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  // Group docs by employee for the list
  const docsByEmployee = docs.reduce((acc, d) => {
    if (!acc[d.uid]) acc[d.uid] = [];
    acc[d.uid].push(d);
    return acc;
  }, {});

  const getEmpName = (empUid) => {
    const e = employees.find((x) => x.uid === empUid);
    return e?.name || e?.fullName || empUid;
  };

  return (
    <>
      <div className="section-title">
        <div>
          <h2>Documents</h2>
          <p>Send documents to employees. Stored permanently in Supabase Storage.</p>
        </div>
      </div>

      <div className="document-send-layout">
        {/* ── Send panel ── */}
        <div className="panel">
          <div className="feature-heading">
            <div className="feature-icon"><Upload size={23} /></div>
            <div><h3>Send Document</h3><span>Employee-specific document delivery</span></div>
          </div>

          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>Employee *</span>
            <select value={uid} onChange={(e) => setUid(e.target.value)} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "9px 12px", fontSize: 13 }}>
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option value={e.uid} key={e.uid}>{e.name || e.fullName} · {e.employeeId || e.id}</option>
              ))}
            </select>
          </label>

          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>Document Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Appointment Letter" style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "9px 12px", fontSize: 13, boxSizing: "border-box" }} />
          </label>

          <label className="file-drop" style={{ display: "block", border: "2px dashed #c7d2fe", borderRadius: 12, padding: "20px", textAlign: "center", cursor: "pointer", marginBottom: 14, background: file ? "#f0fdf4" : "#f8faff" }}>
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <FileText size={26} color={file ? "#15803d" : "#a5b4fc"} style={{ marginBottom: 6 }} />
            <strong style={{ display: "block", fontSize: 13, color: file ? "#15803d" : "#475569" }}>{file ? file.name : "Choose document"}</strong>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>PDF, Word, or image file</span>
            {file && <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); }} style={{ marginTop: 8, background: "none", border: "none", color: "#dc2626", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>Remove</button>}
          </label>

          <button className="primary-button" onClick={send} disabled={sending || !file || !uid}>
            <Send size={18} /> {sending ? "Sending…" : "Send to Employee"}
          </button>

          {status.msg && (
            <div className={`notice ${status.ok ? "success" : "error"}`} style={{ marginTop: 12 }}>
              {status.msg}
              <button onClick={() => setStatus({ msg: "", ok: true })} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 8 }}><X size={15} /></button>
            </div>
          )}
        </div>

        {/* ── Documents list ── */}
        <div className="panel" style={{ overflowY: "auto", maxHeight: 620 }}>
          <div className="panel-header" style={{ marginBottom: 14 }}>
            <div><h3>All Documents</h3><span>Documents sent to employees</span></div>
          </div>

          {loadingDocs ? (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: 30 }}>Loading…</div>
          ) : docs.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: 30 }}>
              <FileText size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
              <p>No documents sent yet.</p>
            </div>
          ) : (
            Object.entries(docsByEmployee).map(([empUid, empDocs]) => (
              <div key={empUid} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#7b8494", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
                  {getEmpName(empUid)}
                </div>
                {empDocs.map((doc) => (
                  <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f8fafc" }}>
                    <FileText size={20} color="#4f46e5" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: "block", fontSize: 13, color: "#1e293b" }}>{doc.title || doc.file_name}</strong>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{doc.file_name} · {new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                    <a href={getDocumentUrl(doc.file_path)} target="_blank" rel="noreferrer"
                      style={{ border: "1px solid #e2e8f0", background: "white", color: "#475569", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                      <ArrowDownToLine size={13} /> View
                    </a>
                    <button onClick={() => remove(doc)} style={{ border: 0, background: "#fff1f2", color: "#dc2626", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
