# TechBlog Frontend

基于 React + Vite 的博客前端，负责 Markdown 渲染与文档站点交互。

## 技术栈

- **React 18** + **Vite 5**
- **react-markdown** + **remark-gfm** — Markdown 渲染
- **react-syntax-highlighter** (PrismLight) — 代码高亮按需加载
- **react-router-dom 6** — 路由

## 目录结构

```
frontend/
├── src/
│   ├── api/                  # API 请求封装
│   │   ├── content.js        # 内容相关接口
│   │   └── request.js        # axios 实例
│   ├── components/           # 通用组件
│   │   ├── MarkdownRenderer  # Markdown 渲染
│   │   ├── SideNav           # 左侧导航（可拖拽宽度）
│   │   ├── TopNav            # 顶部导航
│   │   ├── TableOfContents   # 文档目录
│   │   └── ThemeSwitcher     # 主题切换
│   ├── pages/
│   │   └── HomePage.jsx      # 主页面
│   ├── styles/               # 样式（CSS 变量设计体系）
│   │   ├── themes.css        # 设计 Token + 主题变量
│   │   └── *.css             # 组件样式
│   ├── App.jsx
│   └── main.jsx
├── .env.development          # 开发环境变量
├── .env.production           # 生产环境变量
└── vite.config.js
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 5173 端口）
npm run dev

# 代码检查
npm run lint

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

## 环境变量

| 文件 | 变量 | 说明 |
|---|---|---|
| `.env.development` | `VITE_API_BASE_URL` | 开发环境后端地址 |
| `.env.production` | `VITE_API_BASE_URL` | 生产环境后端地址 |

## 设计体系

样式基于 CSS 变量（Design Token）实现主题切换：

- `themes.css` 定义 `--bg`、`--text`、`--color-primary` 等变量
- 通过 `body.dark-mode` / `body.eye-care-mode` 覆盖变量实现主题切换
- 所有组件引用变量而非硬编码颜色

## 功能特性

- 亮色 / 暗色 / 护眼模式切换，跟随系统偏好，本地持久化
- 侧边栏可拖拽调整宽度（200-480px），宽度持久化
- 移动端抽屉式导航 + 背景遮罩
- 代码高亮 5 种风格可切换，代码一键复制
- 文章路径写入 URL，支持刷新恢复和分享
