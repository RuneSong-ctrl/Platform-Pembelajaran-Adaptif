import React from "react";

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-amber-200 pb-20">
      {/* NAVBAR SISWA (Gamified Topbar) */}
      <nav className="sticky top-0 z-50 bg-white px-4 py-3 md:px-8 md:py-4 flex flex-wrap items-center justify-between border-b-4 border-slate-900 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-400 border-4 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_#0f172a]">
            <span className="text-xl">🚀</span>
          </div>
          <div>
            <span className="font-black text-slate-900 text-base md:text-lg block tracking-tight uppercase">
              AIDeaLearn
            </span>
            <span className="text-[10px] md:text-xs font-bold text-slate-500 block uppercase tracking-wider">
              Student Workspace
            </span>
          </div>
        </div>

        {/* Indikator Gamifikasi & Offline Sync */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-emerald-100 px-3 py-1.5 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0_#0f172a]">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black uppercase">
              Online & Synced
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-amber-100 px-3 py-1.5 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0_#0f172a]">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-black uppercase">
              12 Hari Beruntun
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12">
        {/* HEADER: AI MENTOR GREETING */}
        <section className="mb-10">
          <div className="bg-indigo-200 rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0_#0f172a] p-6 md:p-10 relative overflow-hidden transition-transform hover:-translate-y-1">
            <div className="relative z-10 md:w-2/3">
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4">
                Hai,{" "}
                <span className="bg-white px-2 border-4 border-slate-900 shadow-[4px_4px_0_#0f172a] inline-block -rotate-2">
                  Rama!
                </span>{" "}
                👋
              </h1>
              <p className="text-base md:text-lg font-bold text-slate-800 leading-relaxed mb-6">
                AI Mentor mendeteksi kamu sedang{" "}
                <span className="text-indigo-700 underline decoration-4 underline-offset-4">
                  sangat fokus
                </span>{" "}
                di materi Logika Matematika. Tingkat kesulitan telah disesuaikan
                agar kamu tidak bosan. Siap untuk tantangan berikutnya?
              </p>
              <button className="px-6 py-3 rounded-xl bg-amber-400 text-slate-900 font-black text-sm md:text-base uppercase tracking-wide border-4 border-slate-900 shadow-[4px_4px_0_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#0f172a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer">
                Mulai Tantangan Harian
              </button>
            </div>
            {/* Dekorasi Visual */}
            <div className="absolute -right-10 -bottom-10 opacity-50 hidden md:block">
              <svg
                className="w-64 h-64 text-slate-900"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M11 2L2 9l9 7 9-7-9-7zm0 2.8L16.2 9 11 13.2 5.8 9 11 4.8zM2 15l9 7 9-7-1.5-1.2-7.5 5.8-7.5-5.8L2 15z" />
              </svg>
            </div>
          </div>
        </section>

        {/* BENTO GRID UTAMA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* KIRI: Jalur Belajar (Dynamic Curriculum) */}
          <section className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase tracking-tight">
                Jalur Belajarmu
              </h2>
            </div>

            {/* Kartu Mata Pelajaran 1 (Sains - Sedang Aktif) */}
            <div className="bg-white rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0_#0f172a] p-5 flex flex-col md:flex-row items-start md:items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-200 border-4 border-slate-900 shadow-[4px_4px_0_#0f172a] flex items-center justify-center shrink-0 text-3xl">
                🧬
              </div>
              <div className="flex-1 w-full">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h3 className="font-black text-xl uppercase">
                      Sains: Ekosistem
                    </h3>
                    <p className="text-sm font-bold text-slate-500">
                      Tingkat Kesulitan:{" "}
                      <span className="text-emerald-600">
                        Dinamis (Level 4)
                      </span>
                    </p>
                  </div>
                  <span className="font-black text-lg">75%</span>
                </div>
                {/* Progress Bar Playful */}
                <div className="h-4 w-full bg-slate-100 border-2 border-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 border-r-2 border-slate-900 w-[75%]"></div>
                </div>
              </div>
              <button className="w-full md:w-auto px-5 py-3 rounded-xl bg-emerald-300 border-4 border-slate-900 shadow-[4px_4px_0_#0f172a] font-black uppercase hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#0f172a] transition-all cursor-pointer">
                Lanjut
              </button>
            </div>

            {/* Kartu Mata Pelajaran 2 (Matematika) */}
            <div className="bg-white rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0_#0f172a] p-5 flex flex-col md:flex-row items-start md:items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-sky-200 border-4 border-slate-900 shadow-[4px_4px_0_#0f172a] flex items-center justify-center shrink-0 text-3xl">
                📐
              </div>
              <div className="flex-1 w-full">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h3 className="font-black text-xl uppercase">
                      Matematika: Aljabar
                    </h3>
                    <p className="text-sm font-bold text-slate-500">
                      Menunggu Reviu AI
                    </p>
                  </div>
                  <span className="font-black text-lg">30%</span>
                </div>
                <div className="h-4 w-full bg-slate-100 border-2 border-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 border-r-2 border-slate-900 w-[30%]"></div>
                </div>
              </div>
              <button className="w-full md:w-auto px-5 py-3 rounded-xl bg-white border-4 border-slate-900 shadow-[4px_4px_0_#0f172a] font-black uppercase hover:bg-slate-50 transition-all cursor-pointer">
                Mulai
              </button>
            </div>
          </section>

          {/* KANAN: Gamifikasi & Blockchain */}
          <section className="space-y-8">
            {/* Widget Misi Aktif (Gamification) */}
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight mb-6">
                Misi Global
              </h2>
              <div className="bg-rose-200 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0_#0f172a] p-6">
                <h3 className="font-black text-lg uppercase mb-4">
                  🌍 Eco-Planet Guardian
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0_#0f172a]">
                    <div className="text-2xl">🌱</div>
                    <div className="flex-1">
                      <p className="font-black text-sm uppercase">
                        Tanam Pohon Virtual
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        Selesaikan 2 Quiz Biologi
                      </p>
                    </div>
                    <span className="font-black text-rose-600">+50 XP</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl border-2 border-slate-900 border-dashed">
                    <div className="text-2xl grayscale">🤝</div>
                    <div className="flex-1">
                      <p className="font-black text-sm uppercase text-slate-600">
                        Kolaborasi Internasional
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        Terkunci (Butuh Level 5)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Widget Blockchain Passport */}
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight mb-6">
                Kredensial
              </h2>
              <div className="bg-slate-800 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0_#0f172a] p-6 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm border border-white/30">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <span className="bg-emerald-400 text-slate-900 font-black text-[10px] uppercase px-2 py-1 rounded border-2 border-slate-900 shadow-[2px_2px_0_#0f172a]">
                      Verified Ledger
                    </span>
                  </div>
                  <p className="font-bold text-slate-300 text-xs uppercase mb-1">
                    ID Jaringan Cerdas
                  </p>
                  <p className="font-black font-mono text-sm tracking-widest break-all mb-4">
                    0x7F4A...B99C
                  </p>
                  <button className="w-full py-2 bg-white text-slate-900 font-black text-sm uppercase rounded-xl border-2 border-slate-900 shadow-[2px_2px_0_#0f172a] hover:bg-slate-100 transition-colors cursor-pointer">
                    Lihat Paspor
                  </button>
                </div>
                {/* Aksen visual background wallet */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-slate-700 rounded-full blur-2xl"></div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
