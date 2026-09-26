import React, { useEffect, useRef, useState } from "react";
import { ApiService, DirectMessage, utcDate } from "@/services/apiClient";
import { Send } from "@/components/ui/icons";
import { useLiveEvents } from "@/services/liveEvents";

const when = (iso: string) =>
  utcDate(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/**
 * Private chat between a class teacher and one student. Students leave studentId out (they only have
 * their own thread). New messages arrive through the live channel; a slow poll covers a dropped connection.
 */
export default function MessageThread({
  classroomId,
  studentId,
  parentId,
  emptyHint,
  onRead,
}: {
  classroomId: string;
  studentId?: string;
  /** Teacher answering a parent: that parent's id. Parents and students leave it out. */
  parentId?: string | null;
  emptyHint: string;
  onRead?: () => void;
}) {
  const [messages, setMessages] = useState<DirectMessage[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const loadRef = useRef<() => void>(() => {});

  useEffect(() => {
    let alive = true;
    const load = () =>
      ApiService.getMessages(classroomId, studentId, parentId || undefined)
        .then((m) => {
          if (!alive) return;
          setMessages(m);
          onRead?.();
        })
        .catch((e) => alive && setError(e.message));
    loadRef.current = load;
    setMessages(null);
    load();
    const timer = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
    // onRead is a callback from the parent; re-subscribing on every render would restart polling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId, studentId, parentId]);

  // A student's own thread has no studentId prop; any message event in this class is theirs.
  useLiveEvents((e) => {
    if (e.type === "message" && e.classroom_id === classroomId && (!studentId || e.student_id === studentId)) loadRef.current();
    // (the server only sends events for threads this user belongs to; refetching is cheap and access-checked)
  });

  useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), [messages?.length]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const m = await ApiService.sendMessage(classroomId, text.trim(), studentId, parentId || undefined);
      setMessages((xs) => [...(xs || []), m]);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pesan gagal terkirim.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 min-h-0">
      <div className="max-h-[45vh] min-h-40 overflow-y-auto space-y-2.5 pr-1">
        {messages === null ? (
          <p className="text-xs text-[#9195A8]">Memuat pesan...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-[#5A5E70] text-center py-8 px-4">{emptyHint}</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}>
              <p
                className={`max-w-[85%] px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] ${
                  m.mine ? "bg-[#1C1E26] text-white rounded-2xl rounded-br-md" : "bg-[#F0EEF6] text-[#1C1E26] rounded-2xl rounded-bl-md"
                }`}
              >
                {m.text}
              </p>
              <span className="text-mini text-[#9195A8] mt-0.5 px-1">
                {m.mine ? "" : `${m.sender_name} · `}
                {when(m.created_at)}
                {m.mine && m.read && " · Dibaca"}
              </span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {error && <p role="alert" className="text-xs font-bold text-[#852C28]">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-end gap-2"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Tulis pesan..."
          aria-label="Tulis pesan"
          className="flex-1 resize-none max-h-32 p-3 rounded-2xl border border-[rgba(28,30,38,0.1)] text-sm bg-[#F8F9FD] focus:outline-none focus:border-[#4B3B7A] field-sizing-content"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          aria-label="Kirim pesan"
          className="clay-btn clay-btn-dark w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
