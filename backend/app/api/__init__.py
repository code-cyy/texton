from fastapi import APIRouter
from .auth import router as auth_router
from .files import router as files_router
from .history import router as history_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["认证"])
api_router.include_router(files_router, prefix="/files", tags=["文件"])
api_router.include_router(history_router, prefix="/history", tags=["版本历史"])
