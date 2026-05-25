from __future__ import annotations

from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    rx_label_guard_api_key: Optional[str] = Field(default=None, alias="RX_LABEL_GUARD_API_KEY")
    rx_label_guard_mock: bool = Field(default=True, alias="RX_LABEL_GUARD_MOCK")
    rx_label_guard_timeout_seconds: float = Field(default=10, alias="RX_LABEL_GUARD_TIMEOUT_SECONDS")
    cors_origins: str = Field(default="http://localhost:5173", alias="CORS_ORIGINS")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
