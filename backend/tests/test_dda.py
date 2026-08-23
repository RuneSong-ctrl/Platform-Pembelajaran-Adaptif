import pytest
from app.schemas.dda import DDAEvaluationRequest
from app.services.dda_service import evaluate_dda_step

def test_dda_level_up():
    # 2x benar dan response time <= 25 detik -> LEVEL_UP
    req = DDAEvaluationRequest(
        current_level="BASIC",
        consecutive_correct=1,
        consecutive_incorrect=0,
        total_correct=1,
        total_answered=1,
        is_correct=True,
        response_time_sec=15.0,
        question_index=1
    )
    res = evaluate_dda_step(req)
    assert res.action == "LEVEL_UP"
    assert res.next_level == "MEDIUM"

def test_dda_level_down():
    # 2x salah dari MEDIUM -> LEVEL_DOWN ke BASIC
    req = DDAEvaluationRequest(
        current_level="MEDIUM",
        consecutive_correct=0,
        consecutive_incorrect=1,
        total_correct=2,
        total_answered=3,
        is_correct=False,
        response_time_sec=30.0,
        question_index=3
    )
    res = evaluate_dda_step(req)
    assert res.action == "LEVEL_DOWN"
    assert res.next_level == "BASIC"
    assert res.ai_hint_suggested is True

def test_dda_maintain():
    # 1x benar dari BASIC -> MAINTAIN
    req = DDAEvaluationRequest(
        current_level="BASIC",
        consecutive_correct=0,
        consecutive_incorrect=0,
        total_correct=0,
        total_answered=0,
        is_correct=True,
        response_time_sec=12.0,
        question_index=0
    )
    res = evaluate_dda_step(req)
    assert res.action == "MAINTAIN"
    assert res.next_level == "BASIC"
    assert res.consecutive_correct == 1
