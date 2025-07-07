from pathlib import Path
from typing import AsyncGenerator

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).parent.parent

class Config(BaseSettings):
    BOT_TOKEN: SecretStr
    
    WEBAPP_URL: str = ""
    
    WEBHOOK_URL: str = ""
    WEBHOOK_PATH: str = "/webhook"
    
    APP_HOST: str = "127.0.0.1"
    APP_PORT: int = 8000
    
    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / "config" / ".env",
        env_file_encoding="utf-8"
    )
    
config = Config()