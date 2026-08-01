# TechBlog Backend

基于 Go + Gin 的博客后端，负责读取 Markdown 目录结构并提供 API。

## 技术栈

- **Go 1.22** + **Gin 1.10**
- **Viper** — 配置管理
- **Logrus + Lumberjack** — 日志与轮转
- **Swagger** — API 文档

## 目录结构

```
backend/
├── config/                   # 配置加载
│   ├── config.go
│   └── config.yaml
├── controllers/              # 控制器
│   └── markdown.go           # Markdown 内容接口
├── middleware/               # 中间件
│   └── logger.go             # 日志中间件
├── models/                   # 数据模型
│   └── file.go               # 文件/目录结构
├── routes/                   # 路由
│   └── routes.go
├── services/                 # 业务逻辑
│   └── file_service.go       # 文件读取 + 目录树缓存
├── utils/                    # 工具
│   └── response.go           # 统一响应格式
├── docs/                     # Swagger 文档（自动生成）
├── test/                     # 测试
│   └── markdown_test.go
├── go.mod
└── main.go                   # 入口
```

## 开发

```bash
# 安装依赖
go mod tidy

# 启动服务（默认 8080 端口）
go run main.go

# 指定配置文件
go run main.go -config path/to/config.yaml

# 运行测试
go test ./...

# 构建
go build -o tech-blog .

# 交叉编译 Linux
GOOS=linux GOARCH=amd64 go build -o tech-blog .
```

## API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/content` | 获取目录树结构 |
| POST | `/api/markdown` | 获取指定 Markdown 文件内容 |

Swagger 文档：`http://localhost:8080/swagger/index.html`

## 配置

配置文件 `config.yaml`：

```yaml
ServerPort: ":8080"          # 服务端口
ContentDir: "../posts"       # Markdown 内容目录

LOG:
  LEVEL: "info"              # debug/info/warn/error
  ROTATE_DAYS: 7             # 日志轮转天数
  FORMAT: "json"             # json/text
```

## 安全

- **路径穿越防护**：所有文件请求经过 `resolveSafePath` 校验，确保路径在 `ContentDir` 范围内
- **日志中间件**：记录请求方法、路径、状态码、耗时，输出到文件并按天轮转
- **目录树缓存**：减少重复 IO，内容变更时自动刷新
