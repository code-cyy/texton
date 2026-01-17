from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # 环境
    ENVIRONMENT: str = "development"
    
    # 安全密钥
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ENCRYPTION_KEY: str = "dev-encryption-key-32bytes!!"
    
    # JWT
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # 数据库
    DATABASE_URL: str = "sqlite:///./data/secure_editor.db"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:10086"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # 信任的主机
    TRUSTED_HOSTS: str = "localhost,127.0.0.1"
    
    @property
    def trusted_hosts_list(self) -> List[str]:
        return [host.strip() for host in self.TRUSTED_HOSTS.split(",")]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # 文件存储
    FILES_STORAGE_PATH: str = "./data/files"
    
    # 版本快照
    SNAPSHOT_INTERVAL_SECONDS: int = 60
    SNAPSHOT_MAX_OPERATIONS: int = 10
    
    # GitHub 仓库 (用于检测更新)
    GITHUB_REPO: str = ""
    
    # 自动锁定 (分钟)
    AUTO_LOCK_MINUTES: int = 5
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# 确保数据目录存在
os.makedirs(os.path.dirname(settings.DATABASE_URL.replace("sqlite:///", "")), exist_ok=True)
os.makedirs(settings.FILES_STORAGE_PATH, exist_ok=True)
