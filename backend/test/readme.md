当然可以！将测试用例放在单独的 `test` 目录下可以更好地组织项目结构，使得测试代码与生产代码分离。以下是如何在 `test` 目录下组织测试用例的详细步骤。

### 调整项目结构

我们将测试用例放在 `test` 目录中，并调整项目结构如下：

```
backend/
├── config/
│   └── config.go
├── controllers/
│   └── markdown.go
├── middleware/
│   └── logger.go
├── models/
│   └── file.go
├── routes/
│   └── routes.go
├── services/
│   └── file_service.go
├── utils/
│   └── response.go
├── content/               # 本地Markdown目录（示例）
├── test/                  # 测试文件夹
│   └── markdown_test.go   # 测试用例文件
├── go.mod
├── go.sum
└── main.go
```

### 编写测试用例

在 `test` 目录下创建测试文件 `markdown_test.go`：

```go
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
```

### 运行测试

要运行放置在 `test` 目录中的测试用例，需要指定测试目录。

1. **进入 `backend` 目录**：

   ```bash
   cd backend
   ```

2. **运行测试**：

   ```bash
   go test ./test
   ```

这将执行 `test` 目录下所有以 `_test.go` 结尾的测试文件中的测试用例，并输出测试结果。

### 总结

将测试用例放在 `test` 目录下的好处是：

- **代码整洁**：测试代码与生产代码分离，保持项目结构清晰。
- **易于管理**：测试用例集中管理，便于查找和修改。
- **可扩展性**：未来可以在 `test` 目录下添加更多的测试文件或子目录，来测试不同模块的功能。

通过这种方式组织你的测试用例，你可以保持项目的高可维护性和可读性。