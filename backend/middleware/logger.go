package logger

import (
	"backend/config"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"gopkg.in/natefinch/lumberjack.v2"
	"io"
	"os"
	"time"
)

var Log *logrus.Logger // 全局的日志记录器

// CustomTextFormatter 自定义日志格式化器
type CustomTextFormatter struct {
	logrus.TextFormatter
}

func (f *CustomTextFormatter) Format(entry *logrus.Entry) ([]byte, error) {
	// 自定义日志输出格式
	timestamp := entry.Time.Format("2006-01-02T15:04:05-0700")
	level := entry.Level.String()
	msg := entry.Message

	logMsg := timestamp + " " + level + " " + msg + "\n"
	return []byte(logMsg), nil
}

// InitLogger 初始化并返回一个配置好的 *logrus.Logger 实例
func InitLogger() *logrus.Logger {
	if Log == nil { // 如果日志记录器还未初始化
		Log = logrus.New()

		// 配置日志滚动
		logConfig := config.AppConfig.Log
		fileLogger := &lumberjack.Logger{
			Filename:   "logfile.log",        // 日志文件名
			MaxAge:     logConfig.RotateDays, // 日志文件最大保存天数
			MaxSize:    10,                   // 日志文件最大大小（MB）
			MaxBackups: 5,                    // 保留的旧日志文件数
		}

		// 配置多路输出，控制台和文件
		Log.SetOutput(io.MultiWriter(os.Stdout, fileLogger))

		// 配置控制台日志格式为带颜色的TextFormatter
		consoleFormatter := &CustomTextFormatter{
			TextFormatter: logrus.TextFormatter{
				ForceColors:   true, // 强制使用颜色
				FullTimestamp: true, // 完整时间戳
			},
		}

		// 配置文件日志格式为JSON格式
		fileFormatter := &logrus.JSONFormatter{}

		// 添加 Hook，根据输出目标设置不同的日志格式
		Log.AddHook(&LogFormatHook{
			Writer:    os.Stdout,
			Formatter: consoleFormatter,
		})
		Log.AddHook(&LogFormatHook{
			Writer:    fileLogger,
			Formatter: fileFormatter,
		})

		// 配置日志级别
		level, err := logrus.ParseLevel(logConfig.Level)
		if err != nil {
			level = logrus.InfoLevel // 默认日志级别
		}
		Log.SetLevel(level)
	}

	return Log
}

// LogFormatHook 是一个自定义的 Hook，用于根据输出目标设置不同的日志格式
type LogFormatHook struct {
	Writer    io.Writer
	Formatter logrus.Formatter
}

func (hook *LogFormatHook) Levels() []logrus.Level {
	return logrus.AllLevels
}

func (hook *LogFormatHook) Fire(entry *logrus.Entry) error {
	logMsg, err := hook.Formatter.Format(entry)
	if err != nil {
		return err
	}

	_, err = hook.Writer.Write(logMsg)
	return err
}

// Logger 中间件用于日志记录
func Logger(logger *logrus.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 记录请求开始时间
		logger.WithFields(logrus.Fields{
			"method": c.Request.Method,
			"path":   c.Request.URL.Path,
		}).Info("Request received")
		// 开始时间
		startTime := time.Now()

		// 处理请求
		c.Next()

		// 结束时间
		endTime := time.Now()

		// 执行时间
		latencyTime := endTime.Sub(startTime)

		// 请求方式
		reqMethod := c.Request.Method

		// 请求路由
		reqURI := c.Request.RequestURI

		// 状态码
		statusCode := c.Writer.Status()

		// 请求 IP
		clientIP := c.ClientIP()

		// 记录响应状态码和持续时间
		logger.WithFields(logrus.Fields{
			"status": c.Writer.Status(),
		}).Info("Request completed")
		// 日志格式
		logger.WithFields(logrus.Fields{
			"status_code":  statusCode,
			"latency_time": latencyTime,
			"client_ip":    clientIP,
			"req_method":   reqMethod,
			"req_uri":      reqURI,
		}).Info()
	}
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
