import pyotp
import qrcode
import io
import base64
from datetime import datetime
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models import User
from app.core.security import verify_password, get_password_hash, create_tokens, verify_token


class AuthService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """根据用户名获取用户"""
        return self.db.query(User).filter(User.username == username).first()
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """根据 ID 获取用户"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def authenticate(self, username: str, password: str) -> Optional[User]:
        """验证用户名密码"""
        user = self.get_user_by_username(username)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user
    
    def verify_totp(self, user_or_id, code: str) -> bool:
        """验证 TOTP 码"""
        if isinstance(user_or_id, int):
            user = self.get_user_by_id(user_or_id)
        else:
            user = user_or_id
            
        if not user or not user.totp_secret:
            return False
        totp = pyotp.TOTP(user.totp_secret)
        return totp.verify(code)
    
    def login(self, username: str, password: str, totp_code: Optional[str] = None) -> dict:
        """登录流程"""
        user = self.authenticate(username, password)
        if not user:
            return {"error": "用户名或密码错误"}
        
        # 检查 2FA 状态
        if not user.totp_enabled:
            # 需要设置 2FA
            return {
                "requires_2fa_setup": True,
                "user_id": user.id
            }
        
        # 已启用 2FA，需要验证
        if not totp_code:
            return {"requires_2fa": True, "user_id": user.id}
        
        if not self.verify_totp(user, totp_code):
            return {"error": "验证码错误"}
        
        # 更新最后登录时间
        user.last_login = datetime.utcnow()
        self.db.commit()
        
        # 生成令牌
        access_token, refresh_token = create_tokens(user.id)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token
        }
    
    def setup_2fa(self, user_id: int) -> Tuple[str, str]:
        """设置 2FA，返回 (secret, qr_code_base64)"""
        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError("用户不存在")
        
        # 生成新的 TOTP secret
        secret = pyotp.random_base32()
        user.totp_secret = secret
        self.db.commit()
        
        # 生成 QR 码
        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(name=user.username, issuer_name="SecureEditor")
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return secret, qr_base64
    
    def enable_2fa(self, user_id: int, totp_code: str) -> bool:
        """验证并启用 2FA"""
        user = self.get_user_by_id(user_id)
        if not user or not user.totp_secret:
            return False
        
        if not self.verify_totp(user, totp_code):
            return False
        
        user.totp_enabled = True
        self.db.commit()
        return True
    
    def refresh_access_token(self, refresh_token: str) -> Optional[str]:
        """刷新访问令牌"""
        payload = verify_token(refresh_token, token_type="refresh")
        if not payload:
            return None
        
        user_id = int(payload.get("sub"))
        user = self.get_user_by_id(user_id)
        if not user:
            return None
        
        access_token, _ = create_tokens(user_id)
        return access_token
    
    def create_user(self, username: str, password: str) -> User:
        """创建用户"""
        password_hash = get_password_hash(password)
        user = User(username=username, password_hash=password_hash)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
