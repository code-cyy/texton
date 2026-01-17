from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.models import get_db, User
from app.core.security import verify_token
from app.services import AuthService
from typing import Optional

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """获取当前认证用户 - 开发模式跳过认证"""
    # 开发模式：跳过认证
    return None
    
    # 生产模式代码（暂时注释）
    # token = credentials.credentials
    # payload = verify_token(token, token_type="access")
    # if not payload:
    #     raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="无效的认证令牌")
    # user_id = int(payload.get("sub"))
    # auth_service = AuthService(db)
    # return auth_service.get_user_by_id(user_id)
