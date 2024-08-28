

目录结构：
```shell
backend/
├── config/                # 配置文件夹
│   └── config.go          # 配置加载逻辑
├── controllers/           # 控制器文件夹
│   └── markdown.go        # 处理Markdown相关的控制器
├── middleware/            # 中间件文件夹
│   └── logger.go          # 日志中间件
├── models/                # 模型文件夹（如果使用ORM或数据库，可以放模型）
│   └── file.go            # 定义文件和目录相关的结构
├── routes/                # 路由文件夹
│   └── routes.go          # 路由设置
├── services/              # 业务逻辑文件夹
│   └── file_service.go    # 文件和目录读取的业务逻辑
├── utils/                 # 工具类文件夹
│   └── response.go        # 封装响应格式
├── content/               # 本地Markdown目录（示例）
├── go.mod                 # Go 模块文件
└── main.go                # 主程序入口

```
启动服务器
```shell


```
访问swagger
```shell
http://localhost:8080/swagger/index.html
```