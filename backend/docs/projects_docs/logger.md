是的，您可以简化日志记录的代码，使其更类似于其他语言的日志库。`Logrus` 实际上支持这样的方式，您只需创建一些更方便的日志记录函数来包装这些复杂的语法。

### 方法一：使用全局函数

您可以直接在 `logger` 包中创建一些全局的简化函数，来封装常见的日志记录操作。

#### 修改 `logger.go` 提供简化的日志函数

我们可以在 `logger.go` 中为常用的日志级别添加简化的日志函数。

```go
package logger

import (
	"backend/config"
	"github.com/sirupsen/logrus"
	"gopkg.in/natefinch/lumberjack.v2"
	"io"
	"os"
)

var Log *logrus.Logger // 全局的日志记录器

// InitLogger 初始化并返回一个配置好的 *logrus.Logger 实例
func InitLogger() *logrus.Logger {
	if Log == nil { // 如果日志记录器还未初始化
		Log = logrus.New()

		// 配置日志滚动
		logConfig := config.AppConfig.Log
		Log.SetOutput(io.MultiWriter(os.Stdout, &lumberjack.Logger{
			Filename:   "logfile.log",        // 日志文件名
			MaxAge:     logConfig.RotateDays, // 日志文件最大保存天数
			MaxSize:    10,                   // 日志文件最大大小（MB）
			MaxBackups: 5,                    // 保留的旧日志文件数
		}))

		// 配置日志格式
		if logConfig.Format == "json" {
			Log.SetFormatter(&logrus.JSONFormatter{})
		} else {
			Log.SetFormatter(&logrus.TextFormatter{})
		}

		// 配置日志级别
		level, err := logrus.ParseLevel(logConfig.Level)
		if err != nil {
			level = logrus.InfoLevel // 默认日志级别
		}
		Log.SetLevel(level)
	}

	return Log
}

// 简化的日志函数
func Info(args ...interface{}) {
	Log.Info(args...)
}

func Warn(args ...interface{}) {
	Log.Warn(args...)
}

func Error(args ...interface{}) {
	Log.Error(args...)
}

func Debug(args ...interface{}) {
	Log.Debug(args...)
}

func Fatal(args ...interface{}) {
	Log.Fatal(args...)
}

func Infof(format string, args ...interface{}) {
	Log.Infof(format, args...)
}

func Warnf(format string, args ...interface{}) {
	Log.Warnf(format, args...)
}

func Errorf(format string, args ...interface{}) {
	Log.Errorf(format, args...)
}

func Debugf(format string, args ...interface{}) {
	Log.Debugf(format, args...)
}

func Fatalf(format string, args ...interface{}) {
	Log.Fatalf(format, args...)
}
```

这些函数封装了日志记录器的常见操作，使日志记录变得更简单。

#### 使用这些简化的日志函数

在其他文件中（如 `file_service.go`），可以直接使用这些简化函数：

```go
package services

import (
	"backend/models"
	"backend/logger" // 确保导入 logger 包
	"io"
	"os"
	"path/filepath"
)

func ReadDir(dirPath string) ([]models.FileNode, error) {
	var fileNodes []models.FileNode
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		logger.Error("Failed to read directory:", dirPath, "Error:", err)
		return nil, err
	}

	for _, entry := range entries {
		path := filepath.Join(dirPath, entry.Name())
		fileNode := models.FileNode{
			Name:  entry.Name(),
			Path:  path,
			IsDir: entry.IsDir(),
		}
		if entry.IsDir() {
			children, err := ReadDir(path)
			if err != nil {
				logger.Error("Failed to read subdirectory:", path, "Error:", err)
				return nil, err
			}
			fileNode.Children = children
		}
		fileNodes = append(fileNodes, fileNode)
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
	defer file.Close() // 确保文件在读取后被关闭

	// 使用 io.ReadAll 读取文件内容
	content, err := io.ReadAll(file)
	if err != nil {
		logger.Error("Failed to read file:", filePath, "Error:", err)
		return "", err
	}

	logger.Info("File read successfully:", filePath)

	return string(content), nil
}
```

### 方法二：使用全局结构

