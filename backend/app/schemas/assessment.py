from pydantic import BaseModel
from typing import List, Dict

class AssessmentAnswer(BaseModel):
    question_id: int
    selected_option_index: int
    visual_score: int
    audio_score: int
    practice_score: int
    response_time_sec: float

class AssessmentSubmitRequest(BaseModel):
    student_id: str
    answers: List[AssessmentAnswer]

class AssessmentResultResponse(BaseModel):
    student_id: str
    dominant_modality: str # "VISUAL", "AUDITORI", "KINESTETIK"
    modality_scores: Dict[str, int]
    processing_speed: str
    message: str
