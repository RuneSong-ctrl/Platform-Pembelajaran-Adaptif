
export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-teal-200">
      {/* 1. BAGIAN NAVIGASI */}
      <nav className="sticky top-0 z-50 bg-white px-6 py-4 flex items-center justify-between border-b-4 border-slate-900">
        <div className="flex items-center gap-3">
          {/* Logo dengan sentuhan Neo-Brutalism */}
          <div className="w-12 h-12 rounded-xl bg-amber-400 border-4 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_#0f172a]">
            <span className="text-slate-900 font-black text-sm">UNUD</span>
          </div>
          <div>
            <span className="font-black text-slate-900 text-lg block tracking-tight uppercase">
              Platform Adaptif
            </span>
            <span className="text-xs font-bold text-slate-500 block -mt-1 uppercase tracking-wider">
              Riset Pendidikan
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 font-bold text-sm text-slate-700 uppercase tracking-wide">
          <a
            href="#metodologi"
            className="hover:text-teal-600 hover:-translate-y-0.5 transition-transform"
          >
            Metodologi
          </a>
          <a
            href="#pilar"
            className="hover:text-teal-600 hover:-translate-y-0.5 transition-transform"
          >
            Alur Sistem
          </a>
          <a
            href="#fitur"
            className="hover:text-teal-600 hover:-translate-y-0.5 transition-transform"
          >
            Target Inklusi
          </a>
        </div>

        {/* Tombol Navbar Neo-Brutalist */}
        <button className="px-6 py-2.5 rounded-xl bg-teal-300 text-slate-900 font-black text-sm uppercase tracking-wide border-4 border-slate-900 shadow-[4px_4px_0_#0f172a] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#0f172a] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
          Masuk
        </button>
      </nav>

      {/* 2. BAGIAN UTAMA (Hero Section) - Badge dihapus */}
      <header className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter max-w-4xl mx-auto leading-[1.1] mb-8 uppercase">
          Ekosistem Pendidikan Digital yang{" "}
          <span className="bg-emerald-300 px-3 py-1 border-4 border-slate-900 inline-block -rotate-2 shadow-[6px_6px_0_#0f172a]">
            Personal
          </span>{" "}
          &{" "}
          <span className="bg-indigo-300 px-3 py-1 border-4 border-slate-900 inline-block rotate-2 shadow-[6px_6px_0_#0f172a]">
            Aman
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-700 font-medium max-w-3xl mx-auto leading-relaxed mb-12">
          Kurikulum tidak lagi dibuat seragam. Kami memadukan kecerdasan buatan
          untuk menyesuaikan kecepatan kognitif setiap anak, dan blockchain
          untuk mengamankan rekam jejak akademik mereka.
        </p>

        {/* Tombol Hero Clay-Brutalist (Ada inner shadow untuk efek clay, tapi border tegas) */}
        <button className="px-10 py-5 rounded-2xl bg-rose-400 text-slate-900 font-black text-xl uppercase tracking-wider border-4 border-slate-900 shadow-[6px_6px_0_#0f172a,inset_0_-4px_0_rgba(0,0,0,0.15)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0_#0f172a,inset_0_-4px_0_rgba(0,0,0,0.15)] active:translate-x-1.5 active:translate-y-1.5 active:shadow-[0_0_0_#0f172a,inset_0_0_0_rgba(0,0,0,0)] transition-all cursor-pointer">
          Analisis Gaya Belajarmu
        </button>
      </header>

      {/* 3. DUA PILAR UTAMA TEKNOLOGI */}
      <main id="pilar" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 text-center mb-12 tracking-tight uppercase">
          Dua Pilar Utama
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Pilar 1: AI Engine */}
          <div className="bg-teal-50 p-8 md:p-10 rounded-4xl border-4 border-slate-900 shadow-[8px_8px_0_#0f172a] flex flex-col items-start transition-transform hover:-translate-y-2">
            <div className="w-16 h-16 rounded-2xl bg-teal-300 border-4 border-slate-900 flex items-center justify-center mb-6 shadow-[4px_4px_0_#0f172a]">
              <svg
                className="w-8 h-8 text-slate-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase">
              Kurikulum Dinamis AI
            </h3>
            <p className="text-slate-700 font-medium leading-relaxed">
              Sistem akan menganalisis akurasi jawaban dan waktu respons siswa
              secara langsung. AI dapat menyederhanakan penjelasan saat siswa
              bingung, dan meningkatkan tantangan agar mereka tetap fokus.
            </p>
          </div>

          {/* Pilar 2: Blockchain Passport */}
          <div className="bg-indigo-50 p-8 md:p-10 rounded-4xl border-4 border-slate-900 shadow-[8px_8px_0_#0f172a] flex flex-col items-start transition-transform hover:-translate-y-2">
            <div className="w-16 h-16 rounded-2xl bg-indigo-300 border-4 border-slate-900 flex items-center justify-center mb-6 shadow-[4px_4px_0_#0f172a]">
              <svg
                className="w-8 h-8 text-slate-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase">
              Rekam Jejak Anti-Manipulasi
            </h3>
            <p className="text-slate-700 font-medium leading-relaxed">
              Setiap pencapaian dicatat ke dalam ledger blockchain
              terdesentralisasi. Menghasilkan portofolio digital permanen yang
              aman dari manipulasi dan mudah diverifikasi di mana saja.
            </p>
          </div>
        </div>
      </main>

      {/* 4. FITUR KHUSUS */}
      <section id="fitur" className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-amber-100 rounded-[3rem] p-8 md:p-12 border-4 border-slate-900 shadow-[12px_12px_0_#0f172a]">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4 uppercase">
              Pemerataan & Inklusi
            </h2>
            <p className="font-bold text-slate-700 leading-relaxed">
              Memperluas aksesibilitas pengajaran agar menjangkau kondisi
              geografis maupun kebutuhan kognitif yang beragam.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 md:p-8 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0_#0f172a] flex gap-5 items-start">
              <div className="w-14 h-14 rounded-xl bg-emerald-200 border-4 border-slate-900 flex items-center justify-center shrink-0 shadow-[2px_2px_0_#0f172a]">
                <svg
                  className="w-7 h-7 text-slate-900"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-lg mb-2 uppercase">
                  Belajar Luring (Offline Sync)
                </h4>
                <p className="text-slate-700 font-medium text-sm leading-relaxed">
                  Paket pembelajaran dapat diunduh dan dikerjakan secara luring.
                  Kemajuan disinkronkan otomatis ke blockchain saat sinyal
                  internet kembali tersedia.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0_#0f172a] flex gap-5 items-start">
              <div className="w-14 h-14 rounded-xl bg-rose-200 border-4 border-slate-900 flex items-center justify-center shrink-0 shadow-[2px_2px_0_#0f172a]">
                <svg
                  className="w-7 h-7 text-slate-900"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-lg mb-2 uppercase">
                  Menjaga Kesejahteraan Digital
                </h4>
                <p className="text-slate-700 font-medium text-sm leading-relaxed">
                  Membaca tanda kelelahan kognitif atau stres secara dini. AI
                  akan mengintervensi proaktif menyarankan jeda istirahat
                  sebelum siswa jenuh.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. KAKI HALAMAN (Footer) */}
      <footer className="border-t-4 border-slate-900 bg-white py-8 px-6 text-sm font-bold text-slate-700">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="uppercase">© 2026 Universitas Udayana</p>
          <p className="text-center md:text-right uppercase">
            Inovasi Berkelanjutan - SDG 4
          </p>
        </div>
      </footer>
    </div>
  );
}
