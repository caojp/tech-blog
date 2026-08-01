# TechBlog Makefile
# 统一管理常用开发、构建、检查命令

.PHONY: dev backend frontend build build-linux lint test clean docker help

# 并行启动前后端开发服务器
dev:
	@echo "启动后端..."
	@cd backend && go run main.go &
	@echo "启动前端..."
	@cd frontend && npm run dev

# === 后端 ===
backend:
	cd backend && go run main.go

backend-build:
	cd backend && go build -o tech-blog .

# 交叉编译 Linux/amd64
build-linux:
	cd backend && GOOS=linux GOARCH=amd64 go build -o tech-blog .

# === 前端 ===
frontend:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

# === 构建 ===
build: backend-build frontend-build

# === 检查 ===
lint:
	@echo "Go vet..."
	cd backend && go vet ./...
	@echo "ESLint..."
	cd frontend && npm run lint

test:
	cd backend && go test ./...

# === Docker ===
docker:
	docker compose up -d

docker-build:
	docker compose build

# === 清理 ===
clean:
	rm -f backend/tech-blog backend/tech-blog.exe
	rm -rf frontend/dist
	rm -f backend/*.log

help:
	@echo "可用命令:"
	@echo "  make dev            并行启动前后端开发服务器"
	@echo "  make backend        启动后端"
	@echo "  make frontend       启动前端"
	@echo "  make build          构建前后端"
	@echo "  make build-linux    交叉编译 Linux 二进制"
	@echo "  make lint           代码检查 (go vet + eslint)"
	@echo "  make test           运行后端测试"
	@echo "  make docker         Docker 启动"
	@echo "  make clean          清理构建产物"
