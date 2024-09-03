# 设置目标操作系统和架构
$env:GOOS = "linux"
$env:GOARCH = "amd64"

# 设置输出文件名
$outputFile = "tech-blog"

# 执行构建
go build -o $outputFile .

# 检查构建是否成功
if ($LASTEXITCODE -eq 0) {
    Write-Host "build success: $outputFile"
} else {
    Write-Host "build failed"
}