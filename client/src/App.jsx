import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import UploadPage from "./pages/UploadPage.jsx";
import NotificationTest from "./components/NotificationTest.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardLayout from "./components/dashboard/DashboardLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Subscriptions from "./pages/Subscriptions.jsx";
import Reminders from "./pages/Reminders.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/notification-test" element={<NotificationTest />} />

          {/* one guard for the whole authenticated app */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/subscriptions" element={<Subscriptions />} />
            <Route path="/dashboard/reminders" element={<Reminders />} />
            <Route path="/dashboard/settings" element={<Settings />} />
          </Route>

          <Route path="/dashboard/*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
