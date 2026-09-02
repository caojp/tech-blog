<p align="center">
  <img src="frontend/public/logo-color.svg" alt="TechBlog" width="120">
</p>

<h1 align="center">TechBlog</h1>

<p align="center">
  基于 React + Vite 的纯前端 Markdown 博客系统，将本地 Markdown 文件夹变成结构化的在线文档站点
</p>

<p align="center">
  <a href="https://github.com/caojp/tech-blog/actions"><img alt="CI" src="https://github.com/caojp/tech-blog/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg">
  <img alt="React Version" src="https://img.shields.io/badge/React-18+-61DAFB">
  <img alt="Vite Version" src="https://img.shields.io/badge/Vite-5+-646CFF">
  <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg">
</p>

---

## 目录

- [目录](#目录)
- [功能特性](#功能特性)
- [截图预览](#截图预览)
    - [常规模式](#常规模式)
    - [护眼模式](#护眼模式)
    - [暗黑模式](#暗黑模式)
    - [移动端](#移动端)
- [技术栈](#技术栈)
- [前置条件](#前置条件)
- [快速开始](#快速开始)
  - [1. 克隆仓库](#1-克隆仓库)
  - [2. 配置 Markdown 目录](#2-配置-markdown-目录)
  - [3. 启动前端](#3-启动前端)
  - [4. 添加你的文章](#4-添加你的文章)
- [项目结构](#项目结构)
- [内容目录约定](#内容目录约定)
- [配置说明](#配置说明)
  - [POSTS\_DIR（最重要）](#posts_dir最重要)
  - [工作原理](#工作原理)
  - [其他 Vite 配置](#其他-vite-配置)
- [部署](#部署)
  - [方式一：静态托管（推荐）](#方式一静态托管推荐)
  - [方式二：Docker](#方式二docker)
  - [方式三：本地预览](#方式三本地预览)
- [参与贡献](#参与贡献)
- [开源许可](#开源许可)

## 功能特性

- 📂 **目录即导航** — 自动读取 Markdown 目录结构，生成顶部+左侧多级导航
- 📝 **Markdown 渲染** — 支持 GFM 语法、Mermaid 流程图（全屏查看）、代码高亮（5 种风格可切换）、一键复制代码
- 🌗 **主题切换** — 亮色 / 暗色 / 护眼模式，支持跟随系统偏好，本地持久化
- 📱 **响应式适配** — 桌面端可拖拽侧边栏，移动端抽屉式导航
- 📑 **文档目录** — 自动提取文章标题生成右侧 TOC，支持锚点跳转
- 🔗 **可分享链接** — 文章路径写入 URL，刷新即恢复，支持直接分享
- ⚡ **纯前端架构** — 无后端依赖，静态部署即可（GitHub Pages / Vercel / Netlify）
- 📍 **可配置内容目录** — 开发和生产环境可指向不同的 Markdown 目录（.env 配置）
- 🖼️ **Mermaid 增强** — 自动处理特殊字符避免 Parse error；全屏模式支持拖拽/缩放

## 截图预览

#### 常规模式
![常规模式](image/img_normal.png)

#### 护眼模式
![护眼模式](image/eye-care-img.png)

#### 暗黑模式
![暗黑模式](image/dark_mode.png)

#### 移动端
<p float="left">
  <img src="image/phone1.png" width="180">
  <img src="image/phone2.png" width="180">
  <img src="image/phone3.png" width="180">
</p>

## 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| **前端框架** | React | 18 |
| **构建工具** | Vite | 5 |
| **Markdown 渲染** | react-markdown + remark-gfm | 9 / 4 |
| **Mermaid 图表** | mermaid | 10+ |
| **代码高亮** | react-syntax-highlighter (PrismLight 按需加载) | 15 |
| **路由** | react-router-dom | 6 |
| **内容加载** | Vite Virtual Plugin (Node.js fs 扫描) | — |

## 前置条件

- **Node.js** ≥ 18
- **npm** ≥ 9（或 pnpm / yarn）

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/caojp/tech-blog.git
cd tech-blog
```

### 2. 配置 Markdown 目录

编辑 `frontend/.env.development`：

```bash
# 可以是相对路径（相对于 frontend/）
POSTS_DIR=../posts

# 也可以是绝对路径，指向你的知识库
POSTS_DIR=D:\awesome-me
```

生产环境在 `frontend/.env.production` 中配置服务器上的路径。

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`。

> 项目**不再需要 Go 后端**。所有 Markdown 文件在构建时由 Vite 插件扫描打包。

### 4. 添加你的文章

在 `POSTS_DIR` 指定的目录下放 Markdown 文件即可（参见[内容目录约定](#内容目录约定)）。

开发模式下新增/修改 `.md` 文件会自动触发热更新。生产环境需要重新 `npm run build`。

## 项目结构

```
tech-blog/
├── frontend/                     # React 前端（唯一需要运行的）
│   ├── src/
│   │   ├── api/
│   │   │   └── content.js        # 通过 virtual:posts 虚拟模块读取内容
│   │   ├── components/          # 组件
│   │   ├── pages/               # 页面
│   │   └── styles/              # 样式
│   ├── .env.development         # 开发环境配置（POSTS_DIR）
│   ├── .env.production          # 生产环境配置（POSTS_DIR）
│   └── vite.config.js           # 含 posts-plugin 虚拟模块插件
├── backend/                      # ⚠️ 已弃用（不再被前端调用）
├── posts/                        # 默认 Markdown 内容目录（可在 .env 中改）
├── image/                        # README 截图
└── README.md
```

> **关于 backend/**：后端代码暂时保留，但已脱钩。如需清理可随时删除。

## 内容目录约定

```
posts/
│   index.md                  # 首页展示的内容
│
├───golang                    # 一级目录 → 顶部导航
│   │   Go_Learning_Plan.md   # 文章 → 左侧导航
│   │
│   ├───基础                  # 二级目录 → 左侧可折叠
│   │       post1.md
│   │
│   └───框架
│       ├───gin              # 三级目录 → 左侧可折叠
│       └───orm
│
├───kubernetes
├───linux
└───python
```

- 顶层目录显示在**顶部导航栏**
- 子目录和文件显示在**左侧导航栏**，支持多级折叠
- `index.md` 作为首页默认内容
- 只有包含 `.md` 文件的目录才会出现在导航中

## 配置说明

### POSTS_DIR（最重要）

在 `.env.development` / `.env.production` 中配置 Markdown 内容目录：

```bash
# 相对路径（相对于 frontend/ 目录）
POSTS_DIR=../posts

# Windows 绝对路径（反斜杠正斜杠都行）
POSTS_DIR=D:\awesome-me

# Linux/Mac 绝对路径
POSTS_DIR=/home/user/notes
```

### 工作原理

[vite.config.js](frontend/vite.config.js) 中的 `postsPlugin` 在 build/dev 时：

1. 用 Node.js `fs.readdirSync` 递归扫描 `POSTS_DIR`
2. 读取所有 `.md` 文件内容
3. 生成 `virtual:posts` 虚拟模块（含 `files: Map<路径, 内容>` + `tree: FileNode[]`）
4. 开发模式下监听目录变化，自动热更新

### 其他 Vite 配置

```js
// vite.config.js
export default defineConfig({
    server: {
        port: 5173,          // 开发服务器端口
    },
    build: {
        outDir: 'dist',      // 构建输出目录
    },
});
```

## 部署

### 方式一：静态托管（推荐）

项目是纯前端，构建产物 `frontend/dist/` 可以直接部署到任何静态托管：

```bash
cd frontend
npm run build
# dist/ 目录上传即可
```

| 平台 | 特点 |
|---|---|
| **GitHub Pages** | 免费，push 自动构建 |
| **Vercel** | 免费额度大，零配置 |
| **Netlify** | 免费额度大，拖拽部署 |
| **Nginx** | 自建服务器 |
| **S3 + CloudFront** | AWS 生态 |

### 方式二：Docker

```bash
docker build -t tech-blog .
docker run -p 80:80 tech-blog
```

### 方式三：本地预览

```bash
cd frontend
npm run build
npm run preview
```

## 参与贡献

欢迎提交 Issue 和 PR！请先阅读 [贡献指南](CONTRIBUTING.md)。

- 提交前请确保 `npm run lint` 和 `npm run build` 通过
- 遵循 [约定式提交](https://www.conventionalcommits.org/zh-hans/) 规范
- 报告安全漏洞请参见 [安全策略](SECURITY.md)

## 开源许可

本项目基于 [MIT License](LICENSE) 开源。
