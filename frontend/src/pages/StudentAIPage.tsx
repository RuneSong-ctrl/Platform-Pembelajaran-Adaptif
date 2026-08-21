import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
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
    "Jelaskan mekanisme kerja enzim pepsin & renin!",
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
    <div className="min-h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col pb-24 md:pb-8 overflow-x-hidden">
      <Navbar />

      <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        <StudentSidebar />

        {/* Expanded Desktop AI Tutor Main Content */}
        <main className="flex-1 w-full max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-4">
          {/* Header Card */}
          <div className="clay-card clay-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                to="/student"
                onClick={() => audioSynth.playClickSound()}
                className="clay-pill clay-white p-2 text-[#5A5E70] hover:text-[#010105] md:hidden cursor-pointer"
                title="Kembali"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-6 h-6" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-[#010105]">
                    Asisten Belajar AI Tutor
                  </h1>
                  <span className="clay-pill clay-mint text-[10px] font-extrabold text-[#1D5E4D] px-2.5 py-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1D5E4D] animate-pulse"></span>
                    Online
                  </span>
                </div>
                <p className="text-xs text-[#5A5E70] font-medium">
                  Grounded 100% pada Modul Biologi Kelas 10-A • Zero Hallucination
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="clay-pill clay-lavender text-[10px] font-extrabold text-[#4B3B7A] px-3 py-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>RAG Guard Aktif</span>
              </span>
            </div>
          </div>

          {/* Prompt Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#9195A8] shrink-0 hidden sm:inline-block">
              Pertanyaan Cepat:
            </span>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="clay-pill clay-white hover:bg-[#F2EFFC] text-[#4B3B7A] px-3.5 py-1.5 text-xs font-bold shrink-0 transition-transform hover:scale-105 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-[#4B3B7A]" />
                <span>{q}</span>
              </button>
            ))}
          </div>

          {/* Large Chat Workspace Card */}
          <div className="clay-card clay-white p-4 sm:p-6 flex-1 min-h-[480px] max-h-[620px] flex flex-col justify-between gap-4 overflow-hidden">
            {/* Scrollable Message List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {messages.map((msg) => {
                const isAI = msg.sender === "ai";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[90%] sm:max-w-[80%] ${
                      isAI ? "self-start" : "self-end ml-auto flex-row-reverse"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                        isAI
                          ? "bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] text-white shadow-sm"
                          : "clay-card clay-lavender text-[#4B3B7A]"
                      }`}
                    >
                      {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                        isAI
                          ? "clay-card bg-[#FDFCFE] border border-[rgba(28,30,38,0.06)] text-[#1C1E26]"
                          : "clay-card clay-lavender text-[#2D2152] font-semibold"
                      }`}
                    >
                      <p>{msg.text}</p>

                      {/* Citation Pill */}
                      {msg.citation && (
                        <div className="mt-3 pt-2.5 border-t border-[rgba(28,30,38,0.08)] flex items-start gap-2 text-[11px] text-[#1D5E4D] font-bold bg-[#EBF6F2] -mx-2 -mb-2 p-2.5 rounded-b-2xl">
                          <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{msg.citation}</span>
                        </div>
                      )}

                      <span className="block text-[10px] text-[#9195A8] mt-1.5 text-right font-medium">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Typing Animation */}
              {isTyping && (
                <div className="flex gap-3 max-w-[80%] self-start">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="clay-card clay-white p-3.5 rounded-3xl flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-bounce [animation-delay:0.4s]"></div>
                    <span className="text-xs text-[#9195A8] ml-1.5 font-semibold">
                      Mencari jawaban di modul guru...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar Inside Card */}
            <div className="pt-3 border-t border-black/5 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                placeholder="Tanyakan konsep Bab 3, enzim, atau materi yang sulit dipahami..."
                className="flex-1 px-4 py-3 text-xs sm:text-sm bg-[#F8F9FD] rounded-2xl border border-[rgba(28,30,38,0.08)] outline-hidden text-[#1C1E26] placeholder-[#9195A8] focus:border-[#3B82F6] focus:bg-white transition-all shadow-inner"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
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

      <BottomNav />
    </div>
  );
}
