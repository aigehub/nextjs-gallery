#!/bin/bash

# Puppeteer安装脚本
# 使用方法: bash tests/install-puppeteer.sh

echo "🚀 开始安装Puppeteer..."
echo ""

# 检测包管理器
if command -v pnpm &> /dev/null; then
    echo "📦 使用 pnpm 安装..."
    pnpm add puppeteer @types/puppeteer
elif command -v yarn &> /dev/null; then
    echo "📦 使用 yarn 安装..."
    yarn add puppeteer @types/puppeteer
else
    echo "📦 使用 npm 安装..."
    npm install puppeteer @types/puppeteer
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Puppeteer安装成功！"
    echo ""
    echo "📝 下一步:"
    echo "   1. 更新Cookie: npx tsx tests/update-cookies-puppeteer.ts"
    echo "   2. 运行爬虫: npx tsx tests/xchina-puppeteer.ts"
    echo ""
    echo "📚 查看文档: tests/xchina/README-PUPPETEER.md"
else
    echo ""
    echo "❌ 安装失败"
    echo "💡 请手动运行: npm install puppeteer @types/puppeteer"
    exit 1
fi
