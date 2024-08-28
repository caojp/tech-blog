package main

import (
	"backend/config"
	"backend/routes"
	"flag"
	"fmt"
	"github.com/swaggo/files"       // swagger embed files
	"github.com/swaggo/gin-swagger" // gin-swagger middleware

	_ "backend/docs" // 必须导入你的 docs 包，自动生成文档需要使用这个
)

func main() {
	// 解析命令行参数
	configPath := flag.String("config", "config.yaml", "Path to the configuration file")
	flag.Parse()
	// 打印传递的配置文件路径以供调试
	fmt.Printf("Config file path: %s\n", *configPath)

	// 初始化配置
	config.InitConfig(*configPath)

	// 设置路由
	router := routes.SetupRouter()

	// 初始化 Swagger
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 启动服务器
	port := config.AppConfig.ServerPort
	if port == "" {
		port = ":8080" // 设置默认端口
	}
	fmt.Printf("Starting server on %s...\n", port)
	if err := router.Run(port); err != nil {
		fmt.Printf("Error starting server: %v\n", err)
	}
}
