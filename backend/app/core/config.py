from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "EduAdapt Platform API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "eduadapt_super_secret_jwt_key_2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Database URL
    DATABASE_URL: str = "sqlite:///./eduadapt.db"
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]
    
    GENESIS_PREVIOUS_HASH: str = "0000000000000000000000000000000000000000000000000000000000000000"

    # Google Gemini AI Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_CHAT_MODEL: str = "gemini-2.0-flash"
    GEMINI_EMBEDDING_MODEL: str = "text-embedding-004"
    AI_RATE_LIMIT_PER_MINUTE: int = 20
    AI_CACHE_TTL_SECONDS: int = 86400

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
