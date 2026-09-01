#!/usr/bin/env bash
# 用法：
#   ./run_spider.sh spide                     # 只跑爬虫，更新 json + DB（原老行为）
#   ./run_spider.sh today [--spide]           # 只下今日更新的条目（可选先跑爬虫）
#   ./run_spider.sh full  [--spide]           # 全量下载（可选先跑爬虫）
#   ./run_spider.sh since 2026-08-01 [--spide]
#
# 其余参数会原样透传到对应的 ts 脚本，例如：
#   ./run_spider.sh today --limit 5
#   ./run_spider.sh full --images-only --concurrency 6
#   ./run_spider.sh spide                # 等价于原来的 npx tsx tests/common_spide.ts true
set -euo pipefail
cd "$(dirname "$0")"

export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
export DATABASE_URL="file:./data/girls.db?timeout=5000"

SUBCMD="${1:-today}"
shift || true

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
    exit 2
    ;;
esac
