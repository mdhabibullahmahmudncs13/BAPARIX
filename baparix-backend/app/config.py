"""
Configuration Management

This module handles all application configuration using pydantic-settings
for environment variable validation and type safety.
"""

from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )
    
    # Application Settings
    APP_NAME: str = "VentureOS Backend"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = Field(..., min_length=32)
    API_V1_PREFIX: str = "/api/v1"
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    RELOAD: bool = True
    
    # CORS Settings
    CORS_ORIGINS: str = "http://localhost:3000"
    CORS_ALLOW_CREDENTIALS: bool = True
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS
    
    # PostgreSQL Database
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "ventureos"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = Field(..., min_length=8)
    DATABASE_URL: Optional[str] = None
    
    @property
    def database_url(self) -> str:
        """Construct database URL if not provided."""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
    
    # MongoDB
    MONGODB_HOST: str = "localhost"
    MONGODB_PORT: int = 27017
    MONGODB_DB: str = "ventureos_products"
    MONGODB_USER: str = "mongo"
    MONGODB_PASSWORD: str = Field(..., min_length=8)
    MONGODB_URL: Optional[str] = None
    
    @property
    def mongodb_url(self) -> str:
        """Construct MongoDB URL if not provided."""
        if self.MONGODB_URL:
            return self.MONGODB_URL
        return (
            f"mongodb://{self.MONGODB_USER}:{self.MONGODB_PASSWORD}"
            f"@{self.MONGODB_HOST}:{self.MONGODB_PORT}/{self.MONGODB_DB}"
        )
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = Field(default="", min_length=0)  # Allow empty for local dev
    REDIS_DB: int = 0
    REDIS_URL: Optional[str] = None
    
    @property
    def redis_url(self) -> str:
        """Construct Redis URL if not provided."""
        if self.REDIS_URL:
            return self.REDIS_URL
        # If password is empty, don't include it in URL
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        else:
            return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    # Celery
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None
    CELERY_TASK_ALWAYS_EAGER: bool = False
    
    @property
    def celery_broker_url(self) -> str:
        """Construct Celery broker URL if not provided."""
        if self.CELERY_BROKER_URL:
            return self.CELERY_BROKER_URL
        return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/1"
    
    @property
    def celery_result_backend(self) -> str:
        """Construct Celery result backend URL if not provided."""
        if self.CELERY_RESULT_BACKEND:
            return self.CELERY_RESULT_BACKEND
        return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/2"
    
    # Meilisearch
    MEILISEARCH_HOST: str = "http://localhost:7700"
    MEILISEARCH_API_KEY: str = Field(..., min_length=16)
    
    # Supabase Auth
    SUPABASE_URL: str = Field(..., pattern=r"^https://.*\.supabase\.co$")
    SUPABASE_KEY: str = Field(..., min_length=32)
    SUPABASE_SERVICE_KEY: str = Field(..., min_length=32)
    JWT_SECRET: str = Field(..., min_length=32)
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # AI Models - Local (Ollama)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:7b"
    OLLAMA_TIMEOUT: int = 30
    
    # AI Models - Cloud (OpenRouter)
    OPENROUTER_API_KEY: str = Field(..., min_length=32)
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_BLUEPRINT_MODEL: str = "meta-llama/llama-3.1-8b-instruct:free"
    OPENROUTER_MARKET_MODEL: str = "mistralai/mistral-7b-instruct:free"
    OPENROUTER_SEO_MODEL: str = "google/gemma-2-9b-it:free"
    
    # External APIs
    GOOGLE_TRENDS_API_KEY: Optional[str] = None
    FACEBOOK_AD_LIBRARY_TOKEN: Optional[str] = None
    TIKTOK_API_KEY: Optional[str] = None
    
    # Payment Gateway (SSLCommerz)
    SSLCOMMERZ_STORE_ID: str = Field(..., min_length=8)
    SSLCOMMERZ_STORE_PASSWORD: str = Field(..., min_length=8)
    SSLCOMMERZ_API_URL: str = "https://sandbox.sslcommerz.com"
    SSLCOMMERZ_VALIDATION_URL: str = "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"
    
    # Monitoring & Logging
    SENTRY_DSN: Optional[str] = None
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_FREE_TIER_SEARCHES_PER_DAY: int = 20
    RATE_LIMIT_FREE_TIER_BLUEPRINTS_PER_MONTH: int = 1
    RATE_LIMIT_PRO_TIER_BLUEPRINTS_PER_MONTH: int = 10
    
    # Scraping Configuration
    SCRAPING_ENABLED: bool = True
    SCRAPING_USER_AGENT: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    SCRAPING_TIMEOUT: int = 30
    SCRAPING_MAX_RETRIES: int = 3
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    
    # Encryption
    ENCRYPTION_KEY: str = Field(..., min_length=32)
    ENCRYPTION_ALGORITHM: str = "AES-256-GCM"
    
    # Feature Flags
    ENABLE_MARKETPLACE_INTELLIGENCE: bool = True
    ENABLE_RESEARCH_SITE_DATASET: bool = True
    ENABLE_AI_FALLBACK: bool = True
    ENABLE_CACHE: bool = True
    ENABLE_METRICS: bool = True


# Global settings instance
settings = Settings()
