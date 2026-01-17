# Secure Editor - 私有化在线文本/代码编辑器

单用户、私有化部署的在线文本/代码编辑器，用于在多设备间安全编辑高度敏感的文本文件。

## 特性

- 🎨 Monaco Editor 核心，接近 VS Code 体验
- 💾 实时自动保存 + 版本历史
- 🔐 AES-256 加密存储 + 2FA 认证
- 🎯 Notion/ChatGPT 风格极简 UI
- 📱 响应式设计，多设备支持

## 技术栈

### 前端
- React 18 + Vite
- Monaco Editor
- Tailwind CSS + shadcn/ui
- Zustand 状态管理
- Framer Motion 动效

### 后端
- Python FastAPI
- SQLAlchemy ORM + SQLite
- JWT + 2FA (TOTP)
- AES-256 文件加密

## 快速开始

### 1. 后端设置

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt

# 复制并配置环境变量
copy .env.example .env
# 编辑 .env 设置你的密钥

# 初始化数据库并创建用户
python -m app.init_db

# 启动后端
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. 前端设置

```bash
cd frontend
npm install

# 复制并配置环境变量
copy .env.example .env

# 启动前端
npm run dev
```

### 3. 首次登录

1. 访问 http://localhost:10086
2. 使用初始化时设置的用户名密码登录
3. 扫描 2FA 二维码完成绑定

## 生产部署 (Cloudflare 反向代理)

### Cloudflare 配置

1. **SSL/TLS 设置**: 使用 `Full (Strict)` 模式
2. **DNS**: 添加 A 记录指向你的服务器
3. **Page Rules**: 可选配置缓存规则

### Nginx 反向代理配置

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # Cloudflare Origin Certificate
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 信任 Cloudflare 代理头
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    real_ip_header CF-Connecting-IP;

    # 前端静态文件
    location / {
        root /var/www/secure-editor/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 后端生产配置

```bash
# .env 生产配置
ENVIRONMENT=production
TRUSTED_HOSTS=your-domain.com
CORS_ORIGINS=https://your-domain.com
```

## 安全说明

- 所有文件内容使用 AES-256-GCM 加密存储
- 密码使用 Argon2 哈希
- 强制 TOTP 两步验证
- JWT Token 自动刷新机制
- API Rate Limiting 防护
- CSRF Token 保护

## 目录结构

```
secure-editor/
├── backend/
│   ├── app/
│   │   ├── api/           # API 路由
│   │   │   ├── auth.py    # 认证接口
│   │   │   ├── files.py   # 文件操作
│   │   │   └── history.py # 版本历史
│   │   ├── core/          # 核心配置
│   │   │   ├── config.py  # 配置管理
│   │   │   ├── security.py# 安全工具
│   │   │   └── crypto.py  # 加密模块
│   │   ├── models/        # 数据模型
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # 业务逻辑
│   │   └── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # UI 组件
│   │   ├── hooks/         # 自定义 hooks
│   │   ├── stores/        # Zustand stores
│   │   ├── services/      # API 服务
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## License

Private Use Only
