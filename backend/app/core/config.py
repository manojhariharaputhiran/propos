from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # App
    app_name: str = "RFP Automation API"
    environment: str = "development"
    debug: bool = True

    # Database
    database_url: str = "postgresql://rfpuser:rfppassword@localhost:5432/rfpdb"

    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: Optional[str] = None
    qdrant_collection: str = "rfp_knowledge"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Anthropic
    anthropic_api_key: Optional[str] = None

    # Auth
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    microsoft_client_id: Optional[str] = None
    microsoft_client_secret: Optional[str] = None
    allowed_origins: Optional[str] = None  # comma-separated, e.g. "https://propos.vercel.app"
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 24 hours

    # Feature flags
    @property
    def use_real_llm(self) -> bool:
        return bool(self.anthropic_api_key)

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
