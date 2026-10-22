# 贡献指南

感谢你对 AldusBlog 的关注！欢迎提交 Issue 和 Pull Request。

## 开发环境准备

1. **Node.js** ≥ 18 — [下载](https://nodejs.org/)
2. 克隆仓库并安装依赖：

```bash
git clone https://github.com/caojp/aldus-blog.git
cd aldus-blog/frontend && npm install
```

3. 配置 Markdown 目录：编辑 `.env.development`，设置 `POSTS_DIR` 指向你的知识库。

4. 启动开发服务器：

```bash
npm run dev
# 访问 http://localhost:5173
```

## 开发流程

1. **Fork** 仓库到你自己的 GitHub 账号
2. 从 `master` 创建功能分支：

   ```bash
   git checkout -b feat/your-feature
   ```

3. 编写代码，确保通过检查：

   ```bash
   npm run lint    # ESLint 检查
   npm run build   # 构建验证
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
feat(mermaid): 支持 Mermaid 流程图全屏查看

fix(topnav): 修复侧边栏遮挡顶部导航下拉菜单
```

## 代码规范

### React / JavaScript

- 运行 `npm run lint`，确保无 ESLint 错误
- 使用函数组件 + Hooks
- 组件使用 `memo` 避免不必要的重渲染
- 样式使用 CSS 变量（Design Token），不硬编码颜色
- Mermaid 预处理新增特殊字符时，同步更新测试用例

### Mermaid 预处理（重要）

修改 `preprocessMermaid()` 时注意：

- 节点正则（rect/round/diamond）和边标签正则的特殊字符列表必须**保持同步**
- 嵌套形状（圆形 `(())`、六边形 `{{}}`、圆柱 `[()]`）需要跳过处理
- 内部引号用 `&quot;` 转义（不是 `\"`）
- 边标签先抽成占位符，处理完节点后再还原，避免节点正则误匹配

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
