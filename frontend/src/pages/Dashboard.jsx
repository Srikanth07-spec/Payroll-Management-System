import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import {
  Bell, Building2, CalendarDays, Clock3, FileBarChart,
  Fingerprint, Gift, Home, LogOut, Menu, MessageCircle, Search, Settings,
  ShieldCheck, User, Users, WalletCards, X, UserCheck, Crown,
} from "lucide-react";
import AdminDashboard from "./admin/AdminDashboard";
import AdminLeaveApproval from "./admin/AdminLeaveApproval";
import Employees from "./admin/Employees";
import GenerateReport from "./admin/GenerateReport";
import EmployeeReport from "./admin/EmployeeReport";
import AttendanceReport from "./admin/AttendanceReport";
import CalculateSalary from "./admin/CalculateSalary";
import AdminDocuments from "./admin/AdminDocuments";
import AdminProfile from "./admin/AdminProfile";
import AdminManagement from "./admin/AdminManagement";
import EmployeeDashboard from "./employee/EmployeeDashboard";
import EmployeeAttendance from "./employee/EmployeeAttendance";
import ApplyLeave from "./employee/ApplyLeave";
import EmployeeDocuments from "./employee/EmployeeDocuments";
import EmployeeProfile from "./employee/EmployeeProfile";
import SalarySlip from "./employee/SalarySlip";
import { getEmployees, getLeaves, loadData, saveData } from "./shared/payrollData";
import { useTheme } from "../context/ThemeContext.jsx";
import "./Dashboard.css";

const MAIN_ADMIN_EMAIL = "adminpayroll03@gmail.com";
const norm = (e) => String(e || "").trim().toLowerCase();

const defaultHolidays = [
  { id: 1, name: "Ganesh Chaturthi", date: "2026-09-14", day: "Monday" },
  { id: 2, name: "Gandhi Jayanti",   date: "2026-10-02", day: "Friday"  },
  { id: 3, name: "Diwali",           date: "2026-11-08", day: "Sunday"  },
];

function resolveIsAdmin(firebaseUser) {
  if (!firebaseUser) return false;
  if (norm(firebaseUser.email) === norm(MAIN_ADMIN_EMAIL)) return true;
  try {
    const employees = JSON.parse(localStorage.getItem("payroll_employees") || "[]");
    const record = employees.find(
      (e) => (e.uid && e.uid === firebaseUser.uid) || norm(e.email) === norm(firebaseUser.email)
    );
    return record?.role === "admin" || record?.isAdmin === true;
  } catch { return false; }
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose}><X size={19} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ── OrgPage: Branch / Department / Designation / Shift ── */
const ORG_CONFIG = {
  branch:      { label:"Branch",      plural:"Branches",     fields:["name","code","location","contact","status"] },
  department:  { label:"Department",  plural:"Departments",  fields:["name","code","description","status"] },
  designation: { label:"Designation", plural:"Designations", fields:["name","department","description","status"] },
  shift:       { label:"Shift",       plural:"Shifts",       fields:["name","code","startTime","endTime","status"] },
};

