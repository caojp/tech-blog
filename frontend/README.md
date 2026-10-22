# AldusBlog Frontend

基于 React + Vite 的纯前端博客，负责 Markdown 渲染与文档站点交互。

## 技术栈

- **React 18** + **Vite 5**
- **react-markdown** + **remark-gfm** — Markdown 渲染
- **mermaid** — Mermaid 流程图（含全屏查看）
- **react-syntax-highlighter** (PrismLight) — 代码高亮按需加载
- **react-router-dom 6** — 路由
- **Vite Virtual Plugin** — 构建时扫描 Markdown 目录

## 目录结构

```
frontend/
├── src/
│   ├── api/
│   │   └── content.js           # 从 virtual:posts 读取内容
│   ├── components/
│   │   ├── MarkdownRenderer.jsx # Markdown + Mermaid 渲染（预处理器 + 全屏）
│   │   ├── SideNav.jsx          # 左侧导航
│   │   ├── TopNav.jsx           # 顶部导航（溢出自动折叠）
│   │   ├── ContentNav.jsx       # 二级导航
│   │   ├── TableOfContents.jsx  # 文档目录
│   │   └── ThemeSwitcher.jsx    # 主题切换
│   ├── pages/
│   │   └── HomePage.jsx
│   ├── styles/
│   │   ├── themes.css           # 设计 Token + 主题变量
│   │   └── *.css
│   ├── App.jsx
│   └── main.jsx
├── .env.development             # POSTS_DIR=开发目录
├── .env.production              # POSTS_DIR=生产目录
└── vite.config.js               # 含 posts-plugin 虚拟模块
```

## 开发

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # 产物在 dist/
npm run preview   # 预览构建产物
```

## 环境变量

| 文件 | 变量 | 说明 |
|---|---|---|
| `.env.development` | `POSTS_DIR` | 开发环境 Markdown 目录（支持相对路径和绝对路径） |
| `.env.production` | `POSTS_DIR` | 生产环境 Markdown 目录 |

```bash
# 示例
POSTS_DIR=../posts              # 相对于 frontend/
POSTS_DIR=D:\awesome-me         # Windows 绝对路径
POSTS_DIR=/var/www/posts        # Linux 绝对路径
```

## 工作原理

**内容加载**：`vite.config.js` 中的 `postsPlugin` 在 build/dev 时用 Node.js `fs.readdirSync` 递归扫描 `POSTS_DIR`，生成 `virtual:posts` 虚拟模块。`src/api/content.js` 直接 `import postsData from 'virtual:posts'` 拿到文件内容和目录树。

**Mermaid 预处理**：`preprocessMermaid()` 在渲染前自动处理节点/边标签中的特殊字符（`+ # ()[]{} / <br/>` 等），避免 Parse error。

**Mermaid 全屏**：用 React Portal 渲染到 `document.body`，避免祖先 `transform` 导致的 `position: fixed` 降级问题；克隆 SVG 时重命名所有 `id`（加 `-fs` 后缀）避免 DOM 冲突。

## 设计体系

- `themes.css` 定义 `--bg`、`--text`、`--color-primary` 等 CSS 变量
- 通过 `body.dark-mode` / `body.eye-care-mode` 覆盖变量实现主题切换
- 所有组件引用变量而非硬编码颜色

## 功能特性

- 亮色 / 暗色 / 护眼模式切换，跟随系统偏好，本地持久化
- 侧边栏可拖拽调整宽度（200-480px），宽度持久化
- 顶部导航动态溢出检测——菜单项多时自动折叠为下拉面板
- 移动端抽屉式导航 + 背景遮罩
- 代码高亮 5 种风格可切换，代码一键复制
- Mermaid 流程图：自动处理特殊字符 + 全屏查看（拖拽/缩放/重置）
- 表格横向滚动不溢出页面
- 文章路径写入 URL，支持刷新恢复和分享
