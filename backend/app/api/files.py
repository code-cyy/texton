from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models import get_db, User
from app.schemas import (
    FileCreate,
    FileUpdate,
    FileResponse,
    FileListResponse,
    FileSaveRequest,
)
from app.services import FileService
from app.api.deps import get_current_user
import json
import zipfile
import io
from datetime import datetime

router = APIRouter()


class ReorderRequest(BaseModel):
    file_ids: List[int]  # 按顺序排列的文件 ID 列表


@router.get("", response_model=List[FileListResponse])
async def list_files(
    include_deleted: bool = False,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """列出所有文件"""
    file_service = FileService(db)
    files = file_service.list_files(include_deleted=include_deleted)
    return files


@router.post("/reorder")
async def reorder_files(
    request: ReorderRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """重新排序文件"""
    file_service = FileService(db)
    file_service.reorder_files(request.file_ids)
    return {"message": "排序成功"}


@router.get("/trash", response_model=List[FileListResponse])
async def list_trash(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """列出回收站文件"""
    file_service = FileService(db)
    return file_service.list_deleted_files()


@router.get("/export-all")
async def export_all_files(
    password: str = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """导出所有文件为 ZIP 压缩包（可选密码保护）"""
    file_service = FileService(db)
    files = file_service.list_files(include_deleted=False)
    
    zip_buffer = io.BytesIO()
    
    # 如果有密码，使用 pyzipper 创建加密 ZIP
    if password:
        import pyzipper
        with pyzipper.AESZipFile(zip_buffer, 'w', compression=pyzipper.ZIP_DEFLATED, encryption=pyzipper.WZ_AES) as zip_file:
            zip_file.setpassword(password.encode('utf-8'))
            
            metadata = {
                "exported_at": datetime.utcnow().isoformat(),
                "file_count": len(files),
                "encrypted": True,
                "files": []
            }
            
            for f in files:
                file_obj = file_service.get_file(f.id)
                if file_obj:
                    content = file_service.get_file_content(file_obj)
                    file_path = f.path.lstrip('/') or f.name
                    zip_file.writestr(file_path, content.encode('utf-8'))
                    metadata["files"].append({
                        "name": f.name,
                        "path": f.path,
                        "language": f.language,
                        "created_at": f.created_at.isoformat() if f.created_at else None,
                        "updated_at": f.updated_at.isoformat() if f.updated_at else None,
                    })
            
            zip_file.writestr("_metadata.json", json.dumps(metadata, ensure_ascii=False, indent=2).encode('utf-8'))
    else:
        # 无密码，使用标准 zipfile
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            metadata = {
                "exported_at": datetime.utcnow().isoformat(),
                "file_count": len(files),
                "encrypted": False,
                "files": []
            }
            
            for f in files:
                file_obj = file_service.get_file(f.id)
                if file_obj:
                    content = file_service.get_file_content(file_obj)
                    file_path = f.path.lstrip('/') or f.name
                    zip_file.writestr(file_path, content.encode('utf-8'))
                    metadata["files"].append({
                        "name": f.name,
                        "path": f.path,
                        "language": f.language,
                        "created_at": f.created_at.isoformat() if f.created_at else None,
                        "updated_at": f.updated_at.isoformat() if f.updated_at else None,
                    })
            
            zip_file.writestr("_metadata.json", json.dumps(metadata, ensure_ascii=False, indent=2).encode('utf-8'))
    
    zip_buffer.seek(0)
    
    filename = f"texton-backup-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.zip"
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.post("/import")
async def import_files(
    data: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """从 JSON 导入文件"""
    file_service = FileService(db)
    
    files_data = data.get("files", [])
    imported = 0
    skipped = 0
    
    for f in files_data:
        try:
            # 检查文件是否已存在
            existing = file_service.get_file_by_path(f.get("path", ""))
            if existing:
                skipped += 1
                continue
            
            file_service.create_file(
                name=f.get("name", "untitled"),
                path=f.get("path", f"/{f.get('name', 'untitled')}"),
                content=f.get("content", ""),
                language=f.get("language", "plaintext")
            )
            imported += 1
        except Exception:
            skipped += 1
    
    return {"imported": imported, "skipped": skipped}


@router.post("", response_model=FileResponse)
async def create_file(
    request: FileCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建文件"""
    file_service = FileService(db)
    file = file_service.create_file(
        name=request.name,
        path=request.path,
        content=request.content,
        language=request.language
    )
    return FileResponse(
        id=file.id,
        name=file.name,
        path=file.path,
        content=request.content,
        language=file.language,
        encoding=file.encoding,
        is_deleted=file.is_deleted,
        created_at=file.created_at,
        updated_at=file.updated_at
    )


@router.get("/{file_id}", response_model=FileResponse)
async def get_file(
    file_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取文件详情"""
    file_service = FileService(db)
    file = file_service.get_file(file_id)
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文件不存在"
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


@router.get("/{file_id}/export")
async def export_file(
    file_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """导出单个文件"""
    file_service = FileService(db)
    file = file_service.get_file(file_id)
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文件不存在"
        )
    
    content = file_service.get_file_content(file)
    
    return Response(
        content=content,
        media_type="text/plain",
        headers={
            "Content-Disposition": f"attachment; filename={file.name}"
        }
    )


@router.put("/{file_id}", response_model=FileResponse)
async def update_file(
    file_id: int,
    request: FileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新文件元信息"""
    file_service = FileService(db)
    
    try:
        file = file_service.update_file(
            file_id,
            name=request.name,
            path=request.path,
            language=request.language
        )
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


@router.post("/{file_id}/duplicate", response_model=FileResponse)
async def duplicate_file(
    file_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """复制文件"""
    file_service = FileService(db)
    file = file_service.get_file(file_id)
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文件不存在"
        )
    
    content = file_service.get_file_content(file)
    
    # 生成新文件名
    base_name = file.name.rsplit('.', 1)
    if len(base_name) > 1:
        new_name = f"{base_name[0]}_copy.{base_name[1]}"
    else:
        new_name = f"{file.name}_copy"
    
    new_path = file.path.rsplit('/', 1)
    if len(new_path) > 1:
        new_path = f"{new_path[0]}/{new_name}"
    else:
        new_path = f"/{new_name}"
    
    new_file = file_service.create_file(
        name=new_name,
        path=new_path,
        content=content,
        language=file.language
    )
    
    return FileResponse(
        id=new_file.id,
        name=new_file.name,
        path=new_file.path,
        content=content,
        language=new_file.language,
        encoding=new_file.encoding,
        is_deleted=new_file.is_deleted,
        created_at=new_file.created_at,
        updated_at=new_file.updated_at
    )


@router.post("/{file_id}/save", response_model=FileResponse)
async def save_file(
    file_id: int,
    request: FileSaveRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """保存文件内容"""
    file_service = FileService(db)
    
    try:
        file = file_service.save_file(
            file_id,
            content=request.content,
            force_snapshot=request.create_snapshot
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    
    return FileResponse(
        id=file.id,
        name=file.name,
        path=file.path,
        content=request.content,
        language=file.language,
        encoding=file.encoding,
        is_deleted=file.is_deleted,
        created_at=file.created_at,
        updated_at=file.updated_at
    )


@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    permanent: bool = False,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除文件 (默认软删除)"""
    file_service = FileService(db)
    
    try:
        if permanent:
            file_service.permanent_delete(file_id)
        else:
            file_service.soft_delete(file_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    
    return {"message": "删除成功"}


@router.post("/{file_id}/restore")
async def restore_file(
    file_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """从回收站恢复文件"""
    file_service = FileService(db)
    
    try:
        file_service.restore_file(file_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    
    return {"message": "恢复成功"}
