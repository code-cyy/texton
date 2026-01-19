from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models import File, FileVersion
from app.core.crypto import encrypt_content, decrypt_content
from app.core.config import settings


class FileService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_file(self, name: str, path: str, content: str = "", language: str = "plaintext") -> File:
        """创建文件"""
        encrypted = encrypt_content(content) if content else encrypt_content("")
        
        file = File(
            name=name,
            path=path,
            content_encrypted=encrypted,
            language=language
        )
        self.db.add(file)
        self.db.commit()
        self.db.refresh(file)
        
        # 创建初始版本
        self._create_version(file, content)
        
        return file
    
    def get_file(self, file_id: int, include_deleted: bool = False) -> Optional[File]:
        """获取文件"""
        query = self.db.query(File).filter(File.id == file_id)
        if not include_deleted:
            query = query.filter(File.is_deleted == False)
        return query.first()
    
    def get_file_by_path(self, path: str, include_deleted: bool = False) -> Optional[File]:
        """根据路径获取文件"""
        query = self.db.query(File).filter(File.path == path)
        if not include_deleted:
            query = query.filter(File.is_deleted == False)
        return query.first()
    
    def get_file_content(self, file: File) -> str:
        """获取解密后的文件内容"""
        if not file.content_encrypted:
            return ""
        return decrypt_content(file.content_encrypted)
    
    def list_files(self, include_deleted: bool = False) -> List[File]:
        """列出所有文件"""
        query = self.db.query(File)
        if not include_deleted:
            query = query.filter(File.is_deleted == False)
        return query.order_by(File.sort_order, File.name).all()
    
    def reorder_files(self, file_ids: List[int]) -> None:
        """重新排序文件"""
        for index, file_id in enumerate(file_ids):
            file = self.db.query(File).filter(File.id == file_id).first()
            if file:
                file.sort_order = index
        self.db.commit()
    
    def list_deleted_files(self) -> List[File]:
        """列出回收站文件"""
        return self.db.query(File).filter(File.is_deleted == True).all()
    
    def save_file(self, file_id: int, content: str, force_snapshot: bool = False) -> File:
        """保存文件内容"""
        file = self.get_file(file_id)
        if not file:
            raise ValueError("文件不存在")
        
        # 加密并保存
        file.content_encrypted = encrypt_content(content)
        file.updated_at = datetime.utcnow()
        
        # 检查是否需要创建版本快照
        should_snapshot = force_snapshot or self._should_create_snapshot(file)
        if should_snapshot:
            self._create_version(file, content)
        
        self.db.commit()
        self.db.refresh(file)
        return file
    
    def _should_create_snapshot(self, file: File) -> bool:
        """判断是否应该创建版本快照"""
        latest_version = self.db.query(FileVersion).filter(
            FileVersion.file_id == file.id
        ).order_by(FileVersion.version_number.desc()).first()
        
        if not latest_version:
            return True
        
        # 检查时间间隔
        time_diff = (datetime.utcnow() - latest_version.created_at).total_seconds()
        if time_diff >= settings.SNAPSHOT_INTERVAL_SECONDS:
            return True
        
        # 检查操作次数
        if latest_version.operation_count >= settings.SNAPSHOT_MAX_OPERATIONS:
            return True
        
        # 增加操作计数
        latest_version.operation_count += 1
        return False
    
    def _create_version(self, file: File, content: str) -> FileVersion:
        """创建版本快照"""
        # 获取最新版本号
        latest = self.db.query(FileVersion).filter(
            FileVersion.file_id == file.id
        ).order_by(FileVersion.version_number.desc()).first()
        
        version_number = (latest.version_number + 1) if latest else 1
        
        version = FileVersion(
            file_id=file.id,
            content_encrypted=encrypt_content(content),
            version_number=version_number,
            operation_count=0
        )
        self.db.add(version)
        self.db.commit()
        return version
    
    def get_versions(self, file_id: int) -> List[FileVersion]:
        """获取文件版本历史"""
        return self.db.query(FileVersion).filter(
            FileVersion.file_id == file_id
        ).order_by(FileVersion.version_number.desc()).all()
    
    def get_version_content(self, version_id: int) -> Optional[str]:
        """获取指定版本的内容"""
        version = self.db.query(FileVersion).filter(FileVersion.id == version_id).first()
        if not version:
            return None
        return decrypt_content(version.content_encrypted)
    
    def restore_version(self, file_id: int, version_id: int) -> File:
        """恢复到指定版本"""
        file = self.get_file(file_id)
        if not file:
            raise ValueError("文件不存在")
        
        content = self.get_version_content(version_id)
        if content is None:
            raise ValueError("版本不存在")
        
        # 保存当前内容为新版本，然后恢复
        return self.save_file(file_id, content, force_snapshot=True)
    
    def update_file(self, file_id: int, name: str = None, path: str = None, language: str = None) -> File:
        """更新文件元信息"""
        file = self.get_file(file_id)
        if not file:
            raise ValueError("文件不存在")
        
        if name:
            file.name = name
        if path:
            file.path = path
        if language:
            file.language = language
        
        self.db.commit()
        self.db.refresh(file)
        return file
    
    def soft_delete(self, file_id: int) -> File:
        """软删除文件"""
        file = self.get_file(file_id)
        if not file:
            raise ValueError("文件不存在")
        
        file.is_deleted = True
        file.deleted_at = datetime.utcnow()
        self.db.commit()
        return file
    
    def restore_file(self, file_id: int) -> File:
        """从回收站恢复文件"""
        file = self.get_file(file_id, include_deleted=True)
        if not file:
            raise ValueError("文件不存在")
        
        file.is_deleted = False
        file.deleted_at = None
        self.db.commit()
        return file
    
    def permanent_delete(self, file_id: int) -> bool:
        """永久删除文件"""
        file = self.get_file(file_id, include_deleted=True)
        if not file:
            return False
        
        self.db.delete(file)
        self.db.commit()
        return True
