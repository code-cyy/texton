from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base


class File(Base):
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    path = Column(String(1000), nullable=False, index=True)  # 虚拟路径
    
    # 加密后的内容
    content_encrypted = Column(Text, nullable=True)
    
    # 文件元信息
    language = Column(String(50), default="plaintext")
    encoding = Column(String(20), default="utf-8")
    
    # 状态
    is_deleted = Column(Boolean, default=False)  # 软删除
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    # 关联
    versions = relationship("FileVersion", back_populates="file", cascade="all, delete-orphan")


class FileVersion(Base):
    __tablename__ = "file_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    
    # 加密后的内容快照
    content_encrypted = Column(Text, nullable=False)
    
    # 版本信息
    version_number = Column(Integer, nullable=False)
    operation_count = Column(Integer, default=0)  # 该版本包含的操作数
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关联
    file = relationship("File", back_populates="versions")
