from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", populate_by_name=True)

    node_env: str = Field(default="development", validation_alias="NODE_ENV")
    port: int = Field(default=4000, validation_alias="PORT")
    mongodb_uri: str = Field(default="mongodb://127.0.0.1:27018/orbly", validation_alias="MONGODB_URI")
    jwt_secret: str = Field(
        default="change-me-to-a-random-string-at-least-32-chars",
        validation_alias="JWT_SECRET",
    )
    jwt_access_expires_min: int = Field(default=15, validation_alias="JWT_ACCESS_EXPIRES_MIN")
    jwt_refresh_expires_days: int = Field(default=7, validation_alias="JWT_REFRESH_EXPIRES_DAYS")
    cors_origin: str = Field(
        default="http://localhost:3000,http://localhost:8081",
        validation_alias="CORS_ORIGIN",
    )


settings = Settings()
