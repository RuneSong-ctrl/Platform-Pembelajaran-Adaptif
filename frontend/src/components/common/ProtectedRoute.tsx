import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("SISWA" | "GURU" | "ORTU")[];
  requireAssessment?: boolean;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  requireAssessment = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, currentUser } = useApp();
  const location = useLocation();

  // 1. If not authenticated, redirect to official auth gate (/)
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 2. Check role authorization
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    if (currentUser.role === "SISWA") return <Navigate to="/student" replace />;
    if (currentUser.role === "GURU") return <Navigate to="/teacher" replace />;
    if (currentUser.role === "ORTU") return <Navigate to="/parent" replace />;
    return <Navigate to="/" replace />;
  }

  // 3. If student has not completed initial ability & learning style assessment, redirect to /assessment
  if (
    currentUser.role === "SISWA" &&
    !currentUser.learningStyle &&
    requireAssessment &&
    location.pathname !== "/assessment"
  ) {
    return <Navigate to="/assessment" replace />;
  }

  return <>{children}</>;
}
