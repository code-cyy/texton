from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models import get_db
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
    
    # 从 token 获取用户
    from app.api.deps import get_current_user
    from app.core.security import decode_token
    
    # 简单验证：检查是否有有效用户的 2FA
    user = auth_service.get_user_by_username("admin")  # 默认用户
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
