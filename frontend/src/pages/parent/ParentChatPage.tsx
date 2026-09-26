import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import ParentShell from "@/components/parent/ParentShell";
import MessageThread from "@/components/common/MessageThread";
import { ApiService, MessageThreadSummary } from "@/services/apiClient";
import { useLiveEvents } from "@/services/liveEvents";
import { ArrowLeft } from "@/components/ui/icons";
import type { User } from "@/types";

export default function ParentChatPage() {
  return <ParentShell title="Pesan guru">{(child) => <ChildMessages key={child.id} child={child} />}</ParentShell>;
}

/** One private thread per class teacher of the selected child. */
function ChildMessages({ child }: { child: User }) {
  const { classrooms } = useApp();
  const [params, setParams] = useSearchParams();
  const [threads, setThreads] = useState<MessageThreadSummary[]>([]);
  const classes = classrooms.filter((c) => c.studentIds.includes(child.id));
  const active = classes.find((c) => c.id === params.get("kelas"));

  const load = () => ApiService.getMessageThreads().then(setThreads).catch(() => {});
  useEffect(() => {
    load();
  }, []);
  useLiveEvents((e) => e.type === "message" && load());

  const unread = (classId: string) =>
    threads.find((t) => t.classroom_id === classId && t.student_id === child.id)?.unread || 0;
  const open = (id: string | null) => setParams(id ? { kelas: id } : {}, { replace: true });

  if (classes.length === 0) {
    return (
      <div className="clay-card clay-white p-5 text-sm text-[#5A5E70]">
        {child.name} belum bergabung ke kelas mana pun, jadi belum ada guru yang bisa dihubungi.
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-4">
      {/* Teacher list (hidden on phones while a conversation is open) */}
      <ul className={`clay-card clay-white divide-y divide-[rgba(28,30,38,0.06)] self-start ${active ? "hidden md:block" : ""}`}>
        {classes.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => open(c.id)}
              aria-current={c.id === active?.id ? "true" : undefined}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 cursor-pointer ${c.id === active?.id ? "bg-[#F0EEF6]" : "hover:bg-[#F8F9FD]"}`}
            >
              <span className="w-9 h-9 rounded-full bg-[#E0DAF5] text-[#4B3B7A] font-black text-sm flex items-center justify-center shrink-0">
                {c.teacherName.charAt(0).toUpperCase()}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-black text-[#010105] truncate">{c.teacherName}</span>
                <span className="block text-xs text-[#5A5E70] truncate">{c.name}</span>
              </span>
              {unread(c.id) > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#1C1E26] text-white text-mini font-black flex items-center justify-center">
                  {unread(c.id)}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {active ? (
        <section className="clay-card clay-white p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={() => open(null)} className="md:hidden p-1.5 -ml-1 rounded-lg text-[#5A5E70] cursor-pointer" aria-label="Kembali ke daftar guru">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-[#010105] truncate">{active.teacherName}</h2>
              <p className="text-xs text-[#5A5E70] truncate">
                {active.name} · tentang {child.name.split(" ")[0]} · hanya Anda dan guru yang bisa membaca
              </p>
            </div>
          </div>
          <MessageThread
            classroomId={active.id}
            studentId={child.id}
            emptyHint={`Belum ada pesan. Tanyakan perkembangan ${child.name.split(" ")[0]} atau sampaikan hal yang perlu guru ketahui.`}
            onRead={load}
          />
        </section>
      ) : (
        <div className="hidden md:flex clay-card clay-white p-8 items-center justify-center text-sm text-[#5A5E70]">
          Pilih guru untuk mulai berkirim pesan.
        </div>
      )}
    </div>
  );
}
