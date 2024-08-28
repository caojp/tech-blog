package controllers

import (
	"backend/config"
	logger "backend/middleware"
	"backend/payloads"
	"backend/services"
	"backend/utils"
	"github.com/gin-gonic/gin"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
)

// GetContentDir godoc
// @Summary Get directory contents
// @Description Get list of files and directories
// @Tags content
// @Produce  json
// @Success 200 {object} []models.FileNode
// @Router /api/content [get]
func GetContentDir(c *gin.Context) {
	// 从配置文件中获取 ContentDir
	defaultDir := config.AppConfig.ContentDir

	// 从查询参数中获取路径
	dirPath := c.Query("path")
	if dirPath == "" {
		dirPath = defaultDir // 使用配置文件中的默认路径
	}

	// 确保路径是有效的
	absDirPath, err := filepath.Abs(dirPath)
	if err != nil {
		utils.ErrorResponseFunc(c, http.StatusBadRequest, "Invalid path")
		return
	}
	fileNodes, err := services.ReadDir(absDirPath)
	if err != nil {
		utils.ErrorResponseFunc(c, http.StatusInternalServerError, "Failed to read directory")
		return
	}

	utils.SuccessResponse(c, fileNodes)
}

// GetMarkdownContent godoc
// @Summary      获取Markdown内容
// @Description  根据提供的文件路径获取Markdown文件的内容
// @Tags         markdown
// @Accept       json
// @Produce      json
// @Param        request body payloads.RequestData true "请求数据"
// @Success 200 {string} string "Markdown file content"
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/markdown [post]
func GetMarkdownContent(c *gin.Context) {
	var requestData payloads.RequestData

	//// 使用 io.ReadAll 读取请求体
	//rawData, err := io.ReadAll(c.Request.Body)
	//if err != nil {
	//	c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Failed to read request body"})
	//	return
	//}
	//
	//// 打印原始请求体
	//logger.Log.Debug("Raw JSON data:", string(rawData))

	// 重新设置请求体，以便之后的 BindJSON 可以再次读取
	//c.Request.Body = io.NopCloser(strings.NewReader(string(rawData)))

	// 绑定 JSON 数据到结构体
	if err := c.BindJSON(&requestData); err != nil {
		// 打印错误信息
		logger.Log.Errorf("JSON解析错误: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid JSON format"})
		return
	}

	filePath := requestData.FilePath
	logger.Log.Debug("FilePath:", filePath)

	logger.Log.Debug("Raw file path: ", filePath)
	if filePath == "" {
		utils.ErrorResponseFunc(c, http.StatusBadRequest, "Invalid path")
		return
	}

	// 解码 URL 编码的路径
	decodedFilePath, err := url.QueryUnescape(filePath)
	if err != nil {
		logger.Log.Error("Failed to decode file path: ", err)
		utils.ErrorResponseFunc(c, http.StatusBadRequest, "Invalid file path")
		return
	}

	// 使用 logger 记录解码后的路径
	logger.Log.Debug("Decoded file path: ", decodedFilePath)

	// 确保路径没有多余的斜杠
	absFilePath, err := filepath.Abs(decodedFilePath)
	if err != nil {
		logger.Log.Error("Failed to convert to absolute path: ", err)
		utils.ErrorResponseFunc(c, http.StatusBadRequest, "Invalid file path")
		return
	}

	// 使用 logger 记录绝对路径
	logger.Log.Debug("Absolute file path: ", absFilePath)

	// 读取文件内容
	content, err := services.ReadFile(absFilePath)
	if err != nil {
		if os.IsNotExist(err) {
			logger.Log.Error("File not found: ", err)
			utils.ErrorResponseFunc(c, http.StatusNotFound, "File not found")
		} else {
			logger.Log.Error("Failed to read file: ", err)
			utils.ErrorResponseFunc(c, http.StatusInternalServerError, "Failed to read file")
		}
		return
	}

	// 使用 logger 记录读取的内容
	//logger.Log.Debug("File content: ", content)

	utils.SuccessResponse(c, content)
}
