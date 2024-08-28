要访问 Swagger 文档，你需要确保你的 Gin 路由中正确配置了 Swagger UI 路由。以下是访问 Swagger UI 的详细步骤：

### 1. 确保 Swagger 路由配置正确

在你的 `main.go` 文件中，确保你已经正确设置了 Swagger 路由。你的 `main.go` 文件应该包含类似于下面的代码：

```go
package main

import (
	"backend/config"
	"backend/routes"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/swaggo/files"       // swagger embed files
	"github.com/swaggo/gin-swagger" // gin-swagger middleware
	_ "backend/docs" // 导入自动生成的 Swagger 文档
)

func main() {
	// 初始化配置
	config.InitConfig()

	// 设置路由
	router := routes.SetupRouter()

	// 设置 Swagger 路由
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 启动服务器
	port := config.AppConfig.ServerPort
	fmt.Printf("Starting server on %s...\n", port)
	if err := router.Run(port); err != nil {
		fmt.Printf("Error starting server: %v\n", err)
	}
}
```

### 2. 生成 Swagger 文档

确保已经生成了 Swagger 文档。如果你还没有运行过 Swagger 的生成命令，可以使用以下命令：

```bash
swag init
```

这会生成 `docs/swagger.yaml` 和 `docs/docs.go` 文件，这些文件是 Swagger 的文档源。

### 3. 访问 Swagger UI

确保你的服务器正在运行（例如，它可能运行在 `localhost:8080`）。你可以在浏览器中访问 Swagger UI，通常通过以下 URL 访问：

```
http://localhost:8080/swagger/index.html
```

### 4. 验证 Swagger 文档

在浏览器中打开上面的 URL，Swagger UI 应该显示自动生成的 API 文档页面。你可以在这个页面上查看 API 的详细信息，包括端点、请求和响应格式等。

### 5. 检查常见问题

- **404 错误**：如果你访问 Swagger UI 时遇到 `404 Not Found` 错误，确保 Swagger 路由 `/swagger/*any` 的配置是正确的，并且 Swagger UI 中间件已经添加到 Gin 路由中。

- **配置文件**：确认 Swagger 文档生成时没有错误，且 `docs` 包已经正确生成并导入到项目中。

- **端口号**：确保访问的端口号与你的 Go 应用程序运行的端口号一致。如果你的服务器在不同的端口上运行，调整 URL 中的端口号以匹配实际端口。

### 6. 使用 Swagger UI

在 Swagger UI 中，你可以：

- **查看 API 端点**：检查 API 端点的详细描述、参数和返回值。
- **测试 API**：使用 Swagger UI 提供的测试功能直接向 API 发起请求并查看响应。
- **导出 API 文档**：下载 Swagger 文档以供离线查看或使用其他工具。

通过这些步骤，你可以成功地访问和使用 Swagger UI 来查看和测试你的 API 文档。如果还有其他问题或需要进一步帮助，请告诉我！