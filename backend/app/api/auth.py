from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models import get_db, User
from app.schemas import (
    LoginRequest,
    LoginResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
    Setup2FAResponse,
    Verify2FARequest,
)
from app.services import AuthService

router = APIRouter()


class InitStatusResponse(BaseModel):
    initialized: bool
    message: str


class RegisterRequest(BaseModel):
    username: str
    password: str


@router.get("/init-status", response_model=InitStatusResponse)
async def check_init_status(db: Session = Depends(get_db)):
    """检查系统是否已初始化（是否有用户）"""
    user_count = db.query(User).count()
    if user_count == 0:
        return InitStatusResponse(initialized=False, message="系统未初始化，请创建管理员账户")
    return InitStatusResponse(initialized=True, message="系统已初始化")


@router.post("/register", response_model=LoginResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """注册用户（仅当系统未初始化时可用）"""
    # 检查是否已有用户
    user_count = db.query(User).count()
    if user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="系统已初始化，不允许注册新用户"
        )
    
    # 验证输入
    if len(request.username) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名至少 3 个字符"
        )
    
    if len(request.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="密码至少 8 个字符"
        )
    
    # 创建用户
    auth_service = AuthService(db)
    auth_service.create_user(request.username, request.password)
    
    # 返回需要设置 2FA
    return LoginResponse(
        access_token="",
        refresh_token="",
        requires_2fa_setup=True
    )


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """用户登录"""
    auth_service = AuthService(db)
    result = auth_service.login(request.username, request.password, request.totp_code)
    
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result["error"]
        )
    
    if result.get("requires_2fa_setup"):
        return LoginResponse(
            access_token="",
            refresh_token="",
            requires_2fa_setup=True
        )
    
    if result.get("requires_2fa"):
        return LoginResponse(
            access_token="",
            refresh_token="",
            requires_2fa=True
        )
    
    return LoginResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"]
    )


@router.post("/setup-2fa", response_model=Setup2FAResponse)
async def setup_2fa(request: LoginRequest, db: Session = Depends(get_db)):
    """设置 2FA (需要先验证用户名密码)"""
    auth_service = AuthService(db)
    user = auth_service.authenticate(request.username, request.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    secret, qr_code = auth_service.setup_2fa(user.id)
    return Setup2FAResponse(secret=secret, qr_code=qr_code)


@router.post("/verify-2fa", response_model=LoginResponse)
async def verify_2fa(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """验证并启用 2FA"""
    auth_service = AuthService(db)
    user = auth_service.authenticate(request.username, request.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    if not request.totp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请提供验证码"
        )
    
    if not auth_service.enable_2fa(user.id, request.totp_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码错误"
        )
    
    # 启用成功，返回令牌
    result = auth_service.login(request.username, request.password, request.totp_code)
    return LoginResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"]
    )


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(request: TokenRefreshRequest, db: Session = Depends(get_db)):
    """刷新访问令牌"""
    auth_service = AuthService(db)
    new_token = auth_service.refresh_access_token(request.refresh_token)
    
    if not new_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌"
        )
    
    return TokenRefreshResponse(access_token=new_token)


@router.post("/verify-totp")
async def verify_totp(request: Verify2FARequest, db: Session = Depends(get_db)):
    """验证 TOTP 验证码 (用于解锁屏幕)"""
    auth_service = AuthService(db)
    
    # 获取第一个用户（单用户系统）
    user = db.query(User).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    if not user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="未启用 2FA"
        )
    
    if not auth_service.verify_totp(user.id, request.totp_code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="验证码错误"
        )
    
    return {"success": True}
