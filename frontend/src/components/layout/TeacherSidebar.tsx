import React from "react";
import { useLocation } from "react-router-dom";
import { LayoutDashboard, Database, FileText, Award, MessageSquare } from "@/components/ui/icons";
import RoleSidebar from "./RoleSidebar";

export default function TeacherSidebar() {
  const { pathname } = useLocation();
  const links = [
    {
      href: "/teacher",
      label: "Beranda",
      icon: LayoutDashboard,
      active: pathname === "/teacher" || pathname.startsWith("/teacher/class"),
    },
    {
      href: "/teacher/rag",
      label: "Materi Ajar",
      icon: Database,
      active: pathname === "/teacher/rag",
    },
    {
      href: "/teacher/tasks/new",
      label: "Tugas & Ujian",
      icon: FileText,
      active: pathname.startsWith("/teacher/tasks") || pathname.includes("/tasks/new") || pathname === "/teacher/quiz-generator",
    },
    {
      href: "/teacher/asisten",
      label: "Asisten",
      icon: MessageSquare,
      active: pathname === "/teacher/asisten",
    },
    {
      href: "/teacher/gradebook",
      label: "Buku Nilai",
      icon: Award,
      active: pathname === "/teacher/gradebook",
    },
  ];

  return <RoleSidebar title="Menu Pengajar" storageKey="teacherSidebarCollapsed" links={links} />;
}
