"""Kinesthetic practice missions: stages are derived from teacher-approved content, and progress is stored per
student so a harder stage can only be completed after every easier stage (enforced here, not only in the UI).

The stage rules must stay identical to frontend/src/lib/practiceMission.ts.
"""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String

from app.core.database import Base

MIN_ITEMS = 3          # a sequence needs at least three steps to be worth ordering
MIN_MAP_SLOTS = 2      # a map stage needs at least two cards to place
MAX_UNIT_STAGES = 2    # bonus sequence stages taken from learning units
MAX_STAGE_XP = 30


class PracticeProgress(Base):
    __tablename__ = "practice_progress"

    user_id = Column(String(64), ForeignKey("users.id"), primary_key=True)
    document_id = Column(String(64), ForeignKey("documents.id"), primary_key=True)
    completed = Column(JSON, nullable=False, default=list)  # [{"stage": id, "xp": n, "at": iso}]
    updated_at = Column(DateTime, nullable=True)


def _depths(nodes: list[dict]) -> dict[str, int]:
    parents = {node["id"]: node.get("parent") for node in nodes}
    depths = {}
    for node_id in parents:
        depth, current, seen = 0, node_id, set()
        while parents.get(current) and current not in seen:
            seen.add(current)
            current = parents[current]
            depth += 1
        depths[node_id] = depth
    return depths


def practice_stage_ids(infographic: dict | None, units: list[dict]) -> list[str]:
    """Ordered easy → hard; empty when the approved content has nothing to practise."""
    stages = []
    info = infographic or {}
    diagram = info.get("diagram") or {}
    if len(info.get("flow_steps") or []) >= MIN_ITEMS or (
            diagram.get("kind") == "timeline" and len(diagram.get("nodes") or []) >= MIN_ITEMS):
        stages.append("sequence-main")
    if diagram.get("kind") == "mindmap":
        depths = _depths(diagram.get("nodes") or [])
        if sum(1 for d in depths.values() if d == 1) >= MIN_MAP_SLOTS:
            stages.append("map-branches")
        if sum(1 for d in depths.values() if d >= 2) >= MIN_MAP_SLOTS:
            stages.append("map-details")
    bonus = [unit for unit in units or []
             if (unit.get("visual") or {}).get("kind") == "sequence"
             and len(unit["visual"].get("nodes") or []) >= MIN_ITEMS]
    stages += [f"sequence-unit-{unit['id']}" for unit in bonus[:MAX_UNIT_STAGES]]
    return stages


def progress_view(record: PracticeProgress | None, stages: list[str]) -> dict:
    """Only stages that still exist count (the teacher may republish different content)."""
    done = [entry for entry in (record.completed if record else []) if entry.get("stage") in stages]
    return {"stages": stages, "completed": [entry["stage"] for entry in done],
            "xp": sum(int(entry.get("xp") or 0) for entry in done)}


def complete_stage(record: PracticeProgress, stages: list[str], stage: str, xp: int) -> None:
    """Raises ValueError when the stage is unknown or an easier stage is still unfinished."""
    if stage not in stages:
        raise ValueError("Tahap tidak dikenal untuk materi ini.")
    done = {entry.get("stage") for entry in record.completed or []}
    if stage in done:
        return  # finishing again keeps the first result
    missing = [earlier for earlier in stages[:stages.index(stage)] if earlier not in done]
    if missing:
        raise ValueError("Selesaikan tahap sebelumnya terlebih dahulu.")
    record.completed = [*(record.completed or []),
                        {"stage": stage, "xp": max(0, min(MAX_STAGE_XP, int(xp))), "at": datetime.utcnow().isoformat() + "Z"}]
    record.updated_at = datetime.utcnow()
