import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { ApiService, Announcement, MessageThreadSummary, utcDate } from "@/services/apiClient";
import { Bell, MessageSquare, ChevronRight } from "@/components/ui/icons";
import { useLiveEvents } from "@/services/liveEvents";

/** Latest announcements and unread teacher replies across the student's classes. Hidden when there is nothing new. */
export default function TeacherNews() {
  const { classrooms } = useApp();
  const [news, setNews] = useState<Announcement[]>([]);
  const [unread, setUnread] = useState<MessageThreadSummary[]>([]);

  const load = () => {
    ApiService.getAnnouncements().then((a) => setNews(a.slice(0, 3))).catch(() => {});
    ApiService.getMessageThreads().then((t) => setUnread(t.filter((x) => x.unread > 0))).catch(() => {});
  };
  useEffect(load, []);
  useLiveEvents(load);

  if (news.length === 0 && unread.length === 0) return null;
  const className = (id: string) => classrooms.find((c) => c.id === id)?.name || "Kelas";

  return (
    <section className="clay-card clay-white p-4 sm:p-5 space-y-3 shadow-xs">
      <h2 className="text-sm sm:text-base font-extrabold text-[#010105] flex items-center gap-2">
        <Bell className="w-4 h-4 text-[#4B3B7A]" /> Kabar dari guru
      </h2>

      {unread.map((t) => (
        <Link
          key={t.classroom_id}
          to={`/student/class/${t.classroom_id}`}
          className="flex items-center gap-3 p-3 rounded-2xl bg-[#1C1E26] text-white hover:opacity-90"
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span className="flex-1 min-w-0 text-xs">
            <b className="font-black">{t.teacher_name}</b> membalas pesanmu · {t.classroom_name}
          </span>
          <ChevronRight className="w-4 h-4 shrink-0" />
        </Link>
      ))}

      {news.map((a) => (
        <Link
          key={a.id}
          to={`/student/class/${a.classroom_id}`}
          className="block p-3 rounded-2xl bg-[#F8F9FD] hover:bg-[#F0EEF6] transition-colors"
        >
          <span className="block text-mini font-bold text-[#9195A8]">
            {className(a.classroom_id)} · {utcDate(a.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
          </span>
          <span className="block text-xs text-[#1C1E26] line-clamp-2 mt-0.5">{a.text}</span>
        </Link>
      ))}
    </section>
  );
}
