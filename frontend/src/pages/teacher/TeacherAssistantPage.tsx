import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import TeacherSidebar from "@/components/layout/TeacherSidebar";
import { ApiService } from "@/services/apiClient";
import { audioSynth } from "@/services/audioSynth";
import { Send, Plus, Trash2, MessageSquare, Copy, Check } from "@/components/ui/icons";

interface Msg {
  sender: "user" | "ai";
  text: string;
  citation?: string;
  isError?: boolean;
}
type Conv = { id: string; title: string; updated_at: string };

const SUGGESTIONS = [
  "Siapa saja siswa yang perlu perhatian, dan apa yang sebaiknya saya lakukan?",
  "Buatkan rencana pelajaran 2 × 45 menit dari materi ini.",
  "Buatkan 5 soal uraian beserta kunci jawabannya dari materi ini.",
  "Jelaskan inti materi ini dengan bahasa sederhana untuk siswa.",
];

export default function TeacherAssistantPage() {
  const { classrooms, documents, currentUser } = useApp();
  const myClasses = classrooms.filter((c) => c.teacherId === currentUser.id);
  const [classId, setClassId] = useState(myClasses[0]?.id || "");
  const classDocs = documents.filter((d) => d.classroomId === classId);
  const [docId, setDocId] = useState("");

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const refresh = () => ApiService.listAIConversations().then((l) => setConvs(l || []));
  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    if (!classId && myClasses[0]) setClassId(myClasses[0].id);
  }, [myClasses, classId]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const newChat = () => {
    setConvId(null);
    setMessages([]);
  };

  const openConv = async (id: string) => {
    const c = await ApiService.getAIConversation(id);
    if (!c) return;
    setConvId(c.id);
    setMessages(c.messages.map((m) => ({ sender: m.sender, text: m.text, citation: m.citation })));
    const doc = documents.find((d) => d.id === c.document_id);
    if (doc) {
      setClassId(doc.classroomId);
      setDocId(doc.id);
    }
  };

  const removeConv = async (id: string) => {
    if (!window.confirm("Hapus percakapan ini?")) return;
    await ApiService.deleteAIConversation(id);
    if (id === convId) newChat();
    refresh();
  };

  const send = async (text = input) => {
    const q = text.trim();
    if (!q || sending) return;
    audioSynth.playClickSound();
    const history = messages.filter((m) => !m.isError);
    setMessages([...messages, { sender: "user", text: q }]);
    setInput("");
    setSending(true);
    const res = await ApiService.chatWithAI({
      message: q,
      history: history.map((m) => ({ sender: m.sender, text: m.text })),
      classroom_id: classId || undefined,
      document_id: docId || undefined,
      conversation_id: convId || undefined,
    });
    setSending(false);
    if (!res?.text) {
      setMessages((m) => [...m, { sender: "ai", text: "Pesan gagal terkirim. Periksa koneksi lalu coba lagi.", isError: true }]);
      return;
    }
    if (res.conversation_id) setConvId(res.conversation_id);
    setMessages((m) => [...m, { sender: "ai", text: res.text, citation: res.citation }]);
    refresh();
  };

  const copy = (i: number, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  const selectCls =
    "p-2 rounded-xl border border-[rgba(28,30,38,0.1)] text-xs font-bold text-[#010105] bg-white focus:outline-none cursor-pointer min-w-0";

  return (
    <div className="h-dvh bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden w-full min-h-0">
        <TeacherSidebar />

        {/* Conversation history */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[rgba(28,30,38,0.06)] bg-white/60 p-3 gap-2">
          <button onClick={newChat} className="clay-btn clay-btn-dark px-3 py-2.5 text-xs font-black flex items-center justify-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" /> Percakapan baru
          </button>
          <div className="flex-1 overflow-y-auto space-y-1 mt-1">
            {convs.length === 0 && <p className="text-xs text-[#9195A8] px-2 py-3">Belum ada riwayat.</p>}
            {convs.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center gap-1 rounded-xl ${c.id === convId ? "bg-[#EEF0F6]" : "hover:bg-[#F1F2F7]"}`}
              >
                <button onClick={() => openConv(c.id)} className="flex-1 min-w-0 text-left px-3 py-2 text-xs font-bold text-[#1C1E26] truncate cursor-pointer">
                  {c.title}
                </button>
                <button
                  onClick={() => removeConv(c.id)}
                  aria-label={`Hapus ${c.title}`}
                  className="p-1.5 mr-1 rounded-lg text-[#9195A8] hover:text-[#ba1a1a] opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 min-h-0 pb-16 md:pb-0">
          {/* Context bar */}
          <div className="shrink-0 px-4 sm:px-6 py-3 border-b border-[rgba(28,30,38,0.06)] flex flex-wrap items-center gap-2">
            <h1 className="text-base font-black text-[#010105] mr-auto">Asisten Mengajar</h1>
            <button onClick={newChat} className="lg:hidden clay-btn clay-btn-white p-2 cursor-pointer" aria-label="Percakapan baru">
              <Plus className="w-4 h-4" />
            </button>
            {myClasses.length > 0 && (
              <>
                <select
                  value={classId}
                  onChange={(e) => {
                    setClassId(e.target.value);
                    setDocId("");
                  }}
                  className={selectCls}
                  aria-label="Kelas"
                >
                  {myClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select value={docId} onChange={(e) => setDocId(e.target.value)} className={`${selectCls} max-w-50`} aria-label="Materi">
                  <option value="">Semua materi kelas</option>
                  {classDocs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.length === 0 && (
                <div className="text-center space-y-5 pt-6">
                  <div className="w-12 h-12 rounded-2xl clay-lavender text-[#4B3B7A] flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-[#010105]">Mau siapkan apa hari ini?</h2>
                    <p className="text-xs text-[#5A5E70] max-w-md mx-auto">
                      Asisten membaca materi dan data nilai kelas yang dipilih di atas. Periksa lagi hasilnya sebelum dipakai di kelas.
                    </p>
                    {myClasses.length === 0 && (
                      <p className="text-xs text-[#852C28] font-bold">
                        Belum ada kelas, jadi jawaban belum bisa merujuk materi Anda. <Link to="/teacher" className="underline">Buat kelas</Link>.
                      </p>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-left">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="clay-card clay-white clay-card-hover p-3.5 text-xs font-bold text-[#1C1E26] cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) =>
                m.sender === "user" ? (
                  <div key={i} className="flex justify-end">
                    <p className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-[#1C1E26] text-white text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
                      {m.text}
                    </p>
                  </div>
                ) : (
                  <div key={i} className="max-w-[92%] space-y-1">
                    <div
                      className={`px-4 py-3 rounded-2xl rounded-tl-md text-sm leading-[1.7] whitespace-pre-wrap [overflow-wrap:anywhere] select-text ${
                        m.isError ? "bg-[#FDE8E8] text-[#9B1C1C]" : "clay-card clay-white"
                      }`}
                    >
                      {m.text}
                    </div>
                    {!m.isError && (
                      <div className="flex items-center gap-3 px-1 text-mini text-[#9195A8]">
                        <button onClick={() => copy(i, m.text)} className="flex items-center gap-1 font-bold hover:text-[#010105] cursor-pointer">
                          {copied === i ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied === i ? "Tersalin" : "Salin"}
                        </button>
                        {m.citation && <span className="truncate">Sumber: {m.citation}</span>}
                      </div>
                    )}
                  </div>
                ),
              )}
              {sending && <p className="text-xs text-[#9195A8] font-bold animate-pulse">Asisten sedang menulis...</p>}
              <div ref={endRef} />
            </div>
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="shrink-0 px-4 sm:px-6 py-3 border-t border-[rgba(28,30,38,0.06)] bg-[#F8F9FD]"
          >
            <div className="max-w-3xl mx-auto flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                maxLength={1500}
                placeholder="Tulis pertanyaan atau permintaan..."
                className="flex-1 resize-none max-h-40 p-3 rounded-2xl border border-[rgba(28,30,38,0.1)] text-sm bg-white focus:outline-none field-sizing-content"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                aria-label="Kirim"
                className="clay-btn clay-btn-dark w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
