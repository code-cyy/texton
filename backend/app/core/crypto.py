import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from .config import settings


def _get_key() -> bytes:
    """获取加密密钥 (32 bytes for AES-256)"""
    key = settings.ENCRYPTION_KEY.encode()
    # 确保密钥长度为 32 字节
    if len(key) < 32:
        key = key.ljust(32, b'\0')
    elif len(key) > 32:
        key = key[:32]
    return key


def encrypt_content(content: str) -> str:
    """AES-256-GCM 加密内容"""
    key = _get_key()
    aesgcm = AESGCM(key)
    
    # 生成随机 nonce (12 bytes)
    nonce = os.urandom(12)
    
    # 加密
    ciphertext = aesgcm.encrypt(nonce, content.encode('utf-8'), None)
    
    # 组合 nonce + ciphertext 并 base64 编码
    encrypted = base64.b64encode(nonce + ciphertext).decode('utf-8')
    return encrypted


def decrypt_content(encrypted: str) -> str:
    """AES-256-GCM 解密内容"""
    key = _get_key()
    aesgcm = AESGCM(key)
    
    # base64 解码
    data = base64.b64decode(encrypted.encode('utf-8'))
    
    # 分离 nonce 和 ciphertext
    nonce = data[:12]
    ciphertext = data[12:]
    
    # 解密
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode('utf-8')
