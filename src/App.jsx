import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getToken } from "./lib/auth";

import AuthPage from "./pages/AuthPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import DashboardPage from "./pages/DashboardPage";

// admin pages
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

function PrivateRoute({ children }) {
  const token = getToken();
  return token ? children : <Navigate to="/auth" replace />;
}

function AdminPrivateRoute({ children }) {
  const token = getToken();
  return token ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* user */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* keep /login for compatibility */}
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<AuthPage />} />

      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />

      {/* admin */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <AdminPrivateRoute>
            <AdminDashboardPage />
          </AdminPrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
