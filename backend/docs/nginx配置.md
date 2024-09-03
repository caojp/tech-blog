
nginx代理前段访问后端
```shell
location /v1/ {
    proxy_pass http://localhost:8080/;  # 移除末尾的 /
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```