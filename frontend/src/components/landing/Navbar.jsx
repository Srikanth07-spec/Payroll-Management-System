import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#solutions" },
  { label: "Benefits", href: "#benefits" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-[86px] max-w-[1440px] items-center justify-between px-6 lg:px-12">
        <a href="#home" onClick={closeMobile} className="flex items-center gap-3">
          <span className="relative flex h-12 w-12 items-center justify-center rounded-[13px] bg-gradient-to-br from-[#4d8dff] via-[#2563eb] to-[#3154d9] text-white shadow-lg shadow-blue-500/25">
            <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8" fill="none">
              <path d="M8 6.5h10.5a6.5 6.5 0 0 1 0 13H12v5.8H8V6.5Z" fill="white" />
              <path d="M12 10.5v5h6.2a2.5 2.5 0 0 0 0-5H12Z" fill="#4d8dff" />
              <path d="M8 21.5v5.2l5.1-5.2H8Z" fill="white" />
            </svg>
          </span>
          <span className="leading-none">
            <span className="block text-[24px] font-bold tracking-tight text-slate-950">
              PayRoll <span className="text-blue-600">Pro</span>
            </span>
            <span className="mt-1 block text-[13px] font-medium text-slate-500">
              Smart Payroll Management
            </span>
          </span>
        </a>

        <div className="hidden items-center gap-9 lg:flex">
          {navLinks.map((link, index) => (
            <a
              key={link.label}
              href={link.href}
              className={`relative py-7 text-[15px] font-medium transition-colors ${
                index === 0 ? "text-blue-600" : "text-slate-700 hover:text-blue-600"
              }`}
            >
              {link.label}
              {index === 0 && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-600" />
              )}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="/login"
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-[15px] font-semibold text-slate-800 transition hover:border-blue-300 hover:text-blue-600"
          >
            Log In
          </a>
          <a
            href="/register"
            className="group flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            Get Started
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((value) => !value)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-slate-200 bg-white lg:hidden"
          >
            <div className="mx-auto max-w-[1440px] px-6 py-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={closeMobile}
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <a href="/login" onClick={closeMobile} className="rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold">Log In</a>
                <a href="/register" onClick={closeMobile} className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white">Get Started</a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
