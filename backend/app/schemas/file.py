from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class FileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    path: str = Field(..., max_length=1000)
    content: str = ""
    language: str = "plaintext"


class FileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    path: Optional[str] = Field(None, max_length=1000)
    language: Optional[str] = None


class FileSaveRequest(BaseModel):
    content: str
    create_snapshot: bool = False  # 是否强制创建版本快照


class FileResponse(BaseModel):
    id: int
    name: str
    path: str
    content: str
    language: str
    encoding: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FileListResponse(BaseModel):
    id: int
    name: str
    path: str
    language: str
    is_deleted: bool
    sort_order: int = 0
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FileVersionResponse(BaseModel):
    id: int
    version_number: int
    operation_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class FileRestoreRequest(BaseModel):
    version_id: int
