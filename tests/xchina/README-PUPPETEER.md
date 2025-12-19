# Puppeteer方案快速开始

## 🎯 一分钟上手

### 1. 安装Puppeteer

```bash
npm install puppeteer
```

### 2. 更新Cookie

```bash
# 首次使用或Cookie过期时运行
npx tsx tests/update-cookies-puppeteer.ts
```

**期望输出:**
```
🚀 开始使用Puppeteer更新Cookies...
🌐 目标URL: https://xchina.co/...
👀 显示模式: 有界面模式

✅ Puppeteer浏览器初始化成功

🔓 正在绕过Cloudflare验证...
🌐 正在访问页面 (尝试 1/3): https://xchina.co/...
📡 响应状态码: 200
✅ Cloudflare挑战已完成
✅ 成功通过Cloudflare验证！

💾 Cookies已保存到: ./tests/xchina/cookies-puppeteer.json
📊 保存了 8 个cookies
🔑 cf_clearance: m8wiuzwRNLDU4YX2l...

📄 页面标题: XChina.co
✅ Cookie更新完成！
```

### 3. 运行爬虫

```bash
npx tsx tests/xchina-puppeteer.ts
```

就这么简单！✨

---

## 📋 目录结构

```
tests/
├── utils/
│   └── puppeteer-helper.ts          # Puppeteer工具类（核心）
├── xchina/
│   ├── cookies-puppeteer.json       # 保存的Cookies
│   └── README-PUPPETEER.md          # 本文件
├── update-cookies-puppeteer.ts      # Cookie更新工具
├── xchina-puppeteer.ts              # Puppeteer版爬虫
├── puppeteer-example.ts             # 使用示例
└── PUPPETEER-SOLUTION.md            # 详细文档
```

---

## 🔧 常用命令

```bash
# 安装依赖
npm install puppeteer

# 更新Cookie（有界面，推荐）
npx tsx tests/update-cookies-puppeteer.ts

# 更新Cookie（无头模式）
npx tsx tests/update-cookies-puppeteer.ts --headless

# 自定义URL
npx tsx tests/update-cookies-puppeteer.ts --url=https://xchina.co/photos/

# 运行爬虫
npx tsx tests/xchina-puppeteer.ts

# 运行示例
npx tsx tests/puppeteer-example.ts

# 查看帮助
npx tsx tests/update-cookies-puppeteer.ts --help
```

---

## ⚠️ 常见问题速查

### ❓ 仍然收到403

```bash
# 重新更新Cookie
npx tsx tests/update-cookies-puppeteer.ts
```

### ❓ Cookie文件在哪？

```
tests/xchina/cookies-puppeteer.json
```

### ❓ Cookie多久过期？

通常 **5分钟到2小时**。遇到403就重新更新。

### ❓ 如何调试？

```bash
# 使用有界面模式，可以看到浏览器操作
npx tsx tests/update-cookies-puppeteer.ts
```

---

## 📚 进阶文档

详细文档请查看: [PUPPETEER-SOLUTION.md](../PUPPETEER-SOLUTION.md)

包含:
- 完整API文档
- 使用示例
- 最佳实践
- 性能优化
- 故障排除

---

## 🎬 工作流程

```
┌─────────────────────────────────────────────────────┐
│  1. 安装Puppeteer                                     │
│     npm install puppeteer                            │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  2. 更新Cookie                                        │
│     npx tsx tests/update-cookies-puppeteer.ts        │
│                                                       │
│  • 打开真实浏览器                                      │
│  • 自动访问网站                                        │
│  • 等待Cloudflare验证（5-15秒）                        │
│  • 保存有效Cookie                                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  3. 运行爬虫                                          │
│     npx tsx tests/xchina-puppeteer.ts                │
│                                                       │
│  • 加载保存的Cookie                                   │
│  • 使用真实浏览器发送请求                              │
│  • 自动处理403（重新绕过Cloudflare）                   │
│  • 抓取数据                                           │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  4. 如果遇到403                                       │
│     • Cookie可能过期                                  │
│     • 返回步骤2，重新更新Cookie                        │
└─────────────────────────────────────────────────────┘
```

---

## ✨ 核心优势

✅ **自动化** - 一键更新Cookie，无需手动复制粘贴
✅ **智能** - 自动检测Cloudflare挑战并等待完成
✅ **可靠** - 使用真实浏览器，更难被检测
✅ **简单** - 只需两个命令即可使用
✅ **调试友好** - 支持截图和有界面模式

---

## 🎓 快速示例

### 最简单的用法

```typescript
import { fetchWithPuppeteer } from './utils/puppeteer-helper';

// 一行代码获取页面
const result = await fetchWithPuppeteer('https://xchina.co/');

if (result.ok) {
  console.log(result.html);
}
```

### 批量请求

```typescript
import { PuppeteerCloudflareBypass } from './utils/puppeteer-helper';

const helper = new PuppeteerCloudflareBypass();
await helper.init();

for (const url of urls) {
  const result = await helper.fetch(url);
  // 处理结果...
}

await helper.close();
```

---

## 🚨 重要提示

1. **Cookie会过期** - 遇到403就重新更新Cookie
2. **降低频率** - 添加延迟，避免请求过快
3. **遵守规则** - 尊重网站的robots.txt
4. **仅供学习** - 请勿用于非法用途

---

## 📞 需要帮助？

- 查看详细文档: [PUPPETEER-SOLUTION.md](../PUPPETEER-SOLUTION.md)
- 运行示例代码: `npx tsx tests/puppeteer-example.ts`
- 查看工具帮助: `npx tsx tests/update-cookies-puppeteer.ts --help`

---

**祝你使用愉快！🎉**
