from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "ApoloFoodOS"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    SECRET_KEY: str = "cambia-esto-en-produccion-ahora-mismo"

    # Base de datos
    # Dev local:  sqlite+aiosqlite:///./apolofood.db
    # Producción: postgresql+asyncpg://user:pass@host:5432/db
    DATABASE_URL: str = "sqlite+aiosqlite:///./apolofood.db"

    # Redis (opcional — fallback a SimpleQueue si no está)
    REDIS_URL: Optional[str] = None

    # CORS — orígenes permitidos separados por coma en el .env
    # Ej: CORS_ORIGINS=https://apolofood.pages.dev,https://panel.apolofood.lat
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:4173"

    # Twilio WhatsApp (dejar vacío → mock en consola)
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"

    # Cloudflare R2
    R2_ACCESS_KEY: Optional[str] = None
    R2_SECRET_KEY: Optional[str] = None
    R2_BUCKET: str = "apolofood-images"
    R2_ENDPOINT: Optional[str] = None

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.DATABASE_URL

    @property
    def is_postgres(self) -> bool:
        return "postgresql" in self.DATABASE_URL

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
