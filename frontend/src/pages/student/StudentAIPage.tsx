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
  User,
  Sparkles,
  BookOpen,
  ArrowLeft,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
} from "@/components/ui/icons";
interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  citation?: string;
  timestamp: string;
}

export default function StudentAIPage() {
  const { currentUser, documents, classrooms } = useApp();
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const myClassrooms = classrooms.filter((c) =>
    Boolean(currentUser?.id && c.studentIds?.includes(currentUser.id))
  );
  const activeDocs = documents.filter((d) =>
    myClassrooms.some((c) => c.id === d.classroomId)
  );
  const primaryDoc = activeDocs[0] || documents[0];

  const initialGreeting = primaryDoc
    ? `Halo ${currentUser.name || "Siswa"}! Saya adalah Asisten Belajar AI Tutor yang ter-grounding langsung pada modul ajar gurumu: "${primaryDoc.title}". Silakan tanyakan konsep apa saja seputar materi ini.`
    : `Halo ${currentUser.name || "Siswa"}! Saya Asisten AI Tutor. Saat ini guru belum mengunggah silabus/modul resmi di kelasmu. Kamu dapat bertanya konsep pelajaran umum, atau meminta gurumu mengunggah materi ajar ke RAG Knowledge Base.`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_init_1",
      sender: "ai",
      text: initialGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const quickQuestions = primaryDoc
    ? [
        `Jelaskan ringkasan ${primaryDoc.title.slice(0, 30)}!`,
        "Apa poin konsep paling penting yang perlu saya kuasai?",
        "Berikan contoh analogi sederhana untuk materi ini!",
        "Bagaimana tips menyelesaikan kuis adaptif DDA untuk topik ini?",
      ]
    : [
        "Bagaimana cara belajar adaptif yang efektif?",
        "Apa itu DDA (Dynamic Difficulty Adjustment)?",
        "Bagaimana cara bergabung ke kelas guru?",
        "Jelaskan prinsip sertifikat Paspor Blockchain!",
      ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isTyping) return;

    audioSynth.playClickSound();

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setIsTyping(true);

    try {
      const response = await ApiService.chatWithAI({
        message: text.trim(),
        history: newHistory.map((m) => ({ sender: m.sender, text: m.text })),
        classroom_id: primaryDoc?.classroomId,
        document_id: primaryDoc?.id,
        learning_style: currentUser?.learningStyle || "VISUAL",
        student_name: currentUser?.name || "Siswa",
        student_id: currentUser?.id || "guest",
      });

      if (response && response.text) {
        audioSynth.playSuccessSound();
        const aiMsg: ChatMessage = {
          id: `msg_ai_${Date.now()}`,
          sender: "ai",
          text: response.text,
          citation: response.citation,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err: any) {
      console.warn("Backend chat fallback:", err);
      // Fallback local
      const aiMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: "ai",
        text: primaryDoc
          ? `Berdasarkan modul "${primaryDoc.title}": ${primaryDoc.summary || primaryDoc.rawText.slice(0, 200)}...`
          : "Pertanyaan yang sangat bagus! Silakan eksplorasi konsep ini lebih dalam.",
        citation: primaryDoc ? `${primaryDoc.title} • Modul Terverifikasi` : "EduAdapt AI",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    audioSynth.playClickSound();
    setIsResetConfirmOpen(true);
  };

  const confirmResetChat = () => {
    audioSynth.playSuccessSound();
    setMessages([
      {
        id: `msg_init_${Date.now()}`,
        sender: "ai",
        text: `Halo ${currentUser.name}! Sesi percakapan telah direset. Silakan tanyakan konsep apa saja ${primaryDoc ? `seputar "${primaryDoc.title}"` : "seputar materi pembelajaran"}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setIsResetConfirmOpen(false);
  };

  return (
    <div className="h-[100dvh] w-full bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden select-none">
      {/* 1. FIXED TOP NAVBAR */}
      <div className="shrink-0">
        <Navbar />
      </div>

      {/* 2. BODY CONTAINER */}
      <div className="flex flex-1 overflow-hidden min-h-0 w-full relative z-10">
        {/* Desktop Sidebar */}
        <StudentSidebar />

        {/* Fixed Viewport AI Tutor Main Content */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-2 h-full overflow-hidden min-h-0 min-w-0">
          {/* Header Bar */}
          <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-[rgba(28,30,38,0.06)] shadow-xs flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <Link
                to="/student"
                onClick={() => audioSynth.playClickSound()}
                className="w-8 h-8 rounded-xl bg-[#F0EEF6] hover:bg-[#E3DBF8] text-[#4B3B7A] flex items-center justify-center md:hidden cursor-pointer shrink-0"
                title="Kembali ke Beranda"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs sm:text-sm font-black text-[#1C1E26] truncate">
                    Asisten Belajar AI
                  </h1>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-[#5A5E70] font-medium truncate">
                  {primaryDoc?.title || "Konsultasi Materi Pembelajaran"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleResetChat}
                className="p-1.5 rounded-xl bg-[#F0EEF6] hover:bg-[#E3DBF8] text-[#4B3B7A] transition-colors cursor-pointer"
                title="Reset Percakapan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Chat Workspace Card (Fit & Bounded) */}
          <div className="clay-card clay-white p-3 sm:p-4 flex-1 flex flex-col justify-between gap-2.5 overflow-hidden min-h-0 shadow-sm w-full">
            {/* Scrollable Message History Stream */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3.5 pr-1.5 min-h-0 w-full">
              {messages.map((msg) => {
                const isAI = msg.sender === "ai";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 sm:gap-3 max-w-[90%] sm:max-w-[82%] min-w-0 ${
                      isAI ? "self-start" : "self-end ml-auto flex-row-reverse"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                        isAI
                          ? "bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] text-white shadow-xs"
                          : "clay-card clay-lavender text-[#4B3B7A]"
                      }`}
                    >
                      {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`p-3.5 sm:p-4 rounded-3xl text-xs sm:text-sm leading-relaxed max-w-full min-w-0 overflow-hidden break-words [overflow-wrap:anywhere] [word-break:break-word] ${
                        isAI
                          ? "clay-card bg-[#FDFCFE] border border-[rgba(28,30,38,0.06)] text-[#1C1E26]"
                          : "clay-card clay-lavender text-[#2D2152] font-semibold"
                      }`}
                    >
                      <p className="break-words [overflow-wrap:anywhere] [word-break:break-word] whitespace-pre-wrap leading-relaxed select-text">
                        {msg.text}
                      </p>

                      {/* Citation Pill */}
                      {msg.citation && (
                        <div className="mt-2.5 pt-2 border-t border-[rgba(28,30,38,0.08)] flex items-start gap-1.5 text-[10px] sm:text-[11px] text-[#1D5E4D] font-bold bg-[#EBF6F2] -mx-2 -mb-2 p-2.5 rounded-b-2xl break-words [overflow-wrap:anywhere]">
                          <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span className="min-w-0">{msg.citation}</span>
                        </div>
                      )}

                      <span className="block text-[9px] text-[#9195A8] mt-1 text-right font-medium">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Typing Animation */}
              {isTyping && (
                <div className="flex gap-2.5 max-w-[85%] self-start min-w-0">
                  <div className="w-8 h-8 rounded-2xl bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="clay-card clay-white p-3 rounded-2xl flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-bounce [animation-delay:0.4s]"></div>
                    <span className="text-xs text-[#9195A8] ml-1 font-semibold">
                      Mencari jawaban di modul guru...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips Slider (Scrollbar Hidden) */}
            <div className="w-full min-w-0 overflow-x-auto flex items-center gap-1.5 py-1 px-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="bg-[#F2EFFC] hover:bg-[#E3DBF8] text-[#4B3B7A] px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold shrink-0 transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  <Sparkles className="w-3 h-3 text-[#4B3B7A]" />
                  <span>{q}</span>
                </button>
              ))}
            </div>

            {/* Auto-expanding Multiline Input Dock (Lightweight Clay Tipis) */}
            <div className="pt-2 border-t border-black/5 shrink-0 min-w-0 w-full">
              <div className="p-1 sm:p-1.5 rounded-[22px] bg-[#F7F6FA] border border-white shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.04),0_2px_8px_rgba(28,30,38,0.02)] flex items-end gap-1.5 sm:gap-2 w-full">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Tanyakan konsep materi atau topik yang ingin kamu pelajari..."
                  className="flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm text-[#1C1E26] placeholder-[#9195A8] px-3 py-1.5 sm:py-2 resize-none max-h-28 overflow-y-auto leading-relaxed min-w-0"
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim()}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all shrink-0 ${
                    inputText.trim()
                      ? "clay-btn bg-[#1C1E26] text-white shadow-[0_4px_10px_rgba(28,30,38,0.2),inset_1px_1px_2px_rgba(255,255,255,0.3)] active:scale-95 cursor-pointer hover:bg-[#2B2E3B]"
                      : "bg-[#E6E4EE] text-[#9195A8] cursor-not-allowed"
                  }`}
                  title="Kirim Pertanyaan (Enter)"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* LIGHTWEIGHT SUBTLE CLAY CONFIRMATION MODAL */}
      {isResetConfirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/25 backdrop-blur-none flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsResetConfirmOpen(false)}
        >
          <div
            className="clay-card bg-white rounded-[26px] p-5 sm:p-6 border border-white max-w-xs sm:max-w-sm w-full shadow-[0_12px_28px_rgba(28,30,38,0.08),inset_2px_2px_4px_#fff,inset_-2px_-2px_5px_rgba(0,0,0,0.03)] animate-in zoom-in-95 duration-150 flex flex-col items-center text-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Clay Pill Icon */}
            <div className="w-11 h-11 rounded-2xl bg-[#FCD9D7] text-[#852C28] flex items-center justify-center shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.9),0_4px_10px_rgba(133,44,40,0.08)] border border-white">
              <AlertCircle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-black text-[#1C1E26] leading-tight">
                Reset Percakapan AI?
              </h3>
              <p className="text-xs text-[#5A5E70] mt-1 leading-relaxed">
                Seluruh riwayat tanya jawab pada sesi ini akan dihapus dan dimulai kembali dari awal.
              </p>
            </div>

            {/* Action Buttons (Clay Tipis) */}
            <div className="flex items-center gap-2 w-full mt-2 pt-2 border-t border-black/5">
              <button
                onClick={() => {
                  audioSynth.playClickSound();
                  setIsResetConfirmOpen(false);
                }}
                className="clay-pill bg-[#F0EEF6] hover:bg-[#E3DBF8] text-[#4B3B7A] text-xs font-extrabold py-2 px-4 flex-1 shadow-[inset_1px_1px_2px_#fff,0_2px_6px_rgba(0,0,0,0.04)] active:scale-95 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmResetChat}
                className="clay-btn bg-[#852C28] text-white text-xs font-extrabold py-2 px-4 flex-1 shadow-[0_4px_12px_rgba(133,44,40,0.25),inset_1px_1px_2px_rgba(255,255,255,0.3)] hover:bg-[#72231F] active:scale-95 transition-all cursor-pointer"
              >
                Ya, Reset Sesi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

