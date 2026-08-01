# 更新日志

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [Unreleased]

### Added
- 项目标准化：新增 LICENSE、CONTRIBUTING、CODE_OF_CONDUCT、SECURITY 等开源治理文件
- 新增 Makefile 统一管理常用命令
- 新增 Dockerfile + docker-compose.yml 支持容器化部署
- 新增 GitHub Actions CI 自动化（go vet/test + eslint/build）
- 新增 .editorconfig 统一编辑器配置
- 新增 Issue/PR 模板规范贡献流程

### Changed
- go.mod module 路径改为 `github.com/caojp/tech-blog/backend`
- 重写根 README，增加徽章、目录、架构图、部署说明
- 替换 frontend/README.md（原为 Vite 模板默认内容）
- 优化 .gitignore 分类与规则

### Security
- 路径穿越防护：所有文件请求校验路径在 ContentDir 范围内

## [1.0.0] - 2026-01-01

### Added
- 基于 Go + Gin + React + Vite 的 Markdown 博客系统
- 自动读取 Markdown 目录结构生成多级导航
- Markdown 渲染：GFM 语法、代码高亮、代码复制
- 亮色 / 暗色 / 护眼模式，跟随系统偏好，本地持久化
- 侧边栏可拖拽调整宽度，移动端抽屉式导航
- 文档目录 TOC 自动生成，锚点跳转
- 文章路径写入 URL，支持刷新恢复和分享
- 后端目录树缓存、日志轮转、Swagger API 文档
