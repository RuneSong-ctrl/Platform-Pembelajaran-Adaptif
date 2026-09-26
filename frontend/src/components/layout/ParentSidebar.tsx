import React from "react";
import { useLocation } from "react-router-dom";
import { LayoutDashboard, MessageSquare } from "@/components/ui/icons";
import RoleSidebar from "./RoleSidebar";

export default function ParentSidebar() {
  const { pathname } = useLocation();
  const links = [
    { href: "/parent", label: "Ringkasan", icon: LayoutDashboard, active: pathname === "/parent" },
    { href: "/parent/chat", label: "Pesan guru", icon: MessageSquare, active: pathname === "/parent/chat" },
  ];
  return <RoleSidebar title="Menu Orang Tua" storageKey="parentSidebarCollapsed" links={links} />;
}
