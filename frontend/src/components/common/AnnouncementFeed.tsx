import React, { useEffect, useState } from "react";
import { ApiService, Announcement, utcDate } from "@/services/apiClient";
import { audioSynth } from "@/services/audioSynth";
import { Bell, Clock, Send, Trash2 } from "@/components/ui/icons";
import { useLiveEvents } from "@/services/liveEvents";

const when = (iso: string) =>
  utcDate(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Class announcements. The class teacher (canPost) can write and delete; students only read. */
export default function AnnouncementFeed({ classroomId, canPost = false }: { classroomId: string; canPost?: boolean }) {
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const load = () =>
    ApiService.getAnnouncements(classroomId)
      .then(setItems)
      .catch((e) => {
        setItems([]);
        setError(e.message);
      });
  useEffect(() => {
    setItems(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId]);
  useLiveEvents((e) => {
    if (e.type === "announcement" && e.classroom_id === classroomId && !canPost) load();
  });

  const post = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    setError("");
    try {
      const a = await ApiService.postAnnouncement(classroomId, text.trim());
      setItems((xs) => [a, ...(xs || [])]);
      setText("");
      audioSynth.playSuccessSound();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pengumuman gagal dikirim.");
    } finally {
      setPosting(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Hapus pengumuman ini? Siswa tidak akan melihatnya lagi.")) return;
    try {
      await ApiService.deleteAnnouncement(id);
      setItems((xs) => (xs || []).filter((a) => a.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus.");
    }
  };

  return (
    <div className="space-y-3">
      {canPost && (
        <div className="clay-card clay-white p-4 space-y-2.5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Tulis pengumuman untuk seluruh kelas, misalnya jadwal ulangan atau tugas yang perlu disiapkan."
            aria-label="Isi pengumuman"
            className="w-full p-3 rounded-2xl border border-[rgba(28,30,38,0.1)] text-sm bg-[#F8F9FD] focus:outline-none focus:border-[#4B3B7A] resize-none"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-mini text-[#9195A8]">Semua siswa di kelas ini akan melihatnya.</span>
            <button
              onClick={post}
              disabled={!text.trim() || posting}
              className="clay-btn clay-btn-dark px-4 py-2 text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" /> {posting ? "Mengirim..." : "Umumkan"}
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-xs font-bold text-[#852C28]">{error}</p>}

      {items === null ? (
        <p className="text-xs text-[#9195A8] px-1">Memuat pengumuman...</p>
      ) : items.length === 0 ? (
        <div className="clay-card bg-white p-8 rounded-3xl border border-black/5 text-center space-y-2 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#F0EEF6] text-[#5A5E70] flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black text-[#1C1E26]">Belum ada pengumuman</h3>
          <p className="text-xs text-[#5A5E70] max-w-xs mx-auto">
            {canPost ? "Pengumuman yang Anda tulis akan muncul di sini dan di halaman siswa." : "Pengumuman dari guru akan muncul di sini."}
          </p>
        </div>
      ) : (
        items.map((a) => (
          <article key={a.id} className="clay-card bg-white p-4 sm:p-5 rounded-3xl border border-black/5 space-y-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E3DBF8] text-[#4B3B7A] flex items-center justify-center text-sm font-black shrink-0">
                {a.author_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-black text-[#1C1E26] block truncate">{a.author_name}</span>
                <span className="text-mini text-[#5A5E70] font-medium flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-[#9195A8]" /> {when(a.created_at)}
                </span>
              </div>
              {canPost && (
                <button
                  onClick={() => remove(a.id)}
                  aria-label="Hapus pengumuman"
                  className="p-2 rounded-xl text-[#9195A8] hover:text-[#ba1a1a] hover:bg-[#FDE8E8] cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-sm leading-relaxed text-[#1C1E26] whitespace-pre-wrap [overflow-wrap:anywhere]">{a.text}</p>
          </article>
        ))
      )}
    </div>
  );
}
