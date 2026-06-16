# 极简个人微博（Micro Blog）前端开发文档

## 一、项目目标

开发一个「极简个人微博（Micro Blog）」前端项目。

特点：

* 单用户模式；
* 无关注、粉丝、评论、点赞系统；
* 核心能力是记录、搜索、管理自己的碎片化内容；
* 风格偏向早期博客 + 微博；
* UI 极简，参考设计稿；
* 优先保证可维护性和代码整洁；
* 当前阶段仅开发前端。

项目定位：

> 一个基于 React 的单用户微博应用，当前使用 localStorage 持久化数据，未来可无缝接入真实后端。

---

# 二、开发原则

## 当前阶段

* 不存在真实后端；
* 所有功能必须完整可运行；
* 数据持久化使用 localStorage；
* 所有数据操作必须通过 API Repository 层完成。

## 未来阶段

未来将接入真实后端（Spring Boot / Node.js / Go）。

要求：

> 页面层和 Store 层不得直接访问 localStorage，也不得直接发起 HTTP 请求。

后续仅替换 Repository 实现即可。

---

# 三、技术栈要求

## 基础环境

* React 18
* TypeScript
* Vite
* npm

初始化：

```bash
npm create vite@latest micro-blog -- --template react-ts

cd micro-blog

npm install
```

启动：

```bash
npm run dev
```

---

## UI

使用：

```bash
npm install antd
npm install @ant-design/icons
```

要求：

* 不使用 Tailwind；
* 不使用 styled-components；
* 布局、表单、弹窗统一使用 Ant Design；
* CSS 使用 CSS Modules。

示例：

```tsx
import styles from './index.module.css'
```

---

## 路由

安装：

```bash
npm install react-router-dom
```

要求：

* React Router v6；
* SPA 路由。

---

## 请求层（预留）

安装：

```bash
npm install axios
```

建立：

```text
src/utils/request.ts
```

示例：

```ts
import axios from 'axios';

export const request = axios.create({
    baseURL: '/api',
    timeout: 10000,
});
```

说明：

> 当前阶段不得使用 request 发起请求，仅作为后端接入预留。

---

## 日期库

安装：

```bash
npm install dayjs
```

---

## Markdown

安装：

```bash
npm install react-markdown
npm install remark-gfm
```

支持：

* 标题
* 粗体
* 列表
* 引用
* 代码块
* 表格

---

# 四、设计原则

整体风格：

> Less is More

要求：

* 白底灰边；
* 不使用渐变；
* 不使用复杂动画；
* 阴影极轻或无阴影；
* 保持大量留白；
* 风格类似早期博客系统、Typecho、极简微博。

---

# 五、整体布局

采用三栏布局：

```text
┌────────┬────────────────────────────┬─────────┐
│ 左侧栏 │         主内容区            │ 右侧栏  │
└────────┴────────────────────────────┴─────────┘
```

---

# 六、路由设计

```text
/
首页

/search
搜索

/settings
设置
```

未知路由：

```text
跳转首页
```

---

# 七、左侧栏

宽度：

```text
100px
```

固定内容：

```text
首页
搜索
设置
退出
Github
版本号
```

要求：

* 图标 + 文字；
* 当前路由高亮；
* GitHub 新窗口打开；
* 版本号读取 package.json。

---

# 八、首页（核心页面）

## 发布框

顶部卡片。

编辑区域：

* Markdown 输入；
* 高度 200px。

提示：

```text
输入你要记录的内容，第一行以 # 开头会被视为标题
```

---

工具栏：

左侧：

```text
可见性

所有人可见
仅自己可见
```

中间：

```text
上传图片
插入表情
全屏编辑
```

右侧：

```text
记录按钮
```

按钮文字：

```text
记录
```

绿色主按钮。

---

## 时间流列表

按时间倒序。

每条记录卡片包含：

顶部：

```text
发布时间
用户名
可见性
浏览数
```

示例：

```text
2026-06-11 13:58:42
@densu
所有人可见
👁 0
```

内容：

支持 Markdown 渲染。

标签：

自动识别：

```text
#test
#日常
#生活
```

展示为绿色 Tag。

点击：

```text
/search?tag=test
```

---

菜单操作：

```text
编辑
删除
复制链接
```

---

# 九、搜索页

布局：

搜索条件 + 搜索结果。

字段：

## 标签

Select：

```text
全部
标签列表
```

来源：

Repository 返回。

---

## 可见性

Select：

```text
全部
所有人可见
仅自己可见
```

---

## 用户

保留字段。

默认：

```text
当前用户
```

---

## 内容

Input：

placeholder：

```text
支持全文搜索
```

支持模糊匹配。

---

## 时间范围

RangePicker。

默认：

最近三年。

---

按钮：

```text
搜索
```

---

结果：

复用 PostCard。

空状态：

```text
暂无记录
```

---

# 十、设置页

Tab：

```text
系统设置
用户设置
标签管理
开发者
```

---

## 用户设置

字段：

* 头像
* 昵称
* 密码
* 邮箱
* 个人介绍
* 默认可见性

昵称默认：

```text
densu
```

密码提示：