function OrgPage({ type, employees = [] }) {
  const cfg = ORG_CONFIG[type];
  const key = `payroll_org_${type}`;
  const [items,     setItems]     = useState(() => loadData(key, []));
  const [showAdd,   setShowAdd]   = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState({});
  const [delTarget, setDelTarget] = useState(null);
  const [delStep,   setDelStep]   = useState(1);
  const [toast,     setToast]     = useState("");
  const [search,    setSearch]    = useState("");
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };
  useEffect(() => saveData(key, items), [key, items]);

  const filtered = items.filter((it) =>
    !search || `${it.name} ${it.code||""} ${it.description||""}`.toLowerCase().includes(search.toLowerCase())
  );
  const empCount = (n) => employees.filter((e) => norm(e[type === "branch" ? "branch" : type === "department" ? "department" : type === "designation" ? "designation" : "shift"] || "") === norm(n)).length;

  const openAdd = () => { setForm({ name:"", code:"", description:"", location:"", contact:"", department:"", startTime:"09:00", endTime:"18:00", status:"Active" }); setEditing(null); setShowAdd(true); };
  const openEdit = (it) => { setForm({...it}); setEditing(it.id); setShowAdd(true); };
  const saveItem = () => {
    if (!form.name?.trim()) { showToast("Name is required."); return; }
    if (editing) {
      setItems(items.map((it) => it.id === editing ? {...it, ...form, updatedAt: new Date().toISOString()} : it));
      showToast(`${cfg.label} updated.`);
    } else {
      if (items.some((it) => norm(it.name) === norm(form.name.trim()))) { showToast("Name already exists."); return; }
      setItems([...items, { id:Date.now(), ...form, name:form.name.trim(), createdAt:new Date().toISOString() }]);
      showToast(`${cfg.label} added.`);
    }
    setShowAdd(false); setEditing(null); setForm({});
  };
  const cancelDel = () => { setDelTarget(null); setDelStep(1); };
  const confirmDel = () => { setItems(items.filter((it) => it.id !== delTarget.id)); showToast(`${cfg.label} deleted.`); cancelDel(); };

  return (
    <div style={{ paddingBottom:40 }}>
      <div className="welcome-row">
        <div>
          <div className="page-eyebrow">ORGANIZATION</div>
          <h1>{cfg.plural}</h1>
          <p>Manage company {cfg.plural.toLowerCase()} and configurations.</p>
        </div>
        <button className="primary-button" onClick={openAdd}><Users size={16}/> Add {cfg.label}</button>
      </div>
      <div className="stats-grid" style={{marginBottom:22}}>
        <div className="stat-card blue"><div className="stat-icon"><Building2 size={20}/></div><div className="stat-content"><span>Total {cfg.plural}</span><strong>{items.length}</strong><small>Configured</small></div></div>
        <div className="stat-card green"><div className="stat-icon"><ShieldCheck size={20}/></div><div className="stat-content"><span>Active</span><strong>{items.filter((i)=>i.status!=="Inactive").length}</strong><small>Active</small></div></div>
        <div className="stat-card purple"><div className="stat-icon"><Users size={20}/></div><div className="stat-content"><span>Employees</span><strong>{employees.length}</strong><small>Total</small></div></div>
      </div>
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,background:"white",border:"1px solid #e2e8f0",borderRadius:11,padding:"0 14px",flex:1}}>
          <Search size={16} color="#94a3b8"/>
          <input style={{border:0,outline:0,padding:"11px 0",fontSize:13,width:"100%"}} value={search} onChange={(e)=>setSearch(e.target.value)} placeholder={`Search ${cfg.plural.toLowerCase()}…`}/>
        </div>
        <span style={{fontSize:12,color:"#7b8494"}}>{filtered.length} {cfg.plural.toLowerCase()}</span>
      </div>
      <div className="panel" style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"13px 20px",borderBottom:"1px solid #f1f5f9",background:"#f8fafc"}}><h3 style={{margin:0,fontSize:15}}>{cfg.plural} List</h3></div>
        {filtered.length === 0 ? (
          <div style={{textAlign:"center",padding:"50px 20px",color:"#94a3b8"}}>
            <Building2 size={38} style={{opacity:.3,marginBottom:12}}/>
            <strong style={{display:"block",color:"#475569"}}>No {cfg.plural.toLowerCase()} yet</strong>
            <span style={{fontSize:12}}>Click "Add {cfg.label}" to start.</span>
          </div>
        ) : filtered.map((it, idx) => (
          <div key={it.id} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 20px",borderBottom:idx<filtered.length-1?"1px solid #f8fafc":"none"}}>
            <div style={{width:40,height:40,borderRadius:11,background:"#eef2ff",color:"#4f46e5",display:"grid",placeItems:"center",fontWeight:800,fontSize:15,flexShrink:0}}>{it.name.charAt(0).toUpperCase()}</div>
            <div style={{flex:1}}>
              <strong style={{display:"block",fontSize:13}}>{it.name}</strong>
              <span style={{fontSize:11,color:"#7b8494"}}>
                {it.code?`Code: ${it.code} · `:""}
                {it.startTime&&it.endTime?`${it.startTime}–${it.endTime} · `:""}
                {it.location?`${it.location} · `:""}
                {it.description?`${it.description.slice(0,40)}${it.description.length>40?"…":""} · `:""}
                {empCount(it.name)} emp.
              </span>
            </div>
            <span style={{fontSize:11,fontWeight:700,background:it.status==="Inactive"?"#f1f5f9":"#dcfce7",color:it.status==="Inactive"?"#475569":"#15803d",borderRadius:999,padding:"3px 10px"}}>{it.status||"Active"}</span>
            <div style={{display:"flex",gap:6}}>
              <button type="button" onClick={()=>openEdit(it)} style={{border:"1px solid #e2e8f0",background:"white",color:"#475569",borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Edit</button>
              <button type="button" onClick={()=>{setDelTarget(it);setDelStep(1);}} style={{border:0,background:"#fff1f2",color:"#dc2626",borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {showAdd && (
        <div style={{position:"fixed",inset:0,background:"#11182780",display:"grid",placeItems:"center",zIndex:50,padding:20}} onMouseDown={()=>{setShowAdd(false);setEditing(null);}}>
          <div style={{background:"white",borderRadius:18,width:"min(480px,100%)",padding:"26px",boxShadow:"0 25px 70px #0005",maxHeight:"90vh",overflowY:"auto"}} onMouseDown={(e)=>e.stopPropagation()}>
            <h3 style={{margin:"0 0 18px",fontSize:17}}>{editing?`Edit ${cfg.label}`:`Add ${cfg.label}`}</h3>
            <div style={{display:"grid",gap:13}}>
              {["name","code","description","location","contact","department","startTime","endTime"].filter((f)=>cfg.fields.includes(f)).map((f)=>(
                <div key={f}>
                  <label style={{fontSize:12,fontWeight:700,display:"block",marginBottom:5}}>{f==="startTime"?"Start Time":f==="endTime"?"End Time":f.charAt(0).toUpperCase()+f.slice(1)}{f==="name"?" *":""}</label>
                  <input type={f.includes("Time")?"time":"text"} value={form[f]||""} onChange={(e)=>setForm({...form,[f]:e.target.value})} placeholder={`Enter ${f}`} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"9px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                </div>
              ))}
              <div>
                <label style={{fontSize:12,fontWeight:700,display:"block",marginBottom:5}}>Status</label>
                <select value={form.status||"Active"} onChange={(e)=>setForm({...form,status:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"9px 12px",fontSize:13}}>
                  <option>Active</option><option>Inactive</option>
                </select>
              </div>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
              <button type="button" onClick={()=>{setShowAdd(false);setEditing(null);}} style={{border:"1px solid #e2e8f0",background:"white",color:"#475569",borderRadius:10,padding:"10px 20px",fontWeight:600,cursor:"pointer"}}>Cancel</button>
              <button type="button" onClick={saveItem} style={{border:0,background:"linear-gradient(135deg,#4f46e5,#7c3aed)",color:"white",borderRadius:10,padding:"10px 22px",fontWeight:700,cursor:"pointer"}}>{editing?`Update ${cfg.label}`:`Add ${cfg.label}`}</button>
            </div>
          </div>
        </div>
      )}
      {delTarget && (
        <div style={{position:"fixed",inset:0,background:"#11182780",display:"grid",placeItems:"center",zIndex:60,padding:20}} onMouseDown={cancelDel}>
          <div style={{background:"white",borderRadius:18,width:"min(420px,100%)",padding:"26px",boxShadow:"0 25px 70px #0005",textAlign:"center"}} onMouseDown={(e)=>e.stopPropagation()}>
            <div style={{width:50,height:50,borderRadius:14,background:"#fff1f2",color:"#dc2626",display:"grid",placeItems:"center",margin:"0 auto 14px"}}><X size={24}/></div>
            {delStep===1 ? (
              <>
                <h3 style={{margin:"0 0 8px"}}>Delete {cfg.label}?</h3>
                <p style={{color:"#64748b",fontSize:13,margin:"0 0 6px"}}>Delete <strong>{delTarget.name}</strong>?</p>
                {empCount(delTarget.name)>0 && <p style={{color:"#f59e0b",fontSize:12,margin:"0 0 10px"}}>⚠ {empCount(delTarget.name)} employee(s) assigned.</p>}
                <p style={{fontSize:11,color:"#94a3b8",margin:"0 0 18px"}}>Step 1 of 2</p>
                <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                  <button onClick={cancelDel} style={{border:"1px solid #e2e8f0",background:"white",color:"#475569",borderRadius:10,padding:"10px 20px",fontWeight:600,cursor:"pointer"}}>Cancel</button>
                  <button onClick={()=>setDelStep(2)} style={{border:"1px solid #fca5a5",background:"#fff1f2",color:"#dc2626",borderRadius:10,padding:"10px 20px",fontWeight:700,cursor:"pointer"}}>Continue →</button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{margin:"0 0 8px"}}>Confirm Delete</h3>
                <p style={{color:"#64748b",fontSize:13,margin:"0 0 18px"}}>Permanently remove <strong>{delTarget.name}</strong>. This cannot be undone.</p>
                <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                  <button onClick={cancelDel} style={{border:"1px solid #e2e8f0",background:"white",color:"#475569",borderRadius:10,padding:"10px 20px",fontWeight:600,cursor:"pointer"}}>Cancel</button>
                  <button onClick={confirmDel} style={{border:0,background:"linear-gradient(135deg,#dc2626,#b91c1c)",color:"white",borderRadius:10,padding:"10px 22px",fontWeight:700,cursor:"pointer"}}>Delete {cfg.label}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {toast && <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#1e293b",color:"white",padding:"11px 20px",borderRadius:12,fontSize:13,fontWeight:600,zIndex:9999,whiteSpace:"nowrap"}}>{toast}</div>}
    </div>
  );
}

/* ── Holidays ── */
function Holidays({ holidays, setHolidays, isAdmin }) {
  const [open,    setOpen]    = useState(false);
  const [hName,   setHName]   = useState("");
  const [hDate,   setHDate]   = useState("");
  const [hType,   setHType]   = useState("Public Holiday");
  const [delId,   setDelId]   = useState(null);
  const [delStep, setDelStep] = useState(1);

  const today = new Date();
  const upcoming = [...holidays].filter((h) => new Date(h.date) >= today).sort((a,b)=>a.date.localeCompare(b.date));
  const past     = [...holidays].filter((h) => new Date(h.date) <  today).sort((a,b)=>b.date.localeCompare(a.date));

  const addHoliday = () => {
    if (!hName.trim() || !hDate) return;
    const d = new Date(hDate);
    setHolidays([...holidays, { id:Date.now(), name:hName.trim(), date:hDate, day:d.toLocaleDateString("en",{weekday:"long"}), type:hType }]);
    setHName(""); setHDate(""); setHType("Public Holiday"); setOpen(false);
  };
  const cancelDel  = ()  => { setDelId(null); setDelStep(1); };
  const confirmDel = ()  => { setHolidays(holidays.filter((h)=>h.id!==delId)); cancelDel(); };

  const List = ({ list, label }) => (
    <div style={{marginBottom:24}}>
      <h3 style={{fontSize:13,color:"#7b8494",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:12}}>{label} ({list.length})</h3>
      {list.length===0
        ? <div style={{color:"#94a3b8",fontSize:13,textAlign:"center",padding:"20px 0"}}>No {label.toLowerCase()} holidays.</div>
        : <div className="holiday-grid">
            {list.map((h)=>(
              <div className="holiday-card" key={h.id} style={{position:"relative"}}>
                <div className="holiday-card-date"><strong>{new Date(h.date).getDate()}</strong><span>{new Date(h.date).toLocaleString("en",{month:"short"})}</span></div>
                <div className="holiday-card-info"><h3>{h.name}</h3><span>{h.day}</span><small>{h.type||"Public Holiday"}</small></div>
                <Gift size={20}/>
                {isAdmin && <button type="button" onClick={()=>{setDelId(h.id);setDelStep(1);}} style={{position:"absolute",top:10,right:10,border:0,background:"#fff1f2",color:"#dc2626",borderRadius:6,padding:"3px 8px",fontSize:10,cursor:"pointer",fontWeight:700}}>✕</button>}
              </div>
            ))}
          </div>
      }
    </div>
  );

  return (
    <>
      <div className="welcome-row">
        <div><div className="page-eyebrow">ORGANIZATION</div><h1>Holidays</h1><p>{holidays.length} holidays configured.</p></div>
        {isAdmin && <button className="primary-button" onClick={()=>setOpen(true)}><Gift size={16}/> Add Holiday</button>}
      </div>
      <List list={upcoming} label="Upcoming"/>
      <List list={past}     label="Past"/>
      {open && (
        <Modal title="Add Holiday" onClose={()=>setOpen(false)}>
          <div className="modal-form">
            <label>Holiday Name *<input value={hName} onChange={(e)=>setHName(e.target.value)} placeholder="e.g. Diwali"/></label>
            <label>Date *<input type="date" value={hDate} onChange={(e)=>setHDate(e.target.value)}/></label>
            <label>Holiday Type<select value={hType} onChange={(e)=>setHType(e.target.value)} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"9px 12px",fontSize:13,marginTop:4}}><option>Public Holiday</option><option>Optional Holiday</option><option>Restricted Holiday</option></select></label>
            <button className="primary-button" onClick={addHoliday} disabled={!hName.trim()||!hDate}>Save Holiday</button>
          </div>
        </Modal>
      )}
      {delId && (
        <div style={{position:"fixed",inset:0,background:"#11182780",display:"grid",placeItems:"center",zIndex:60,padding:20}} onMouseDown={cancelDel}>
          <div style={{background:"white",borderRadius:18,width:"min(380px,100%)",padding:"24px",boxShadow:"0 25px 70px #0005",textAlign:"center"}} onMouseDown={(e)=>e.stopPropagation()}>
            {delStep===1 ? (
              <>
                <h3 style={{margin:"0 0 8px"}}>Delete Holiday?</h3>
                <p style={{color:"#64748b",fontSize:13,margin:"0 0 16px"}}>Delete <strong>{holidays.find((h)=>h.id===delId)?.name}</strong>? Step 1 of 2.</p>
                <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                  <button onClick={cancelDel} style={{border:"1px solid #e2e8f0",background:"white",color:"#475569",borderRadius:10,padding:"9px 18px",fontWeight:600,cursor:"pointer"}}>Cancel</button>
                  <button onClick={()=>setDelStep(2)} style={{border:"1px solid #fca5a5",background:"#fff1f2",color:"#dc2626",borderRadius:10,padding:"9px 18px",fontWeight:700,cursor:"pointer"}}>Continue →</button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{margin:"0 0 8px"}}>Confirm Delete</h3>
                <p style={{color:"#64748b",fontSize:13,margin:"0 0 16px"}}>This holiday will be permanently removed.</p>
                <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                  <button onClick={cancelDel} style={{border:"1px solid #e2e8f0",background:"white",color:"#475569",borderRadius:10,padding:"9px 18px",fontWeight:600,cursor:"pointer"}}>Cancel</button>
                  <button onClick={confirmDel} style={{border:0,background:"linear-gradient(135deg,#dc2626,#b91c1c)",color:"white",borderRadius:10,padding:"9px 18px",fontWeight:700,cursor:"pointer"}}>Delete Holiday</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ── Chat ── */
function ChatPage({ isAdmin, currentUser }) {
  const [messages, setMessages] = useState(() => loadData("payroll_chat_messages", []));
  const [text,     setText]     = useState("");
  const [tab,      setTab]      = useState("chat");
  const [reqType,  setReqType]  = useState("Leave Extension");
  const [reqBody,  setReqBody]  = useState("");
  const endRef = useRef(null);
  useEffect(() => saveData("payroll_chat_messages", messages), [messages]);
  useEffect(() => { endRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  const empName = currentUser?.displayName || "Employee";
  const REQ_TYPES = ["Leave Extension","Attendance Correction","Salary Query","Work From Home","Permission Letter","Other Request"];
  const TMPLS = {
    "Leave Extension":       `Subject: Leave Extension Request\n\nRespected Admin,\n\nI request an extension of my leave due to [reason]. Please grant [number] additional days.\n\nRegards,\n${empName}`,
    "Attendance Correction": `Subject: Attendance Correction\n\nRespected Admin,\n\nMy attendance on [date] shows [status] but I was present. Please correct this.\n\nRegards,\n${empName}`,
    "Salary Query":          `Subject: Salary Query\n\nRespected Admin,\n\nI have a query about my salary for [month]. The credited amount [amount] differs from expected [expected].\n\nRegards,\n${empName}`,
    "Work From Home":        `Subject: Work From Home Request\n\nRespected Admin,\n\nI request to work from home on [dates] due to [reason].\n\nRegards,\n${empName}`,
    "Permission Letter":     `Subject: Permission Request\n\nRespected Admin,\n\nI request permission to [reason] on [date/time].\n\nRegards,\n${empName}`,
    "Other Request":         `Subject: General Request\n\nRespected Admin,\n\n[Describe your request here]\n\nRegards,\n${empName}`,
  };

  const send = () => {
    if (!text.trim()) return;
    setMessages([...messages,{id:Date.now(),sender:isAdmin?"Admin":empName,email:currentUser?.email,role:isAdmin?"admin":"employee",message:text.trim(),createdAt:new Date().toISOString()}]);
    setText("");
  };
  const sendReq = () => {
    if (!reqBody.trim()) return;
    setMessages([...messages,{id:Date.now(),sender:empName,email:currentUser?.email,role:"employee",message:`📋 REQUEST\nType: ${reqType}\n\n${reqBody.trim()}`,isRequest:true,createdAt:new Date().toISOString()}]);
    setReqBody(""); setTab("chat");
  };

  return (
    <>
      <div className="section-title">
        <div><h2>{isAdmin?"Chat":"Chat with Admin"}</h2><p>{isAdmin?"Communicate with employees":"Send messages or request letters"}</p></div>
        {!isAdmin && (
          <div style={{display:"flex",gap:8}}>
            {["chat","request"].map((t)=>(
              <button key={t} onClick={()=>{setTab(t);if(t==="request")setReqBody(TMPLS[reqType]);}} style={{padding:"8px 16px",borderRadius:10,fontWeight:700,fontSize:12,border:"1px solid #e2e8f0",cursor:"pointer",background:tab===t?"#4f46e5":"white",color:tab===t?"white":"#475569"}}>
                {t==="chat"?"💬 Chat":"📋 Request"}
              </button>
            ))}
          </div>
        )}
      </div>
      {tab==="chat" && (
        <div className="chat-panel">
          <div className="messages">
            {messages.map((m)=>(
              <div className={`message ${m.role===(isAdmin?"admin":"employee")?"mine":""}`} key={m.id}>
                <span>{m.sender}</span>
                <p style={{whiteSpace:"pre-wrap"}}>
                  {m.isRequest&&<span style={{fontSize:10,background:"#ede9fe",color:"#6d28d9",borderRadius:6,padding:"2px 7px",marginRight:6,fontWeight:700}}>REQUEST</span>}
                  {m.message}
                </p>
              </div>
            ))}
            <div ref={endRef}/>
          </div>
          <div className="chat-input">
            <input value={text} onChange={(e)=>setText(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&send()} placeholder="Type a message..."/>
            <button onClick={send}><MessageCircle size={18}/></button>
          </div>
        </div>
      )}
      {tab==="request"&&!isAdmin&&(
        <div className="panel" style={{maxWidth:720}}>
          <h3 style={{margin:"0 0 4px",fontSize:16}}>Request Letter to Admin</h3>
          <p style={{margin:"0 0 14px",fontSize:12,color:"#7b8494"}}>Select type, edit template, send to Admin.</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
            {REQ_TYPES.map((t)=>(
              <button key={t} onClick={()=>{setReqType(t);setReqBody(TMPLS[t]);}} style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:600,border:"1px solid #e2e8f0",cursor:"pointer",background:reqType===t?"#4f46e5":"white",color:reqType===t?"white":"#475569"}}>{t}</button>
            ))}
          </div>
          <textarea value={reqBody} onChange={(e)=>setReqBody(e.target.value)} rows={10} style={{width:"100%",padding:"12px 14px",border:"1.5px solid #e1e6ef",borderRadius:10,fontSize:13,lineHeight:1.7,resize:"vertical",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}} onFocus={(e)=>e.target.style.borderColor="#4f46e5"} onBlur={(e)=>e.target.style.borderColor="#e1e6ef"} placeholder="Edit the template above…"/>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <button onClick={()=>setTab("chat")} style={{padding:"10px 20px",border:"1px solid #e2e8f0",background:"white",color:"#475569",borderRadius:10,fontWeight:600,cursor:"pointer",fontSize:13}}>Cancel</button>
            <button onClick={sendReq} disabled={!reqBody.trim()} style={{padding:"10px 24px",background:"linear-gradient(135deg,#4f46e5,#7c3aed)",color:"white",border:"none",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:13,opacity:reqBody.trim()?1:0.5}}>📋 Send Request</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Biometric Face Management ── */
function BiometricPage({ employees = [], setPage }) {
  const [search, setSearch] = useState("");
  const filtered = employees.filter((e)=>!search||`${e.name} ${e.employeeId||e.id} ${e.department}`.toLowerCase().includes(search.toLowerCase()));
  const registered = employees.filter((e)=>e.profilePic||e.profileImage).length;

  return (
    <div style={{paddingBottom:40}}>
      <div className="welcome-row">
        <div><div className="page-eyebrow">EMPLOYEE MANAGEMENT</div><h1>Face / Biometric</h1><p>Employee face-verification registration status.</p></div>
        <button className="primary-button" onClick={()=>setPage("employees")}><Users size={16}/> Manage Employees</button>
      </div>
      <div className="stats-grid" style={{marginBottom:22}}>
        <div className="stat-card blue"><div className="stat-icon"><Users size={21}/></div><div className="stat-content"><span>Total Employees</span><strong>{employees.length}</strong><small>In the system</small></div></div>
        <div className="stat-card green"><div className="stat-icon"><UserCheck size={21}/></div><div className="stat-content"><span>Face Registered</span><strong>{registered}</strong><small>Ready for attendance</small></div></div>
        <div className="stat-card orange"><div className="stat-icon"><Fingerprint size={21}/></div><div className="stat-content"><span>Not Registered</span><strong>{employees.length-registered}</strong><small>Cannot attend</small></div></div>
      </div>
      <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:14,padding:"12px 16px",marginBottom:20,fontSize:13,color:"#15803d"}}>
        <strong>How it works: </strong>Admin uploads employee reference photo in Employee Management → Edit Employee → Face Photo. This photo is used for face-match attendance verification.
      </div>
      <div style={{display:"flex",gap:10,marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,background:"white",border:"1px solid #e2e8f0",borderRadius:11,padding:"0 14px",flex:1}}>
          <Search size={16} color="#94a3b8"/>
          <input style={{border:0,outline:0,padding:"11px 0",fontSize:13,width:"100%"}} value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search employees…"/>
        </div>
      </div>
      <div className="panel" style={{padding:0,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1.2fr 1fr",padding:"11px 20px",borderBottom:"1px solid #f1f5f9",background:"#f8fafc"}}>
          {["Employee","Employee ID","Department","Face Photo","Status"].map((h)=>(
            <div key={h} style={{fontSize:10,fontWeight:800,color:"#7b8494",textTransform:"uppercase",letterSpacing:0.5}}>{h}</div>
          ))}
        </div>
        {filtered.length===0 ? (
          <div style={{textAlign:"center",padding:"50px 20px",color:"#94a3b8"}}><Fingerprint size={38} style={{opacity:.3,marginBottom:12}}/><strong style={{display:"block",color:"#475569"}}>No employees found</strong></div>
        ) : filtered.map((emp,idx)=>{
          const hasPhoto=!!(emp.profilePic||emp.profileImage);
          return (
            <div key={emp.uid||emp.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1.2fr 1fr",padding:"12px 20px",alignItems:"center",borderBottom:idx<filtered.length-1?"1px solid #f8fafc":"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:10,overflow:"hidden",background:"#eef2ff",display:"grid",placeItems:"center",flexShrink:0}}>
                  {emp.profilePic||emp.profileImage ? <img src={emp.profilePic||emp.profileImage} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontWeight:800,color:"#4f46e5"}}>{(emp.name||"E").charAt(0).toUpperCase()}</span>}
                </div>
                <div><strong style={{fontSize:13}}>{emp.name||emp.fullName}</strong><span style={{fontSize:11,color:"#7b8494",display:"block"}}>{emp.email}</span></div>
              </div>
              <div style={{fontSize:12,color:"#475569"}}>{emp.employeeId||emp.id||"—"}</div>
              <div style={{fontSize:12,color:"#475569"}}>{emp.department||"—"}</div>
              <div>{hasPhoto?<span style={{fontSize:11,color:"#15803d",background:"#dcfce7",borderRadius:8,padding:"3px 10px",fontWeight:700}}>✓ Uploaded</span>:<span style={{fontSize:11,color:"#92400e",background:"#fef3c7",borderRadius:8,padding:"3px 10px",fontWeight:700}}>⚠ Missing</span>}</div>
              <div><span style={{fontSize:11,fontWeight:700,background:hasPhoto?"#dcfce7":"#fff1f2",color:hasPhoto?"#15803d":"#dc2626",borderRadius:999,padding:"3px 10px"}}>{hasPhoto?"Ready":"Not Registered"}</span></div>
            </div>
          );
        })}
      </div>
      <div style={{marginTop:14,fontSize:12,color:"#64748b",textAlign:"center"}}>
        To update a photo: <button type="button" onClick={()=>setPage("employees")} style={{background:"none",border:"none",color:"#4f46e5",fontWeight:700,cursor:"pointer",fontSize:12}}>Employee Management</button> → Edit → Upload Face Photo.
      </div>
    </div>
  );
}

/* ── Settings Page ── */
function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const options = [
    {
      id: "light",
      label: "Light Mode",
      desc: "Professional bright theme — default appearance.",
      icon: "☀️",
      preview: { bg: "#f5f7fb", panel: "#fff", text: "#182033", accent: "#4f46e5" },
    },
    {
      id: "dark",
      label: "Dark Mode",
      desc: "Dark interface for low-light environments.",
      icon: "🌙",
      preview: { bg: "#0f172a", panel: "#1e293b", text: "#e2e8f0", accent: "#818cf8" },
    },
    {
      id: "eye",
      label: "Eye Protection",
      desc: "Warm tones to reduce screen brightness fatigue.",
      icon: "🌿",
      preview: { bg: "#f5f0e8", panel: "#fdfaf4", text: "#2d2416", accent: "#c27d34" },
    },
  ];

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="welcome-row">
        <div>
          <div className="page-eyebrow">SETTINGS</div>
          <h1>Application Settings</h1>
          <p>Customise the appearance of your PayRoll Pro workspace.</p>
        </div>
      </div>

      {/* Appearance */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header" style={{ marginBottom: 20 }}>
          <div>
            <h3>Appearance</h3>
            <span>Choose how PayRoll Pro looks across all pages.</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {options.map((opt) => {
            const active = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                style={{
                  border: `2px solid ${active ? opt.preview.accent : "var(--border-color, #e9edf4)"}`,
                  borderRadius: 16, padding: 0, cursor: "pointer", background: "none",
                  boxShadow: active ? `0 0 0 3px ${opt.preview.accent}22` : "none",
                  transition: "all 0.18s", textAlign: "left", overflow: "hidden",
                }}
              >
                {/* Mini preview */}
                <div style={{ background: opt.preview.bg, padding: "14px 14px 10px", display: "flex", gap: 8 }}>
                  <div style={{ width: 36, height: 52, borderRadius: 8, background: "#111827", flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ height: 10, borderRadius: 4, background: opt.preview.panel, border: "1px solid " + (opt.id === "dark" ? "#334155" : "#e2e8f0") }} />
                    <div style={{ height: 22, borderRadius: 6, background: opt.preview.panel, border: "1px solid " + (opt.id === "dark" ? "#334155" : "#e2e8f0") }} />
                    <div style={{ height: 14, borderRadius: 4, background: opt.preview.accent + "22" }} />
                  </div>
                </div>
                {/* Label row */}
                <div style={{ padding: "12px 14px", background: "var(--bg-panel, #fff)", borderTop: "1px solid var(--border-color, #e9edf4)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{opt.icon}</span>
                    <strong style={{ fontSize: 13, color: "var(--text-primary, #182033)" }}>{opt.label}</strong>
                    {active && (
                      <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 800, background: opt.preview.accent + "20", color: opt.preview.accent, borderRadius: 999, padding: "2px 8px" }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted, #94a3b8)", lineHeight: 1.5 }}>{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Account info */}
      <div className="panel">
        <div className="panel-header" style={{ marginBottom: 16 }}>
          <div><h3>Account</h3><span>Your PayRoll Pro authentication details.</span></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            ["Authentication", "Firebase Authentication"],
            ["Database", "Supabase"],
          ].map(([k, v]) => (
            <div key={k} style={{ background: "var(--bg-hover, #f8fafc)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary, #1e293b)", marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Sidebar ── */
function Sidebar({ page, setPage, isAdmin, isMainAdmin, onLogout, mobileOpen, setMobileOpen }) {
  const adminGroups = [
    { label:"MAIN",                items:[["home","Home",Home]] },
    { label:"ORGANIZATION",        items:[["branch","Branch",Building2],["department","Department",Building2],["designation","Designation",ShieldCheck],["shift","Shift",Clock3],["holidays","Holidays",Gift]] },
    { label:"EMPLOYEE MANAGEMENT", items:[["employees","Employees",Users],["leaves","Leave Requests",CalendarDays],["biometric","Face / Biometric",Fingerprint],["documents","Documents",FileBarChart]] },
    { label:"PAYROLL",             items:[["salary","Calculate Salary",WalletCards],["reports","Generate Reports",FileBarChart]] },
    { label:"ADMINISTRATION",      items:[...(isMainAdmin?[["admin-management","Admin Management",Crown]]:[]),["chat","Chat",MessageCircle],["profile","Profile",User]] },
  ];
  const employeeItems = [
    ["home","Home",Home],["attendance","Attendance",UserCheck],["apply-leave","Apply For Leave",CalendarDays],
    ["holidays","Holiday List",Gift],["chat","Chat With Admin",MessageCircle],
    ["salary-slip","Salary / Payslips",WalletCards],["documents","My Documents",FileBarChart],["profile","Employee Profile",User],
  ];
  return (
    <aside className={`sidebar ${mobileOpen?"sidebar-open":""}`}>
      <div className="sidebar-brand">
        <div className="brand-mark">P</div>
        <div><strong>PayRoll <span>Pro</span></strong><small>Smart Payroll Management</small></div>
        <button className="mobile-close" onClick={()=>setMobileOpen(false)}><X size={20}/></button>
      </div>
      <div className="sidebar-role">
        <div className="role-icon">{isMainAdmin?<Crown size={17}/>:isAdmin?<ShieldCheck size={17}/>:<User size={17}/>}</div>
        <div><span>Logged in as</span><strong>{isMainAdmin?"Main Admin":isAdmin?"Administrator":"Employee"}</strong></div>
      </div>
      <nav className="sidebar-nav">
        {isAdmin ? (
          adminGroups.map((g)=>(
            <div key={g.label}>
              <span className="nav-label">{g.label}</span>
              {g.items.map(([k,lbl,Icon])=>(
                <button key={k} className={page===k?"nav-item active":"nav-item"} onClick={()=>{setPage(k);setMobileOpen(false);}}>
                  <Icon size={19}/><span>{lbl}</span>
                </button>
              ))}
            </div>
          ))
        ) : (
          <>
            <span className="nav-label">MAIN MENU</span>
            {employeeItems.map(([k,lbl,Icon])=>(
              <button key={k} className={page===k?"nav-item active":"nav-item"} onClick={()=>{setPage(k);setMobileOpen(false);}}>
                <Icon size={19}/><span>{lbl}</span>
              </button>
            ))}
          </>
        )}
      </nav>
      <div className="sidebar-bottom">
        <button className="nav-item" onClick={()=>setPage("settings")}><Settings size={19}/><span>Settings</span></button>
        <button className="logout-button" onClick={onLogout}><LogOut size={19}/><span>Logout</span></button>
      </div>
    </aside>
  );
}

/* ── Root Dashboard ── */
export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState("home");
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [employees,   setEmployees]   = useState(() => getEmployees());
  const [leaves,      setLeaves]      = useState(() => getLeaves());
  const [holidays,    setHolidays]    = useState(() => loadData("payroll_holidays", defaultHolidays));

  useEffect(() =>
    onAuthStateChanged(auth, async (u) => {
      setCurrentUser(u); setLoading(false); setPage("home");

      if (u) {
        // Load all data from Supabase on login
        try {
          const [emps, lvs, hols] = await Promise.all([
            fetchEmployees(),
            fetchLeaves(),
            fetchHolidays(),
          ]);
          if (emps.length > 0) setEmployees(emps);
          if (lvs.length  > 0) setLeaves(lvs);
          if (hols.length > 0) setHolidays(hols);
        } catch (err) {
          console.warn("Supabase load failed, using localStorage cache", err.message);
        }
      }

      if (u && norm(u.email) !== norm(MAIN_ADMIN_EMAIL) && !resolveIsAdmin(u)) {
        const sk = `payroll_active_session_${u.uid}`;
        if (!localStorage.getItem(sk)) {
          const now = new Date();
          const items = loadData("payroll_attendance", []);
          items.push({ id:Date.now(), uid:u.uid, employee:u.displayName||u.email?.split("@")[0]||"Employee", email:u.email, action:"Login", time:now.toISOString(), date:now.toLocaleDateString(), source:"Authentication" });
          saveData("payroll_attendance", items);
          localStorage.setItem(sk, now.toISOString());
        }
      }
    }), []
  );

  useEffect(() => saveData("payroll_employees", employees), [employees]);
  useEffect(() => saveData("payroll_leaves",    leaves),    [leaves]);
  useEffect(() => saveData("payroll_holidays",  holidays),  [holidays]);

  useEffect(() => {
    const refresh = () => setEmployees(getEmployees());
    window.addEventListener("payroll-employees-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("payroll-employees-updated", refresh); window.removeEventListener("storage", refresh); };
  }, []);

  const isMainAdmin = norm(currentUser?.email) === norm(MAIN_ADMIN_EMAIL);
  const isAdmin     = resolveIsAdmin(currentUser);

  const handleLogout = async () => {
    if (currentUser && !isAdmin) {
      const sk = `payroll_active_session_${currentUser.uid}`;
      if (localStorage.getItem(sk)) {
        const now = new Date();
        const items = loadData("payroll_attendance", []);
        items.push({ id:Date.now(), uid:currentUser.uid, employee:currentUser.displayName||currentUser.email?.split("@")[0]||"Employee", email:currentUser.email, action:"Logout", time:now.toISOString(), date:now.toLocaleDateString(), source:"Authentication" });
        saveData("payroll_attendance", items);
        localStorage.removeItem(sk);
      }
    }
    await signOut(auth);
  };

  if (loading) return <div className="dashboard-loading"><div className="loading-logo">P</div><strong>Loading PayRoll Pro...</strong></div>;
  if (!currentUser) { window.location.href = "/login"; return null; }

  const safePage = () => {
    const adminOnly    = ["branch","shift","department","designation","employees","leaves","salary","reports","biometric","admin-management"];
    const employeeOnly = ["apply-leave","salary-slip","attendance"];
    if (isAdmin  && employeeOnly.includes(page)) return "home";
    if (!isAdmin && adminOnly.includes(page))    return "home";
    if (page === "admin-management" && !isMainAdmin) return "home";
    return page;
  };
  const p = safePage();

  const render = () => {
    switch (p) {
      case "home":
        return isAdmin
          ? <AdminDashboard currentUser={currentUser} setPage={setPage} employees={employees} leaves={leaves} holidays={holidays}/>
          : <EmployeeDashboard currentUser={currentUser} setPage={setPage} employees={employees} leaves={leaves} holidays={holidays}/>;
      case "branch":      return <OrgPage type="branch"      employees={employees}/>;
      case "department":  return <OrgPage type="department"  employees={employees}/>;
      case "designation": return <OrgPage type="designation" employees={employees}/>;
      case "shift":       return <OrgPage type="shift"       employees={employees}/>;
      case "holidays":    return <Holidays holidays={holidays} setHolidays={setHolidays} isAdmin={isAdmin}/>;
      case "employees":   return <Employees employees={employees} setEmployees={setEmployees}/>;
      case "leaves":      return <AdminLeaveApproval leaves={leaves} setLeaves={setLeaves} employees={employees}/>;
      case "apply-leave": return <ApplyLeave currentUser={currentUser} leaves={leaves} setLeaves={setLeaves} employees={employees} holidays={holidays}/>;
      case "attendance":  return <EmployeeAttendance currentUser={currentUser}/>;
      case "biometric":   return <BiometricPage employees={employees} setPage={setPage}/>;
      case "salary":      return <CalculateSalary employees={employees}/>;
      case "reports":          return <GenerateReport setPage={setPage}/>;
      case "employee-report":  return <EmployeeReport employees={employees} setPage={setPage}/>;
      case "attendance-report":return <AttendanceReport employees={employees} setPage={setPage}/>;
      case "documents":   return isAdmin ? <AdminDocuments employees={employees}/> : <EmployeeDocuments currentUser={currentUser}/>;
      case "chat":        return <ChatPage isAdmin={isAdmin} currentUser={currentUser}/>;
      case "profile":     return isAdmin ? <AdminProfile currentUser={currentUser}/> : <EmployeeProfile currentUser={currentUser}/>;
      case "salary-slip": return <SalarySlip currentUser={currentUser}/>;
      case "admin-management": return isMainAdmin ? <AdminManagement currentUser={currentUser}/> : null;
      case "settings":
        return <SettingsPage />;
      default: return null;
    }
  };

  return (
    <div className="dashboard-app">
      <Sidebar page={p} setPage={setPage} isAdmin={isAdmin} isMainAdmin={isMainAdmin} onLogout={handleLogout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>
      <div className="dashboard-main">
        <header className="dashboard-mobile-header">
          <button onClick={()=>setMobileOpen(true)}><Menu size={23}/></button>
          <div className="mobile-brand"><div className="brand-mark">P</div><strong>PayRoll <span>Pro</span></strong></div>
          <button><Bell size={20}/></button>
        </header>
        <main className="dashboard-content">{render()}</main>
      </div>
    </div>
  );
}
