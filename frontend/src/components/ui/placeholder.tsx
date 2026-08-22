"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Sparkles,
  Lock,
  Timer,
  Award,
  Layers,
  ArrowRight,
  Flame,
  Brain,
} from "@/components/ui/icons";

/* ==========================================================================
   1. EmptyState Component
   ========================================================================== */

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  variant?: "default" | "clay" | "subtle" | "mint" | "lavender";
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  variant = "clay",
  className,
}: EmptyStateProps) {
  const variantStyles = {
    default: "bg-white border border-[rgba(28,30,38,0.08)]",
    clay: "clay-card clay-white",
    subtle: "bg-[#F0EEF6] border border-transparent",
    mint: "clay-card clay-mint",
    lavender: "clay-card clay-lavender",
  };

  return (
    <div
      className={cn(
        "rounded-[28px] p-8 md:p-12 text-center flex flex-col items-center justify-center space-y-4 select-none",
        variantStyles[variant],
        className
      )}
    >
      <div className="w-16 h-16 rounded-3xl bg-[#F0EEF6] text-[#1C1E26] flex items-center justify-center shadow-xs">
        {icon || <Layers className="w-8 h-8 text-[#5A5E70]" />}
      </div>

      <div className="max-w-md space-y-1.5">
        <h3 className="text-lg md:text-xl font-black text-[#1C1E26]">{title}</h3>
        <p className="text-xs md:text-sm text-[#5A5E70] leading-relaxed">
          {description}
        </p>
      </div>

      {(actionText || secondaryActionText) && (
        <div className="flex items-center gap-3 pt-2 flex-wrap justify-center">
          {secondaryActionText && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSecondaryAction}
              className="rounded-xl"
            >
              {secondaryActionText}
            </Button>
          )}
          {actionText && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onAction}
              className="rounded-xl"
            >
              {actionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   2. MaterialPlaceholder Component
   ========================================================================== */

export interface MaterialPlaceholderProps {
  title?: string;
  topic?: string;
  modality?: "VISUAL" | "AUDITORI" | "KINESTETIK";
  isLocked?: boolean;
  lockReason?: string;
  progress?: number;
  estMinutes?: number;
  onStart?: () => void;
  className?: string;
}

export function MaterialPlaceholder({
  title = "Modul Pembelajaran Adaptif",
  topic = "Topik Selanjutnya",
  modality = "VISUAL",
  isLocked = false,
  lockReason = "Selesaikan kuis sebelumnya untuk membuka modul ini",
  progress = 0,
  estMinutes = 15,
  onStart,
  className,
}: MaterialPlaceholderProps) {
  const modalityBadges = {
    VISUAL: { label: "Visual Infografis", color: "mint" as const },
    AUDITORI: { label: "Podcast Dialog", color: "lavender" as const },
    KINESTETIK: { label: "Simulasi Interaktif", color: "butter" as const },
  };

  const badgeInfo = modalityBadges[modality] || modalityBadges.VISUAL;

  return (
    <div
      className={cn(
        "clay-card clay-white p-5 md:p-6 rounded-[28px] relative overflow-hidden transition-all duration-200",
        isLocked ? "opacity-80" : "hover:-translate-y-1 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Badge variant={badgeInfo.color}>{badgeInfo.label}</Badge>
          <span className="text-[11px] font-extrabold text-[#5A5E70] flex items-center gap-1">
            <Timer className="w-3 h-3" /> {estMinutes} Menit
          </span>
        </div>

        {isLocked ? (
          <div className="clay-pill clay-coral px-2.5 py-0.5 text-[10px] font-black flex items-center gap-1">
            <Lock className="w-3 h-3" /> Terkunci
          </div>
        ) : (
          <div className="clay-pill clay-mint px-2.5 py-0.5 text-[10px] font-black flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Siap Dipelajari
          </div>
        )}
      </div>

      <div className="space-y-1.5 mb-5">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#9195A8]">
          {topic}
        </span>
        <h4 className="text-base md:text-lg font-black text-[#1C1E26] leading-snug">
          {title}
        </h4>
        {isLocked && (
          <p className="text-xs text-[#852C28] bg-[#FCD9D7]/40 p-2.5 rounded-xl">
            {lockReason}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[rgba(28,30,38,0.06)]">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#5A5E70]">
          <BookOpen className="w-4 h-4 text-[#1C1E26]" />
          <span>{progress > 0 ? `${progress}% Selesai` : "Belum Dimulai"}</span>
        </div>

        <Button
          size="sm"
          variant={isLocked ? "outline" : "default"}
          onClick={onStart}
          disabled={isLocked}
          rightIcon={!isLocked ? <ArrowRight className="w-3.5 h-3.5" /> : undefined}
          className="rounded-xl"
        >
          {isLocked ? "Terkunci" : progress > 0 ? "Lanjutkan" : "Mulai Belajar"}
        </Button>
      </div>
    </div>
  );
}

/* ==========================================================================
   3. QuizPlaceholder Component
   ========================================================================== */

export interface QuizPlaceholderProps {
  title?: string;
  difficulty?: "BASIC" | "INTERMEDIATE" | "ADVANCED";
  questionCount?: number;
  rewardXP?: number;
  onStartQuiz?: () => void;
  className?: string;
}

export function QuizPlaceholder({
  title = "Tantangan Kuis DDA Adaptif",
  difficulty = "INTERMEDIATE",
  questionCount = 5,
  rewardXP = 100,
  onStartQuiz,
  className,
}: QuizPlaceholderProps) {
  const difficultyBadges = {
    BASIC: { label: "Dasar (Taraf 1)", color: "mint" as const },
    INTERMEDIATE: { label: "Menengah (Taraf 2)", color: "butter" as const },
    ADVANCED: { label: "Tinggi (Taraf 3)", color: "coral" as const },
  };

  const diff = difficultyBadges[difficulty] || difficultyBadges.INTERMEDIATE;

  return (
    <div
      className={cn(
        "clay-card clay-white p-5 md:p-6 rounded-[28px] relative overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <Badge variant={diff.color}>{diff.label}</Badge>
        <div className="clay-pill clay-butter px-3 py-1 flex items-center gap-1 text-[11px] font-black text-[#785308]">
          <Flame className="w-3.5 h-3.5 fill-[#785308]" />
          <span>+{rewardXP} XP</span>
        </div>
      </div>

      <div className="flex items-start gap-3.5 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#D2E5FA] text-[#21518A] flex items-center justify-center shrink-0">
          <Brain className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-black text-[#1C1E26]">{title}</h4>
          <p className="text-xs text-[#5A5E70]">
            {questionCount} Pertanyaan DDA (Dynamic Difficulty Adjustment)
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-[rgba(28,30,38,0.06)] flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#5A5E70] flex items-center gap-1">
          <Award className="w-3.5 h-3.5 text-[#1C1E26]" /> Sertifikat Terverifikasi
        </span>

        <Button
          size="sm"
          variant="primary"
          onClick={onStartQuiz}
          rightIcon={<Sparkles className="w-3.5 h-3.5" />}
          className="rounded-xl"
        >
          Kerjakan Kuis
        </Button>
      </div>
    </div>
  );
}

/* ==========================================================================
   4. ContentSkeleton Loader
   ========================================================================== */

export function ContentSkeleton({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3 animate-pulse select-none", className)}>
      <div className="h-6 w-1/3 bg-[#ECE9F4] rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 bg-[#ECE9F4] rounded-2xl w-full" />
        ))}
      </div>
    </div>
  );
}
