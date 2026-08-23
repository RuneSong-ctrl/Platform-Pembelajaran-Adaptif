from pydantic import BaseModel
from typing import List, Optional

class DDATransitionSchema(BaseModel):
    question_index: int
    from_level: str
    to_level: str
    is_correct: bool
    response_time_sec: float
    action: str # "LEVEL_UP", "LEVEL_DOWN", "MAINTAIN", "OFFER_HINT"

class DDAEvaluationRequest(BaseModel):
    current_level: str
    consecutive_correct: int = 0
    consecutive_incorrect: int = 0
    total_correct: int = 0
    total_answered: int = 0
    is_correct: bool
    response_time_sec: float
    question_index: int

class DDAEvaluationResponse(BaseModel):
    next_level: str
    consecutive_correct: int
    consecutive_incorrect: int
    total_correct: int
    total_answered: int
    action: str
    ai_hint_suggested: bool
    transition: DDATransitionSchema
