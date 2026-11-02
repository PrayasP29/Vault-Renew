import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ThemeToggle } from "../context/ThemeContext.jsx";
import { cn } from "../lib/utils.js";

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
            "rounded-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl",
            "border border-zinc-200/70 dark:border-zinc-800",
            "shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
            "px-3 sm:px-4 py-2"
          )}
        >
          <Link to="/" className="flex items-center gap-2.5 shrink-0 pl-1">
            <span className="h-7 w-7 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
              <span className="h-2.5 w-2.5 rounded-full bg-white dark:bg-zinc-900" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Vault-Renew
            </span>
          </Link>

          {/* desktop nav */}
          <div className="hidden md:flex items-center gap-1 bg-zinc-900/[0.04] dark:bg-zinc-800/50 rounded-full p-1 border border-zinc-200/60 dark:border-zinc-800">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.to}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors",
                  isActive(l.to.split("#")[0]) && !l.to.includes("#")
                    ? "bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
                onClick={(e) => {
                  if (l.to.includes("#")) {
                    e.preventDefault();
                    if (loc.pathname !== "/") nav("/");
                    setTimeout(() => {
                      document
                        .querySelector(l.to.split("#")[1] ? `#${l.to.split("#")[1]}` : "")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }, 80);
                  }
                }}
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 rounded-full text-[13px] font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className="px-3.5 py-1.5 rounded-full text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Dashboard
                </Link>
                <Link
                  to="/upload"
                  className="px-3.5 py-1.5 rounded-full text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Upload
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-1.5 rounded-full text-[13px] font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* mobile toggle */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
              className="h-9 w-9 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 grid place-items-center"
            >
              <span className="text-[11px] font-mono tracking-widest">{open ? "✕" : "≡"}</span>
            </button>
          </div>
        </nav>

        {/* mobile panel */}
        {open && (
          <div className="md:hidden pointer-events-auto mt-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-3 space-y-1">
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
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                {l.label}
              </a>
            ))}
            <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
            {!isAuthenticated ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-center text-sm font-semibold"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="grid gap-2 pt-1">
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-center text-sm font-semibold"
                >
                  Dashboard
                </Link>
                <Link
                  to="/upload"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Upload Invoice
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="px-4 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-center text-sm font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
