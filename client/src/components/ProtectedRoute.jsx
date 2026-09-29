import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// ponytail: token validity is decided by the existing AuthContext (/auth/me), not by reading
// localStorage here — one source of truth for "is this session real"
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] pt-[72px] grid place-items-center">
        <div className="text-sm text-zinc-500">Checking your session…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // remember where they were headed so login can send them back
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
