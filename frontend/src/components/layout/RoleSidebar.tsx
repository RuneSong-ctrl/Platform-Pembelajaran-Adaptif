import React, { useState } from "react";
import { Link } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "@/components/ui/icons";
import { audioSynth } from "@/services/audioSynth";

export interface SidebarLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}

/** Shared collapsible sidebar (desktop) + bottom tab bar (mobile) used by the teacher and parent areas. */
export default function RoleSidebar({ title, storageKey, links }: { title: string; storageKey: string; links: SidebarLink[] }) {
  // Remembered per browser so it stays collapsed across page navigation.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });
  const toggleCollapsed = () => {
    audioSynth.playClickSound();
    setCollapsed((v) => {
      try {
        localStorage.setItem(storageKey, v ? "0" : "1");
      } catch {
        // storage blocked: collapse still works until next page
      }
      return !v;
    });
  };

  return (
    <>
      {/* 1. DESKTOP SIDEBAR (collapsible to an icon rail) */}
      <aside
        className={`hidden md:flex ${collapsed ? "w-[76px]" : "w-64"} shrink-0 h-full overflow-y-auto overflow-x-hidden bg-white/80 backdrop-blur-md border-r border-[rgba(28,30,38,0.06)] p-3.5 flex-col shadow-2xs z-20 transition-[width] duration-200 ease-out`}
      >
        <div className={`flex items-center mb-3 ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <span className="px-3 text-mini font-black uppercase tracking-wider text-[#9195A8] whitespace-nowrap">
              {title}
            </span>
          )}
          <button
            onClick={toggleCollapsed}
            className="w-10 h-10 shrink-0 rounded-xl text-[#595F72] hover:bg-[#F0EEF6] hover:text-[#1C1E26] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3B7A]/40"
            aria-label={collapsed ? "Perlebar menu" : "Ciutkan menu"}
            aria-expanded={!collapsed}
            title={collapsed ? "Perlebar menu" : "Ciutkan menu"}
          >
            {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>

        <nav className="space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => audioSynth.playClickSound()}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                aria-current={item.active ? "page" : undefined}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl whitespace-nowrap text-xs font-extrabold transition-all ${
                  item.active
                    ? "bg-[#1C1E26] text-white shadow-xs"
                    : "text-[#595F72] hover:bg-[#F0EEF6]/70 hover:text-[#1C1E26]"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className={collapsed ? "sr-only" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 2. MOBILE BOTTOM TAB BAR: always visible, never covers page content (pages reserve pb-24). */}
      <nav
        aria-label={title}
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[rgba(28,30,38,0.08)] shadow-[0_-8px_24px_rgba(28,30,38,0.06)] flex pb-[env(safe-area-inset-bottom)]"
      >
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => audioSynth.playClickSound()}
              aria-current={item.active ? "page" : undefined}
              className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-mini font-bold ${
                item.active ? "text-[#1C1E26]" : "text-[#9195A8]"
              }`}
            >
              <span className={`px-3 py-1 rounded-full ${item.active ? "bg-[#E3DBF8] text-[#4B3B7A]" : ""}`}>
                <Icon className="w-5 h-5" />
              </span>
              <span className="truncate max-w-full px-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
