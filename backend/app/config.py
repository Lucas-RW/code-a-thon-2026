from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "campuslens"
    
    # AI Configuration
    AI_PROVIDER: str = "openrouter"
    AI_API_KEY: str = ""
    AI_MODEL: str = "anthropic/claude-3-haiku"

    # JWT Configuration
    JWT_SECRET_KEY: str = "your-secret-key"  # Should be overridden by env
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
