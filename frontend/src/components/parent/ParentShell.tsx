import React, { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import ParentSidebar from "@/components/layout/ParentSidebar";
import LinkChildForm from "@/components/parent/LinkChildForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "@/components/ui/icons";
import type { User } from "@/types";

/** The linked children and which one is selected (shared by every parent page). */
export function useChildren() {
  const { users, selectedParentChildId, setSelectedParentChildId } = useApp();
  const children = users.filter((u) => u.role === "SISWA").sort((a, b) => a.name.localeCompare(b.name));
  const child = children.find((c) => c.id === selectedParentChildId) || children[0];
  return { children, child, selectChild: setSelectedParentChildId };
}

/** Layout for parent pages: navbar, sidebar, child switcher. Shows only the link form until a child is linked. */
export default function ParentShell({ title, children: body }: { title: string; children: (child: User) => React.ReactNode }) {
  const { children, child, selectChild } = useChildren();
  const [linkOpen, setLinkOpen] = useState(false);

  return (
    <div className="h-dvh bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden w-full min-h-0">
        <ParentSidebar />
        <main className="flex-1 overflow-y-auto min-w-0 px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {!child ? (
              <div className="clay-card clay-white p-6 space-y-4 max-w-md mx-auto mt-6">
                <h1 className="text-xl font-black text-[#010105]">Hubungkan akun anak</h1>
                <LinkChildForm />
              </div>
            ) : (
              <>
                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#010105] tracking-tight">{title}</h1>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mb-1 max-w-full" role="tablist" aria-label="Pilih anak">
                    {children.length > 1 &&
                      children.map((c) => (
                        <button
                          key={c.id}
                          role="tab"
                          aria-selected={c.id === child.id}
                          onClick={() => selectChild(c.id)}
                          className={`clay-pill px-3.5 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer ${
                            c.id === child.id ? "clay-dark text-white" : "clay-white text-[#5A5E70]"
                          }`}
                        >
                          {c.name.split(" ")[0]}
                        </button>
                      ))}
                    <button
                      onClick={() => setLinkOpen(true)}
                      className="clay-pill clay-white px-3 py-1.5 text-xs font-bold text-[#5A5E70] whitespace-nowrap flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah anak
                    </button>
                  </div>
                </header>
                {body(child)}
              </>
            )}
          </div>
        </main>
      </div>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl border-2 border-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-[#010105]">Tambah anak</DialogTitle>
          </DialogHeader>
          <LinkChildForm onLinked={() => setLinkOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
