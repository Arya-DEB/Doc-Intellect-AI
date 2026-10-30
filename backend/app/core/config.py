
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class MySettings(BaseSettings):
    app_name: str = Field(
        default="Doc Intellect AI",
        validation_alias="APP_NAME",
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
