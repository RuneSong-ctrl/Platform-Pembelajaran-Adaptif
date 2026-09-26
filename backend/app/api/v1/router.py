from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    users,
    classrooms,
    documents,
    learning_units,
    tasks,
    dda,
    assessment,
    submissions,
    blockchain,
    schedules,
    notes,
    ai,
    messages,
    family,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(classrooms.router)
api_router.include_router(documents.router)
api_router.include_router(learning_units.router)
api_router.include_router(tasks.router)
api_router.include_router(dda.router)
api_router.include_router(assessment.router)
api_router.include_router(submissions.router)
api_router.include_router(blockchain.router)
api_router.include_router(schedules.router)
api_router.include_router(notes.router)
api_router.include_router(ai.router)
api_router.include_router(messages.router)
api_router.include_router(family.router)
