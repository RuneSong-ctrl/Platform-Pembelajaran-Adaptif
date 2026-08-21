import { DDALevel, DDATransition } from "@/types";

/**
 * Dynamic Difficulty Adjustment (DDA Engine)
 * Sesuai SPEC.md §3 (Logika Matematis & Aturan Transisi Keadaan)
 */

export const DDA_LEVELS: DDALevel[] = [
  "BASIC",
  "MEDIUM",
  "CHALLENGING",
  "MASTERY",
];

export interface DDAState {
  currentLevel: DDALevel;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  totalCorrect: number;
  totalAnswered: number;
  history: DDATransition[];
  aiHintSuggested: boolean;
}

export function createInitialDDAState(startLevel: DDALevel = "BASIC"): DDAState {
  return {
    currentLevel: startLevel,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    totalCorrect: 0,
    totalAnswered: 0,
    history: [],
    aiHintSuggested: false,
  };
}

export function evaluateDDAAnswer(
  state: DDAState,
  isCorrect: boolean,
  responseTimeSec: number,
  questionIndex: number
): {
  nextState: DDAState;
  transition: DDATransition;
} {
  const currentIdx = DDA_LEVELS.indexOf(state.currentLevel);
  let nextIdx = currentIdx;
  let action: DDATransition["action"] = "MAINTAIN";
  let aiHint = false;

  const newConsecutiveCorrect = isCorrect ? state.consecutiveCorrect + 1 : 0;
  const newConsecutiveIncorrect = !isCorrect ? state.consecutiveIncorrect + 1 : 0;
  const newTotalCorrect = isCorrect ? state.totalCorrect + 1 : state.totalCorrect;
  const newTotalAnswered = state.totalAnswered + 1;

  // Aturan 1: Level UP (2x Benar & Waktu <= 25 detik)
  if (isCorrect && newConsecutiveCorrect >= 2 && responseTimeSec <= 25.0) {
    if (currentIdx < DDA_LEVELS.length - 1) {
      nextIdx = currentIdx + 1;
      action = "LEVEL_UP";
    }
  }
  // Aturan 2: Level DOWN (2x Salah & Index > 0)
  else if (!isCorrect && newConsecutiveIncorrect >= 2 && currentIdx > 0) {
    nextIdx = currentIdx - 1;
    action = "LEVEL_DOWN";
    aiHint = true;
  }
  // Aturan 3: OFFER HINT (2x Salah di BASIC)
  else if (!isCorrect && newConsecutiveIncorrect >= 2 && currentIdx === 0) {
    action = "OFFER_HINT";
    aiHint = true;
  }

  const nextLevel = DDA_LEVELS[nextIdx];

  const transition: DDATransition = {
    questionIndex,
    fromLevel: state.currentLevel,
    toLevel: nextLevel,
    isCorrect,
    responseTimeSec,
    action,
  };

  const nextState: DDAState = {
    currentLevel: nextLevel,
    consecutiveCorrect: action === "LEVEL_UP" ? 0 : newConsecutiveCorrect,
    consecutiveIncorrect: action === "LEVEL_DOWN" ? 0 : newConsecutiveIncorrect,
    totalCorrect: newTotalCorrect,
    totalAnswered: newTotalAnswered,
    history: [...state.history, transition],
    aiHintSuggested: aiHint,
  };

  return { nextState, transition };
}
