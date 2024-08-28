package utils

import "github.com/gin-gonic/gin"

// ErrorResponse 定义用于错误响应的结构体
type ErrorResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// SuccessResponse 发送成功响应
func SuccessResponse(c *gin.Context, data interface{}) {
	c.JSON(200, gin.H{
		"status": "success",
		"data":   data,
	})
}

// ErrorResponse 发送错误响应
func ErrorResponseFunc(c *gin.Context, code int, message string) {
	c.JSON(code, ErrorResponse{
		Status:  "error",
		Message: message,
	})
}
