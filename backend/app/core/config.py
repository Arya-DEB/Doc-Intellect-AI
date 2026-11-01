
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class MySettings(BaseSettings):
    app_name: str = Field(
        default="Doc Intellect AI",
        validation_alias="APP_NAME",
    )

    llm_model: str = Field(
        default="openai/gpt-oss-120b",
        validation_alias="LLM_MODEL",
    )
    llm_temperature: float = Field(
        default=0.3,
        validation_alias="LLM_TEMPERATURE",
    )
    llm_max_tokens: int = Field(
        default=1024,
        validation_alias="LLM_MAX_TOKENS",
    )
    groq_api_key: str = Field(
        validation_alias="GROQ_API_KEY",
    )
 
    DATABASE_URL:str
    
    jwt_secret_key: str = Field(
        validation_alias="JWT_SECRET_KEY",
    )
    jwt_algorithm: str = Field(
        default="HS256",
        validation_alias="JWT_ALGORITHM",
    )
    access_token_expire_minutes: int = Field(
        default=30,
        validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES",
    )

    cloudinary_cloud_name: str = Field(validation_alias="CLOUDINARY_CLOUD_NAME")
    cloudinary_api_key: str = Field(validation_alias="CLOUDINARY_API_KEY")
    cloudinary_api_secret: str = Field(validation_alias="CLOUDINARY_API_SECRET")

    cors_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        validation_alias="CORS_ORIGINS",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    app_env: str = Field(
        default="development",
        validation_alias="APP_ENV",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )
    log_level: str = Field(
        default="INFO",
        validation_alias="LOG_LEVEL",
    )


@lru_cache()
def get_settings() -> MySettings:
    return MySettings()
