import React, { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import { audioSynth } from "@/services/audioSynth";
import {
  Send,
  User,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Check,
} from "@/components/ui/icons";

interface AckNotice {
  noteId: string;
  ackCode: string;
  timestamp: string;
}

export default function ParentChatPage() {
  const {
    users,
    notes,
    sendParentTeacherNote,
    replyNote,
    selectedParentChildId,
  } = useApp();

  const [searchParams] = useSearchParams();
  const childIdFromUrl = searchParams.get("childId");
  const activeChildId = childIdFromUrl || selectedParentChildId || "user_ayu_01";

  const selectedChild =
    users.find((u) => u.id === activeChildId) || users[0];

  const [inputText, setInputText] = useState("");
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // System ACK & Teacher Response states (Zero backend load)
  const [ackNotice, setAckNotice] = useState<AckNotice | null>(null);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [isTeacherTyping, setIsTeacherTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      activeTimersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  // Filter and sort notes chronologically (oldest at top, newest at bottom)
  const childNotes = notes
    .filter((n) => n.studentId === selectedChild.id)
    .slice()
    .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [childNotes, isWaitingResponse, isTeacherTyping, ackNotice]);

  const quickQuestions = [
    `Bagaimana fokus belajar ${selectedChild.name.split(" ")[0]} minggu ini?`,
    `Apakah ada materi remedial atau latihan pengayaan tambahan?`,
    `Berapa rata-rata akurasi kuis adaptif ${selectedChild.name.split(" ")[0]}?`,
    `Terima kasih banyak atas bimbingannya Pak Gunawan.`,
  ];

  const handleSendMessage = (customText?: string) => {
    const text = (customText || inputText).trim();
    if (!text) return;

    audioSynth.playClickSound();

    // 1. Send note to AppContext (Instant local storage update)
    const newNoteId = sendParentTeacherNote("user_teacher_01", selectedChild.id, text);
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // 2. Issue System ACK (Instant delivery confirmation)
    const ackCode = `ACK-${Math.floor(1000 + Math.random() * 9000)}`;
    setAckNotice({
      noteId: newNoteId,
      ackCode,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    setIsWaitingResponse(true);
    setIsTeacherTyping(false);

    // 3. Client-side Async Teacher Simulation (Zero backend load)
    const typingTimer = setTimeout(() => {
      setIsTeacherTyping(true);
    }, 1200);

    const replyTimer = setTimeout(() => {
      let simulatedReply = "";
      const lower = text.toLowerCase();

      if (lower.includes("remedial") || lower.includes("nilai") || lower.includes("latihan") || lower.includes("pengayaan")) {
        simulatedReply = `Selamat pagi Bu Ni Wayan. Laporan perkembangan ${selectedChild.name} sangat baik dengan akurasi kuis DDA 82%. Untuk persiapan bab depan, saya telah menambahkan 1 modul pengayaan adaptif di beranda belajarnya.`;
      } else if (lower.includes("fokus") || lower.includes("waktu") || lower.includes("kebiasaan") || lower.includes("istirahat")) {
        simulatedReply = `Terima kasih atas diskusinya Bu. ${selectedChild.name} tercatat konsisten mengikuti jadwal mandiri 42 menit per hari dengan jeda istirahat teratur (seimbang). Mohon terus didampingi di rumah ya Bu.`;
      } else if (lower.includes("akurasi") || lower.includes("skor") || lower.includes("rata-rata")) {
        simulatedReply = `Akurasi kognitif ${selectedChild.name} stabil di angka 82-95% pada materi Biologi Sistem Pencernaan. Pemahaman konsepnya sangat kuat di modalitas ${selectedChild.learningStyle === "VISUAL" ? "Visual" : selectedChild.learningStyle === "AUDITORI" ? "Auditori" : "Kinestetik"}.`;
      } else if (lower.includes("terima kasih") || lower.includes("makasih") || lower.includes("pak gunawan")) {
        simulatedReply = `Sama-sama Bu Ni Wayan! Senang bisa bermitra dengan orang tua demi kemajuan ${selectedChild.name}. Kami di sekolah siap mendampingi proses belajarnya setiap hari.`;
      } else {
        simulatedReply = `Selamat pagi Bu Ni Wayan. Catatan konsultasi terkait ${selectedChild.name} sudah saya terima dan catat. Gaya belajar ${selectedChild.learningStyle === "VISUAL" ? "Visual (diagram/bagan)" : selectedChild.learningStyle === "AUDITORI" ? "Auditori (penjelasan suara)" : "Praktik Kinestetik"} anak akan terus kami fasilitasi maksimal di kelas 10-A.`;
      }

      replyNote(newNoteId, simulatedReply);
      setIsTeacherTyping(false);
      setIsWaitingResponse(false);
      audioSynth.playSuccessSound();
    }, 3400);

    activeTimersRef.current.push(typingTimer, replyTimer);
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
    setAckNotice(null);
    setIsWaitingResponse(false);
    setIsTeacherTyping(false);
    setIsResetConfirmOpen(false);
  };

  return (
    <div className="h-[100dvh] w-full bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden select-none">
      {/* 1. FIXED TOP NAVBAR */}
      <div className="shrink-0">
        <Navbar />
      </div>

      {/* 2. MAIN CONTAINER (FIT VIEWPORT, ZERO GLOBAL SCROLL) */}
      <div className="flex flex-1 overflow-hidden min-h-0 w-full">
        <main className="flex-1 w-full max-w-4xl lg:max-w-5xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex flex-col gap-2 h-full overflow-hidden min-h-0">
          {/* Header Bar */}
          <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-[rgba(28,30,38,0.06)] shadow-xs flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <Link
                to="/parent"
                onClick={() => audioSynth.playClickSound()}
                className="w-8 h-8 rounded-xl bg-[#F0EEF6] hover:bg-[#E3DBF8] text-[#4B3B7A] flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                title="Kembali ke Portal Orang Tua"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              {/* Teacher Avatar */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E0DAF5] text-[#4B3B7A] font-black text-xs flex items-center justify-center shrink-0 shadow-xs border border-white">
                GW
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs sm:text-sm font-black text-[#1C1E26] truncate">
                    Bpk. Gunawan, M.Pd.
                  </h1>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online"></span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-[#5A5E70] font-medium truncate">
                  Wali Kelas 10-A • Konsultasi Terbuka
                </p>
              </div>
            </div>

            {/* Focused Child Badge (No cluttered child selectors in chat header) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="clay-pill bg-[#F2EFFC] text-[#4B3B7A] px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black flex items-center gap-1.5 shadow-2xs border border-[#E3DBF8]/70">
                <User className="w-3.5 h-3.5 text-[#4B3B7A]" />
                <span className="truncate max-w-[130px] sm:max-w-[200px]">
                  Siswa: {selectedChild.name}
                </span>
              </div>

              <button
                onClick={handleResetChat}
                className="p-1.5 rounded-xl bg-[#F0EEF6] hover:bg-[#E3DBF8] text-[#4B3B7A] transition-colors cursor-pointer"
                title="Bersihkan Tampilan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>


          {/* Chat Workspace Card (Fit & Bounded) */}
          <div className="clay-card clay-white p-3 sm:p-4 flex-1 flex flex-col gap-2.5 overflow-hidden min-h-0 shadow-sm w-full">
            {/* Scrollable Message History Stream */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3.5 pr-1.5 min-h-0 w-full flex flex-col justify-start">

              {/* Context Banner */}
              <div className="text-center my-0.5">
                <span className="clay-pill bg-white/90 text-[#4B3B7A] text-[9px] sm:text-[10px] font-extrabold px-3 py-1 border border-[#E3DBF8]/70 shadow-2xs">
                  Konsultasi Khusus Siswa: {selectedChild.name} (Kelas 10-A)
                </span>
              </div>

              {childNotes.map((note) => (
                <div key={note.id} className="space-y-2.5 animate-in fade-in duration-200">
                  {/* Parent Message Bubble (Right-aligned, Dark Clay) */}
                  <div className="flex gap-2.5 sm:gap-3 max-w-[90%] sm:max-w-[82%] min-w-0 self-end ml-auto flex-row-reverse">
                    <div className="w-8 h-8 rounded-2xl clay-card clay-lavender text-[#4B3B7A] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-xs">
                      <User className="w-4 h-4" />
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-3xl text-xs sm:text-sm leading-relaxed max-w-full min-w-0 overflow-hidden break-words [overflow-wrap:anywhere] [word-break:break-word] clay-btn-dark bg-[#1C1E26] text-white shadow-xs">
                      <p className="break-words [overflow-wrap:anywhere] [word-break:break-word] whitespace-pre-wrap leading-relaxed select-text">
                        {note.message}
                      </p>

                      <div className="mt-2 pt-1.5 border-t border-white/15 flex items-center justify-between text-[9px] text-white/70 font-medium">
                        <span>Ibu Ni Wayan Sari</span>
                        <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                          <Check className="w-2.5 h-2.5 stroke-[3]" /> Terkirim ke Guru
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Teacher Reply Bubble (Left-aligned, Lavender Clay) */}
                  {note.reply && (
                    <div className="flex gap-2.5 sm:gap-3 max-w-[90%] sm:max-w-[85%] min-w-0 self-start animate-in fade-in duration-200">
                      <div className="w-8 h-8 rounded-2xl bg-[#E0DAF5] text-[#4B3B7A] font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs border border-white">
                        GW
                      </div>

                      <div className="p-3.5 sm:p-4 rounded-3xl text-xs sm:text-sm leading-relaxed max-w-full min-w-0 overflow-hidden break-words [overflow-wrap:anywhere] [word-break:break-word] clay-card bg-[#FDFCFE] border border-[#E3DBF8] text-[#1C1E26] shadow-2xs">
                        <span className="text-[10px] font-black text-[#4B3B7A] block mb-1">
                          Bpk. Gunawan, M.Pd. (Wali Kelas)
                        </span>

                        <p className="break-words [overflow-wrap:anywhere] [word-break:break-word] whitespace-pre-wrap leading-relaxed select-text text-[#2D2152]">
                          {note.reply}
                        </p>

                        <div className="mt-2 pt-1.5 border-t border-[#E3DBF8]/60 flex items-center justify-between text-[9px] text-[#5A5E70] font-medium">
                          <span className="text-[#4B3B7A] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#4B3B7A]" /> Terverifikasi Wali Kelas
                          </span>
                          <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* System ACK Notice Pill */}
              {ackNotice && (
                <div className="clay-pill bg-[#E6F5EE] border border-[#C7EAD9] text-[#1D5E4D] py-1.5 px-3 rounded-full text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-2xs mx-auto animate-in fade-in max-w-fit">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1D5E4D] shrink-0" />
                  <span>
                    Sistem EduFlow: <strong>{ackNotice.ackCode}</strong> terkonfirmasi • Diteruskan ke Wali Kelas
                  </span>
                </div>
              )}

              {/* Waiting / Teacher Typing Animation */}
              {isWaitingResponse && (
                <div className="flex gap-2.5 max-w-[85%] self-start min-w-0 animate-in fade-in">
                  <div className="w-8 h-8 rounded-2xl bg-[#E0DAF5] text-[#4B3B7A] font-black text-xs flex items-center justify-center shrink-0 shadow-xs border border-white">
                    GW
                  </div>

                  {!isTeacherTyping ? (
                    <div className="clay-card bg-[#F4F1FA] border border-[#E3DBF8] p-3 rounded-2xl flex items-center gap-2 shadow-2xs animate-pulse">
                      <Clock className="w-3.5 h-3.5 text-[#4B3B7A] shrink-0" />
                      <span className="text-xs text-[#4B3B7A] font-bold">
                        Menunggu respon dari Bpk. Gunawan, M.Pd...
                      </span>
                    </div>
                  ) : (
                    <div className="clay-card bg-white border border-[#E3DBF8] p-3 rounded-2xl shadow-2xs flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#4B3B7A] animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-[#4B3B7A] animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#4B3B7A] animate-bounce [animation-delay:0.4s]"></div>
                      <span className="text-xs text-[#5A5E70] font-bold ml-1">
                        Bpk. Gunawan sedang mengetik balasan...
                      </span>
                    </div>
                  )}
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

            {/* Auto-expanding Multiline Input Dock (Bounded & Lightweight Clay) */}
            <div className="pt-2 border-t border-black/5 shrink-0 min-w-0 w-full">
              <div className="p-1 sm:p-1.5 rounded-[22px] bg-[#F7F6FA] border border-white shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.04),0_2px_8px_rgba(28,30,38,0.02)] flex items-end gap-1.5 sm:gap-2 w-full">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={`Tulis pesan konsultasi terkait ${selectedChild.name.split(" ")[0]} ke wali kelas...`}
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
                  title="Kirim Pesan (Enter)"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* LIGHTWEIGHT SUBTLE CLAY RESET CONFIRMATION MODAL */}
      {isResetConfirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/25 backdrop-blur-none flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsResetConfirmOpen(false)}
        >
          <div
            className="clay-card bg-white rounded-[26px] p-5 sm:p-6 border border-white max-w-xs sm:max-w-sm w-full shadow-[0_12px_28px_rgba(28,30,38,0.08),inset_2px_2px_4px_#fff,inset_-2px_-2px_5px_rgba(0,0,0,0.03)] animate-in zoom-in-95 duration-150 flex flex-col items-center text-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-2xl bg-[#FCD9D7] text-[#852C28] flex items-center justify-center shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.9),0_4px_10px_rgba(133,44,40,0.08)] border border-white">
              <AlertCircle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-black text-[#1C1E26] leading-tight">
                Bersihkan Tampilan Chat?
              </h3>
              <p className="text-xs text-[#5A5E70] mt-1 leading-relaxed">
                Status notifikasi ACK dan antrean saat ini akan disegarkan.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full mt-2 pt-2 border-t border-black/5">
              <button
                onClick={() => {
                  audioSynth.playClickSound();
                  setIsResetConfirmOpen(false);
                }}
                className="clay-pill bg-[#F0EEF6] hover:bg-[#E3DBF8] text-[#4B3B7A] text-xs font-extrabold py-2 px-4 flex-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmResetChat}
                className="clay-btn bg-[#852C28] text-white text-xs font-extrabold py-2 px-4 flex-1 shadow-sm hover:bg-[#72231F] active:scale-95 transition-all cursor-pointer"
              >
                Ya, Segarkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
