# ===== 阶段1: 构建前端 =====
FROM node:18-alpine AS builder

WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend/ ./frontend/
# 生产模式不需要 POSTS_DIR，内容运行时通过 nginx HTTP 拉取
RUN cd frontend && npm run build

# ===== 阶段2: Nginx 运行 =====
FROM nginx:alpine

# 拷贝前端构建产物
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Nginx 配置（SPA fallback + /posts/ 服务 Markdown 目录）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 创建 Markdown 内容目录（映射到 nginx.conf 中 alias 路径）
# docker run 时用 -v /your/posts:/opt/aldus-blog/awesome-me 挂载实际内容
RUN mkdir -p /opt/aldus-blog/awesome-me

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
