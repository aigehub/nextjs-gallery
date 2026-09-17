# 数据库托管与日常使用手册

> nextjs-gallery 的 SQLite 数据库（`prisma/data/girls.db`）**不入 git**，改由
> GitHub Release 托管、Vercel 构建时下载。本文档说明日常工作流。

**适用对象**：维护这个 repo 的人（本地开发 / CI / Vercel 部署）。

---

## 为什么 db 不入 git

- `girls.db` 已经 100MB+，GitHub 单文件 100MB 上限，逼近拒绝线
- 每天 GitHub Actions 都会跑一次爬虫更新它，历史上已经积累了 **718 次 db commit**
- 入 git 的 db 是派生物不是源码，每天 commit 等于每天整个二进制挤进 pack

2026-09-03 用 `git filter-repo` 把 `prisma/data/girls.db` 从所有历史抹掉，
repo pack 从 565MB → 292MB，并把 db 改用 Release 托管。

---

## 架构速览

```
                (每天跑爬虫)
   GitHub Actions ──────────────────┐
        │                            │
        │ git commit -m "spide data" │ gh release upload db-snapshot
        ▼                            ▼
   main 分支 (json, 代码)      Release db-snapshot
                                       │
                                       │ curl 下载
                                       ▼
                              Vercel build (prebuild 钩)
                                       │
                                       ▼
                                  部署产物
```

**关键约定**：
- GitHub Release tag 固定叫 `db-snapshot`
- 附件文件名固定叫 `girls.db`
- 每次跑爬虫后用 `--clobber` 覆盖旧附件

---

## 常见场景操作

### 场景 A：本地开发，一切正常

什么也不用做。`prisma/data/girls.db` 一直在你的工作区，不受 git 影响。

```bash
npm run dev     # 直接用现有 db
```

### 场景 B：你刚 clone 仓库，没有 db

跑根目录下的 fetch 脚本：

```bash
bash scripts/fetch-db.sh
```

会从 `https://github.com/aigehub/nextjs-gallery/releases/download/db-snapshot/girls.db`
下载最新快照。

### 场景 C：本地改了 db（手动塞了数据 / 迁移过）

想让别人和 Vercel 都能拿到，推到 Release：

```bash
gh release upload db-snapshot prisma/data/girls.db --clobber
```

`--clobber` 表示覆盖旧附件，必加。

> 注意：这步**不影响** GitHub Actions 的工作流 — 明天它跑完会再次覆盖。
> 所以如果你想塞的是永久数据，得同时把数据落到代码里（json 或 migration）。

### 场景 D：Vercel 部署

不用做任何事。`package.json` 的 `prebuild` 钩会：

1. 检测 `prisma/data/girls.db` 是否已经存在
2. 不存在 → `bash scripts/fetch-db.sh` 从 Release 下载
3. 然后 `npx prisma generate` + `next build`

build 日志里能看到 `[fetch-db] 下载 ... → prisma/data/girls.db` 或
`[fetch-db] prisma/data/girls.db 已存在，跳过下载`。

### 场景 E：GitHub Actions 每天跑爬虫

不用做任何事。workflow 最后一步：

```yaml
- name: upload db to release
  uses: softprops/action-gh-release@v2
  with:
    tag_name: db-snapshot
    files: prisma/data/girls.db
```

会自动覆盖 Release 附件（splash 每 4-12 小时一次，见 cron)。

### 场景 F：Release 下载失败 / 链接 404

大概率是：

1. **Release tag 不存在** — 查 https://github.com/aigehub/nextjs-gallery/releases
   有没有叫 `db-snapshot` 的 Release，没的话手动建一个：
   ```bash
   gh release create db-snapshot prisma/data/girls.db \
     --title "数据库快照" --notes "看图库 db" --latest=false
   ```

2. **GitHub Token 失效** — workflow log 里看 401/403，重新生成 PAT。

3. **网络问题** — Vercel 偶尔拉 GitHub 慢，重试 build。

---

## 故障排查速查

| 现象 | 大概率原因 | 处理 |
|---|---|---|
| `npm run build` 报 `prisma/data/girls.db 不存在` | fetch-db.sh 失败 | 手动跑 `bash scripts/fetch-db.sh` 看具体错误 |
| build 报「Release asset 404」 | release tag/asset 不存在 | 见场景 F |
| `git push` 又被拒 " File ... exceeds GitHub's file size limit" | 有别的文件涨过 100MB | 该文件也得从 git 拿掉 |
| Workflow 跑过但 Vercel 用的还是旧 db | Release 覆盖成功但 Vercel 用了 build cache | Vercel 控制台 → Redeploy，勾选清除缓存，或 `vercel --force` |
| Release 详情里看到「2 个 girls.db」 | `gh release upload` 没加 `--clobber` | 重传一次，或网页删掉旧那个 |
| `prebuild` 钩在本地拖慢了 build | 每次都从 GitHub 重下 | 确保 db 已经存在，脚本会跳过下载 |

---

## 背后的故事（为什么是这个方案）

历史上 `girls.db` 一直在 git 里跟踪。到 2026-09-03 那天它涨到 101MB,
新一次 commit push 时被 GitHub 服务器拒了：

```
remote: error: File prisma/data/girls.db is 100.16 MB;
this exceeds GitHub's file size limit of 100.00 MB
```

当时的应急方案是迁到 Git LFS(Vercel 支持 LFS)，但实测有两个坑：

1. GitHub LFS 带宽配额 1GB/月，每天 push 100MB+ 一周就烧完
2. Vercel 自带 LFS 配额，部署时重复扣

长期方案就是当前这套：db 退出 git，由 GitHub Release 托管（不收费，无单文件上限，也无带宽硬上限）,Vercel 构建时下载。

历史重写：`git filter-repo --path prisma/data/girls.db --invert-paths --force`
把 db 从所有 commit 抹掉，再 force push。备份分支 `backup-before-filter-repo`
还留着，需要回滚看历史的话:

```bash
git switch backup-before-filter-repo
```

---

## 相关文件位置速查

| 内容 | 路径 |
|---|---|
| 下载脚本 | `scripts/fetch-db.sh` |
| Workflow（爬虫+db上传） | `.github/workflows/node.js.yml` |
| Prebuild 钩 | `package.json` 的 `scripts.prebuild` |
| db 本体（不入 git) | `prisma/data/girls.db` |
| 数据库 schema | `prisma/schema.prisma` |
| Release URL | https://github.com/aigehub/nextjs-gallery/releases/tag/db-snapshot |
| 数据库实际下载 URL | https://github.com/aigehub/nextjs-gallery/releases/download/db-snapshot/girls.db |
| 数据爬虫入口 | `./run_spider.sh spide` / `tests/common_spide.ts` |
| 封面/视频使用手册 | `docs/zz-poster-runbook.md` |

---

## 最近演练

2026-09-03 已经完整跑通过一次：

1. ✅ 字段重写后的 main 完成 force push(`b0b72c26`)
2. ✅ Release `db-snapshot` 建好并上传了 101MB `girls.db`
3. ✅ HEAD 请求 Release URL 返回 200,content-length 与本地一致
4. ✅ 本地 db 从 `.git/lfs` 缓存恢复到 `prisma/data/girls.db`，数据完好

下次 daily workflow 跑(09:00 or 09:00+12 UTC）会触发首次完整自动化。
