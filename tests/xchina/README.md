# XChina 爬虫使用说明

## 问题：403 Forbidden

爬虫遇到 403 错误是因为 Cloudflare 的 `cf_clearance` cookie 已过期。

## 解决方案

### 步骤 1: 获取新的 Cookie

1. **打开 Chrome 无痕模式** (`Ctrl+Shift+N`)
2. **访问** https://xchina.co
3. **完成 Cloudflare 验证**（如果出现）
4. **打开开发者工具** (`F12`)
5. **切换到 Network 标签**
6. **刷新页面** (`F5`)
7. **点击第一个请求**（通常是文档请求）
8. **找到 Request Headers** 部分
9. **复制完整的 `cookie:` 值**

示例截图位置：
```
Network Tab → 第一个请求 → Headers → Request Headers → cookie
```

### 步骤 2: 更新 Cookie 文件

编辑 `tests/xchina/cookies.json`:

```json
{
  "cookies": "你刚才复制的完整Cookie字符串",
  "userAgent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36",
  "timestamp": 当前时间戳（可选，用于追踪Cookie年龄）
}
```

**重要提示**：
- 确保 Cookie 字符串是完整的，包含 `cf_clearance`
- Cookie 通常只有 5-120 分钟有效期
- 如果超过 2 小时，建议重新获取

### 步骤 3: 运行爬虫

```bash
npm run test
# 或
npx tsx tests/xchina.ts
```

## Cookie 内容示例

完整的 Cookie 字符串应该类似：

```
pv_punch_pc=%7B%22count%22%3A1%2C%22expiry%22%3A1766212667%7D; showed_adscarat_shuffle_box=1; deviceType=4; ck_theme=dark; _ga_F0JXM9DQXX=GS2.1.1766126413.1.0.1766126413.60.0.0; _ga=GA1.1.1370686643.1766126414; cf_clearance=你的cf_clearance值
```

**关键字段**：
- `cf_clearance` - Cloudflare 验证令牌（最重要）
- `_ga` - Google Analytics
- `deviceType` - 设备类型
- `ck_theme` - 主题设置

## 工作原理

1. 爬虫启动时会自动从 `cookies.json` 加载 Cookie
2. 显示 Cookie 的年龄（多久之前获取的）
3. 如果超过 2 小时会警告可能已过期
4. 使用加载的 Cookie 进行所有 HTTP 请求

## 优化设置

当前配置已优化以避免触发反爬虫：

- **并发数**: 1 个请求（`pLimit(1)`）
- **延迟**: 每个请求间隔 2-5 秒随机延迟
- **重试**: 自动重试失败的请求
- **User-Agent**: 模拟移动设备

## 常见问题

### Q: Cookie 多久过期？
A: 通常 5 分钟到 2 小时，取决于 Cloudflare 配置。

### Q: 为什么还是 403？
A: 可能原因：
1. Cookie 已过期 → 重新获取
2. 请求太频繁 → 等待更长时间后重试
3. IP 被封 → 更换 IP 或使用代理

### Q: 如何测试 Cookie 是否有效？
A: 运行爬虫时，第一个请求会立即显示是否成功。

## 日志输出示例

成功时：
```
📁 从文件加载Cookie: /path/to/cookies.json
🕐 Cookie年龄: 15分钟前
load page 1/1
等待 3247ms 后请求第1页...
正在请求: https://xchina.co/photos/series-66600a3a227ee/1.html
loadAllByPage 第1页: 200 OK
第1页找到 15 个项目
```

失败时：
```
⚠️  Cookie可能已过期（超过2小时），建议更新
load page 1/1
正在请求: https://xchina.co/photos/series-66600a3a227ee/1.html
loadAllByPage 第1页: 403 Forbidden
⚠️  403 Forbidden - 可能原因:
  1. Cloudflare cf_clearance cookie已过期
  2. 请求频率过高，触发反爬虫
  3. User-Agent被识别为爬虫
  建议: 手动访问网站，获取新的 cf_clearance cookie
```

## 高级：自动获取 Cookie（可选）

如果需要自动化获取 Cookie，可以使用 Puppeteer：

```bash
# 安装依赖
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth

# 运行自动获取脚本
npx tsx tests/xchina-puppeteer.ts
```

这会打开浏览器，自动访问网站并保存 Cookie。

## 注意事项

⚠️  **重要**：
- 频繁爬取可能导致 IP 被封
- 建议在非高峰时段运行
- 尊重网站的 robots.txt
- 不要用于商业用途

## 更新历史

- 2025-12-19: 添加了从文件加载 Cookie 的功能
- 2025-12-19: 优化了请求频率和延迟
- 2025-12-19: 添加了详细的错误提示
