"""Timed exams (UTS/UAS): deadlines, automatic multiple-choice scoring, and closing attempts that ran out of time."""
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.models.submission import AssignmentSubmission
from app.models.task import GroundedTask

# A last autosave or the submit request can arrive a little after the clock hits zero.
GRACE = timedelta(seconds=60)


def to_utc_naive(value: Optional[datetime]) -> Optional[datetime]:
    """The database stores naive UTC; browsers send ISO strings with an offset."""
    if value and value.tzinfo:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


def questions_of(task: GroundedTask) -> list:
    out = []
    for q in (task.content_json or {}).get("questions") or []:
        kind = q.get("kind") or "mcq"
        out.append({**q, "kind": kind, "points": float(q.get("points") or 1)})
    return out


def answer_key(question: dict):
    return question.get("correctIndex", question.get("correct_index"))


def deadline(task: GroundedTask, sub: AssignmentSubmission) -> Optional[datetime]:
    candidates = [task.closes_at]
    if task.time_limit_minutes and sub.started_at:
        candidates.append(sub.started_at + timedelta(minutes=task.time_limit_minutes))
    candidates = [c for c in candidates if c]
    return min(candidates) if candidates else None


def score(task: GroundedTask, sub: AssignmentSubmission) -> dict:
    answers = sub.answers or {}
    essays = sub.essay_scores or {}
    got = total = 0.0
    correct = mcq_count = 0
    pending = False
    for q in questions_of(task):
        total += q["points"]
        if q["kind"] == "mcq":
            mcq_count += 1
            chosen = answers.get(q["id"])
            if chosen is not None and chosen == answer_key(q):
                got += q["points"]
                correct += 1
        elif q["id"] in essays:
            got += min(max(float(essays[q["id"]]), 0.0), q["points"])
        else:
            pending = True
    return {"got": got, "total": total, "correct": correct, "mcq_count": mcq_count, "pending": pending}


def apply_grade(task: GroundedTask, sub: AssignmentSubmission) -> None:
    """Grades what can be graded; essays waiting for the teacher keep the exam in SUBMITTED."""
    result = score(task, sub)
    if result["mcq_count"]:
        sub.content = f"Ujian: {result['correct']} dari {result['mcq_count']} soal pilihan ganda benar."
    else:
        sub.content = "Ujian esai."
    if result["pending"]:
        sub.status, sub.grade = "SUBMITTED", None
    else:
        sub.status = "GRADED"
        sub.grade = round(result["got"] / result["total"] * 100, 1) if result["total"] else 0.0


def finish(task: GroundedTask, sub: AssignmentSubmission, at: datetime) -> None:
    sub.submitted_at = at
    apply_grade(task, sub)


def settle(task: GroundedTask, sub: AssignmentSubmission, now: Optional[datetime] = None) -> bool:
    """Closes an exam whose time is over with the answers saved so far, even if the student's phone died."""
    if sub.status != "IN_PROGRESS" or task.type != "exam":
        return False
    end = deadline(task, sub)
    if end and (now or datetime.utcnow()) > end + GRACE:
        finish(task, sub, end)
        return True
    return False
