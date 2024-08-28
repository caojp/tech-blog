package test

import (
	"backend/config"
	"backend/routes"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func init() {
	// 初始化配置
	config.InitConfig()
}

func TestGetContentDir(t *testing.T) {
	router := routes.SetupRouter()

	// 创建测试请求
	req, _ := http.NewRequest("GET", "/api/content", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	// 检查状态码是否为200
	if resp.Code != http.StatusOK {
		t.Errorf("Expected status code 200, got %d", resp.Code)
	}

	// 检查响应体中是否包含预期的内容
	expected := `"name":"category1"`
	if !strings.Contains(resp.Body.String(), expected) {
		t.Errorf("Expected response to contain %s, got %s", expected, resp.Body.String())
	}
}

func TestGetMarkdownContent(t *testing.T) {
	router := routes.SetupRouter()

	// 测试获取文件内容
	req, _ := http.NewRequest("GET", "/api/markdown/category1/subcategory1/file1.md", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	// 检查状态码是否为200
	if resp.Code != http.StatusOK {
		t.Errorf("Expected status code 200, got %d", resp.Code)
	}

	// 检查响应体中是否包含文件内容
	expectedContent := "This is the content of **file1.md**"
	if !strings.Contains(resp.Body.String(), expectedContent) {
		t.Errorf("Expected response to contain %s, got %s", expectedContent, resp.Body.String())
	}
}
