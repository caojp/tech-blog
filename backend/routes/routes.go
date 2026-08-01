package routes

import (
	"github.com/caojp/tech-blog/backend/controllers"
	logger "github.com/caojp/tech-blog/backend/middleware" // 导入 logger 包
	"github.com/gin-gonic/gin"
)

// SetupRouter 设置路由
func SetupRouter() *gin.Engine {
	// 创建一个新的 Gin 引擎实例
	router := gin.New()

	// 初始化日志记录器
	log := logger.InitLogger() // 使用 InitLogger 初始化日志记录器

	// 注册 Recovery 中间件（捕获 panic 防止进程崩溃）和日志中间件。
	// 注意：不能在中间件闭包内直接调用 logger.Logger(log)(c)，那会破坏 Gin 的中间件链。
	router.Use(gin.Recovery(), logger.Logger(log))

	// 路由组
	api := router.Group("/api")
	{
		// 定义路由及其处理函数
		api.GET("/content", controllers.GetContentDir)
		api.POST("/markdown", controllers.GetMarkdownContent)
	}

	return router
}
