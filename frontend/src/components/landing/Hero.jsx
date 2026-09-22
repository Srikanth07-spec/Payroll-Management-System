import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileCheck2,
  FileText,
  LockKeyhole,
  Mail,
  Menu,
  MousePointer2,
  PieChart,
  Play,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Zap,
} from "lucide-react";

const features = [
  { icon: Zap, title: "Automated Payroll", text: "Process recurring payroll tasks quickly with a clear and simple workflow." },
  { icon: Users, title: "Employee Management", text: "Keep employee information organized and easy to access in one place." },
  { icon: BarChart3, title: "Reports & Analytics", text: "Create clear reports and understand payroll activity at a glance." },
  { icon: ShieldCheck, title: "Compliance Ready", text: "Build reliable payroll processes with security and compliance in mind." },
  { icon: CalendarCheck2, title: "Attendance & Leave", text: "Track attendance, leave and work information without scattered records." },
  { icon: FileCheck2, title: "Digital Documents", text: "Keep payroll documents and records structured, searchable and secure." },
  { icon: Settings2, title: "Flexible Settings", text: "Configure workflows and payroll preferences around your organization." },
  { icon: Bell, title: "Smart Notifications", text: "Stay informed about important payroll actions and upcoming tasks." },
];

const benefits = [
  { icon: LockKeyhole, title: "Secure & Reliable", text: "Protect important business information with a security-first experience." },
  { icon: Clock3, title: "Save Time", text: "Reduce repetitive work and spend more time on people and business." },
  { icon: BarChart3, title: "Accurate Reports", text: "Turn payroll activity into useful, easy-to-read information." },
  { icon: ShieldCheck, title: "Stay Compliant", text: "Support consistent payroll processes with compliance-focused tools." },
];

const steps = [
  ["01", "Set up your workspace", "Add your organization details and configure your payroll workflow."],
  ["02", "Manage your team", "Organize employee records, attendance, leave and required documents."],
  ["03", "Run payroll with ease", "Complete payroll tasks through a guided and efficient process."],
  ["04", "Review & report", "Check activity, generate reports and keep your records organized."],
];

function LogoMark({ small = false }) {
  return (
    <span className={`relative flex ${small ? "h-6 w-6 rounded-md" : "h-12 w-12 rounded-[13px]"} items-center justify-center bg-gradient-to-br from-[#4d8dff] via-[#2563eb] to-[#3154d9] text-white shadow-lg shadow-blue-500/20`}>
      <svg viewBox="0 0 32 32" aria-hidden="true" className={small ? "h-4 w-4" : "h-8 w-8"} fill="none">
        <path d="M8 6.5h10.5a6.5 6.5 0 0 1 0 13H12v5.8H8V6.5Z" fill="white" />
        <path d="M12 10.5v5h6.2a2.5 2.5 0 0 0 0-5H12Z" fill="#4d8dff" />
        {!small && <path d="M8 21.5v5.2l5.1-5.2H8Z" fill="white" />}
      </svg>
    </span>
  );
}

function LaptopPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[700px] px-2 sm:px-0">
      <div className="absolute left-[8%] top-[7%] h-[78%] w-[84%] rounded-full bg-blue-100/65 blur-3xl" />
      <div className="absolute right-[3%] top-[12%] h-44 w-44 rounded-full bg-indigo-100/60 blur-3xl" />
      <div className="absolute right-[1%] top-[5%] grid grid-cols-5 gap-3 opacity-55">
        {Array.from({ length: 35 }).map((_, i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-blue-100" />)}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, rotate: 1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="relative z-10 pt-3 sm:pt-5"
        style={{ perspective: "1400px" }}
      >
        <div
          className="relative mx-auto w-[96%] sm:w-[92%]"
          style={{ transform: "rotateX(2deg) rotateY(-7deg) rotateZ(1deg)", transformStyle: "preserve-3d" }}
        >
          {/* Laptop display bezel */}
          <div className="rounded-[22px] border-[8px] border-slate-300 bg-slate-200 p-2 shadow-[0_35px_75px_rgba(37,99,235,0.20)] sm:rounded-[27px] sm:border-[10px] sm:p-2.5">
            <div className="overflow-hidden rounded-[13px] border border-slate-200 bg-white shadow-inner sm:rounded-[17px]">
              <div className="flex h-9 items-center justify-between border-b border-slate-100 bg-white px-3 sm:h-11 sm:px-4">
                <div className="flex items-center gap-2">
                  <LogoMark small />
                  <span className="text-[9px] font-bold text-slate-800 sm:text-[10px]">PayRoll <span className="text-blue-600">Pro</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden h-5 w-20 rounded-md bg-slate-50 sm:block" />
                  <Bell size={12} className="text-slate-400" />
                  <div className="h-5 w-5 rounded-full bg-blue-100" />
                </div>
              </div>

              <div className="grid min-h-[265px] grid-cols-[82px_1fr] sm:min-h-[330px] sm:grid-cols-[116px_1fr]">
                <aside className="border-r border-slate-100 bg-slate-50/90 p-2 sm:p-3">
                  <div className="mb-4 flex items-center gap-1.5 rounded-lg bg-blue-600 px-2 py-2 text-[7px] font-semibold text-white sm:mb-5 sm:text-[9px]"><BarChart3 size={11} /> Overview</div>
                  {["Employees", "Payroll", "Attendance", "Reports", "Documents", "Settings"].map((item) => (
                    <div key={item} className="mb-2.5 flex items-center gap-1.5 px-1.5 text-[7px] font-medium text-slate-400 sm:mb-3 sm:px-2 sm:text-[9px]">
                      <span className="h-2.5 w-2.5 rounded bg-slate-200 sm:h-3 sm:w-3" /> {item}
                    </div>
                  ))}
                </aside>

                <div className="p-2.5 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-[7px] text-slate-400 sm:text-[9px]">Workspace</p><p className="text-[11px] font-bold text-slate-900 sm:text-sm">Payroll Overview</p></div>
                    <button className="rounded-lg border border-slate-200 px-2 py-1 text-[6px] font-semibold text-slate-600 sm:px-2.5 sm:py-1.5 sm:text-[8px]">This Month</button>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-1.5 sm:mt-4 sm:gap-2">
                    {[[Users, "Employees", "Team"], [CalendarCheck2, "Payroll Runs", "Tasks"], [FileText, "Reports", "Insights"]].map(([Icon, title, sub]) => (
                      <div key={title} className="rounded-xl border border-slate-100 bg-white p-2 shadow-sm sm:p-3">
                        <div className="mb-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600 sm:mb-2 sm:h-7 sm:w-7"><Icon size={11} /></div>
                        <p className="text-[7px] font-bold text-slate-800 sm:text-[9px]">{title}</p>
                        <p className="mt-0.5 text-[6px] text-slate-400 sm:mt-1 sm:text-[7px]">{sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 grid grid-cols-[1.35fr_.65fr] gap-1.5 sm:mt-3 sm:gap-2">
                    <div className="rounded-xl border border-slate-100 p-2 shadow-sm sm:p-3">
                      <div className="flex items-center justify-between"><p className="text-[7px] font-bold text-slate-800 sm:text-[9px]">Activity Overview</p><BarChart3 size={11} className="text-blue-500" /></div>
                      <div className="mt-3 flex h-16 items-end gap-1.5 sm:mt-5 sm:h-24 sm:gap-2">
                        {[34, 48, 42, 63, 54, 76, 68, 86, 73, 94].map((height, i) => <div key={i} className="flex-1 rounded-t bg-blue-100" style={{ height: `${height}%` }}><div className="h-1/2 rounded-t bg-blue-500/80" /></div>)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-100 p-2 shadow-sm sm:p-3">
                      <p className="text-[7px] font-bold text-slate-800 sm:text-[9px]">Overview</p>
                      <div className="relative mx-auto mt-2 h-14 w-14 rounded-full bg-[conic-gradient(#2563eb_0_62%,#60a5fa_62%_82%,#e2e8f0_82%_100%)] sm:mt-4 sm:h-20 sm:w-20">
                        <div className="absolute inset-2.5 flex items-center justify-center rounded-full bg-white sm:inset-3"><span className="text-[8px] font-bold text-slate-800 sm:text-[11px]">82%</span></div>
                      </div>
                      <div className="mt-2 space-y-1 text-[5px] text-slate-500 sm:mt-3 sm:text-[7px]"><p>● Completed</p><p>● In progress</p><p>● Pending</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Realistic laptop base */}
          <div className="relative mx-auto -mt-1 h-5 w-[108%] -translate-x-[4%] rounded-b-[45%] bg-gradient-to-b from-slate-300 to-slate-400 shadow-[0_22px_28px_rgba(15,23,42,0.18)] sm:h-7">
            <div className="absolute left-1/2 top-0 h-1.5 w-[24%] -translate-x-1/2 rounded-b-full bg-slate-500/50 sm:h-2" />
            <div className="absolute left-1/2 bottom-1 h-1 w-[34%] -translate-x-1/2 rounded-full bg-white/65" />
          </div>
        </div>

        {/* Foreground plant */}
        <div className="absolute bottom-[1%] left-[8%] hidden h-36 w-28 sm:block">
          <div className="absolute bottom-0 left-4 h-16 w-20 rounded-b-[35%] rounded-t-[12px] bg-gradient-to-b from-white to-slate-200 shadow-[0_12px_20px_rgba(15,23,42,0.12)]" />
          <div className="absolute bottom-14 left-[42px] h-20 w-1.5 rounded-full bg-emerald-700" />
          <span className="absolute bottom-24 left-7 h-12 w-7 -rotate-[30deg] rounded-[100%_0_100%_0] bg-emerald-500" />
          <span className="absolute bottom-28 left-12 h-14 w-8 rotate-[15deg] rounded-[0_100%_0_100%] bg-emerald-600" />
          <span className="absolute bottom-22 left-[54px] h-11 w-7 rotate-[55deg] rounded-[100%_0_100%_0] bg-emerald-500" />
        </div>
      </motion.div>

      {/* Floating information card */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="absolute -right-1 top-[30%] z-20 rounded-2xl border border-white/80 bg-white/95 px-3 py-2.5 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur sm:-right-4 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><CheckCircle2 size={17} /></span><div><p className="text-[9px] text-slate-400">Payroll status</p></div></div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 200 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="absolute bottom-[9%] left-0 z-20 rounded-2xl border border-white/80 bg-white/95 px-3 py-2.5 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur sm:-left-3 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheck size={17} /></span><div><p className="text-[9px] text-slate-400">Security</p><p className="text-xs font-bold text-slate-800 sm:text-sm">Protected workspace</p></div></div>
      </motion.div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, text }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold text-blue-600">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[46px]">{title}</h2>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">{text}</p>
    </div>
  );
}

function Hero() {
  return (
    <div>
      <section id="home" className="relative overflow-hidden border-b border-slate-100 bg-white pt-[86px]">
        <div className="absolute left-[4%] top-[15%] h-56 w-56 rounded-full bg-blue-50 blur-3xl" />
        <div className="absolute right-[5%] top-[25%] h-72 w-72 rounded-full bg-indigo-50 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#dbeafe_1px,transparent_1px)] [background-size:26px_26px] opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />

        <div className="relative mx-auto grid max-w-[1440px] items-center gap-10 px-6 pb-16 pt-16 lg:grid-cols-[.92fr_1.08fr] lg:px-12 lg:pb-20 lg:pt-20 xl:gap-4">
          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }} className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600"><Sparkles size={15} /> Smart <span>•</span> Secure <span>•</span> Simple</div>
            <h1 className="max-w-2xl text-5xl font-bold leading-[1.02] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-[68px] xl:text-[76px]">
              Payroll Management<br />
              Made <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Effortless</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-500 sm:text-xl">Automate payroll processes, manage employees, and generate accurate reports with ease. Built for modern teams and growing businesses.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="/register" className="group flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-7 py-4 text-[15px] font-bold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700">Get Started Free <ArrowRight size={18} className="transition group-hover:translate-x-1" /></a>
              <a href="#features" className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-7 py-4 text-[15px] font-bold text-slate-800 transition hover:border-blue-300 hover:text-blue-600"><Play size={15} /> Explore Features</a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-8 gap-y-4 text-sm text-slate-500">
              <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-blue-600" /> Secure & Reliable</span>
              <span className="flex items-center gap-2"><Clock3 size={18} className="text-blue-600" /> Save Time</span>
              <span className="flex items-center gap-2"><BarChart3 size={18} className="text-blue-600" /> Accurate Reports</span>
            </div>
          </motion.div>
          <LaptopPreview />
        </div>

        <div className="relative mx-auto max-w-[1440px] px-6 pb-10 lg:px-12">
          <div className="grid overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.06)] sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Zap, "Automated Payroll", "Process payroll in just a few clicks."],
              [Users, "Employee Management", "Manage employee data efficiently and securely."],
              [FileText, "Reports & Analytics", "Get detailed reports instantly."],
              [ShieldCheck, "Compliance Ready", "Stay aligned with latest regulations."],
            ].map(([Icon, title, text], index) => (
              <div key={title} className={`flex items-center gap-4 p-7 ${index !== 3 ? "lg:border-r" : ""} ${index !== 1 ? "border-slate-200" : "border-slate-200"}`}>
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Icon size={25} /></span>
                <div><h3 className="font-bold text-slate-900">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{text}</p></div>
              </div>
            ))}
          </div>
        </div>
        <a href="#features" className="mx-auto mb-4 flex w-fit items-center gap-2 text-xs font-semibold text-slate-400 hover:text-blue-600">Scroll to explore <ArrowDown size={14} /></a>
      </section>

      <section id="features" className="scroll-mt-24 bg-slate-50/70 px-6 py-24 lg:px-12 lg:py-28">
        <SectionTitle eyebrow="EVERYTHING YOU NEED" title="Powerful features for modern businesses" text="A complete payroll experience designed to make everyday work simpler, faster and more organized." />
        <div className="mx-auto mt-14 grid max-w-[1280px] gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white"><Icon size={22} /></div>
              <h3 className="mt-6 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
              <a href="#contact" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 opacity-0 transition group-hover:opacity-100">Learn more <ArrowRight size={14} /></a>
            </div>
          ))}
        </div>
      </section>

      <section id="solutions" className="scroll-mt-24 bg-white px-6 py-24 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[1280px] items-center gap-16 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-blue-600">BUILT AROUND YOUR WORKFLOW</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[46px]">Everything organized in one simple workspace.</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-500">From employee records to reports, PayRoll Pro keeps your everyday payroll work connected without making the experience complicated.</p>
            <div className="mt-8 space-y-5">
              {[
                [MousePointer2, "Simple workflows", "Clear actions and organized screens keep routine work easy."],
                [FileCheck2, "Centralized records", "Keep employee and payroll documents together and accessible."],
                [PieChart, "Useful insights", "Understand payroll activity through clear reports and visual summaries."],
              ].map(([Icon, title, text]) => <div key={title} className="flex gap-4"><span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon size={20} /></span><div><h3 className="font-bold text-slate-900">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div></div>)}
            </div>
          </div>
          <div className="relative rounded-[28px] bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-7 lg:p-10">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-blue-900/10">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5"><div><p className="text-xs text-slate-400">Workspace</p><p className="mt-1 text-lg font-bold">Today at a glance</p></div><span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600">Overview</span></div>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[[Users, "Team", "Organized"], [CalendarCheck2, "Attendance", "Up to date"], [ReceiptText, "Payroll", "On track"], [BarChart3, "Reports", "Ready"], [FileText, "Documents", "Secure"], [Bell, "Alerts", "Clear"]].map(([Icon, title, sub]) => <div key={title} className="rounded-xl bg-slate-50 p-4"><Icon size={20} className="text-blue-600" /><p className="mt-4 text-sm font-bold text-slate-800">{title}</p><p className="mt-1 text-xs text-slate-400">{sub}</p></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="scroll-mt-24 bg-slate-950 px-6 py-24 text-white lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1280px]">
          <div className="max-w-2xl"><p className="text-sm font-semibold text-blue-300">WHY PAYROLL PRO</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[46px]">Less busywork. More control.</h2><p className="mt-5 text-lg leading-8 text-slate-400">A professional payroll platform that helps your team work confidently from setup to reporting.</p></div>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{benefits.map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 transition hover:bg-white/[0.07]"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300"><Icon size={22} /></span><h3 className="mt-6 text-lg font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{text}</p></div>)}</div>
        </div>
      </section>

      <section id="about" className="scroll-mt-24 bg-white px-6 py-24 lg:px-12 lg:py-28">
        <SectionTitle eyebrow="HOW IT WORKS" title="A simpler way to manage payroll" text="Get from setup to a complete payroll workflow with a few clear steps." />
        <div className="mx-auto mt-14 grid max-w-[1180px] gap-5 md:grid-cols-2 lg:grid-cols-4">{steps.map(([number, title, text]) => <div key={number} className="relative rounded-2xl border border-slate-200 p-7"><span className="text-sm font-bold text-blue-600">{number}</span><h3 className="mt-7 text-lg font-bold text-slate-900">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{text}</p></div>)}</div>
      </section>

      <section id="pricing" className="scroll-mt-24 bg-slate-50 px-6 py-24 lg:px-12 lg:py-28">
        <SectionTitle eyebrow="SIMPLE PLANS" title="Choose what fits your team" text="Start simple and move to a plan that matches the way your organization works." />
        <div className="mx-auto mt-14 grid max-w-[1050px] gap-6 md:grid-cols-3">
          {[{name:"Starter", desc:"For small teams getting organized.", price:"Free", items:["Employee management","Basic payroll workflow","Standard reports"]},{name:"Professional", desc:"For growing teams that need more control.", price:"Custom", items:["Everything in Starter","Advanced reports","Attendance & documents","Priority support"]},{name:"Business", desc:"For organizations with larger workflows.", price:"Custom", items:["Everything in Professional","Flexible workflows","Enhanced controls","Dedicated support"]}].map((plan, i) => <div key={plan.name} className={`rounded-2xl border bg-white p-8 ${i===1 ? "border-blue-500 shadow-xl shadow-blue-900/10" : "border-slate-200"}`}><div className="flex items-center justify-between"><h3 className="text-xl font-bold">{plan.name}</h3>{i===1 && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">Popular</span>}</div><p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">{plan.desc}</p><p className="mt-7 text-3xl font-bold text-slate-950">{plan.price}</p><a href="/register" className="mt-7 block rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-bold text-white hover:bg-blue-700">Get Started</a><ul className="mt-7 space-y-3">{plan.items.map(item => <li key={item} className="flex items-center gap-2 text-sm text-slate-600"><Check size={16} className="text-blue-600" />{item}</li>)}</ul></div>)}
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 bg-white px-6 py-24 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1180px] overflow-hidden rounded-[30px] bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-2xl shadow-blue-900/20 sm:p-12 lg:flex lg:items-center lg:justify-between lg:p-16">
          <div className="max-w-2xl"><p className="text-sm font-semibold text-blue-100">READY TO SIMPLIFY PAYROLL?</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Bring your payroll workflow into one place.</h2><p className="mt-4 text-base leading-7 text-blue-100">Start with a clean, modern payroll experience built around your team.</p></div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:ml-10 lg:shrink-0"><a href="/register" className="rounded-xl bg-white px-6 py-3.5 text-center text-sm font-bold text-blue-700 hover:bg-blue-50">Get Started Free</a><a href="mailto:hello@payrollpro.example" className="flex items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/10"><Mail size={16} /> Contact Us</a></div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-12 lg:px-12">
        <div className="mx-auto grid max-w-[1280px] gap-10 md:grid-cols-4">
          <div className="md:col-span-2"><div className="flex items-center gap-3"><LogoMark /><span className="text-xl font-bold">PayRoll <span className="text-blue-600">Pro</span></span></div><p className="mt-4 max-w-md text-sm leading-6 text-slate-500">Smart payroll management for modern teams. Simple workflows, organized records and clear reporting.</p></div>
          <div><h3 className="font-bold text-slate-900">Product</h3><div className="mt-4 space-y-3 text-sm text-slate-500"><a className="block hover:text-blue-600" href="#features">Features</a><a className="block hover:text-blue-600" href="#solutions">Solutions</a><a className="block hover:text-blue-600" href="#pricing">Pricing</a></div></div>
          <div><h3 className="font-bold text-slate-900">Company</h3><div className="mt-4 space-y-3 text-sm text-slate-500"><a className="block hover:text-blue-600" href="#about">About</a><a className="block hover:text-blue-600" href="#contact">Contact</a><a className="block hover:text-blue-600" href="/login">Log In</a></div></div>
        </div>
        <div className="mx-auto mt-10 max-w-[1280px] border-t border-slate-100 pt-6 text-xs text-slate-400">© 2026 PayRoll Pro. All rights reserved.</div>
      </footer>
    </div>
  );
}

export default Hero;
