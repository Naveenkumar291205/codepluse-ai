"""
CodePulse AI - Configuration Module
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "CodePulse AI")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./codepulse.db")

    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))
    MAX_FILES_IN_ARCHIVE: int = int(os.getenv("MAX_FILES_IN_ARCHIVE", "500"))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")

    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
        ).split(",")
    ]


settings = Settings()
