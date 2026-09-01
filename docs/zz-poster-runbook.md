# 至尊封面修复手册

> Runbook · nextjs-gallery 图库站
> 适用平台：**plat=2 · 至尊（zhizun）**
> 整理日期：2026-08-31
> 数据快照：`prisma/data/girls.db`（8913 条视频记录）

**状态**

- ✅ 代码已修复，本地验证通过
- ⏳ 待部署环境验证老域名连通性

---

## 目录

- [01 · 问题速览](#01-问题速览)
- [02 · 修复原理](#02-修复原理)
- [03 · 改动清单](#03-改动清单)
- [04 · 部署验证](#04-部署验证)
- [05 · 排障速查](#05-排障速查)
- [06 · 回滚方案](#06-回滚方案)
- [07 · 已知限制与待办](#07-已知限制与待办)

---

## 01 · 问题速览

**现象**：「至尊」分类下部分视频卡片封面黑屏，只剩中央 ▶ 浮标；同一条目的图片封面却显示正常。

**根因（两条叠加）**

1. **代理拦截** — `/api/zz-image` 白名单此前只放行 `im4ge.net`。老至尊图床（leelawyer、jinyu32、punycode 域名）的封面请求全部返回 `403`。
2. **解码误判** — `decodeZhizunImage` 对任何输入都强制执行「18 字节位移反变换 + WebP 校验」。老域名存的是**明文 JPEG/PNG**，校验必然失败抛错，组件捕获后把封面置空，最终渲染为黑底。

**影响面**：8913 条至尊视频记录中，约 **3294 条（36.9%）** 使用老域名封面，修复前全部无法展示。分布如下：

| 封面域名                              | 记录数 | 占比    | 存储形态                |
| ------------------------------------- | ------ | ------- | ----------------------- |
| `im4ge.net`（含子域）                 | 5619   | 63.0 %  | 🔒 18 字节位移加密 · WebP |
| `test.xn--fiqa24e…m.com:2000`         | 1578   | 17.7 %  | 📄 明文原图             |
| `tencent.leelawyer.cn`                | 876    | 9.8 %   | 📄 明文原图             |
| `octopus.leelawyer.cn:2000`           | 398    | 4.5 %   | 📄 明文原图             |
| `resource.jinyu32.com`                | 373    | 4.2 %   | 📄 明文原图             |
| `res.jinyu32.com`                     | 69     | 0.8 %   | 📄 明文原图             |

---

## 02 · 修复原理

视频封面的完整链路如下。修复落在**白名单放行老域名**和**解码器先识别明文再决定是否变换**这两环：

```
视频卡片 (item.poster)
        │
        ▼
/api/zz-image  —— 白名单校验，回源拉取
        │
        ▼
magic bytes 识别 ── 是明文图？ ── 直返
        │            │
        │ 不匹配     │ 匹配
        ▼            ▼
18 字节位移解码   Blob URL → <video poster>
```

**解码器判定规则（按顺序）**

| 字节特征                | 判定        | 动作                                       |
| ----------------------- | ----------- | ------------------------------------------ |
| `FF D8 FF` 开头          | 明文 JPEG   | 原样返回，类型 `image/jpeg`                |
| `89 50 4E 47` 开头       | 明文 PNG    | 原样返回，类型 `image/png`                 |
| `GIF8` 开头              | 明文 GIF    | 原样返回，类型 `image/gif`                 |
| `RIFF…WEBP` 结构         | 明文 WebP   | 原样返回，类型 `image/webp`                |
| 以上皆不匹配            | im4ge 加密流 | 前 18 字节做 base64 位移逆变换 → 校验为 WebP，否则抛错 |

---

## 03 · 改动清单

改动共 **2 个文件**，当前位于工作区（`git status` 显示为 `M`），部署前需先提交。

### `src/app/components/NewZZImage.tsx`

- 新增 `detectGenericImageFormat()`：JPEG / PNG / GIF / WebP magic bytes 嗅探。
- `decodeZhizunImage()` 改为「先嗅探明文、直返原图；不匹配才走 18 字节位移解码」。

### `src/app/api/zz-image/route.ts`

- 新增 `LEGACY_IMAGE_HOSTS` 白名单（5 个老至尊域名）。
- `isAllowedImageUrl()` 放行这些域名的 `https` 443 / 2000 端口；其余域名仍返回 403，防止代理被滥用。

### 无需改动的依赖

- `NewZZVideo.tsx`：封面链路复用 `/api/zz-image` 与 `decodeZhizunImage`，自动受益。

### 本地验证结论

- `npx tsc --noEmit` 通过（仅历史遗留的 `tests/test.ts` 报错，与本次无关）。
- 解码分支用 5 组样本验证通过：im4ge 加密 WebP、明文 JPEG、明文 PNG、明文 GIF、明文 WebP；垃圾字节正确抛错。

---

## 04 · 部署验证

部署后按以下步骤核对，任何一步不达预期请跳到 [05 排障速查](#05-排障速查)。

### 步骤 1 · 提交并部署

```bash
git add src/app/components/NewZZImage.tsx src/app/api/zz-image/route.ts
git commit -m "修复老至尊封面：代理白名单 + 明文图片直返"
# 按现有流程部署到线上
```

### 步骤 2 · 取样一条老域名封面

```bash
python3 - <<'EOF'
import sqlite3, urllib.parse
conn = sqlite3.connect("prisma/data/girls.db")
poster = conn.execute(
    "SELECT poster FROM ZhizunGirl "
    "WHERE poster LIKE '%leelawyer%' OR poster LIKE '%jinyu32%' "
    "OR poster LIKE '%xn--%' LIMIT 1"
).fetchone()[0]
print(poster)
print(urllib.parse.quote(poster, safe=""))  # 作为 ?src= 的值
EOF
```

**预期**：打印出一条 leelawyer / jinyu32 / punycode 域名的封面 URL 及其 URL 编码。

### 步骤 3 · 验证代理接口

```bash
curl -sS -o /tmp/cover.bin -w "HTTP %{http_code} · %{content_type}\n" \
  "https://<你的域名>/api/zz-image?src=<上一步编码后的URL>"

head -c 4 /tmp/cover.bin | xxd
```

**预期**：HTTP 200；文件头为 `ff d8 ff …`（JPEG 明文）。若为 000 / 超时，说明部署环境同样无法连通老域名，参见 §07。

### 步骤 4 · 页面人工核对

打开图库站至尊分类，找到封面属老域名的条目（可按编号对照数据库），确认视频卡片出现封面图；并按 <kbd>F12</kbd> 打开控制台，搜索关键字 `至尊视频封面解码失败`。

**预期**：老域名条目的视频封面正常渲染；控制台无解码失败报错。

### 步骤 5 · 回归核对 im4ge 加密封面

再找一条封面为 `im4ge.net` 的条目，确认封面与视频播放不受影响。

**预期**：加密路径行为与修复前一致，封面、播放均正常。

---

## 05 · 排障速查

| 现象                                                  | 最可能原因                                     | 确认方法                                        | 处理                                                              |
| ----------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| 封面黑屏，控制台有 `至尊视频封面解码失败`              | 代理返回的不是图片，或解码分支异常             | 直接访问该 `/api/zz-image?src=…` 看状态码       | 按下面对应状态码处理                                              |
| `/api/zz-image` 返回 403「不允许代理该图片域名」      | 该域名未进白名单                               | 核对 URL 的 hostname 与端口                     | 把域名追加到 `LEGACY_IMAGE_HOSTS`（route.ts）后重新部署           |
| `/api/zz-image` 返回 502                              | 部署环境网络无法到达图源                       | 在服务器上 `curl` 该封面原始 URL                | 老域名若是源站死链则代码无法复活，只能等图源恢复（见 §07）        |
| `/api/zz-image` 返回 404 等透传状态                   | 远程对象已被删除                               | 浏览器直接打开原始 URL 复核                     | 数据侧问题，前端无法修复                                          |
| 封面正常，但点击播放黑屏 / 403                        | `/api/zz-video` 白名单仍只含 `im4ge.net`       | 看播放请求是否命中 zz-video 的 403              | 已知限制（见 §07），需另行放开后验证                              |
| im4ge 封面修复后反而异常                              | 明文嗅探误判（概率极低）                       | 对同一 URL 直连原站对比文件头                   | 回滚（§06）并保留该 URL 作为新样本                                |

---

## 06 · 回滚方案

本次改动只涉及两个文件，回滚不影响其它功能。

```bash
# 情形一：改动尚未提交
git checkout -- src/app/components/NewZZImage.tsx src/app/api/zz-image/route.ts

# 情形二：改动已提交
git revert <提交哈希>
```

回滚后行为恢复原状：im4ge 加密封面正常，老域名封面回到黑屏。

---

## 07 · 已知限制与待办

> ⚠️ **外部依赖**：五个老域名均为第三方托管，排查时从沙箱与本地探测全部不可达（HTTP 000）。若部署环境同样不通，这约 3300 条封面属于**源站死链** —— 代码已就位，图源恢复后会自动生效，期间控制台会持续出现「解码失败」日志，属预期。

- **视频代理未放开** — `/api/zz-video` 白名单仍只含 `im4ge.net`。老域名的视频文件（与封面同域）即使封面修好也可能「有封面、播不了」，需要时按同样方式放开并回归验证。
- **其余平台封面未接入** — `getAllPoster()` 目前只读 `item.poster`。
  - plat=5 xchina：可按 `image_base_url + album_id + "/0001.jpg"` 合成
  - plat=3 58kv：使用 `item.cover`
  - plat=1 集美：使用 `IMG_BASE_URL + item.photo`
  
  这些字段的海报字段均未使用，修复方案已评估、尚未实施。
- **兜底体验** — 无任何封面时，可考虑把列表缩略图的 `preload` 从 `"none"` 调成 `"metadata"`，让浏览器直接取视频首帧代替黑底。

---

## 附录 · 涉及文件

| 文件                                       | 状态   | 说明                                       |
| ------------------------------------------ | ------ | ------------------------------------------ |
| `src/app/components/NewZZImage.tsx`        | ✅ 修改 | 明文物嗅探 + 条件解码                      |
| `src/app/api/zz-image/route.ts`            | ✅ 修改 | 老域名白名单                               |
| `src/app/components/NewZZVideo.tsx`        | ➖ 未动 | 复用代理 + 解码，自动受益                   |
| `src/app/components/gallery.tsx`           | ➖ 未动 | 视频卡片入口                               |

---

*本手册依据 2026-08-31 的排查记录整理；数据库统计来自 `prisma/data/girls.db` 的 `ZhizunGirl` 表快照。*
