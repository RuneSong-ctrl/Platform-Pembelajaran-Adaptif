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

    # Universal / 9router AI Gateway Configuration (Semua dimuat murni dari .env)
    AI_GATEWAY_BASE_URL: str = ""
    GEMINI_API_KEY: str = ""
    AI_API_KEY: Optional[str] = None
    GEMINI_CHAT_MODEL: str = ""
    GEMINI_EMBEDDING_MODEL: str = ""
    AI_RATE_LIMIT_PER_MINUTE: int = 20
    AI_CACHE_TTL_SECONDS: int = 86400

    # 1. Text-to-Speech (TTS) Gateway Config
    TTS_ENDPOINT: str = ""
    TTS_API_KEY: str = ""
    TTS_MODEL: str = ""
    TTS_VOICE: str = ""

    # 2. Image Generation Gateway Config
    IMAGE_GEN_ENDPOINT: str = ""
    IMAGE_GEN_API_KEY: str = ""
    IMAGE_GEN_MODEL: str = ""

    # 3. Embedding Gateway Config
    EMBEDDING_ENDPOINT: str = ""
    EMBEDDING_API_KEY: str = ""
    EMBEDDING_MODEL: str = ""

    # 4. Chat & LLM Gateway Config
    CHAT_ENDPOINT: str = ""
    CHAT_API_KEY: str = ""
    CHAT_MODEL: str = ""

    def model_post_init(self, __context):
        # Sinkronisasi GEMINI_API_KEY dan AI_API_KEY dari .env
        if not self.GEMINI_API_KEY and self.AI_API_KEY:
            self.GEMINI_API_KEY = self.AI_API_KEY
        elif self.GEMINI_API_KEY and not self.AI_API_KEY:
            self.AI_API_KEY = self.GEMINI_API_KEY

        # Fallback kunci API jika spesifik tool dikosongkan di .env
        default_key = self.GEMINI_API_KEY or self.AI_API_KEY or ""
        if not self.TTS_API_KEY:
            self.TTS_API_KEY = default_key
        if not self.IMAGE_GEN_API_KEY:
            self.IMAGE_GEN_API_KEY = default_key
        if not self.EMBEDDING_API_KEY:
            self.EMBEDDING_API_KEY = default_key
        if not self.CHAT_API_KEY:
            self.CHAT_API_KEY = default_key

        # Sinkronisasi nama model Chat & Embedding jika salah satu diisi di .env
        if not self.CHAT_MODEL and self.GEMINI_CHAT_MODEL:
            self.CHAT_MODEL = self.GEMINI_CHAT_MODEL
        elif not self.GEMINI_CHAT_MODEL and self.CHAT_MODEL:
            self.GEMINI_CHAT_MODEL = self.CHAT_MODEL

        if not self.EMBEDDING_MODEL and self.GEMINI_EMBEDDING_MODEL:
            self.EMBEDDING_MODEL = self.GEMINI_EMBEDDING_MODEL
        elif not self.GEMINI_EMBEDDING_MODEL and self.EMBEDDING_MODEL:
            self.GEMINI_EMBEDDING_MODEL = self.EMBEDDING_MODEL

        # Resolusi endpoint dinamis murni berbasis AI_GATEWAY_BASE_URL dari .env jika endpoint tool kosong
        if self.AI_GATEWAY_BASE_URL:
            base = self.AI_GATEWAY_BASE_URL.rstrip("/")
            if not self.TTS_ENDPOINT:
                self.TTS_ENDPOINT = f"{base}/audio/speech"
            if not self.IMAGE_GEN_ENDPOINT:
                self.IMAGE_GEN_ENDPOINT = f"{base}/images/generations"
            if not self.EMBEDDING_ENDPOINT:
                self.EMBEDDING_ENDPOINT = f"{base}/embeddings"
            if not self.CHAT_ENDPOINT:
                self.CHAT_ENDPOINT = f"{base}/chat/completions"

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
