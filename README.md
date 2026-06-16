# Micro Blog

基于 FastAPI + React 的微博客应用。

## 项目结构

```
micowb/
├── densu-backend/   # FastAPI 后端
├── micro-blog/      # React 前端
└── doc.md
```

## 技术栈

**后端 (densu-backend)**
- FastAPI + Uvicorn
- Tortoise ORM + PostgreSQL
- JWT 鉴权
- Redis 队列
- Poetry 包管理

**前端 (micro-blog)**
- React 18 + TypeScript
- Vite
- Ant Design 6
- React Router 7
- react-markdown

## 快速开始

### Docker 一键启动（推荐）

```bash
docker compose up -d
```

启动后访问：
- 前端：http://localhost:5173
- 后端 API 文档：http://localhost:8005/docs
- 默认管理员账号：`densu` / `t7JIRd+F/E5hSXxn`

### 本地开发

**后端**

```bash
cd densu-backend

# 安装依赖
poetry install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入数据库等配置

# 启动开发服务器
poetry run uvicorn src.main:app --reload
```

**前端**

```bash
cd micro-blog

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```
