#!/usr/bin/env bash
# Vercel 构建时调用：如果 prisma/data/girls.db 不存在，就从
# GitHub Release 下载最新快照。Release 由 .github/workflows/node.js.yml
# 每次爬虫跑完后上传。
set -e
cd "$(dirname "$0")/.."

DB_PATH="prisma/data/girls.db"
DB_URL="https://github.com/aigehub/nextjs-gallery/releases/download/db-snapshot/girls.db"

if [ -f "$DB_PATH" ]; then
  echo "[fetch-db] $DB_PATH 已存在，跳过下载"
  exit 0
fi

mkdir -p "$(dirname "$DB_PATH")"
echo "[fetch-db] 下载 $DB_URL → $DB_PATH"
curl -fSL --retry 3 --connect-timeout 10 --max-time 300 -o "$DB_PATH.tmp" "$DB_URL"
mv "$DB_PATH.tmp" "$DB_PATH"
echo "[fetch-db] 完成，大小: $(du -h "$DB_PATH" | cut -f1)"
