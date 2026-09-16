import React from "react";
import { Routes, Route } from "react-router-dom";

// Modular Pages by Role
import {
  AuthGatePage,
  PublicVerifyPage,
  NotFoundPage,
  StudentHomePage,
  AdaptiveLearnPage,
  StudentClassPage,
  ClassDetailPage,
  ClassMaterialReaderPage,
  StudentAIPage,
  StudentProfilePage,
  LearningPathwayStatusPage,
  StudentSchedulePage,
  AssessmentPage,
  AdaptiveQuizPage,
  StudentPassportPage,
  TeacherDashboardPage,
  GradebookPage,
  QuizStudioPage,
  TeacherRAGPage,
  ParentPortalPage,
  ParentChatPage,
} from "@/pages";
import ProtectedRoute from "./components/common/ProtectedRoute";
import PWAInstallPrompt from "./components/common/PWAInstallPrompt";

export default function App() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<AuthGatePage />} />
        <Route path="/verify" element={<PublicVerifyPage />} />

        {/* Protected Student Routes */}
        <Route
          path="/assessment"
          element={
            <ProtectedRoute allowedRoles={["SISWA"]} requireAssessment={false}>
              <AssessmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["SISWA"]}>
              <StudentHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/learn"
          element={
            <ProtectedRoute allowedRoles={["SISWA"]}>
              <AdaptiveLearnPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/ai"
          element={
            <ProtectedRoute allowedRoles={["SISWA"]}>
              <StudentAIPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/class"
          element={
            <ProtectedRoute allowedRoles={["SISWA"]}>
              <StudentClassPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/class/:classId"
          element={
            <ProtectedRoute allowedRoles={["SISWA"]}>
              <ClassDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/class/:classId/materi/:docId"
          element={
            <ProtectedRoute allowedRoles={["SISWA"]}>
              <ClassMaterialReaderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={["SISWA"]}>
              <StudentProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/status"
          element={
            <ProtectedRoute allowedRoles={["SISWA"]}>
              <LearningPathwayStatusPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/schedule"
          element={
            <ProtectedRoute allowedRoles={["SISWA"]}>
              <StudentSchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute allowedRoles={["SISWA"]}>
              <AdaptiveQuizPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/passport"
          element={
            <ProtectedRoute allowedRoles={["SISWA"]}>
              <StudentPassportPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Teacher Routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={["GURU"]}>
              <TeacherDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/gradebook"
          element={
            <ProtectedRoute allowedRoles={["GURU"]}>
              <GradebookPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/quiz-generator"
          element={
            <ProtectedRoute allowedRoles={["GURU"]}>
              <QuizStudioPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/rag"
          element={
            <ProtectedRoute allowedRoles={["GURU"]}>
              <TeacherRAGPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Parent Routes */}
        <Route
          path="/parent"
          element={
            <ProtectedRoute allowedRoles={["ORTU"]}>
              <ParentPortalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/chat"
          element={
            <ProtectedRoute allowedRoles={["ORTU"]}>
              <ParentChatPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <PWAInstallPrompt />
    </>
  );
}
