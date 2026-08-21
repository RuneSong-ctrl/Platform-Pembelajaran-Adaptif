import React from "react";
import { Routes, Route } from "react-router-dom";

// Pages
import LandingPage from "./pages/LandingPage";
import StudentHomePage from "./pages/StudentHomePage";
import AdaptiveLearnPage from "./pages/AdaptiveLearnPage";
import StudentClassPage from "./pages/StudentClassPage";
import StudentAIPage from "./pages/StudentAIPage";
import StudentProfilePage from "./pages/StudentProfilePage";
import LearningPathwayStatusPage from "./pages/LearningPathwayStatusPage";
import StudentSchedulePage from "./pages/StudentSchedulePage";
import AssessmentPage from "./pages/AssessmentPage";
import AdaptiveQuizPage from "./pages/AdaptiveQuizPage";
import StudentPassportPage from "./pages/StudentPassportPage";
import TeacherDashboardPage from "./pages/TeacherDashboardPage";
import GradebookPage from "./pages/GradebookPage";
import QuizStudioPage from "./pages/QuizStudioPage";
import TeacherRAGPage from "./pages/TeacherRAGPage";
import ParentPortalPage from "./pages/ParentPortalPage";
import PublicVerifyPage from "./pages/PublicVerifyPage";
import NotFoundPage from "./pages/NotFoundPage";
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
        <Route path="/verify" element={<PublicVerifyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <PWAInstallPrompt />
    </>
  );
}
