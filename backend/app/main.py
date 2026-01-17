from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.api import api_router
from app.models import Base, engine

# 创建数据库表
Base.metadata.create_all(bind=engine)

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Secure Editor API",
    description="私有化在线文本/代码编辑器 API",
    version="1.0.0",
    docs_url="/api/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/api/redoc" if settings.ENVIRONMENT == "development" else None,
)

# Rate Limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Host (生产环境)
if settings.ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.trusted_hosts_list
    )


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """添加安全响应头"""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# API 路由
app.include_router(api_router, prefix="/api")


@app.get("/api/health")
async def health_check():
    """健康检查"""
    return {"status": "ok", "environment": settings.ENVIRONMENT}


@app.get("/api/version")
async def get_version():
    """获取当前版本"""
    import json
    import os
    
    version_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "version.json"
    )
    
    try:
        with open(version_file, 'r') as f:
            data = json.load(f)
            return data
    except:
        return {
            "version": "1.0.0",
            "buildTime": "unknown",
        }


@app.get("/api/check-update")
async def check_update():
    """检查 GitHub 更新"""
    import httpx
    
    github_repo = settings.GITHUB_REPO if hasattr(settings, 'GITHUB_REPO') else ""
    if not github_repo:
        return {"has_update": False, "message": "未配置 GitHub 仓库"}
    
    try:
        async with httpx.AsyncClient() as client:
            # 获取最新 release
            response = await client.get(
                f"https://api.github.com/repos/{github_repo}/releases/latest",
                headers={"Accept": "application/vnd.github.v3+json"},
                timeout=10.0
            )
            
            if response.status_code == 404:
                # 没有 release，检查最新 commit
                response = await client.get(
                    f"https://api.github.com/repos/{github_repo}/commits/main",
                    headers={"Accept": "application/vnd.github.v3+json"},
                    timeout=10.0
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "has_update": True,
                        "latest_version": data["sha"][:7],
                        "message": data["commit"]["message"][:100],
                        "update_url": f"https://github.com/{github_repo}",
                        "type": "commit"
                    }
            elif response.status_code == 200:
                data = response.json()
                current_version = "1.0.0"
                latest_version = data["tag_name"].lstrip("v")
                
                return {
                    "has_update": latest_version != current_version,
                    "current_version": current_version,
                    "latest_version": latest_version,
                    "release_notes": data.get("body", "")[:500],
                    "update_url": data["html_url"],
                    "type": "release"
                }
    except Exception as e:
        return {"has_update": False, "error": str(e)}
    
    return {"has_update": False}


@app.post("/api/update")
async def perform_update():
    """执行更新 (git pull)"""
    import subprocess
    import os
    
    if settings.ENVIRONMENT != "production":
        return {"success": False, "message": "仅生产环境支持自动更新"}
    
    try:
        # 获取项目根目录
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        # 执行 git pull
        result = subprocess.run(
            ["git", "pull", "origin", "main"],
            cwd=project_root,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            return {
                "success": True,
                "message": "更新成功，请重启服务",
                "output": result.stdout
            }
        else:
            return {
                "success": False,
                "message": "更新失败",
                "error": result.stderr
            }
    except subprocess.TimeoutExpired:
        return {"success": False, "message": "更新超时"}
    except Exception as e:
        return {"success": False, "message": str(e)}
