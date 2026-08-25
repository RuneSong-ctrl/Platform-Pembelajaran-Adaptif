import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure connect args based on DB engine
connect_args = {}
database_url = settings.DATABASE_URL

if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        database_url,
        connect_args=connect_args,
        pool_pre_ping=True,
        echo=False
    )
    # Test connection
    with engine.connect() as conn:
        logger.info(f"Connected successfully to database: {database_url}")
except Exception as e:
    logger.warning(f"Failed to connect to configured DB ({database_url}): {e}. Falling back to SQLite.")
    fallback_url = "sqlite:///./eduadapt.db"
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def check_and_migrate_db():
    try:
        with engine.connect() as conn:
            raw_conn = conn.connection
            cursor = raw_conn.cursor()
            if str(engine.url).startswith("sqlite"):
                cursor.execute("PRAGMA table_info(users)")
                cols = [c[1] for c in cursor.fetchall()]
                if cols and "learning_progress" not in cols:
                    cursor.execute("ALTER TABLE users ADD COLUMN learning_progress JSON")
                    raw_conn.commit()
                    logger.info("Auto-migrated users table: added learning_progress column.")
    except Exception as e:
        logger.warning(f"Database migration check notice: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
