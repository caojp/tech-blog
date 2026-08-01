package test

import (
	"backend/config"
	"backend/routes"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// init 初始化测试所需的全局配置（加载真实 config.yaml 以复用日志等配置）。
// 注意：原实现调用 config.InitConfig() 缺少路径参数，无法编译。
func init() {
	config.InitConfig("../config.yaml")
}

// setupContentDir 在临时目录下构造一份与测试断言一致的 markdown 内容，
// 并将其设置为当前的 ContentDir，保证测试自包含、不依赖项目实际的 posts 目录。
func setupContentDir(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()

	subDir := filepath.Join(dir, "category1", "subcategory1")
	if err := os.MkdirAll(subDir, 0o755); err != nil {
		t.Fatalf("create temp content dir: %v", err)
	}

	content := "This is the content of **file1.md**"
	if err := os.WriteFile(filepath.Join(subDir, "file1.md"), []byte(content), 0o644); err != nil {
		t.Fatalf("write temp markdown: %v", err)
	}

	config.AppConfig.ContentDir = dir
	return dir
}

func TestGetContentDir(t *testing.T) {
	setupContentDir(t)
	router := routes.SetupRouter()

	// 创建测试请求
	req, _ := http.NewRequest(http.MethodGet, "/api/content", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	// 检查状态码是否为200
	if resp.Code != http.StatusOK {
		t.Fatalf("Expected status code 200, got %d, body: %s", resp.Code, resp.Body.String())
	}

	// 检查响应体中是否包含预期的目录名
	expected := `"name":"category1"`
	if !strings.Contains(resp.Body.String(), expected) {
		t.Errorf("Expected response to contain %s, got %s", expected, resp.Body.String())
	}
}

func TestGetMarkdownContent(t *testing.T) {
	dir := setupContentDir(t)
	router := routes.SetupRouter()

	// 路由为 POST /api/markdown，文件路径放在 JSON body 中。
	// 原实现用 GET 请求一个不存在的路径，与实际路由不符。
	filePath := filepath.Join(dir, "category1", "subcategory1", "file1.md")
	body, _ := json.Marshal(map[string]string{"filePath": filePath})

	req, _ := http.NewRequest(http.MethodPost, "/api/markdown", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	// 检查状态码是否为200
	if resp.Code != http.StatusOK {
		t.Fatalf("Expected status code 200, got %d, body: %s", resp.Code, resp.Body.String())
	}

	// 检查响应体中是否包含文件内容
	expectedContent := "This is the content of **file1.md**"
	if !strings.Contains(resp.Body.String(), expectedContent) {
		t.Errorf("Expected response to contain %s, got %s", expectedContent, resp.Body.String())
	}
}

// TestGetMarkdownContent_RejectPathTraversal 验证路径穿越防护：
// 尝试读取 ContentDir 之外的文件应被拒绝。
func TestGetMarkdownContent_RejectPathTraversal(t *testing.T) {
	dir := setupContentDir(t)
	router := routes.SetupRouter()

	// 构造一个位于 ContentDir 之外的敏感文件
	secretPath := filepath.Join(filepath.Dir(dir), "secret.txt")
	if err := os.WriteFile(secretPath, []byte("TOP SECRET"), 0o644); err != nil {
		t.Fatalf("write secret: %v", err)
	}
	t.Cleanup(func() { _ = os.Remove(secretPath) })

	body, _ := json.Marshal(map[string]string{"filePath": secretPath})
	req, _ := http.NewRequest(http.MethodPost, "/api/markdown", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	if resp.Code == http.StatusOK {
		t.Errorf("Expected non-200 for path traversal attempt, got %d, body: %s", resp.Code, resp.Body.String())
	}
	if strings.Contains(resp.Body.String(), "TOP SECRET") {
		t.Errorf("Path traversal protection failed: secret leaked, body: %s", resp.Body.String())
	}
}
