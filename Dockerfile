# ===== 阶段1: 构建前端 =====
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ===== 阶段2: 构建后端 =====
FROM golang:1.22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 go build -o tech-blog .

# ===== 阶段3: 运行 =====
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app

# 拷贝构建产物
COPY --from=backend-builder /app/backend/tech-blog ./backend/tech-blog
COPY --from=backend-builder /app/backend/config.yaml ./backend/config.yaml
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# 创建内容目录（挂载点）
RUN mkdir -p /app/posts

EXPOSE 8080
WORKDIR /app/backend
CMD ["./tech-blog", "-config", "config.yaml"]
