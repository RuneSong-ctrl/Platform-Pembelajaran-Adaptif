"""Streak and XP come from real activity: a day counts once the student actually learns something that day."""
from datetime import date, datetime, timedelta, timezone

from app.core.config import settings
from app.models.user import User

# Awarded when a quiz is passed for the first time (the home page advertises this amount).
QUIZ_PASS_XP = 50


def local_today() -> date:
    return datetime.now(timezone(timedelta(hours=settings.STREAK_UTC_OFFSET_HOURS))).date()


def record_activity(user: User) -> None:
    """Call on any real learning action. Consecutive days extend the streak; a missed day restarts it."""
    if user.role != "SISWA":
        return
    today = local_today()
    last = user.last_active_on
    if last == today:
        return
    user.streak_days = (user.streak_days or 0) + 1 if last == today - timedelta(days=1) else 1
    user.last_active_on = today


def current_streak(user: User) -> int:
    """A streak whose last active day is before yesterday is already broken."""
    last = user.last_active_on
    if not last or last < local_today() - timedelta(days=1):
        return 0
    return user.streak_days or 0


def settle_streak(user: User) -> bool:
    """Writes a broken streak back as 0 so every screen shows the same number. Returns True if it changed."""
    streak = current_streak(user)
    if (user.streak_days or 0) != streak:
        user.streak_days = streak
        return True
    return False


def award_xp(user: User, amount: int) -> None:
    if amount > 0:
        user.xp_total = (user.xp_total or 0) + int(amount)
