from pydantic import BaseModel, Field
from typing import Optional


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1)
    totp_code: Optional[str] = Field(None, min_length=6, max_length=6)


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    requires_2fa_setup: bool = False
    requires_2fa: bool = False


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class Setup2FAResponse(BaseModel):
    secret: str
    qr_code: str  # base64 encoded QR code image


class Verify2FARequest(BaseModel):
    totp_code: str = Field(..., min_length=6, max_length=6)
