import { useState } from "react";
import { Bell, Calculator, CheckCircle2, WalletCards } from "lucide-react";
import { loadData, saveData } from "../shared/payrollData";
import { upsertSalarySlip } from "../../services/supabaseService";

export default function CalculateSalary({ employees }) {
  const [uid, setUid] = useState(employees[0]?.uid || "");
  const [basic, setBasic] = useState("");
  const [allowances, setAllowances] = useState("");
  const [deductions, setDeductions] = useState("");
  const [result, setResult] = useState(null);

  const employee = employees.find((e) => e.uid === uid);

  const calculate = async (e) => {
    e.preventDefault();
    if (!employee) return;

    const b = Number(basic) || 0;
    const a = Number(allowances) || 0;
    const d = Number(deductions) || 0;

    const slip = {
      id: Date.now(),
      uid: employee.uid,
      employee: employee.name,
      username: employee.username,
      employeeId: employee.employeeId || employee.id,
      department: employee.department,
      designation: employee.designation,
      employmentType: employee.employmentType,
      month: new Date().toLocaleString("en-US", { month: "long" }),
      year: new Date().getFullYear(),
      basic: b,
      allowances: a,
      deductions: d,
      gross: b + a,
      net: Math.max(0, b + a - d),
      createdAt: new Date().toISOString(),
    };

    setResult(slip);

    // Save to localStorage and Supabase
    const slips = loadData("payroll_salary_slips", []);
    const updated = [...slips.filter((s) => !(s.uid === slip.uid && s.month === slip.month && s.year === slip.year)), slip];
    saveData("payroll_salary_slips", updated);
    await upsertSalarySlip(slip).catch(() => {});

    // Send announcement
    const anns = loadData("payroll_announcements", []);
    saveData(
      "payroll_announcements",
      [
        ...anns,
        {
          id: Date.now() + 1,
          uid: employee.uid,
          message: `Salary slip for ${slip.month} ${slip.year} has been calculated. Net salary: ₹${slip.net.toLocaleString()}. Please open Salary / Payslips to view it.`,
          active: true,
          createdAt: new Date().toISOString(),
        },
      ]
    );
  };

  return (
    <>
      <div className="section-title">
        <div>
          <h2>Calculate Salary</h2>
          <p>Select an employee and prepare the current salary statement.</p>
        </div>
      </div>

      <div className="salary-layout">
        <div className="panel salary-form-panel">
          <div className="feature-heading">
            <div className="feature-icon">
              <Calculator size={24} />
            </div>
            <div>
              <h3>Salary Inputs</h3>
              <span>Basic + allowances − deductions</span>
            </div>
          </div>

          <form className="modal-form" onSubmit={calculate}>
            <label>
              Employee
              <select value={uid} onChange={(e) => setUid(e.target.value)}>
                {employees.map((e) => (
                  <option value={e.uid} key={e.uid}>
                    {e.name} · @{e.username}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Basic Salary
              <input
                type="number"
                min="0"
                value={basic}
                onChange={(e) => setBasic(e.target.value)}
                placeholder="Enter basic salary"
                required
              />
            </label>

            <label>
              Allowances
              <input
                type="number"
                min="0"
                value={allowances}
                onChange={(e) => setAllowances(e.target.value)}
                placeholder="Enter allowances"
              />
            </label>

            <label>
              Deductions
              <input
                type="number"
                min="0"
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
                placeholder="Enter deductions"
              />
            </label>

            <button className="primary-button" type="submit">
              <Calculator size={18} /> Calculate Salary
            </button>
          </form>
        </div>

        <div className="panel salary-result">
          {result ? (
            <>
              <div className="salary-result-header">
                <div className="salary-icon">
                  <WalletCards size={25} />
                </div>
                <div>
                  <h3>Salary Calculated</h3>
                  <span>
                    {result.employee} · {result.month} {result.year}
                  </span>
                </div>
              </div>

              <div className="salary-lines">
                <div>
                  <span>Basic Salary</span>
                  <strong>₹{result.basic.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Allowances</span>
                  <strong>₹{result.allowances.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Gross Salary</span>
                  <strong>₹{result.gross.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Deductions</span>
                  <strong>− ₹{result.deductions.toLocaleString()}</strong>
                </div>
              </div>

              <div className="net-salary">
                <span>NET SALARY</span>
                <strong>₹{result.net.toLocaleString()}</strong>
              </div>

              <div className="success-box">
                <CheckCircle2 size={19} /> Announcement sent to @{result.username}
              </div>
            </>
          ) : (
            <div className="empty-result">
              <WalletCards size={38} />
              <strong>No calculation yet</strong>
              <span>Enter the employee's salary details to generate the statement and announcement.</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
