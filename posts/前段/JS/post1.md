技术探秘者	探索技术世界的奥秘，分享技术发现与心得。  InsightfulTech
词汇	发音	对比词汇
Insightful	/ˈɪnˌsaɪtfəl/	Insight（洞察）
Tech	/tɛk/	Technology（技术）

使用 Go 语言的 Gin 框架设计一个简单的博客网站，能够读取当前目录作为网站导航，并实现左侧导航栏显示目录结构，右侧显示子分类，点击文件名显示 Markdown 文章内容。以下是如何实现这个功能的详细步骤，包括代码示例和相关解释。


## 项目结构

假设你的项目结构如下：

```
my-blog/
│
├── main.go
├── static/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── scripts.js
│   └── images/
│       └── logo.png
├── posts/
│   ├── category1/
│   │   ├── post1.md
│   │   └── post2.md
│   └── category2/
│       ├── post3.md
│       └── post4.md
└── templates/
    ├── index.tmpl
    └── post.tmpl
```

### 1. 安装必要的库

你需要安装 Gin 框架、`blackfriday` 库（用于将 Markdown 转换为 HTML），和 `go-bindata`（用于静态文件嵌入）。

```bash
go get -u github.com/gin-gonic/gin
go get -u github.com/russross/blackfriday/v2
```

### 2. 创建 `main.go` 文件

`main.go` 文件是你的应用的入口点，负责设置路由和处理请求。

```go
package main

import (
    "fmt"
    "net/http"
    "os"
    "path/filepath"
    "github.com/gin-gonic/gin"
    "github.com/russross/blackfriday/v2"
)

// BlogPost 结构体表示博客文章
type BlogPost struct {
    Title   string
    Content string
    Path    string
}

// 获取目录结构
func getDirectoryStructure(baseDir string) (map[string][]string, error) {
    structure := make(map[string][]string)

    err := filepath.Walk(baseDir, func(path string, info os.DirEntry, err error) error {
        if err != nil {
            return err
        }

        if info.IsDir() {
            if path != baseDir {
                relativePath := strings.TrimPrefix(path, baseDir)
                if relativePath != "" && !strings.Contains(relativePath, "/") {
                    structure[relativePath] = nil
                }
            }
        } else {
            ext := filepath.Ext(info.Name())
            if ext == ".md" {
                parentDir := filepath.Dir(strings.TrimPrefix(path, baseDir))
                structure[parentDir] = append(structure[parentDir], info.Name())
            }
        }
        return nil
    })

    if err != nil {
        return nil, err
    }
    return structure, nil
}

// 渲染 Markdown 文件
func renderMarkdown(filePath string) (string, error) {
    markdownContent, err := os.ReadFile(filePath)
    if err != nil {
        return "", err
    }
    htmlContent := blackfriday.Run(markdownContent)
    return string(htmlContent), nil
}

func main() {
    r := gin.Default()

    // 加载模板文件
    r.LoadHTMLGlob("templates/*.tmpl")

    // 静态文件
    r.Static("/static", "./static")

    // 首页
    r.GET("/", func(c *gin.Context) {
        baseDir := "./posts"
        structure, err := getDirectoryStructure(baseDir)
        if err != nil {
            c.String(http.StatusInternalServerError, "Error getting directory structure: %v", err)
            return
        }

        c.HTML(http.StatusOK, "index.tmpl", gin.H{
            "categories": structure,
        })
    })

    // 博客文章页面
    r.GET("/post/:category/:post", func(c *gin.Context) {
        category := c.Param("category")
        post := c.Param("post")
        filePath := filepath.Join("posts", category, post)

        content, err := renderMarkdown(filePath)
        if err != nil {
            c.String(http.StatusInternalServerError, "Error rendering markdown: %v", err)
            return
        }

        c.HTML(http.StatusOK, "post.tmpl", gin.H{
            "title":   post,
            "content": content,
            "category": category,
        })
    })

    r.Run(":8080")
}
```

