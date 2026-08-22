import React from "react";
import { Routes, Route } from "react-router-dom";

// Modular Pages by Role
import {
  LandingPage,
  PublicVerifyPage,
  NotFoundPage,
  StudentHomePage,
  AdaptiveLearnPage,
  StudentClassPage,
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
import PWAInstallPrompt from "./components/common/PWAInstallPrompt";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/student" element={<StudentHomePage />} />
        <Route path="/student/learn" element={<AdaptiveLearnPage />} />
        <Route path="/student/ai" element={<StudentAIPage />} />
        <Route path="/student/class" element={<StudentClassPage />} />
        <Route path="/student/profile" element={<StudentProfilePage />} />
        <Route path="/student/status" element={<LearningPathwayStatusPage />} />
        <Route path="/student/schedule" element={<StudentSchedulePage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/quiz" element={<AdaptiveQuizPage />} />
        <Route path="/passport" element={<StudentPassportPage />} />
        <Route path="/teacher" element={<TeacherDashboardPage />} />
        <Route path="/teacher/gradebook" element={<GradebookPage />} />
        <Route path="/teacher/quiz-generator" element={<QuizStudioPage />} />
        <Route path="/teacher/rag" element={<TeacherRAGPage />} />
        <Route path="/parent" element={<ParentPortalPage />} />
        <Route path="/parent/chat" element={<ParentChatPage />} />
        <Route path="/verify" element={<PublicVerifyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <PWAInstallPrompt />
    </>
  );
}

