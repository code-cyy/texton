from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone


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
        json_encoders = {
            datetime: lambda v: v.replace(tzinfo=timezone.utc).isoformat() if v.tzinfo is None else v.isoformat()
        }


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
        json_encoders = {
            datetime: lambda v: v.replace(tzinfo=timezone.utc).isoformat() if v.tzinfo is None else v.isoformat()
        }


class FileVersionResponse(BaseModel):
    id: int
    version_number: int
    operation_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.replace(tzinfo=timezone.utc).isoformat() if v.tzinfo is None else v.isoformat()
        }


class FileRestoreRequest(BaseModel):
    version_id: int