### 3. 创建 `templates/index.tmpl` 文件

`index.tmpl` 是首页的模板文件，显示目录结构和分类。

```html
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <title>博客首页</title>
    <link rel="stylesheet" href="/static/css/styles.css">
</head>
<body>
    <header>
        <h1>我的博客</h1>
    </header>
    <div id="container">
        <nav id="sidebar">
            <ul>
                {{range $category, $posts := .categories}}
                    <li>
                        <h2>{{if eq $category ""}}首页{{else}}{{.}}{{end}}</h2>
                        <ul>
                            {{range $post := $posts}}
                                <li><a href="/post/{{$category}}/{{$post}}">{{$post}}</a></li>
                            {{end}}
                        </ul>
                    </li>
                {{end}}
            </ul>
        </nav>
        <main id="content">
            <h2>欢迎来到我的博客</h2>
            <p>选择左侧的分类查看文章。</p>
        </main>
    </div>
</body>
</html>
```

### 4. 创建 `templates/post.tmpl` 文件

`post.tmpl` 是显示 Markdown 文章内容的模板文件。

```html
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <title>{{.title}}</title>
    <link rel="stylesheet" href="/static/css/styles.css">
</head>
<body>
    <header>
        <h1>我的博客</h1>
    </header>
    <div id="container">
        <nav id="sidebar">
            <h2>{{.category}}</h2>
            <ul>
                {{range $category, $posts := .categories}}
                    {{if eq $category .category}}
                        {{range $post := $posts}}
                            <li><a href="/post/{{$category}}/{{$post}}">{{$post}}</a></li>
                        {{end}}
                    {{end}}
                {{end}}
            </ul>
        </nav>
        <main id="content">
            <h1>{{.title}}</h1>
            {{.content | safeHTML}}
        </main>
    </div>
</body>
</html>
```

### 5. 创建 `static/css/styles.css` 文件

这是基本的 CSS 样式文件，用于样式化页面。

```css
body {
    font-family: Arial, sans-serif;
    background-color: #f0f0f0;
    margin: 0;
    padding: 0;
}

header {
    background-color: #333;
    color: #fff;
    padding: 10px 0;
    text-align: center;
}

#container {
    display: flex;
}

#sidebar {
    width: 200px;
    background-color: #fff;
    padding: 10px;
    box-shadow: 2px 0 5px rgba(0,0,0,0.1);
}

#content {
    flex: 1;
    padding: 20px;
    background-color: #fff;
    margin-left: 10px;
    box-shadow: 0 0 5px rgba(0,0,0,0.1);
}

h1, h2 {
    color: #333;
}

a {
    text-decoration: none;
    color: #007BFF;
}

a:hover {
    text-decoration: underline;
}
```

### 6. 添加 JavaScript 文件（可选）

如果你需要添加 JavaScript 文件，可以在 `static/js/scripts.js` 中添加相应的功能。

```javascript
// static/js/scripts.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded');
    // 这里可以添加你需要的 JavaScript 功能
});
```

### 7. 运行应用程序

确保所有文件都已经准备好，运行以下命令启动 Gin 应用程序：

```bash
go run main.go
```

然后访问 `http://localhost:8080` 以查看你的博客网站。

## 扩展功能

这个基本的博客网站可以根据你的需求进行扩展，例如：

- **添加用户认证和权限管理**：通过添加用户注册、登录和权限控制功能来保护敏感内容。
- **添加评论功能**：可以通过集成评论系统（如 Disqus）或自定义评论功能来允许用户对文章进行评论。
- **添加搜索功能**：可以集成全文搜索引擎（如 Elasticsearch 或简单的文本搜索）来提供文章搜索功能。
- **支持更多的 Markdown 语法扩展**：使用 `blackfriday` 或 `goldmark` 提供的扩展功能来支持更多的 Markdown 语法特性。

通过上述步骤，你可以创建一个功能完善的博客网站。根据你的需求和想法，你可以进一步开发和优化这个基本的博客网站框架。