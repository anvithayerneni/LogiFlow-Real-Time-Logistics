from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "Real-Time Delivery & Logistics Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "supersecret-jwt-key-replace-in-production-min-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    # Default to sqlite for instant local test execution, easily overridden by env var for PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./delivery_platform.db")

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    REDIS_ENABLED: bool = True

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    KAFKA_ENABLED: bool = os.getenv("KAFKA_ENABLED", "false").lower() in ("true", "1", "yes")
    KAFKA_CLIENT_ID: str = "delivery-platform-backend"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # Logistics defaults
    DEFAULT_AVERAGE_SPEED_KMH: float = 30.0  # Urban driving speed
    DEFAULT_PREP_BUFFER_MINUTES: float = 5.0
    BASE_DELIVERY_FEE: float = 2.99
    PER_KM_DELIVERY_FEE: float = 0.85
    TAX_RATE: float = 0.0825  # 8.25%

    # Payments
    MOCK_PAYMENT_DELAY_SECONDS: float = 0.5

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore"
    )


settings = Settings()
