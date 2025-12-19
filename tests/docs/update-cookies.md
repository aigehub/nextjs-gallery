# 如何更新 xchina.co 的 Cookie

## 方法一：Chrome DevTools（推荐）

1. **打开无痕模式**
   - 按 `Ctrl+Shift+N` (Windows/Linux) 或 `Cmd+Shift+N` (Mac)

2. **访问目标网站**
   - 在地址栏输入：`https://xchina.co`
   - 等待 Cloudflare 验证完成（可能需要点击"验证"按钮）

3. **打开开发者工具**
   - 按 `F12` 或右键 -> "检查"

4. **找到 Cookie**
   - 切换到 `Network` 标签
   - 刷新页面 (`F5`)
   - 点击第一个请求（通常是文档请求）
   - 在右侧面板找到 `Request Headers`
   - 找到 `cookie:` 这一行，复制完整的值

5. **更新代码**
   - 打开 `tests/xchina.ts` 文件
   - 找到第 41 行的 `cookie:` 字段
   - 替换为刚才复制的新 cookie 值

## 方法二：使用 Cookie 导出扩展

1. 安装 Chrome 扩展：[EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg)

2. 访问 `https://xchina.co` 并完成验证

3. 点击扩展图标 -> Export -> 复制 JSON 格式

4. 将以下关键 Cookie 更新到代码中：
   - `cf_clearance` （最重要）
   - `_ga`
   - `_ga_F0JXM9DQXX`
   - `deviceType`
   - `ck_theme`

## Cookie 示例格式

```typescript
cookie: "pv_punch_pc=%7B%22count%22%3A1%2C%22expiry%22%3A1766212667%7D; showed_adscarat_shuffle_box=1; deviceType=4; ck_theme=dark; _ga_F0JXM9DQXX=GS2.1.1766126413.1.0.1766126413.60.0.0; _ga=GA1.1.1370686643.1766126414; cf_clearance=你的新cf_clearance值"
```

## 注意事项

- `cf_clearance` cookie 通常只有 5-120 分钟有效期
- 如果频繁遇到 403，可能需要：
  1. 降低请求频率（已在代码中设置为 2-5秒延迟）
  2. 使用不同的 IP 地址
  3. 考虑使用代理服务
- 每次运行爬虫前都需要更新 cookie

## 快速测试

更新 cookie 后，可以先测试单页：

```bash
# 在 spidexchina() 函数中设置 count: 1
await main(jsonPath, { count: 1, url: sigoHomeURL });
```

如果单页成功，再增加页数。
