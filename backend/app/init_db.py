"""
数据库初始化脚本
运行: python -m app.init_db
"""
import getpass
from app.models import Base, engine, SessionLocal
from app.services import AuthService


def init_database():
    """初始化数据库并创建用户"""
    print("=" * 50)
    print("Secure Editor - 数据库初始化")
    print("=" * 50)
    
    # 创建表
    Base.metadata.create_all(bind=engine)
    print("✓ 数据库表创建完成")
    
    db = SessionLocal()
    auth_service = AuthService(db)
    
    # 检查是否已有用户
    existing = db.execute("SELECT COUNT(*) FROM users").scalar()
    if existing > 0:
        print("! 已存在用户，跳过创建")
        db.close()
        return
    
    # 创建用户
    print("\n请设置管理员账户:")
    username = input("用户名: ").strip()
    while not username:
        username = input("用户名不能为空，请重新输入: ").strip()
    
    password = getpass.getpass("密码: ")
    while len(password) < 8:
        password = getpass.getpass("密码至少8位，请重新输入: ")
    
    confirm = getpass.getpass("确认密码: ")
    while password != confirm:
        print("密码不匹配，请重新输入")
        password = getpass.getpass("密码: ")
        confirm = getpass.getpass("确认密码: ")
    
    user = auth_service.create_user(username, password)
    print(f"\n✓ 用户 '{username}' 创建成功")
    print("\n首次登录时需要设置 2FA (两步验证)")
    print("请准备好 Google Authenticator 或类似应用")
    
    db.close()
    print("\n初始化完成!")


if __name__ == "__main__":
    init_database()
