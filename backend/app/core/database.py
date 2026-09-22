import logging
from sqlalchemy import create_engine, inspect, text
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
        with engine.begin() as conn:
            inspector = inspect(conn)
            if inspector.has_table("users"):
                columns = {column["name"] for column in inspector.get_columns("users")}
                if "password_hash" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
            if inspector.has_table("documents"):
                columns = {column["name"] for column in inspector.get_columns("documents")}
                for name in ["infographic_data_json", "karaoke_json", "podcast_episodes_json", "game_config_json", "visual_nodes_json", "fill_blank_json", "sorting_challenges_json"]:
                    if name not in columns:
                        conn.execute(text(f"ALTER TABLE documents ADD COLUMN {name} TEXT"))
            # create_all never adds columns to an existing table, so newer model columns are added here.
            for table_name in ["adaptive_documents", "auth_sessions"]:
                table = Base.metadata.tables.get(table_name)
                if table is None or not inspector.has_table(table_name):
                    continue
                existing = {column["name"] for column in inspector.get_columns(table_name)}
                for column in table.columns:
                    if column.name not in existing:
                        ddl_type = column.type.compile(dialect=conn.dialect)
                        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column.name} {ddl_type}"))
                        logger.info(f"Auto-migrated {table_name}: added {column.name} column.")
            if inspector.has_table("adaptive_documents"):
                for name in ["source_segments", "draft_units", "published_units", "published_sources"]:
                    conn.execute(text(f"UPDATE adaptive_documents SET {name} = '[]' WHERE {name} IS NULL"))
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

                cursor.execute("PRAGMA table_info(documents)")
                doc_cols = [c[1] for c in cursor.fetchall()]
                for col_name in ["karaoke_json", "podcast_episodes_json", "game_config_json", "visual_nodes_json", "fill_blank_json", "sorting_challenges_json"]:
                    if doc_cols and col_name not in doc_cols:
                        cursor.execute(f"ALTER TABLE documents ADD COLUMN {col_name} TEXT")
                        raw_conn.commit()
                        logger.info(f"Auto-migrated documents table: added {col_name} column.")
    except Exception as e:
        logger.warning(f"Database migration check notice: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
