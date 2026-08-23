from typing import Dict, Any, Tuple
from app.schemas.dda import DDAEvaluationRequest, DDAEvaluationResponse, DDATransitionSchema

DDA_LEVELS = ["BASIC", "MEDIUM", "CHALLENGING", "MASTERY"]

def evaluate_dda_step(req: DDAEvaluationRequest) -> DDAEvaluationResponse:
    """
    Evaluasi matematika DDA Engine
    Sesuai SPEC.md §3 (Logika Matematis & Aturan Transisi Keadaan)
    """
    current_level = req.current_level.upper()
    if current_level not in DDA_LEVELS:
        current_level = "BASIC"
        
    current_idx = DDA_LEVELS.index(current_level)
    next_idx = current_idx
    action = "MAINTAIN"
    ai_hint = False

    new_consecutive_correct = req.consecutive_correct + 1 if req.is_correct else 0
    new_consecutive_incorrect = req.consecutive_incorrect + 1 if not req.is_correct else 0
    new_total_correct = req.total_correct + 1 if req.is_correct else req.total_correct
    new_total_answered = req.total_answered + 1

    # Aturan 1: Level UP (2x Benar & Waktu <= 25.0 detik)
    if req.is_correct and new_consecutive_correct >= 2 and req.response_time_sec <= 25.0:
        if current_idx < len(DDA_LEVELS) - 1:
            next_idx = current_idx + 1
            action = "LEVEL_UP"
    # Aturan 2: Level DOWN (2x Salah & Index > 0)
    elif not req.is_correct and new_consecutive_incorrect >= 2 and current_idx > 0:
        next_idx = current_idx - 1
        action = "LEVEL_DOWN"
        ai_hint = True
    # Aturan 3: OFFER HINT (2x Salah di BASIC)
    elif not req.is_correct and new_consecutive_incorrect >= 2 and current_idx == 0:
        action = "OFFER_HINT"
        ai_hint = True

    next_level = DDA_LEVELS[next_idx]

    transition = DDATransitionSchema(
        question_index=req.question_index,
        from_level=current_level,
        to_level=next_level,
        is_correct=req.is_correct,
        response_time_sec=req.response_time_sec,
        action=action
    )

    return DDAEvaluationResponse(
        next_level=next_level,
        consecutive_correct=0 if action == "LEVEL_UP" else new_consecutive_correct,
        consecutive_incorrect=0 if action == "LEVEL_DOWN" else new_consecutive_incorrect,
        total_correct=new_total_correct,
        total_answered=new_total_answered,
        action=action,
        ai_hint_suggested=ai_hint,
        transition=transition
    )
