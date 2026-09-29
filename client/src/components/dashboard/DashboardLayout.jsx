import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { cn } from "../../lib/utils.js";

const NAV = [
  { to: "/dashboard", label: "Dashboard", end: true },
  { to: "/dashboard/subscriptions", label: "Subscriptions" },
  { to: "/dashboard/reminders", label: "Reminders" },
  { to: "/upload", label: "Upload" },
  { to: "/dashboard/settings", label: "Settings" },
];

const itemClass = (isActive) =>
  cn(
    "block rounded-xl px-3 py-2 text-sm font-medium transition",
    isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
  );

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] pt-[72px]">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* sidebar - desktop */}
          <aside className="hidden md:block w-[220px] shrink-0">
            <div className="sticky top-[88px] rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="px-1 pb-3 border-b border-zinc-100">
                <div className="text-sm font-semibold tracking-tight truncate">{user?.name}</div>
                <div className="text-xs text-zinc-500 truncate">{user?.email}</div>
              </div>
              <nav className="mt-3 space-y-1">
                {NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => itemClass(isActive)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <button
                onClick={signOut}
                className="mt-4 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              >
                Logout
              </button>
            </div>
          </aside>

          {/* nav - mobile, wraps so nothing scrolls sideways */}
          <div className="md:hidden">
            <div className="rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm">
              <div className="text-sm font-semibold tracking-tight px-1">{user?.name}</div>
              <nav className="mt-2 flex flex-wrap gap-1.5">
                {NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "rounded-full px-3 py-1.5 text-[13px] font-medium transition",
                        isActive ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                <button
                  onClick={signOut}
                  className="rounded-full border border-zinc-200 px-3 py-1.5 text-[13px] font-medium text-zinc-600"
                >
                  Logout
                </button>
              </nav>
            </div>
          </div>

          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
