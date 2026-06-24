# micowb - 极简个人微博客

基于 React 18 + TypeScript + Vite 构建的单用户微博客前端应用，搭配 [densu-backend](https://github.com/densu/densu-backend) 后端服务。

## 设计理念

> Less is More

- 单用户模式，无关注、粉丝、评论、点赞系统
- 核心能力：记录、搜索、管理碎片化内容
- 风格偏向早期博客 + 微博，白底灰边，大量留白
- 优先保证可维护性和代码整洁

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript（严格模式） |
| 构建 | Vite 7 |
| UI 库 | Ant Design 6 + @ant-design/icons |
| 路由 | React Router 7 |
| HTTP | Axios |
| Markdown | react-markdown + remark-gfm |
| 日期 | dayjs |
| 图片裁剪 | antd-img-crop |
| 图片预览 | react-photo-view |
| 样式 | CSS Modules |
| 状态管理 | React Context + Hooks |

## 项目结构

```
micowb/
├── micro-blog/           # React 前端
│   ├── public/           # 静态资源
│   ├── src/
│   │   ├── api/          # API Repository 层 (post.ts, tag.ts, user.ts)
│   │   ├── components/   # 通用组件
│   │   │   ├── Layout/           # 三栏布局容器
│   │   │   ├── PostEditor/       # 发布/编辑框
│   │   │   ├── PostCard/         # 微博卡片
│   │   │   ├── MarkdownViewer/   # Markdown 渲染器
│   │   │   ├── EmojiPicker/      # 表情选择器
│   │   │   ├── Heatmap/          # 热力图（GitHub 风格）
│   │   │   ├── UserCard/         # 用户资料卡片
│   │   │   ├── TagList/          # 热门标签列表
│   │   │   └── EmptyState/       # 空状态
│   │   ├── layouts/      # 布局组件 (RightSidebar)
│   │   ├── pages/        # 页面
│   │   │   ├── HomePage/         # 首页
│   │   │   ├── LoginPage/        # 登录页
│   │   │   ├── SearchPage/       # 搜索页
│   │   │   └── SettingsPage/     # 设置页
│   │   ├── router/       # 路由配置
│   │   ├── store/        # 状态管理 (AppContext + useAppStore)
│   │   ├── styles/       # 全局样式 (global.css)
│   │   ├── types/        # TypeScript 类型定义
│   │   └── utils/        # 工具函数 (request.ts, storage.ts)
│   ├── Dockerfile
│   ├── .env.production
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/login` | LoginPage | 登录页（独立布局） |
| `/` | HomePage | 首页：发布框 + 微博时间流 + 无限滚动 |
| `/search` | SearchPage | 多条件搜索（标签/可见性/内容/日期范围） |
| `/settings` | SettingsPage | 4 Tab：系统设置 / 用户设置 / 标签管理 / 开发者信息 |
| `*` | 重定向至 `/` | 未匹配路由 |

## 组件架构

```
<BrowserRouter>
  <AppProvider>                    ← Context 状态管理
    <App>
      ├─ /login → <LoginPage>
      └─ 其他路由 → <Layout>       ← 三栏布局
           ├─ 左侧栏 (100px)       ← 导航 + 外链 + 版本号
           ├─ 中央主内容区
           │    ├─ HomePage
           │    ├─ SearchPage
           │    └─ SettingsPage
           └─ 右侧栏 (220px)       ← RightSidebar
                ├─ UserCard
                ├─ 统计卡片 (Memo/Tags/Days)
                ├─ Heatmap 热力图
                └─ TagList 热门标签
```

## 功能特性

- **Markdown 写作**：支持标题、粗体、列表、引用、代码块、表格、GFM
- **表情插入**：内置 9 类 300+ emoji
- **图片/视频上传**：R2 预签名 URL 三步上传，图片预览支持翻页/旋转/缩放
- **响应式布局**：≥1200px 三栏 / 768-1199px 两栏 / <768px 单栏折叠
- **无限滚动**：IntersectionObserver 驱动
- **热力图**：GitHub Contribution 风格，42 天活跃数据展示
- **标签系统**：自动提取 `#tag`，标签统计、筛选、删除
- **置顶功能**：最多 3 条置顶帖
- **帖子引用**：Markdown 内嵌帖子引用链接预览
- **IP/设备显示**：可配置是否公开显示
- **分享链接**：`/?post=N` 直接定位到指定帖子

## 快速开始

### Docker 部署（推荐）

```bash
# 确保 densu-backend 先启动
cd ../densu-backend
docker compose up -d

# 再启动前端
cd ../micowb
docker compose up -d
```

启动后访问：
- 前端：http://localhost:5173
- 后端 API 文档：http://localhost:8005/docs
- 默认管理员账号：`densu` / `admin123`

### 本地开发

```bash
cd micro-blog

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

开发服务器默认代理 `/api` 到 `http://127.0.0.1:8000`，可通过环境变量 `VITE_API_TARGET` 自定义后端地址。

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_API_TARGET` | `http://127.0.0.1:8000` | 开发代理目标后端地址 |
| `VITE_API_BASE_URL` | `https://api.densu.cc` | 生产环境 API 地址 |

### 生产构建

```bash
npm run build
# 输出到 micro-blog/dist/
```

## 数据流

```
Page ──→ Store (AppContext) ──→ API Repository ──→ Axios ──→ densu-backend
```

- Page 不直接调用 API
- Store 不直接发起 HTTP 请求
- 所有数据操作通过 API Repository 层完成

## 与后端的关系

本项目为纯前端应用，依赖独立的 [densu-backend](https://github.com/densu/densu-backend) 后端服务。两者通过 Docker Compose 编排协作：

- 前端容器通过 `VITE_API_TARGET=http://host.docker.internal:8005` 连接到宿主机后端
- 本地开发时通过 Vite proxy 转发 `/api` 请求到后端

## 响应式断点

| 宽度 | 行为 |
|------|------|
| ≥ 1200px | 三栏：左 100px + 主内容 flex-1 + 右 220px |
| 768px - 1199px | 隐藏右侧栏 |
| < 768px | 左侧栏折叠为 Drawer，汉堡菜单触发；右侧栏隐藏；编辑器全宽 |

## License

MIT
