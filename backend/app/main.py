import json
import os

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
    
    # 获取当前版本
    version_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "version.json"
    )
    current_version = "1.0.0"
    try:
        with open(version_file, 'r') as f:
            current_version = json.load(f).get("version", "1.0.0")
    except:
        pass
    
    try:
        async with httpx.AsyncClient() as client:
            # 获取最新 release
            response = await client.get(
                f"https://api.github.com/repos/{github_repo}/releases/latest",
                headers={"Accept": "application/vnd.github.v3+json"},
                timeout=10.0
            )
            
            if response.status_code == 404:
                # 没有 release，检查最新 commit 与本地是否一致
                response = await client.get(
                    f"https://api.github.com/repos/{github_repo}/commits/main",
                    headers={"Accept": "application/vnd.github.v3+json"},
                    timeout=10.0
                )
                if response.status_code == 200:
                    data = response.json()
                    remote_sha = data["sha"][:7]
                    
                    # 获取本地 git commit
                    import subprocess
                    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                    try:
                        result = subprocess.run(
                            ["/usr/bin/git", "rev-parse", "--short", "HEAD"],
                            cwd=project_root,
                            capture_output=True,
                            text=True,
                            timeout=5
                        )
                        local_sha = result.stdout.strip() if result.returncode == 0 else ""
                    except:
                        local_sha = ""
                    
                    has_update = remote_sha != local_sha if local_sha else True
                    
                    return {
                        "has_update": has_update,
                        "current_version": current_version,
                        "latest_version": remote_sha,
                        "message": data["commit"]["message"].split('\n')[0][:100],
                        "release_notes": data["commit"]["message"],
                        "update_url": f"https://github.com/{github_repo}",
                        "type": "commit"
                    }
            elif response.status_code == 200:
                data = response.json()
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
    """执行完整更新（拉取代码、安装依赖、构建前端、重启服务）"""
    import subprocess
    import os
    
    if settings.ENVIRONMENT != "production":
        return {"success": False, "message": "仅生产环境支持自动更新"}
    
    # 设置完整的 PATH
    env = os.environ.copy()
    env["PATH"] = "/usr/local/bin:/usr/bin:/bin:" + env.get("PATH", "")
    
    try:
        # 获取项目根目录
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        update_script = os.path.join(project_root, "scripts", "update.sh")
        
        # 检查更新脚本是否存在
        if not os.path.exists(update_script):
            # 如果脚本不存在，只执行 git pull
            result = subprocess.run(
                ["/usr/bin/git", "pull", "origin", "main"],
                cwd=project_root,
                capture_output=True,
                text=True,
                timeout=60,
                env=env
            )
            if result.returncode == 0:
                return {
                    "success": True,
                    "message": "代码已更新，请手动重启服务并重新构建前端",
                    "output": result.stdout
                }
            else:
                return {"success": False, "message": "更新失败", "error": result.stderr}
        
        # 执行完整更新脚本
        result = subprocess.run(
            ["/bin/bash", update_script],
            cwd=project_root,
            capture_output=True,
            text=True,
            timeout=300,  # 5分钟超时
            env=env
        )
        
        if result.returncode == 0:
            return {
                "success": True,
                "message": "更新完成！页面将自动刷新。",
                "output": result.stdout
            }
        else:
            return {
                "success": False,
                "message": "更新失败",
                "error": result.stderr,
                "output": result.stdout
            }
    except subprocess.TimeoutExpired:
        return {"success": False, "message": "更新超时"}
    except Exception as e:
        return {"success": False, "message": str(e)}