如果您希望通过更结构化的方式进行日志管理，您可以将日志记录器包装在一个结构体中，然后提供简化的方法来记录日志。

#### 定义一个 `Logger` 结构体

修改 `logger.go` 以引入一个新的 `Logger` 结构体：

```go
package logger

import (
	"backend/config"
	"github.com/sirupsen/logrus"
	"gopkg.in/natefinch/lumberjack.v2"
	"io"
	"os"
)

var Log *Logger

type Logger struct {
	*logrus.Logger
}

// InitLogger 初始化并返回一个配置好的 *Logger 实例
func InitLogger() *Logger {
	if Log == nil { // 如果日志记录器还未初始化
		baseLogger := logrus.New()

		// 配置日志滚动
		logConfig := config.AppConfig.Log
		baseLogger.SetOutput(io.MultiWriter(os.Stdout, &lumberjack.Logger{
			Filename:   "logfile.log",        // 日志文件名
			MaxAge:     logConfig.RotateDays, // 日志文件最大保存天数
			MaxSize:    10,                   // 日志文件最大大小（MB）
			MaxBackups: 5,                    // 保留的旧日志文件数
		}))

		// 配置日志格式
		if logConfig.Format == "json" {
			baseLogger.SetFormatter(&logrus.JSONFormatter{})
		} else {
			baseLogger.SetFormatter(&logrus.TextFormatter{})
		}

		// 配置日志级别
		level, err := logrus.ParseLevel(logConfig.Level)
		if err != nil {
			level = logrus.InfoLevel // 默认日志级别
		}
		baseLogger.SetLevel(level)

		Log = &Logger{baseLogger}
	}

	return Log
}

// 简化的日志函数
func (l *Logger) Info(args ...interface{}) {
	l.Logger.Info(args...)
}

func (l *Logger) Warn(args ...interface{}) {
	l.Logger.Warn(args...)
}

func (l *Logger) Error(args ...interface{}) {
	l.Logger.Error(args...)
}

func (l *Logger) Debug(args ...interface{}) {
	l.Logger.Debug(args...)
}

func (l *Logger) Fatal(args ...interface{}) {
	l.Logger.Fatal(args...)
}

func (l *Logger) Infof(format string, args ...interface{}) {
	l.Logger.Infof(format, args...)
}

func (l *Logger) Warnf(format string, args ...interface{}) {
	l.Logger.Warnf(format, args...)
}

func (l *Logger) Errorf(format string, args ...interface{}) {
	l.Logger.Errorf(format, args...)
}

func (l *Logger) Debugf(format string, args ...interface{}) {
	l.Logger.Debugf(format, args...)
}

func (l *Logger) Fatalf(format string, args ...interface{}) {
	l.Logger.Fatalf(format, args...)
}
```

#### 使用新的 `Logger` 结构体

在 `file_service.go` 中使用新的 `Logger` 结构体：

```go
package services

import (
	"backend/models"
	"backend/logger" // 确保导入 logger 包
	"io"
	"os"
	"path/filepath"
)

func ReadDir(dirPath string) ([]models.FileNode, error) {
	var fileNodes []models.FileNode
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		logger.Log.Error("Failed to read directory:", dirPath, "Error:", err)
		return nil, err
	}

	for _, entry := range entries {
		path := filepath.Join(dirPath, entry.Name())
		fileNode := models.FileNode{
			Name:  entry.Name(),
			Path:  path,
			IsDir: entry.IsDir(),
		}
		if entry.IsDir() {
			children, err := ReadDir(path)
			if err != nil {
				logger.Log.Error("Failed to read subdirectory:", path, "Error:", err)
				return nil, err
			}
			fileNode.Children = children
		}
		fileNodes = append(fileNodes, fileNode)
	}

	logger.Log.Info("Directory read successfully:", dirPath)

	return fileNodes, nil
}

// ReadFile 读取指定路径的文件内容并返回
func ReadFile(filePath string) (string, error) {
	// 尝试打开文件
	file, err := os.Open(filePath)
	if err != nil {
		logger.Log.Error("Failed to open file:", filePath, "Error:", err)
		return "", err
	}
	defer file.Close() // 确保文件在读取后被关闭

	// 使用 io.ReadAll 读取文件内容
	content, err := io