package main

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/russross/blackfriday/v2"
	"html/template"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
)

// 获取目录结构
func getDirectoryStructure(baseDir string) (map[string][]string, error) {
	structure := make(map[string][]string)

	err := filepath.WalkDir(baseDir, func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if entry.IsDir() {
			return nil // 如果是目录，直接返回
		}

		ext := filepath.Ext(entry.Name())
		if ext == ".md" {
			// 计算相对于baseDir的路径，去掉前导的文件分隔符
			relativePath, err := filepath.Rel(baseDir, path)
			if err != nil {
				return err
			}
			// 获取父目录名称作为键
			parentDir := filepath.Dir(relativePath)
			// 如果父目录是当前目录，parentDir 将是"."，需要处理这种情况
			if parentDir == "." {
				parentDir = ""
			}
			// 添加文件到结构中
			structure[parentDir] = append(structure[parentDir], entry.Name())
		}

		return nil
	})

	if err != nil {
		return nil, err
	}
	return structure, nil
}

// 渲染 Markdown 文件
func renderMarkdown(filePath string) (template.HTML, error) {
	fmt.Printf("Attempting to open file: %s\n", filePath) // 调试输出文件路径

	markdownContent, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}

	htmlContent := blackfriday.Run(markdownContent)
	return template.HTML(htmlContent), nil
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
		fmt.Printf("structure: %+v\n", structure)
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
		fmt.Printf("category: %s \r\n post: %s\n", category, post)
		filePath := filepath.Join("posts", category, post)

		fmt.Printf("File path: %s\n", filePath) // 调试输出文件路径

		content, err := renderMarkdown(filePath)
		if err != nil {
			c.String(http.StatusInternalServerError, "Error rendering markdown: %v", err)
			return
		}

		baseDir := "./posts"
		structure, err := getDirectoryStructure(baseDir)
		if err != nil {
			c.String(http.StatusInternalServerError, "Error getting directory structure: %v", err)
			return
		}

		c.HTML(http.StatusOK, "post.tmpl", gin.H{
			"title":      post,
			"content":    content, // 使用解析后的 HTML 内容
			"category":   category,
			"categories": structure,
		})
	})

	err := r.Run(":8080")
	if err != nil {
		return
	}
}
