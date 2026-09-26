import React from "react";
import { useLocation } from "react-router-dom";
import { LayoutDashboard, Database, Sparkles, Award, MessageSquare } from "@/components/ui/icons";
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
      href: "/teacher/quiz-generator",
      label: "Buat Kuis",
      icon: Sparkles,
      active: pathname === "/teacher/quiz-generator",
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
