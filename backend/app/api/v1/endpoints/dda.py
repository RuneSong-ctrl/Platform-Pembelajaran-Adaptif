from fastapi import APIRouter, HTTPException, status
from app.schemas.dda import DDAEvaluationRequest, DDAEvaluationResponse
from app.services.dda_service import evaluate_dda_step

router = APIRouter(prefix="/dda", tags=["Dynamic Difficulty Adjustment"])

@router.post("/evaluate", response_model=DDAEvaluationResponse)
def evaluate_dda(req: DDAEvaluationRequest):
    """
    Evaluasi matematika DDA Engine secara real-time
    Menyesuaikan level kesulitan (BASIC -> MEDIUM -> CHALLENGING -> MASTERY)
    """
    return evaluate_dda_step(req)
