from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models import get_db, User
from app.schemas import FileVersionResponse, FileRestoreRequest, FileResponse
from app.services import FileService
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/{file_id}/versions", response_model=List[FileVersionResponse])
async def get_versions(
    file_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取文件版本历史"""
    file_service = FileService(db)
    file = file_service.get_file(file_id)
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文件不存在"
        )
    
    versions = file_service.get_versions(file_id)
    return versions


@router.get("/{file_id}/versions/{version_id}")
async def get_version_content(
    file_id: int,
    version_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取指定版本的内容"""
    file_service = FileService(db)
    content = file_service.get_version_content(version_id)
    
    if content is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="版本不存在"
        )
    
    return {"content": content}


@router.post("/{file_id}/restore", response_model=FileResponse)
async def restore_version(
    file_id: int,
    request: FileRestoreRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """恢复到指定版本"""
    file_service = FileService(db)
    
    try:
        file = file_service.restore_version(file_id, request.version_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    
    content = file_service.get_file_content(file)
    return FileResponse(
        id=file.id,
        name=file.name,
        path=file.path,
        content=content,
        language=file.language,
        encoding=file.encoding,
        is_deleted=file.is_deleted,
        created_at=file.created_at,
        updated_at=file.updated_at
    )
