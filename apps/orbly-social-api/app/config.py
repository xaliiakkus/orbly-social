from pathlib import Path

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Always load apps/api/.env (not cwd — uvicorn may start from repo root)
_API_ROOT = Path(__file__).resolve().parent.parent
_ENV_FILE = _API_ROOT / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILE if _ENV_FILE.is_file() else None,
        extra="ignore",
        populate_by_name=True,
    )

    node_env: str = Field(default="development", validation_alias="NODE_ENV")
    port: int = Field(default=4000, validation_alias="PORT")
    mongodb_uri: str = Field(
        default="mongodb://127.0.0.1:27018/orbly",
        validation_alias=AliasChoices("MONGODB_URI", "MONGO_URI"),
    )
    mongo_db_name: str = Field(default="orbly", validation_alias="MONGO_DB_NAME")
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
    r2_region: str = Field(default="auto", validation_alias="R2_REGION")

    idrive_endpoint: str | None = Field(default=None, validation_alias="IDRIVE_ENDPOINT")
    idrive_access_key_id: str | None = Field(
        default=None, validation_alias=AliasChoices("IDRIVE_ACCESS_KEY_ID", "IDRIVE_ACCESS_KEY")
    )
    idrive_secret_access_key: str | None = Field(
        default=None, validation_alias=AliasChoices("IDRIVE_SECRET_ACCESS_KEY", "IDRIVE_SECRET_KEY")
    )
    idrive_bucket: str | None = Field(default=None, validation_alias="IDRIVE_BUCKET")
    idrive_public_url: str | None = Field(default=None, validation_alias="IDRIVE_PUBLIC_URL")
    idrive_region: str = Field(default="us-west-2", validation_alias="IDRIVE_REGION")

    media_local_fallback: bool = Field(default=True, validation_alias="MEDIA_LOCAL_FALLBACK")
    # false = resimler Cloudinary (hızlı CDN); true = resim presign iDrive (yavaş)
    media_prefer_idrive_for_images: bool = Field(
        default=False, validation_alias="MEDIA_PREFER_IDRIVE_FOR_IMAGES"
    )

    cloudinary_cloud_name: str | None = Field(default=None, validation_alias="CLOUDINARY_CLOUD_NAME")
    cloudinary_api_key: str | None = Field(default=None, validation_alias="CLOUDINARY_API_KEY")
    cloudinary_api_secret: str | None = Field(default=None, validation_alias="CLOUDINARY_API_SECRET")
    cloudinary_url: str | None = Field(default=None, validation_alias="CLOUDINARY_URL")

    @field_validator("cloudinary_url", mode="before")
    @classmethod
    def _strip_cloudinary_url(cls, v: object) -> object:
        if isinstance(v, str) and v.startswith("CLOUDINARY_URL="):
            return v.removeprefix("CLOUDINARY_URL=").strip()
        return v

    @field_validator(
        "r2_endpoint",
        "idrive_endpoint",
        "r2_public_url",
        "idrive_public_url",
        mode="before",
    )
    @classmethod
    def _ensure_https_endpoint(cls, v: object) -> object:
        if isinstance(v, str) and v and not v.startswith("http"):
            return f"https://{v.lstrip('/')}"
        return v

    @property
    def s3_endpoint(self) -> str | None:
        return self.idrive_endpoint or self.r2_endpoint

    @property
    def s3_access_key_id(self) -> str | None:
        return self.idrive_access_key_id or self.r2_access_key_id

    @property
    def s3_secret_access_key(self) -> str | None:
        return self.idrive_secret_access_key or self.r2_secret_access_key

    @property
    def s3_bucket(self) -> str:
        return self.idrive_bucket or self.r2_bucket

    @property
    def s3_public_url(self) -> str | None:
        return self.idrive_public_url or self.r2_public_url

    @property
    def s3_region(self) -> str:
        if self.idrive_endpoint:
            return self.idrive_region
        return self.r2_region

    google_client_id: str | None = Field(default=None, validation_alias="GOOGLE_CLIENT_ID")
    apple_client_id: str | None = Field(default=None, validation_alias="APPLE_CLIENT_ID")
    tenor_api_key: str | None = Field(default=None, validation_alias="TENOR_API_KEY")
    giphy_api_key: str | None = Field(default=None, validation_alias="GIPHY_API_KEY")

    api_public_url: str = Field(default="http://localhost:4000", validation_alias="API_PUBLIC_URL")
    socket_path: str = Field(default="/socket.io", validation_alias="SOCKET_PATH")

    @field_validator("api_public_url", mode="after")
    @classmethod
    def _api_public_url_https(cls, v: str, info) -> str:
        u = v.rstrip("/")
        node_env = info.data.get("node_env", "development")
        if node_env == "production" and u.startswith("http://"):
            host = u[7:].split("/")[0].lower()
            if host not in ("localhost", "127.0.0.1"):
                u = "https://" + u[7:]
        return u

    livekit_url: str = Field(default="", validation_alias="LIVEKIT_URL")
    livekit_api_key: str = Field(default="", validation_alias="LIVEKIT_API_KEY")
    livekit_api_secret: str = Field(default="", validation_alias="LIVEKIT_API_SECRET")

    web_app_url: str = Field(
        default="http://localhost:3000",
        validation_alias=AliasChoices("WEB_APP_URL", "NEXTAUTH_URL"),
    )
    smtp_host: str | None = Field(default=None, validation_alias="SMTP_HOST")
    smtp_port: int = Field(default=587, validation_alias="SMTP_PORT")
    smtp_user: str | None = Field(default=None, validation_alias="SMTP_USER")
    smtp_password: str | None = Field(default=None, validation_alias="SMTP_PASSWORD")
    smtp_use_tls: bool = Field(default=True, validation_alias="SMTP_USE_TLS")
    email_from: str | None = Field(default=None, validation_alias="EMAIL_FROM")


settings = Settings()
