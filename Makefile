# AldusBlog Makefile
# 统一管理常用开发、构建、检查命令

.PHONY: dev build lint docker help

# === 前端（唯一需要运行的） ===
dev:
	@cd frontend && npm run dev

build:
	@cd frontend && npm run build

lint:
	@cd frontend && npm run lint

# === Docker ===
docker:
	docker compose up -d

docker-build:
	docker compose build

# === 清理 ===
clean:
	rm -rf frontend/dist
	rm -rf node_modules

help:
	@echo "可用命令:"
	@echo "  make dev         启动前端开发服务器"
	@echo "  make build       生产构建"
	@echo "  make lint        ESLint 代码检查"
	@echo "  make docker      Docker 启动 (Nginx)"
	@echo "  make clean       清理构建产物"
