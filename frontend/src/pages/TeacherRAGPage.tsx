import React, { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import TeacherSidebar from "@/components/layout/TeacherSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { audioSynth } from "@/services/audioSynth";
import {
  UploadCloud,
  Lock,
  FileText,
  Trash2,
} from "@/components/ui/icons";

export default function TeacherRAGPage() {
  const { documents, uploadDocument, deleteDocument, classrooms } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>("cls_bio_10a");
  const [strictGrounding, setStrictGrounding] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const handleSimulateUpload = (fileName: string, text: string) => {
    setIsUploading(true);
    audioSynth.playClickSound();

    setTimeout(() => {
      uploadDocument(
        selectedClassId,
        fileName,
        text,
        "Ekstraksi modul PDF kurikulum resmi."
      );
      setIsUploading(false);
      audioSynth.playSuccessSound();
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#1B1C19]">
      <Navbar />

      <div className="flex">
        <TeacherSidebar />

        <main className="flex-1 p-6 sm:p-10 max-w-6xl space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="lavender" className="text-xs">
                  ChromaDB Vector Store
                </Badge>
                <Badge variant="mint" className="text-xs">
                  Zero Hallucination Guard
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold text-[#010105]">
                Knowledge Base &amp; RAG Ingestion Center
              </h1>
              <p className="text-xs sm:text-sm text-[#5A5E70] font-medium mt-0.5">
                Unggah modul PDF dan buku ajar. AI hanya menghasilkan materi dan kuis yang ter-grounding 100% dari sumber ini.
              </p>
            </div>
          </div>

          {/* STRICT GROUNDING TOGGLE & CLASS SELECTOR */}
          <Card className="p-6 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[#5A5E70] block">Rombongan Belajar Target:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="mt-1 p-2.5 rounded-2xl border border-[rgba(28,30,38,0.1)] text-xs font-bold text-[#010105] bg-[#FBF9F4] focus:outline-none"
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.joinCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Strict Grounding Switch */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#E0DAF5] border border-[rgba(75,59,122,0.15)]">
                <Lock className="w-5 h-5 text-[#4B3B7A] shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-[#4B3B7A]">
                    Strict School Grounding Lock
                  </h4>
                  <p className="text-[10px] text-[#4B3B7A]/80 font-medium">
                    AI dilarang mengambil informasi di luar dokumen modul yang diunggah
                  </p>
                </div>
                <button
                  onClick={() => {
                    audioSynth.playClickSound();
                    setStrictGrounding(!strictGrounding);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ml-2 cursor-pointer ${
                    strictGrounding ? "bg-[#4B3B7A]" : "bg-[#c7c6cb]"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      strictGrounding ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>

          {/* UPLOAD SIMULATION DROPZONE */}
          <Card className="p-8 bg-[#FBF9F4] border-2 border-dashed border-[rgba(28,30,38,0.15)] rounded-3xl text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-white border border-[rgba(28,30,38,0.08)] flex items-center justify-center text-[#4B3B7A] mx-auto shadow-xs">
              <UploadCloud className="w-7 h-7" />
            </div>

            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-[#010105]">
                Unggah Dokumen PDF Modul Ajar
              </h3>
              <p className="text-xs text-[#5A5E70] font-medium">
                Sistem akan melakukan ekstraksi teks otomatis, semantic chunking, dan pembobotan embedding vektor.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button
                onClick={() =>
                  handleSimulateUpload(
                    "BAB 5 - Sistem Sirkulasi & Jantung.pdf",
                    "Jantung manusia terdiri dari empat ruang: atrium dekstra, atrium sinistra, ventrikel dekstra, dan ventrikel sinistra..."
                  )
                }
                disabled={isUploading}
                variant="primary"
                size="sm"
                className="font-bold text-xs"
              >
                {isUploading ? "Memproses Chunking..." : "Simulasi Upload: Modul Bab 5 Sirkulasi.pdf"}
              </Button>
            </div>
          </Card>

          {/* INGESTED DOCUMENTS TABLE */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-[#010105]">
              Daftar Modul Terindeks di ChromaDB
            </h2>

            <div className="space-y-3">
              {documents.map((doc) => (
                <Card
                  key={doc.id}
                  className="p-5 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#D1EBE1] text-[#1D5E4D] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="mint" className="text-[10px]">
                          {doc.status}
                        </Badge>
                        <Badge variant="slate" className="text-[10px] font-mono">
                          {doc.vectorId}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-[#010105]">{doc.title}</h4>
                      <p className="text-xs text-[#5A5E70] mt-0.5">{doc.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs font-semibold text-[#9195A8]">
                      {doc.chunksCount} Semantic Chunks
                    </span>
                    <button
                      onClick={() => {
                        audioSynth.playClickSound();
                        deleteDocument(doc.id);
                      }}
                      className="p-2 rounded-xl text-[#ba1a1a] hover:bg-[#FCD9D7]/50 transition-colors cursor-pointer"
                      title="Hapus Modul"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
