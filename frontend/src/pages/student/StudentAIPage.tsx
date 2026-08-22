import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import StudentSidebar from "@/components/layout/StudentSidebar";
import { audioSynth } from "@/services/audioSynth";
import {
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  ArrowLeft,
  ShieldCheck,
  Flame,
  Star,
  CheckCircle2,
} from "@/components/ui/icons";

interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  citation?: string;
  timestamp: string;
}

export default function StudentAIPage() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_init_1",
      sender: "ai",
      text: `Halo ${currentUser.name}! Saya adalah Asisten Belajar AI yang ter-grounding langsung pada materi dan modul ajar gurumu. Silakan tanyakan konsep apa saja seputar Bab 3: Sistem Pencernaan & Enzim.`,
      timestamp: "09:30",
    },
    {
      id: "msg_init_2",
      sender: "user",
      text: "Apa fungsi utama enzim ptialin di dalam rongga mulut?",
      timestamp: "09:31",
    },
    {
      id: "msg_init_3",
      sender: "ai",
      text: "Enzim ptialin (amilase saliva) berfungsi mengkatalisis pemecahan amilum (karbohidrat kompleks) menjadi disakarida maltosa di dalam rongga mulut pada suasana pH netral 6.8. Enzim ini diproduksi oleh kelenjar saliva parotis untuk memulai pencernaan kimiawi.",
      citation: "Modul Biologi Bab 3 Hal. 12 • Guru: I Made Sukadana, S.Pd.",
      timestamp: "09:31",
    },
  ]);

  const quickQuestions = [
    "Bagaimana lambung memecah protein?",
    "Fungsi struktur vili pada usus halus?",
    "Apa peran empedu dalam mencerna lemak?",
    "Jelaskan mekanisme enzim pepsin & renin!",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const getMockAIResponse = (query: string): { text: string; citation: string } => {
    const q = query.toLowerCase();
    if (q.includes("lambung") || q.includes("pepsin") || q.includes("asam") || q.includes("protein") || q.includes("renin")) {
      return {
        text: "Di dalam lambung (ventrikulus), getah lambung menghasilkan asam klorida (HCl) dengan tingkat keasaman ekstrem (pH 1.5 - 2.0) yang disekresikan oleh sel parietal. Keasaman ini berfungsi membunuh mikroorganisme patogen dan mengaktifkan pepsinogen inaktif menjadi enzim aktif pepsin untuk memotong ikatan peptida protein menjadi pepton.",
        citation: "Modul Biologi Bab 3 Hal. 18 • Materi: Fisiologi Lambung",
      };
    }
    if (q.includes("vili") || q.includes("usus") || q.includes("serap") || q.includes("ileum")) {
      return {
        text: "Dinding usus halus (terutama ileum) memiliki lipatan mikroskopis berupa vili dan mikrovili. Struktur ini memperluas total luas permukaan serap nutrisi hingga mencapai 200 meter persegi. Glukosa dan asam amino diserap ke kapiler darah, sedangkan asam lemak diserap ke pembuluh limfa (kil).",
        citation: "Modul Biologi Bab 3 Hal. 25 • Materi: Penyerapan Nutrisi Usus Halus",
      };
    }
    if (q.includes("empedu") || q.includes("lemak") || q.includes("hati") || q.includes("lipase")) {
      return {
        text: "Hati menghasilkan cairan empedu yang disimpan di kantung empedu. Garam empedu berfungsi mengemulsikan gumpalan lemak menjadi butiran mikro (droplet) agar enzim lipase dari pankreas dapat menghidrolisis trigliserida menjadi asam lemak dan gliserol.",
        citation: "Modul Biologi Bab 3 Hal. 22 • Materi: Kelenjar Pencernaan & Enzimatis",
      };
    }
    return {
      text: `Berdasarkan modul ajar guru untuk kelas 10-A, topik "${query}" berkaitan dengan proses fisiologis pencernaan. Seluruh proses diatur secara terkoordinasi oleh gerak mekanik peristaltik dan sekresi biokimiawi enzim untuk memastikan efisiensi metabolisme tubuh.`,
      citation: "Modul Biologi Bab 3 Hal. 15 • Silabus Terverifikasi",
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    audioSynth.playClickSound();

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      audioSynth.playSuccessSound();
      const response = getMockAIResponse(text);
      const aiMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: "ai",
        text: response.text,
        citation: response.citation,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div className="h-[100dvh] w-full bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      {/* 1. FIXED TOP NAVBAR */}
      <div className="shrink-0">
        <Navbar />
      </div>

      {/* 2. BODY CONTAINER (STRICTLY NO WINDOW SCROLLING) */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Desktop Sidebar */}
        <StudentSidebar />

        {/* Fixed Viewport AI Tutor Main Content */}
        <main className="flex-1 w-full max-w-5xl lg:max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4 flex flex-col gap-2.5 sm:gap-3.5 h-full overflow-hidden min-h-0">
          {/* Header Bar (Ultra Slim & Compact on Mobile) */}
          <div className="bg-white rounded-2xl p-2 sm:p-3.5 border border-[rgba(28,30,38,0.06)] shadow-2xs flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Link
                to="/student"
                onClick={() => audioSynth.playClickSound()}
                className="w-7 h-7 rounded-xl bg-[#F0EEF6] hover:bg-[#E3DBF8] text-[#4B3B7A] flex items-center justify-center md:hidden cursor-pointer shrink-0"
                title="Kembali ke Beranda"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>

              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs sm:text-sm font-black text-[#010105] truncate">
                    AI Tutor
                  </h1>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1D5E4D]"></span>
                </div>
                <p className="text-[9px] sm:text-[11px] text-[#5A5E70] font-medium truncate">
                  Bab 3: Sistem Pencernaan &amp; Enzim
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="bg-[#EBF6F2] text-[#1D5E4D] text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>RAG Verified</span>
              </span>
            </div>
          </div>

          {/* Chat Workspace Card (Fills Full Remaining Space) */}
          <div className="clay-card clay-white p-3 sm:p-5 flex-1 flex flex-col justify-between gap-2.5 sm:gap-3 overflow-hidden min-h-0 shadow-sm">
            {/* Scrollable Message History Stream */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 min-h-0">
              {messages.map((msg) => {
                const isAI = msg.sender === "ai";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 sm:gap-3 max-w-[92%] sm:max-w-[80%] ${
                      isAI ? "self-start" : "self-end ml-auto flex-row-reverse"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                        isAI
                          ? "bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] text-white shadow-sm"
                          : "clay-card clay-lavender text-[#4B3B7A]"
                      }`}
                    >
                      {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`p-3.5 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                        isAI
                          ? "clay-card bg-[#FDFCFE] border border-[rgba(28,30,38,0.06)] text-[#1C1E26]"
                          : "clay-card clay-lavender text-[#2D2152] font-semibold"
                      }`}
                    >
                      <p>{msg.text}</p>

                      {/* Citation Pill */}
                      {msg.citation && (
                        <div className="mt-2.5 pt-2 border-t border-[rgba(28,30,38,0.08)] flex items-start gap-1.5 text-[10px] sm:text-[11px] text-[#1D5E4D] font-bold bg-[#EBF6F2] -mx-1.5 -mb-1.5 p-2 rounded-b-2xl">
                          <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{msg.citation}</span>
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
                <div className="flex gap-2.5 max-w-[85%] self-start">
                  <div className="w-8 h-8 rounded-2xl bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-sm">
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

            {/* Quick Prompt Chips Slider (Placed directly above input for max chat area) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="bg-[#F2EFFC] hover:bg-[#E3DBF8] text-[#4B3B7A] px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold shrink-0 transition-transform hover:scale-105 flex items-center gap-1 cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  <Sparkles className="w-3 h-3 text-[#4B3B7A]" />
                  <span>{q}</span>
                </button>
              ))}
            </div>

            {/* Pinned Input Bar Inside Card (Shrink-0) */}
            <div className="pt-1.5 border-t border-black/5 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                placeholder="Tanyakan konsep Bab 3, enzim, atau materi yang sulit dipahami..."
                className="flex-1 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-[#F8F9FD] rounded-2xl border border-[rgba(28,30,38,0.08)] outline-hidden text-[#1C1E26] placeholder-[#9195A8] focus:border-[#3B82F6] focus:bg-white transition-all shadow-inner"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  inputText.trim()
                    ? "clay-btn clay-btn-dark text-white shadow-md hover:scale-105 active:scale-95"
                    : "bg-[#F0EEF6] text-[#9195A8] cursor-not-allowed"
                }`}
                title="Kirim Pertanyaan"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
