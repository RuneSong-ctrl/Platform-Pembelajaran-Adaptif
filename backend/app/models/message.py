from datetime import datetime

from sqlalchemy import Column, DateTime, String, Text

from app.core.database import Base


class Announcement(Base):
    """A class-wide notice from the class teacher; every enrolled student can read it."""
    __tablename__ = "announcements"

    id = Column(String(64), primary_key=True)
    classroom_id = Column(String(64), nullable=False, index=True)
    author_id = Column(String(64), nullable=False)
    author_name = Column(String(255), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class DirectMessage(Base):
    """One message in a private thread between a class teacher and a student, or a student's parent."""
    __tablename__ = "direct_messages"

    id = Column(String(64), primary_key=True)
    classroom_id = Column(String(64), nullable=False, index=True)
    student_id = Column(String(64), nullable=False, index=True)
    # Thread = (classroom_id, student_id, parent_id). parent_id empty: teacher <-> student;
    # set: teacher <-> that parent, about that student.
    parent_id = Column(String(64), nullable=True, index=True)
    sender_id = Column(String(64), nullable=False)
    sender_name = Column(String(255), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    read_at = Column(DateTime, nullable=True)
