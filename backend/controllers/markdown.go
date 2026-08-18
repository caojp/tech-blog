package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/caojp/tech-blog/backend/config"
	logger "github.com/caojp/tech-blog/backend/middleware"
	"github.com/caojp/tech-blog/backend/payloads"
	"github.com/caojp/tech-blog/backend/services"
	"github.com/caojp/tech-blog/backend/utils"
	"github.com/gin-gonic/gin"
)

// resolveSafePath 解析目标路径并确保它位于配置的 ContentDir 范围内，
// 防止通过 "../" 或绝对路径进行路径穿越攻击。
// 返回值是经过 Clean 与符号链接解析后的绝对路径。
func resolveSafePath(target string) (string, error) {
	baseDir, err := filepath.Abs(config.AppConfig.ContentDir)
	if err != nil {
		return "", err
	}
	// 解析 baseDir 的符号链接（目录不存在时退回原值）
	if resolved, err := filepath.EvalSymlinks(baseDir); err == nil {
		baseDir = resolved
	}

	abs, err := filepath.Abs(target)
	if err != nil {
		return "", err
	}
	abs = filepath.Clean(abs)
	// 解析目标路径的符号链接（文件不存在时退回原值，避免影响后续读取的报错判断）
	if resolved, err := filepath.EvalSymlinks(abs); err == nil {
		abs = resolved
	}

	rel, err := filepath.Rel(baseDir, abs)
	if err != nil {
		return "", err
	}
	// 相对路径为 ".." 或以 "../" 开头，说明目标在 ContentDir 之外
	if rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return "", fmt.Errorf("path %q is outside content dir", target)
	}
	return abs, nil
}

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

	// 确保路径在 ContentDir 范围内，防止路径穿越
	absDirPath, err := resolveSafePath(dirPath)
	if err != nil {
		logger.Log.Warnf("Reject unsafe path: %v", err)
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

	// 绑定 JSON 数据到结构体
	if err := c.BindJSON(&requestData); err != nil {
		logger.Log.Errorf("JSON解析错误: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid JSON format"})
		return
	}

	// 从请求体中获取文件路径
	filePath := requestData.FilePath
	logger.Log.Debugf("Request FilePath: %s", filePath)

	if filePath == "" {
		logger.Log.Errorf("Invalid file path: %s", filePath)
		utils.ErrorResponseFunc(c, http.StatusBadRequest, "Invalid path")
		return
	}

	// 解码 URL 编码的路径（兼容前端可能编码的请求）
	// decodedFilePath, err := url.QueryUnescape(filePath)
	decodedFilePath, err := utils.Base64Decode(filePath)

	if err != nil {
		logger.Log.Errorf("Failed to decode file path: %v", err)
		utils.ErrorResponseFunc(c, http.StatusBadRequest, "Invalid file path")
		return
	}
	logger.Log.Debugf("Decoded FilePath: %s", decodedFilePath)

	// 校验路径在 ContentDir 范围内，防止路径穿越
	absFilePath, err := resolveSafePath(decodedFilePath)
	if err != nil {
		logger.Log.Warnf("Reject unsafe file path: %v", err)
		utils.ErrorResponseFunc(c, http.StatusBadRequest, "Invalid file path")
		return
	}
	logger.Log.Debugf("Absolute file path: %s", absFilePath)

	// 读取文件内容
	content, err := services.ReadFile(absFilePath)
	if err != nil {
		if os.IsNotExist(err) {
			logger.Log.Errorf("File not found: %v", err)
			utils.ErrorResponseFunc(c, http.StatusNotFound, "File not found")
		} else {
			logger.Log.Errorf("Failed to read file: %v", err)
			utils.ErrorResponseFunc(c, http.StatusInternalServerError, "Failed to read file")
		}
		return
	}

	utils.SuccessResponse(c, content)
}
