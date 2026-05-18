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

    redis_url: str = Field(default="redis://127.0.0.1:6379", validation_alias="REDIS_URL")
    redis_enabled: bool = Field(default=True, validation_alias="REDIS_ENABLED")

    r2_endpoint: str | None = Field(default=None, validation_alias="R2_ENDPOINT")
    r2_access_key_id: str | None = Field(default=None, validation_alias="R2_ACCESS_KEY_ID")
    r2_secret_access_key: str | None = Field(default=None, validation_alias="R2_SECRET_ACCESS_KEY")
    r2_bucket: str = Field(default="orbly-media", validation_alias="R2_BUCKET")
    r2_public_url: str | None = Field(default=None, validation_alias="R2_PUBLIC_URL")
    media_local_fallback: bool = Field(default=True, validation_alias="MEDIA_LOCAL_FALLBACK")

    google_client_id: str | None = Field(default=None, validation_alias="GOOGLE_CLIENT_ID")
    apple_client_id: str | None = Field(default=None, validation_alias="APPLE_CLIENT_ID")
    tenor_api_key: str | None = Field(default=None, validation_alias="TENOR_API_KEY")

    api_public_url: str = Field(default="http://localhost:4000", validation_alias="API_PUBLIC_URL")
    socket_path: str = Field(default="/socket.io", validation_alias="SOCKET_PATH")


settings = Settings()
