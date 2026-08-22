"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  title: string;
  description?: string;
  submitText?: string;
  cancelText?: string;
  submitVariant?: "default" | "primary" | "mint" | "butter" | "sky" | "coral";
  isLoading?: boolean;
  errorMessage?: string | null;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function InputModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  submitText = "Simpan",
  cancelText = "Batal",
  submitVariant = "default",
  isLoading = false,
  errorMessage,
  children,
  size = "md",
  className,
}: InputModalProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(e);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      variant="clay"
      className={className}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-[#FCD9D7] text-[#852C28] rounded-2xl text-xs font-bold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-3.5 py-1">{children}</div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[rgba(28,30,38,0.06)]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl"
          >
            {cancelText}
          </Button>

          <Button
            type="submit"
            variant={submitVariant}
            size="sm"
            isLoading={isLoading}
            loadingText="Menyimpan..."
            className="rounded-xl font-black"
          >
            {submitText}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
