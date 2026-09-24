import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { cn } from "../lib/utils.js";

// futuristic-nav adapted: floating pill, minimal, trustworthy
// ponytail: no framer-motion, CSS only — add motion lib if measured jank
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();

  const isActive = (path) => loc.pathname === path || loc.hash === path;

  const links = [
    { label: "Home", to: "/" },
    { label: "How It Works", to: "/#how-it-works" },
    { label: "FAQ", to: "/#faq" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 pointer-events-none">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 pt-4 sm:pt-5">
        <nav
          className={cn(
            "pointer-events-auto flex items-center justify-between gap-3",
            "rounded-full bg-white/85 backdrop-blur-xl border border-zinc-200/70",
            "shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.06)]",
            "px-3 sm:px-4 py-2"
          )}
        >
          <Link to="/" className="flex items-center gap-2.5 shrink-0 pl-1">
            <span className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center">
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-zinc-900">Vault-Renew</span>
          </Link>

          {/* desktop nav */}
          <div className="hidden md:flex items-center gap-1 bg-zinc-900/[0.04] rounded-full p-1 border border-zinc-200/60">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.to}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors",
                  isActive(l.to.split("#")[0]) && !l.to.includes("#")
                    ? "bg-white shadow-sm border border-zinc-200 text-zinc-900"
                    : "text-zinc-600 hover:text-zinc-900"
                )}
                onClick={(e) => {
                  if (l.to.includes("#")) {
                    e.preventDefault();
                    if (loc.pathname !== "/") nav("/");
                    setTimeout(() => {
                      document.querySelector(l.to.split("#")[1] ? `#${l.to.split("#")[1]}` : "")?.scrollIntoView({ behavior: "smooth" });
                    }, 80);
                  }
                }}
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="px-4 py-2 rounded-full text-[13px] font-medium text-zinc-700 hover:bg-zinc-100 transition">
                  Login
                </Link>
                <Link to="/signup" className="px-5 py-2 rounded-full text-[13px] font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <Link to="/upload" className="px-4 py-2 rounded-full text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800">
                  Dashboard
                </Link>
                <button onClick={logout} className="px-4 py-2 rounded-full text-[13px] font-medium text-zinc-600 hover:bg-zinc-100">
                  Logout
                </button>
              </>
            )}
          </div>

          {/* mobile toggle */}
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden h-9 w-9 rounded-full bg-zinc-900 text-white grid place-items-center"
          >
            <span className="text-[11px] font-mono tracking-widest">{open ? "✕" : "≡"}</span>
          </button>
        </nav>

        {/* mobile panel */}
        {open && (
          <div className="md:hidden pointer-events-auto mt-2 rounded-2xl bg-white border border-zinc-200 shadow-xl p-3 space-y-1">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.to}
                onClick={(e) => {
                  setOpen(false);
                  if (l.to.includes("#")) {
                    e.preventDefault();
                    document.querySelector(`#${l.to.split("#")[1]}`)?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                {l.label}
              </a>
            ))}
            <div className="h-px bg-zinc-100 my-1" />
            {!isAuthenticated ? (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-full border border-zinc-200 text-center text-sm font-medium">Login</Link>
                <Link to="/signup" onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-full bg-zinc-900 text-white text-center text-sm font-semibold">Get Started</Link>
              </div>
            ) : (
              <div className="grid gap-2">
                <Link to="/upload" onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-full bg-zinc-900 text-white text-center text-sm font-semibold">Dashboard</Link>
                <button onClick={() => { setOpen(false); logout(); }} className="px-4 py-2.5 rounded-full border text-center text-sm">Logout</button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