```text
留空就是不修改密码
```

个人介绍：

Textarea。

高度：

150px。

按钮：

```text
保存配置
```

保存成功：

```ts
message.success('保存成功')
```

---

## 系统设置

展示：

```text
功能开发中
```

---

## 标签管理

展示：

```text
标签名
使用次数
```

支持：

```text
删除标签
```

---

## 开发者

展示：

```text
项目名称
版本号
Github 地址
构建时间
React 版本
Vite 版本
```

---

# 十一、右侧栏

宽度：

```text
220px
```

固定显示。

---

用户卡片：

```text
@densu
2026-06-11
free style!
```

显示：

* 头像
* RSS 图标
* 简介

---

统计：

```text
Memo
Tags
Day
```

例如：

```text
1 Memo
1 Tags
5 Day
```

Day：

连续记录天数。

---

热力图：

要求：

* 7×6；
* 共 42 格；
* GitHub Contribution 风格；
* 使用 CSS 实现；
* 不引入额外库。

---

Top10 Tags：

例如：

```text
#test(1)
```

点击跳转搜索。

---

# 十二、组件拆分

```text
components/
```

包含：

```text
Layout
PostEditor
PostCard
MarkdownViewer
Heatmap
UserCard
TagList
EmptyState
```

每个组件独立目录：

```text
PostCard/
├─ index.tsx
└─ index.module.css
```

---

# 十三、目录结构

```text
src/
├─ api/
├─ assets/
├─ components/
├─ hooks/
├─ layouts/
├─ pages/
├─ router/
├─ store/
├─ styles/
├─ types/
├─ utils/
│   ├─ request.ts
│   └─ storage.ts
├─ App.tsx
└─ main.tsx
```

---

# 十四、类型定义

```ts
type Visibility = 'public' | 'private'
```

帖子：

```ts
interface Post {
    id:number
    content:string
    tags:string[]
    visibility:Visibility
    views:number
    createdAt:string
}
```

用户：

```ts
interface User {
    nickname:string
    avatar:string
    email:string
    bio:string
    defaultVisibility:Visibility
}
```

标签：

```ts
interface Tag {
    name:string
    count:number
}
```

---

# 十五、Repository 模式要求（重要）

当前架构：

```text
Page
↓
Store
↓
API Repository
↓
localStorage
```

未来架构：

```text
Page
↓
Store
↓
API Repository
↓
Axios
↓
Backend
```

要求：

> Page 不得直接访问 localStorage。

> Store 不得直接访问 localStorage。

> Store 只能调用 api 层。

---

# 十六、Storage 层

建立：

```text
utils/storage.ts
```

负责：

```text
loadPosts
savePosts

loadUser
saveUser
```

封装 localStorage。

---

# 十七、API Repository

目录：

```text
api/
├─ post.ts
├─ user.ts
└─ tag.ts
```

要求：

* 返回 Promise；
* 当前内部调用 storage；
* 不允许直接写在页面中。

示例：

```ts
export async function getPosts() {
    return Promise.resolve(loadPosts());
}
```

未来替换：

```ts
request.get(...)
```

即可。

---

# 十八、状态管理

使用：

```text
React Context + Hooks
```

目录：

```text
store/
```

封装：

```ts
useAppStore()
```

维护：

```text
当前用户
帖子列表
标签列表
统计信息
```

---

# 十九、交互要求

发布成功：

```ts
message.success('记录成功')
```

删除：

```ts
Modal.confirm({
    title:'确认删除这条记录？'
})
```

编辑：

Modal 回填。

复制链接：

```ts
navigator.clipboard.writeText(...)
```

成功：

```ts
message.success('复制成功')
```

Tag 联动：

```text
/search?tag=test
```

自动搜索。

---

# 二十、响应式

≥1200px：

```text
三栏布局
```

768~1199px：

```text
隐藏右侧栏
```

<768px：

```text
左侧栏折叠
顶部 Hamburger
右侧栏隐藏
编辑器全宽
```

---

# 二十一、代码规范

要求：

* TypeScript 严格模式；
* 禁止 any；
* Props 类型完整；
* Hooks 抽离；
* 单组件不超过 300 行；
* 每个组件添加注释；
* 所有函数添加功能说明；
* ESLint 无报错；
* 无 TypeScript 报错。

---

# 二十二、开发顺序

Step 1：

初始化项目并安装依赖。

Step 2：

搭建目录、路由、Layout。

Step 3：

完成左右侧栏及响应式。

Step 4：

完成首页功能。

Step 5：

完成搜索页。

Step 6：

完成设置页。

Step 7：

完成 Store、Repository、Storage。

Step 8：

优化样式，贴近设计稿。

Step 9：

自检并输出：

* 已实现功能；
* 未实现功能；
* 后续优化建议。

---

# 二十三、最终输出要求

请直接生成完整项目代码。

要求：

1. 按开发顺序输出；
2. 每个文件必须给出完整代码；
3. 不允许省略；
4. 不允许使用“其余代码类似”；
5. 保证复制即可运行；
6. 最终执行：

```bash
npm install
npm run dev
```

即可启动并达到设计稿效果。
