package services

import (
	"backend/middleware"
	"backend/models"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// 目录树缓存：博客内容更新频率低，对 ReadDir 结果做 TTL 缓存，
// 避免每次请求都递归遍历整个 posts 目录树。
const dirCacheTTL = 30 * time.Second

type dirCacheEntry struct {
	nodes    []models.FileNode
	cachedAt time.Time
}

var (
	dirCache   = map[string]dirCacheEntry{}
	dirCacheMu sync.RWMutex
)

// 文件内容缓存：按 path 缓存内容，以文件 mtime 为失效依据。
// 文件被修改后 mtime 变化，缓存自动失效，无需 TTL。
type fileCacheEntry struct {
	content string
	modTime time.Time
}

var (
	fileCache   = map[string]fileCacheEntry{}
	fileCacheMu sync.RWMutex
)

// ReadDir 读取指定目录，返回 .md 文件和目录树。
// 结果会按 dirCacheTTL 缓存，频繁请求时直接命中缓存。
func ReadDir(dirPath string) ([]models.FileNode, error) {
	dirCacheMu.RLock()
	if entry, ok := dirCache[dirPath]; ok && time.Since(entry.cachedAt) < dirCacheTTL {
		dirCacheMu.RUnlock()
		return entry.nodes, nil
	}
	dirCacheMu.RUnlock()

	nodes, err := readDirNoCache(dirPath)
	if err != nil {
		return nil, err
	}

	dirCacheMu.Lock()
	dirCache[dirPath] = dirCacheEntry{nodes: nodes, cachedAt: time.Now()}
	dirCacheMu.Unlock()

	return nodes, nil
}

// readDirNoCache 实际递归读取目录，不经过缓存。
func readDirNoCache(dirPath string) ([]models.FileNode, error) {
	var fileNodes []models.FileNode

	entries, err := os.ReadDir(dirPath)
	if err != nil {
		logger.Error("Failed to read directory:", dirPath, "Error:", err)
		return nil, err
	}

	for _, entry := range entries {
		// 排除隐藏目录和文件
		if strings.HasPrefix(entry.Name(), ".") {
			continue
		}

		path := filepath.Join(dirPath, entry.Name())
		if entry.IsDir() {
			// 递归读取子目录
			children, err := readDirNoCache(path)
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

// ReadFile 读取指定路径的文件内容并返回。
// 以文件 mtime 为失效依据做缓存，文件未改动时直接命中缓存。
func ReadFile(filePath string) (string, error) {
	info, err := os.Stat(filePath)
	if err != nil {
		logger.Error("Failed to stat file:", filePath, "Error:", err)
		return "", err
	}

	fileCacheMu.RLock()
	if entry, ok := fileCache[filePath]; ok && entry.modTime.Equal(info.ModTime()) {
		fileCacheMu.RUnlock()
		return entry.content, nil
	}
	fileCacheMu.RUnlock()

	// 命中失败则从磁盘读取（os.ReadFile 内部管理句柄，无需手动 Close）
	data, err := os.ReadFile(filePath)
	if err != nil {
		logger.Error("Failed to read file:", filePath, "Error:", err)
		return "", err
	}
	content := string(data)

	fileCacheMu.Lock()
	fileCache[filePath] = fileCacheEntry{content: content, modTime: info.ModTime()}
	fileCacheMu.Unlock()

	logger.Info("File read successfully:", filePath)
	return content, nil
}

// InvalidateCache 清空所有目录树和文件内容缓存。
// 可在内容更新后手动调用，或留给未来的管理接口使用。
func InvalidateCache() {
	dirCacheMu.Lock()
	dirCache = map[string]dirCacheEntry{}
	dirCacheMu.Unlock()

	fileCacheMu.Lock()
	fileCache = map[string]fileCacheEntry{}
	fileCacheMu.Unlock()
}
