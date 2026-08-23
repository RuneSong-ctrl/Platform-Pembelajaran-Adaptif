from fastapi import APIRouter
from app.api.v1.endpoints import (
    users,
    classrooms,
    documents,
    tasks,
    dda,
    assessment,
    submissions,
    blockchain,
    schedules,
    notes,
)

api_router = APIRouter()

api_router.include_router(users.router)
api_router.include_router(classrooms.router)
api_router.include_router(documents.router)
api_router.include_router(tasks.router)
api_router.include_router(dda.router)
api_router.include_router(assessment.router)
api_router.include_router(submissions.router)
api_router.include_router(blockchain.router)
api_router.include_router(schedules.router)
api_router.include_router(notes.router)
