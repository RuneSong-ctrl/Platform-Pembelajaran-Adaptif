import logging
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

def seed_initial_data(db: Session):
    """
    Seed service initialized.
    No mock / hardcoded demo entries inserted, ensuring 100% clean integration
    between frontend and backend database.
    """
    logger.info("EduAdapt database ready for real dynamic operations.")
