#!/bin/bash

# Docker Hub 有时会 503，这个脚本会自动重试
MAX_RETRIES=10
RETRY_DELAY=5

echo "尝试构建 Docker 镜像，最多重试 $MAX_RETRIES 次..."

for i in $(seq 1 $MAX_RETRIES); do
    echo ""
    echo "=== 第 $i/$MAX_RETRIES 次尝试 ==="

    sudo docker build -t ghcr.io/linjonh/nextjs-gallery:latest .

    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ 构建成功！"
        echo ""
        echo "停止并删除旧容器..."
        sudo docker stop gallery 2>/dev/null
        sudo docker rm gallery 2>/dev/null

        echo "启动新容器..."
        sudo docker run -d -p 3020:3000 --name gallery ghcr.io/linjonh/nextjs-gallery:latest

        echo ""
        echo "✓ 部署完成！容器运行在端口 3020"
        exit 0
    fi

    if [ $i -lt $MAX_RETRIES ]; then
        echo ""
        echo "✗ 构建失败，${RETRY_DELAY}秒后重试..."
        sleep $RETRY_DELAY
    fi
done

echo ""
echo "✗ 经过 $MAX_RETRIES 次尝试后仍然失败"
echo ""
echo "建议方案："
echo "1. 检查网络连接"
echo "2. 配置 Docker 镜像加速器"
echo "3. 手动拉取镜像: sudo docker pull node:22-alpine"
exit 1
