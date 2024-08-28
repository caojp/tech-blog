package routes

import (
	"backend/controllers"
	"backend/middleware" // 导入 logger 包
	"github.com/gin-gonic/gin"
)

// SetupRouter 设置路由
func SetupRouter() *gin.Engine {
	// 创建一个新的 Gin 引擎实例
	router := gin.New()

	// 初始化日志记录器
	log := logger.InitLogger() // 使用 InitLogger 初始化日志记录器

	// 使用 Logger 中间件，并将日志记录器存储到上下文中
	router.Use(func(c *gin.Context) {
		c.Set("logger", log)  // 将 logger 存储到上下文中
		logger.Logger(log)(c) // 使用 Logger 中间件记录请求
	})

	// 路由组
	api := router.Group("/api")
	{
		// 定义路由及其处理函数
		api.GET("/content", controllers.GetContentDir)
		api.POST("/markdown", controllers.GetMarkdownContent)
	}

	return router
}
