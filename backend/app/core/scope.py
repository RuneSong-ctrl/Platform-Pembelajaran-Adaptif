"""Which records a signed-in user may list. List endpoints must never return other accounts' data."""
from sqlalchemy.orm import Session

from app.models.classroom import Classroom
from app.models.user import User


def visible_classrooms(user: User, db: Session) -> list[Classroom]:
    if user.role == "GURU":
        return db.query(Classroom).filter(Classroom.teacher_id == user.id).all()
    # student_ids is a JSON list, so membership is checked in Python (portable across SQLite/MySQL).
    members = {user.id} if user.role == "SISWA" else set(user.children_ids or [])
    if not members:
        return []
    return [c for c in db.query(Classroom).all() if members & set(c.student_ids or [])]


def visible_classroom_ids(user: User, db: Session) -> set[str]:
    return {c.id for c in visible_classrooms(user, db)}


def visible_student_ids(user: User, db: Session) -> set[str]:
    if user.role == "SISWA":
        return {user.id}
    if user.role == "ORTU":
        return set(user.children_ids or [])
    return {sid for c in visible_classrooms(user, db) for sid in (c.student_ids or [])}
