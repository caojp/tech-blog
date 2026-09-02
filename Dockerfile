# ===== 阶段1: 构建前端 =====
FROM node:18-alpine AS builder

WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend/ ./frontend/
# 生产环境的 POSTS_DIR 指向容器内的 posts/
RUN cd frontend && POSTS_DIR=../posts npm run build

# ===== 阶段2: Nginx 运行 =====
FROM nginx:alpine

# 拷贝前端构建产物
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Nginx 配置（SPA history fallback + 静态缓存）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 创建内容目录（构建时 posts/ 已打进 bundle，但运行时也可挂载覆盖）
RUN mkdir -p /usr/share/nginx/html/posts

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
