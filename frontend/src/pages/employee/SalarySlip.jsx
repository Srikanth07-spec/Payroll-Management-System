import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, Building2, Printer, WalletCards } from "lucide-react";
import { fetchSalarySlips } from "../../services/supabaseService";

/* ─── print styles injected once ──────────────────────────────── */
const PRINT_STYLE = `
@media print {
  body > *:not(#payslip-print-root) { display: none !important; }
  #payslip-print-root { display: block !important; }
  @page { size: A4; margin: 18mm 16mm; }
}
`;

function ensurePrintStyle() {
  if (document.getElementById("payslip-print-style")) return;
  const s = document.createElement("style");
  s.id = "payslip-print-style";
  s.textContent = PRINT_STYLE;
  document.head.appendChild(s);
}

/* ─── Single Payslip ──────────────────────────────────────────── */
function PayslipCard({ slip }) {
  const ref = useRef(null);

  const handlePrint = () => {
    ensurePrintStyle();
    /* Clone slip into an isolated root so only it prints */
    const root = document.getElementById("payslip-print-root") || document.createElement("div");
    root.id = "payslip-print-root";
    root.style.cssText = "display:none;position:fixed;inset:0;background:white;z-index:99999;overflow:auto;padding:20px;";
    root.innerHTML = ref.current.innerHTML;
    if (!document.getElementById("payslip-print-root")) document.body.appendChild(root);
    root.style.display = "block";
    window.print();
    setTimeout(() => { root.style.display = "none"; }, 500);
  };

  const rows = [
    ["Basic Salary",  slip.basic,      false],
    ["Allowances",    slip.allowances,  false],
    ["Gross Salary",  slip.gross,       false],
    ["Deductions",    slip.deductions,  true ],
  ];

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Action buttons outside the print area */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginBottom: 10 }}>
        <button onClick={handlePrint}
          style={{ display: "flex", alignItems: "center", gap: 7, border: "1px solid #e2e8f0", background: "white", color: "#475569", borderRadius: 10, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          <Printer size={15} /> Print
        </button>
        <button onClick={handlePrint}
          style={{ display: "flex", alignItems: "center", gap: 7, border: 0, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "white", borderRadius: 10, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          <ArrowDownToLine size={15} /> Download PDF
        </button>
      </div>

      {/* A4-style payslip */}
      <div ref={ref} style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        maxWidth: 780,
        margin: "0 auto",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        overflow: "hidden",
        boxShadow: "0 4px 20px #1f29370a",
      }}>

        {/* ── Header band ── */}
        <div style={{ background: "linear-gradient(135deg,#1e3a8a,#4f46e5)", color: "white", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 22 }}>P</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.01em" }}>PayRoll Pro</div>
              <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>Smart Payroll Management System</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>SALARY SLIP</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{slip.month} {slip.year}</div>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "24px 32px" }}>

          {/* Employee info strip */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24, padding: "16px 20px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
            {[
              ["Employee Name",  slip.employee   || "—"],
              ["Employee ID",    slip.employeeId || "—"],
              ["Department",     slip.department || "—"],
              ["Designation",    slip.designation|| "—"],
              ["Employee Type",  slip.employmentType || "—"],
              ["Pay Period",     `${slip.month} ${slip.year}`],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Earnings / Deductions table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", borderRadius: "8px 0 0 8px" }}>Description</th>
                <th style={{ textAlign: "right", padding: "10px 14px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", borderRadius: "0 8px 8px 0" }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, amount, isDed]) => (
                <tr key={label} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#374151" }}>{label}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, textAlign: "right", color: isDed ? "#dc2626" : "#1e293b" }}>
                    {isDed ? "− " : ""}₹{Number(amount || 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Net salary highlight */}
          <div style={{ background: "linear-gradient(135deg,#1e3a8a,#4f46e5)", borderRadius: 12, padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Net Salary Payable</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{slip.month} {slip.year}</div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "white" }}>₹{Number(slip.net || 0).toLocaleString("en-IN")}</div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
            <div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>Generated on</div>
              <div style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>{slip.createdAt ? new Date(slip.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 18 }}>Authorised Signature</div>
              <div style={{ borderTop: "1px solid #94a3b8", paddingTop: 6, fontSize: 11, color: "#64748b", width: 160 }}>HR / Payroll Department</div>
            </div>
          </div>

          <div style={{ marginTop: 14, padding: "10px 14px", background: "#f8fafc", borderRadius: 8, fontSize: 10, color: "#94a3b8", textAlign: "center" }}>
            This is a computer-generated payslip and does not require a physical signature. · PayRoll Pro
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════ */
export default function SalarySlip({ currentUser }) {
  const [slips, setSlips] = useState([]);
  const slipRef = useRef(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    fetchSalarySlips(currentUser.uid).then((data) => {
      const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSlips(sorted);
    });
  }, [currentUser?.uid]);

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="welcome-row">
        <div>
          <div className="page-eyebrow">PAYROLL</div>
          <h1>Salary / Payslips</h1>
          <p>Your salary statements generated by the payroll administrator.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#eef2ff", borderRadius: 12, padding: "10px 16px" }}>
          <WalletCards size={18} color="#4f46e5" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#4f46e5" }}>{slips.length} Payslip{slips.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {slips.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#94a3b8" }}>
          <WalletCards size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <strong style={{ display: "block", fontSize: 16, color: "#475569", marginBottom: 6 }}>No payslips available</strong>
          <span style={{ fontSize: 13 }}>Your salary slips will appear here once generated by the administrator.</span>
        </div>
      ) : (
        slips.map((slip) => <PayslipCard key={slip.id} slip={slip} />)
      )}
    </div>
  );
}
