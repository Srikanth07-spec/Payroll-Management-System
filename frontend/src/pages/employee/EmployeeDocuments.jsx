import { useEffect, useState } from "react";
import { ArrowDownToLine, FileText } from "lucide-react";
import { fetchDocuments, getDocumentUrl } from "../../services/supabaseService";

export default function EmployeeDocuments({ currentUser }) {
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;
    fetchDocuments(currentUser.uid)
      .then((d) => { setDocs(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [currentUser?.uid]);

  return (
    <>
      <div className="section-title"><div><h2>My Documents</h2><p>Documents sent to you by the administrator.</p></div></div>
      <div className="document-list">
        {loading ? (
          <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>Loading documents…</div>
        ) : docs.length === 0 ? (
          <div className="empty-state">
            <FileText size={38} style={{ opacity:.3, marginBottom:10 }}/>
            <p>No documents have been sent to you yet.</p>
          </div>
        ) : docs.map((doc) => (
          <div className="document-card" key={doc.id}>
            <div className="document-icon"><FileText size={25}/></div>
            <div style={{ flex:1, minWidth:0 }}>
              <strong style={{ display:"block", fontSize:14, color:"#1e293b" }}>{doc.title || doc.file_name}</strong>
              <span style={{ fontSize:11, color:"#94a3b8" }}>
                {doc.file_name} · {new Date(doc.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
              </span>
            </div>
            {doc.file_path && (
              <a href={getDocumentUrl(doc.file_path)} target="_blank" rel="noreferrer" download={doc.file_name}
                style={{ display:"inline-flex", alignItems:"center", gap:6, border:0, background:"linear-gradient(135deg,#4f46e5,#7c3aed)", color:"white", borderRadius:9, padding:"8px 14px", fontSize:12, fontWeight:700, textDecoration:"none" }}>
                <ArrowDownToLine size={14}/> Download
              </a>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
