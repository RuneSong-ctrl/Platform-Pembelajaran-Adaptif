import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import StudentSidebar from "@/components/layout/StudentSidebar";
import { audioSynth } from "@/services/audioSynth";
import { ApiService } from "@/services/apiClient";
import {
  Send,
  Bot,
  BookOpen,
  ArrowLeft,
  AlertCircle,
  Lightbulb,
  Brain,
  Sparkles,
  HelpCircle,
  Plus,
  Trash2,
  MessageSquare,
  X,
} from "@/components/ui/icons";

interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  citation?: string;
  timestamp: string;
  isError?: boolean;
}

// Backend sends naive UTC timestamps; mark them as UTC before formatting.
const parseDate = (iso?: string) =>
  iso ? new Date(/Z$|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`) : new Date();
const toTime = (iso?: string) => parseDate(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const now = () => toTime();
const toListDate = (iso: string) => {
  const d = parseDate(iso);
  return d.toDateString() === new Date().toDateString()
    ? toTime(iso)
    : d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

interface ConversationSummary {
  id: string;
  title: string;
  document_id?: string | null;
  updated_at: string;
}

export default function StudentAIPage() {
  const { currentUser, documents, classrooms } = useApp();
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ConversationSummary | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [convsLoading, setConvsLoading] = useState(true);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [loadingConv, setLoadingConv] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const myClassrooms = classrooms.filter((c) =>
    Boolean(currentUser?.id && c.studentIds?.includes(currentUser.id))
  );
  const effectiveClassrooms = myClassrooms.length > 0 ? myClassrooms : classrooms;
  const activeDocs = documents.filter((d) =>
    effectiveClassrooms.some((c) => c.id === d.classroomId)
  );
  const availableDocs = activeDocs.length > 0 ? activeDocs : documents;

  const [selectedDocId, setSelectedDocId] = useState<string>(availableDocs[0]?.id || "");

  const primaryDoc =
    availableDocs.find((d) => d.id === selectedDocId) || availableDocs[0] || documents[0];

  const firstName = (currentUser?.name || "Siswa").split(" ")[0];
  const greeting = primaryDoc
    ? `Jawabanku merujuk ke materi dari gurumu: "${primaryDoc.title}". Tanyakan apa saja yang belum kamu pahami.`
    : "Gurumu belum mengunggah materi, jadi aku akan menjawab dengan pengetahuan umum. Tanyakan konsep pelajaran apa saja.";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const hasConversation = messages.length > 0;

  const suggestions = primaryDoc
    ? [
        { icon: BookOpen, text: `Ringkas materi "${primaryDoc.title.slice(0, 40)}"` },
        { icon: Lightbulb, text: "Apa konsep paling penting yang harus aku kuasai?" },
        { icon: Sparkles, text: "Beri contoh atau analogi sederhana untuk materi ini" },
        { icon: HelpCircle, text: "Buatkan 3 soal latihan beserta pembahasannya" },
      ]
    : [
        { icon: Brain, text: "Bagaimana cara belajar yang efektif?" },
        { icon: Lightbulb, text: "Apa itu tingkat kesulitan adaptif di EduAdapt?" },
        { icon: HelpCircle, text: "Bagaimana cara bergabung ke kelas guru?" },
        { icon: Sparkles, text: "Beri tips mengatur jadwal belajar mandiri" },
      ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const refreshConversations = async () => {
    const list = await ApiService.listAIConversations();
    if (list) setConversations(list);
    setConvsLoading(false);
  };

  useEffect(() => {
    refreshConversations();
  }, []);

  const startNewChat = () => {
    audioSynth.playClickSound();
    setActiveConvId(null);
    setMessages([]);
    setHistoryOpen(false);
    textareaRef.current?.focus();
  };

  const openConversation = async (id: string) => {
    setHistoryOpen(false);
    if (id === activeConvId || isTyping) return;
    audioSynth.playClickSound();
    setActiveConvId(id);
    setLoadingConv(true);
    const conv = await ApiService.getAIConversation(id);
    setLoadingConv(false);
    if (!conv) {
      setMessages([{ id: "load_err", sender: "ai", text: "Percakapan ini gagal dimuat. Coba lagi sebentar.", timestamp: now(), isError: true }]);
      return;
    }
    setMessages(conv.messages.map((m, i) => ({ ...m, id: `${id}_${i}`, timestamp: toTime(m.timestamp) })));
    if (conv.document_id && availableDocs.some((d) => d.id === conv.document_id)) setSelectedDocId(conv.document_id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await ApiService.deleteAIConversation(deleteTarget.id);
    if (res?.deleted) {
      audioSynth.playSuccessSound();
      setConversations((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      if (deleteTarget.id === activeConvId) {
        setActiveConvId(null);
        setMessages([]);
      }
    }
    setDeleteTarget(null);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim();
    if (!text || isTyping) return;

    audioSynth.playClickSound();

    const userMsg: ChatMessage = { id: `msg_user_${Date.now()}`, sender: "user", text, timestamp: now() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsTyping(true);

    try {
      const response = await ApiService.chatWithAI({
        message: text,
        history: newHistory.filter((m) => !m.isError).map((m) => ({ sender: m.sender, text: m.text })),
        classroom_id: primaryDoc?.classroomId,
        document_id: primaryDoc?.id,
        learning_style: currentUser?.learningStyle || "VISUAL",
        student_name: currentUser?.name || "Siswa",
        student_id: currentUser?.id || "guest",
        conversation_id: activeConvId || undefined,
      });
      if (!response?.text) throw new Error("Respons kosong");
      audioSynth.playSuccessSound();
      if (response.conversation_id) setActiveConvId(response.conversation_id);
      refreshConversations();
      setMessages((prev) => [
        ...prev,
        { id: `msg_ai_${Date.now()}`, sender: "ai", text: response.text, citation: response.citation, timestamp: now() },
      ]);
    } catch (err) {
      console.warn("AI chat failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: "ai",
          text: "Maaf, tutor sedang tidak bisa dihubungi. Periksa koneksimu lalu coba kirim ulang pertanyaannya.",
          timestamp: now(),
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
      textareaRef.current?.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const canSend = Boolean(inputText.trim()) && !isTyping;

  return (
    <div className="h-[100dvh] w-full bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      <div className="shrink-0">
        <Navbar />
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0 w-full relative z-10">
        <StudentSidebar />

        <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col h-full overflow-hidden min-h-0 min-w-0">
          <section className="relative flex-1 flex min-h-0 w-full max-w-6xl mx-auto bg-white rounded-3xl border border-black/5 shadow-[0_1px_2px_rgba(28,30,38,0.04),0_12px_32px_-12px_rgba(28,30,38,0.10)] overflow-hidden">
            {/* History panel: static on lg, drawer on smaller screens */}
            {historyOpen && (
              <div className="lg:hidden absolute inset-0 z-20 bg-black/20" onClick={() => setHistoryOpen(false)} aria-hidden="true" />
            )}
            <aside
              aria-label="Riwayat percakapan"
              className={`${historyOpen ? "flex" : "hidden"} lg:flex absolute lg:static inset-y-0 left-0 z-30 w-72 max-w-[85%] lg:w-64 shrink-0 flex-col bg-[#FAFAFC] border-r border-black/5`}
            >
              <div className="p-3 flex items-center gap-2 border-b border-black/5">
                <button
                  onClick={startNewChat}
                  className="flex-1 h-10 px-3 rounded-xl bg-[#1C1E26] hover:bg-[#2B2E3B] text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3B7A]/40"
                >
                  <Plus className="w-4 h-4" /> Percakapan baru
                </button>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="lg:hidden w-10 h-10 rounded-xl text-[#5A5E70] hover:bg-black/5 flex items-center justify-center cursor-pointer"
                  aria-label="Tutup riwayat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                <p className="px-2 pt-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#9195A8]">Riwayat</p>
                {convsLoading ? (
                  [0, 1, 2].map((i) => <div key={i} className="h-10 mx-1 mb-1 rounded-lg bg-black/[0.04] animate-pulse" />)
                ) : conversations.length === 0 ? (
                  <p className="px-2 text-xs text-[#9195A8] leading-relaxed">Belum ada percakapan. Pertanyaanmu akan tersimpan di sini.</p>
                ) : (
                  conversations.map((c) => {
                    const active = c.id === activeConvId;
                    return (
                      <div
                        key={c.id}
                        className={`group flex items-center rounded-lg transition-colors ${active ? "bg-[#F0EEF6]" : "hover:bg-black/[0.04]"}`}
                      >
                        <button
                          onClick={() => openConversation(c.id)}
                          aria-current={active ? "true" : undefined}
                          className="flex-1 min-w-0 text-left px-2.5 py-2 flex items-center gap-2 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3B7A]/40"
                        >
                          <MessageSquare className={`w-4 h-4 shrink-0 ${active ? "text-[#4B3B7A]" : "text-[#9195A8]"}`} />
                          <span className="min-w-0 flex-1">
                            <span className={`block text-sm truncate ${active ? "font-bold text-[#2D2152]" : "font-medium text-[#1C1E26]"}`}>{c.title}</span>
                            <span className="block text-[11px] text-[#9195A8]">{toListDate(c.updated_at)}</span>
                          </span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="shrink-0 mr-1 w-8 h-8 rounded-md text-[#9195A8] hover:text-[#852C28] hover:bg-[#FDF0EF] flex items-center justify-center lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
                          aria-label={`Hapus percakapan ${c.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Header */}
            <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-black/5 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  to="/student"
                  onClick={() => audioSynth.playClickSound()}
                  className="w-10 h-10 -ml-1 rounded-xl text-[#5A5E70] hover:bg-[#F0EEF6] flex items-center justify-center md:hidden shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3B7A]/40"
                  aria-label="Kembali ke Beranda"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="w-10 h-10 rounded-xl bg-[#1C1E26] text-white flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-base font-black tracking-tight truncate">AI Tutor</h1>
                  <p className="text-xs text-[#5A5E70] font-medium truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                    {primaryDoc ? `Merujuk: ${primaryDoc.title}` : "Siap membantu belajar"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 lg:hidden">
                <button
                  onClick={() => setHistoryOpen(true)}
                  className="h-10 px-3 rounded-xl text-[#4B3B7A] bg-[#F0EEF6] hover:bg-[#E3DBF8] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3B7A]/40"
                  aria-label="Buka riwayat percakapan"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Riwayat</span>
                </button>
                {hasConversation && (
                  <button
                    onClick={startNewChat}
                    className="w-10 h-10 rounded-xl text-[#4B3B7A] bg-[#F0EEF6] hover:bg-[#E3DBF8] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3B7A]/40"
                    aria-label="Mulai percakapan baru"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </header>

            {/* Module focus */}
            {availableDocs.length > 1 && (
              <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 border-b border-black/5 overflow-x-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9195A8] shrink-0">Materi</span>
                {availableDocs.map((doc) => {
                  const active = doc.id === primaryDoc?.id;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => {
                        audioSynth.playClickSound();
                        setSelectedDocId(doc.id);
                      }}
                      aria-pressed={active}
                      className={`h-8 px-3 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D5E4D]/40 ${
                        active ? "bg-[#1D5E4D] text-white" : "bg-[#F4F5F8] text-[#5A5E70] hover:bg-[#EBECF1]"
                      }`}
                    >
                      {doc.title}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Messages / empty state */}
            <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 py-5" aria-live="polite">
              {loadingConv ? (
                <div className="flex flex-col gap-5" role="status" aria-label="Memuat percakapan">
                  {[60, 80, 45].map((w, i) => (
                    <div key={i} className={`h-12 rounded-2xl bg-black/[0.04] animate-pulse ${i % 2 ? "" : "self-end"}`} style={{ width: `${w}%` }} />
                  ))}
                </div>
              ) : !hasConversation ? (
                <div className="min-h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto gap-5 py-2">
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight">Halo, {firstName}! Mau belajar apa hari ini?</h2>
                    <p className="text-sm text-[#5A5E70] leading-relaxed max-w-lg mx-auto">{greeting}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                    {suggestions.map(({ icon: Icon, text }) => (
                      <button
                        key={text}
                        onClick={() => handleSendMessage(text)}
                        className="group text-left px-3 py-2.5 rounded-xl border border-black/5 bg-[#FAFAFC] hover:bg-white hover:border-[#4B3B7A]/20 hover:shadow-[0_6px_16px_-8px_rgba(75,59,122,0.25)] hover:-translate-y-0.5 transition-all duration-200 ease-out active:scale-[0.98] flex items-center gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3B7A]/40"
                      >
                        <span className="w-8 h-8 rounded-lg bg-[#F0EEF6] text-[#4B3B7A] flex items-center justify-center shrink-0 group-hover:bg-[#E3DBF8] transition-colors">
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="text-sm font-semibold text-[#1C1E26] leading-snug">{text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {messages.map((msg) =>
                    msg.sender === "user" ? (
                      <div key={msg.id} className="self-end max-w-[85%] sm:max-w-[75%] flex flex-col items-end gap-1">
                        <div className="px-4 py-2.5 rounded-2xl rounded-br-md bg-[#1C1E26] text-white text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] select-text">
                          {msg.text}
                        </div>
                        <span className="text-[11px] text-[#9195A8] font-medium px-1">{msg.timestamp}</span>
                      </div>
                    ) : (
                      <div key={msg.id} className="self-start max-w-full sm:max-w-[85%] flex gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            msg.isError ? "bg-[#FCD9D7] text-[#852C28]" : "bg-[#1C1E26] text-white"
                          }`}
                        >
                          {msg.isError ? <AlertCircle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex flex-col gap-1.5">
                          <div
                            className={`px-4 py-3 rounded-2xl rounded-tl-md text-sm leading-[1.7] whitespace-pre-wrap [overflow-wrap:anywhere] select-text ${
                              msg.isError ? "bg-[#FDF0EF] text-[#852C28]" : "bg-[#F4F5F8] text-[#1C1E26]"
                            }`}
                          >
                            {msg.text}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 px-1">
                            {msg.citation && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1D5E4D] bg-[#EBF6F2] px-2 py-1 rounded-full max-w-full">
                                <BookOpen className="w-3 h-3 shrink-0" />
                                <span className="truncate">Sumber: {msg.citation}</span>
                              </span>
                            )}
                            <span className="text-[11px] text-[#9195A8] font-medium">{msg.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  {isTyping && (
                    <div className="self-start flex gap-3" role="status">
                      <div className="w-8 h-8 rounded-lg bg-[#1C1E26] text-white flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-[#F4F5F8] flex items-center gap-2">
                        <span className="flex gap-1" aria-hidden="true">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#5A5E70] animate-bounce" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#5A5E70] animate-bounce [animation-delay:0.15s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#5A5E70] animate-bounce [animation-delay:0.3s]" />
                        </span>
                        <span className="text-xs text-[#5A5E70] font-medium">
                          {primaryDoc ? "Membaca materi gurumu…" : "Sedang berpikir…"}
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="px-3 sm:px-6 pb-3 sm:pb-4 pt-2 shrink-0">
              <div className="flex items-end gap-2 p-1.5 rounded-2xl bg-[#F4F5F8] border border-transparent focus-within:border-[#4B3B7A]/25 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(75,59,122,0.08)] transition-all">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  aria-label="Tulis pertanyaan untuk AI Tutor"
                  placeholder={primaryDoc ? "Tanya tentang materi ini…" : "Tanya konsep pelajaran…"}
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-[#1C1E26] placeholder-[#9195A8] px-3 py-2.5 resize-none max-h-40 leading-relaxed min-w-0"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!canSend}
                  aria-label="Kirim pertanyaan"
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3B7A]/40 ${
                    canSend
                      ? "bg-[#1C1E26] text-white hover:bg-[#2B2E3B] active:scale-95 cursor-pointer"
                      : "bg-[#E6E4EE] text-[#9195A8] cursor-not-allowed"
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="hidden sm:block text-[11px] text-[#9195A8] text-center mt-2">
                Enter untuk kirim · Shift + Enter untuk baris baru · AI bisa keliru, cek kembali dengan materi gurumu
              </p>
            </div>
            </div>
          </section>
        </main>
      </div>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reset-title"
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-[0_24px_48px_-12px_rgba(28,30,38,0.25)] animate-in zoom-in-95 duration-150 flex flex-col items-center text-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-2xl bg-[#FCD9D7] text-[#852C28] flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="reset-title" className="text-base font-black tracking-tight">Hapus percakapan ini?</h3>
              <p className="text-sm text-[#5A5E70] mt-1 leading-relaxed [overflow-wrap:anywhere]">
                "{deleteTarget.title}" akan dihapus permanen dari riwayatmu.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full mt-2">
              <button
                autoFocus
                onClick={() => {
                  audioSynth.playClickSound();
                  setDeleteTarget(null);
                }}
                className="h-11 flex-1 rounded-xl bg-[#F0EEF6] hover:bg-[#E3DBF8] text-[#4B3B7A] text-sm font-bold active:scale-[0.98] transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="h-11 flex-1 rounded-xl bg-[#852C28] hover:bg-[#72231F] text-white text-sm font-bold active:scale-[0.98] transition-all cursor-pointer"
              >
                Ya, hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
