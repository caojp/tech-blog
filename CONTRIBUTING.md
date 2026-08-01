# 贡献指南

感谢你对 TechBlog 的关注！欢迎提交 Issue 和 Pull Request。

## 开发环境准备

1. **Go** ≥ 1.22 — [下载](https://go.dev/dl/)
2. **Node.js** ≥ 18 — [下载](https://nodejs.org/)
3. 克隆仓库并安装依赖：

```bash
git clone https://github.com/caojp/tech-blog.git
cd tech-blog

# 后端
cd backend && go mod tidy

# 前端
cd ../frontend && npm install
```

## 开发流程

1. **Fork** 仓库到你自己的 GitHub 账号
2. 从 `master` 创建功能分支：

   ```bash
   git checkout -b feat/your-feature
   ```

3. 编写代码，确保通过检查：

   ```bash
   make lint    # 代码检查
   make test    # 运行测试
   make build   # 构建验证
   ```

4. 提交代码（遵循下方提交规范）
5. 推送并创建 **Pull Request** 到 `master` 分支

## 提交规范

遵循 [约定式提交](https://www.conventionalcommits.org/zh-hans/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**type** 可选值：

| type | 说明 |
|---|---|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档变更 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构（非新功能、非修复） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具变更 |

**示例**：

```
feat(frontend): 侧边栏支持拖拽调整宽度

fix(backend): 修复路径穿越漏洞，校验路径在 ContentDir 范围内
```

## 代码规范

### Go

- 运行 `gofmt -w .` 格式化
- 遵循 [Effective Go](https://go.dev/doc/effective_go)
- 导出函数需有注释，以函数名开头

### React / JavaScript

- 运行 `npm run lint`，确保无 ESLint 错误
- 使用函数组件 + Hooks
- 组件使用 `memo` 避免不必要的重渲染
- 样式使用 CSS 变量（Design Token），不硬编码颜色

## 分支命名

- `feat/xxx` — 新功能
- `fix/xxx` — Bug 修复
- `docs/xxx` — 文档
- `refactor/xxx` — 重构

## Issue 指南

- Bug 报告请使用 [Bug Report 模板](.github/ISSUE_TEMPLATE/bug_report.md)
- 功能建议请使用 [Feature Request 模板](.github/ISSUE_TEMPLATE/feature_request.md)
- 提交前请搜索是否已有相同 Issue

## 行为准则

参与本项目即表示你同意遵守 [行为准则](CODE_OF_CONDUCT.md)。
