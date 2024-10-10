package services

import (
	"backend/middleware"
	"backend/models"
	"io"
	"os"
	"path/filepath"
	"strings"
)

//func ReadDir(dirPath string) ([]models.FileNode, error) {
//	var fileNodes []models.FileNode
//	entries, err := os.ReadDir(dirPath)
//	if err != nil {
//		logger.Error("Failed to read directory:", dirPath, "Error:", err)
//		return nil, err
//	}
//
//	for _, entry := range entries {
//		path := filepath.Join(dirPath, entry.Name())
//		fileNode := models.FileNode{
//			Name:  entry.Name(),
//			Path:  path,
//			IsDir: entry.IsDir(),
//		}
//		if entry.IsDir() {
//			children, err := ReadDir(path)
//			if err != nil {
//				logger.Error("Failed to read subdirectory:", path, "Error:", err)
//				return nil, err
//			}
//			fileNode.Children = children
//		}
//		fileNodes = append(fileNodes, fileNode)
//	}
//
//	logger.Info("Directory read successfully:", dirPath)
//
//	return fileNodes, nil
//}

// ReadDir 读取指定目录，返回 .md 文件和目录树
func ReadDir(dirPath string) ([]models.FileNode, error) {
	var fileNodes []models.FileNode

	entries, err := os.ReadDir(dirPath)
	if err != nil {
		logger.Error("Failed to read directory:", dirPath, "Error:", err)
		return nil, err
	}

	for _, entry := range entries {
		// 排除隐藏目录和文件
		if strings.HasPrefix(entry.Name(), ".") {
			continue // 跳过以 "." 开头的文件或目录
		}

		// 只处理 .md 文件或目录
		path := filepath.Join(dirPath, entry.Name())
		if entry.IsDir() {
			// 递归读取子目录
			children, err := ReadDir(path)
			if err != nil {
				logger.Error("Failed to read subdirectory:", path, "Error:", err)
				return nil, err
			}
			fileNode := models.FileNode{
				Name:     entry.Name(),
				Path:     path,
				IsDir:    true,
				Children: children,
			}
			fileNodes = append(fileNodes, fileNode)
		} else if strings.HasSuffix(entry.Name(), ".md") {
			// 只添加 .md 文件
			fileNode := models.FileNode{
				Name:  entry.Name(),
				Path:  path,
				IsDir: false,
			}
			fileNodes = append(fileNodes, fileNode)
		}
	}

	logger.Info("Directory read successfully:", dirPath)
	return fileNodes, nil
}

// ReadFile 读取指定路径的文件内容并返回
func ReadFile(filePath string) (string, error) {
	// 尝试打开文件
	file, err := os.Open(filePath)
	if err != nil {
		logger.Error("Failed to open file:", filePath, "Error:", err)
		return "", err
	}
	defer func(file *os.File) {
		err := file.Close()
		if err != nil {
			logger.Error("Failed to close file:", filePath, "Error:", err)
		}
	}(file) // 确保文件在读取后被关闭

	// 使用 io.ReadAll 读取文件内容
	content, err := io.ReadAll(file)
	if err != nil {
		logger.Error("Failed to read file:", filePath, "Error:", err)
		return "", err
	}

	logger.Info("File read successfully:", filePath)

	return string(content), nil
}
