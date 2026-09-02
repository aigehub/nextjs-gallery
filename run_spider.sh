#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

print_help() {
  cat <<'EOF'
run_spider.sh · 至尊图库 / 爬虫 / 下载 入口

子命令 (必选其一)
  spide                              只跑爬虫 (npx tsx tests/common_spide.ts true)，更新 json + girls.db
  today    [--spide]                 只下 updatedAt 落在本地今日零点之后的条目(默认动作)
  full     [--spide]                 下载整个清单
  since    <YYYY-MM-DD> [--spide]    只下 updatedAt >= 指定日期的条目

通用选项 (跟在子命令后面，原样透传给 ts 脚本)
  --spide                            在执行 today/full/since 前先跑一次爬虫(等价 ... spide && 下载)
  --dry-run                          只打印筛选结果概览，不真的下载
  --limit <n>                        只处理前 n 条
  --images-only                      只下载图片
  --videos-only                      只下载视频
  --concurrency <n>                  条目级并发，默认 4
  --segment-concurrency <n>          单条目内分片并发，默认 12
  --force                            无视本地已有文件，全部重下

环境变量
  ZHIZUN_PASSWORD                    爬虫登录密码 (默认 123456)
  ZHIZUN_CF_CLEARANCE                Cloudflare 通行 cookie，过期时必须更新
  ZHIZUN_PAGE_SIZE                   列表页大小，默认 100
  ZHIZUN_LIST_CONCURRENCY            列表翻页并发，默认 4
  ZHIZUN_CONCURRENCY                 详情抓取并发，默认 16
  ZHIZUN_REFRESH_DETAILS=1           跳过详情缓存全量重抓，默认靠 updatedAt 增量
  NODE_EXTRA_CA_CERTS                (脚本内部已 export)
  DATABASE_URL                       (脚本内部已 export)

示例
  ./run_spider.sh                                  # 等价 today(只下今日新增)
  ./run_spider.sh spide                            # 只跑爬虫
  ./run_spider.sh today --spide                    # 先跑爬虫，然后下今日
  ./run_spider.sh today --images-only              # 只下图片
  ./run_spider.sh full --limit 50 --videos-only    # 全量模式但只拉前 50 条的视频
  ./run_spider.sh since 2026-08-20 --dry-run       # 看看 8-20 之后有多少条要更新，不下载
  ./run_spider.sh help                             # 本帮助

工作目录
  列表 JSON    json/zhizun/new_zhizun_*.json
  详情缓存     json/all/new_zhizun_all_girls_details.json  (增量复用)
  数据库       prisma/data/girls.db
  媒体输出     downloads/new_zhizun/...                    (本目录已 gitignore)

更多
  排障可参考 docs/zz-poster-runbook.md(图片解码失败时)和 tests/download_new_zhizun_media.ts 的注释。
EOF
}

SUBCMD="${1:-today}"
if [[ "$SUBCMD" == "help" || "$SUBCMD" == "-h" || "$SUBCMD" == "--help" ]]; then
  print_help
  exit 0
fi
shift || true

export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
export DATABASE_URL="file:./data/girls.db?timeout=5000"

# 是否先跑爬虫再下媒体（默认 false；传 --spide 触发）
RUN_SPIDE=false
FILTERED_ARGS=()
for arg in "$@"; do
  if [[ "$arg" == "--spide" ]]; then
    RUN_SPIDE=true
  else
    FILTERED_ARGS+=("$arg")
  fi
done

run_spide() {
  echo "[run_spider] 跑爬虫采集 new_zhizun 列表 + DB …"
  npx tsx tests/common_spide.ts true
}

case "$SUBCMD" in
  spide)
    run_spide
    ;;
  today|full)
    if [[ "$RUN_SPIDE" == true ]]; then run_spide; fi
    exec npx tsx tests/download_new_zhizun_media.ts --mode "$SUBCMD" "${FILTERED_ARGS[@]}"
    ;;
  since)
    SINCE_DATE="${1:?用法: ./run_spider.sh since YYYY-MM-DD [--spide]}"
    shift || true
    # 重新过滤一次，去掉可能跟在日期后面的 --spide
    FILTERED_ARGS=()
    for arg in "$@"; do
      if [[ "$arg" == "--spide" ]]; then
        RUN_SPIDE=true
      else
        FILTERED_ARGS+=("$arg")
      fi
    done
    if [[ "$RUN_SPIDE" == true ]]; then run_spide; fi
    exec npx tsx tests/download_new_zhizun_media.ts --since "$SINCE_DATE" "${FILTERED_ARGS[@]}"
    ;;
  *)
    echo "未知子命令: $SUBCMD" >&2
    echo "支持: spide | today | full | since <YYYY-MM-DD>" >&2
    echo "运行 ./run_spider.sh help 查看完整说明" >&2
    exit 2
    ;;
esac
