from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "campuslens"
    
    # AI Configuration
    AI_PROVIDER: str = "openrouter"
    AI_API_KEY: str = ""
    AI_MODEL: str = "anthropic/claude-3-haiku"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
