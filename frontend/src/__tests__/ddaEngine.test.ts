import { describe, it, expect } from "vitest";
import {
  createInitialDDAState,
  evaluateDDAAnswer,
  DDA_LEVELS,
} from "../services/ddaEngine";

describe("Dynamic Difficulty Adjustment (DDA Engine)", () => {
  it("should initialize with BASIC level and 0 stats", () => {
    const state = createInitialDDAState("BASIC");
    expect(state.currentLevel).toBe("BASIC");
    expect(state.consecutiveCorrect).toBe(0);
    expect(state.consecutiveIncorrect).toBe(0);
    expect(state.totalCorrect).toBe(0);
    expect(state.totalAnswered).toBe(0);
    expect(state.history).toHaveLength(0);
    expect(state.aiHintSuggested).toBe(false);
  });

  it("should maintain level after 1 correct answer", () => {
    const s0 = createInitialDDAState("BASIC");
    const { nextState, transition } = evaluateDDAAnswer(s0, true, 12.5, 0);

    expect(nextState.currentLevel).toBe("BASIC");
    expect(nextState.consecutiveCorrect).toBe(1);
    expect(nextState.totalCorrect).toBe(1);
    expect(nextState.totalAnswered).toBe(1);
    expect(transition.action).toBe("MAINTAIN");
  });

  it("should LEVEL_UP to MEDIUM after 2 consecutive correct answers within 25 seconds", () => {
    let state = createInitialDDAState("BASIC");
    // 1st correct
    state = evaluateDDAAnswer(state, true, 14.0, 0).nextState;
    // 2nd correct
    const { nextState, transition } = evaluateDDAAnswer(state, true, 18.0, 1);

    expect(nextState.currentLevel).toBe("MEDIUM");
    expect(transition.action).toBe("LEVEL_UP");
    expect(nextState.consecutiveCorrect).toBe(0); // reset after level up
    expect(nextState.totalCorrect).toBe(2);
  });

  it("should NOT level up if response time exceeds 25 seconds", () => {
    let state = createInitialDDAState("BASIC");
    state = evaluateDDAAnswer(state, true, 14.0, 0).nextState;
    const { nextState, transition } = evaluateDDAAnswer(state, true, 28.0, 1);

    expect(nextState.currentLevel).toBe("BASIC");
    expect(transition.action).toBe("MAINTAIN");
    expect(nextState.consecutiveCorrect).toBe(2);
  });

  it("should LEVEL_DOWN from MEDIUM to BASIC after 2 consecutive incorrect answers", () => {
    let state = createInitialDDAState("MEDIUM");
    // 1st wrong
    state = evaluateDDAAnswer(state, false, 20.0, 0).nextState;
    expect(state.currentLevel).toBe("MEDIUM");
    expect(state.consecutiveIncorrect).toBe(1);

    // 2nd wrong
    const { nextState, transition } = evaluateDDAAnswer(state, false, 22.0, 1);
    expect(nextState.currentLevel).toBe("BASIC");
    expect(transition.action).toBe("LEVEL_DOWN");
    expect(nextState.aiHintSuggested).toBe(true);
  });

  it("should offer AI hint if 2 consecutive incorrect answers happen at BASIC", () => {
    let state = createInitialDDAState("BASIC");
    state = evaluateDDAAnswer(state, false, 15.0, 0).nextState;
    const { nextState, transition } = evaluateDDAAnswer(state, false, 15.0, 1);

    expect(nextState.currentLevel).toBe("BASIC"); // Cannot go lower than BASIC
    expect(transition.action).toBe("OFFER_HINT");
    expect(nextState.aiHintSuggested).toBe(true);
  });
});
