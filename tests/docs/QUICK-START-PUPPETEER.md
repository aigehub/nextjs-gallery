# 🎯 Puppeteer解决403问题 - 快速开始

## 三步搞定

### ① 安装

```bash
npm install puppeteer @types/puppeteer
```

或使用便捷脚本:

```bash
bash tests/install-puppeteer.sh
```

### ② 更新Cookie

```bash
npx tsx tests/update-cookies-puppeteer.ts
```

等待浏览器自动完成Cloudflare验证（约10-15秒）

### ③ 运行爬虫

```bash
npx tsx tests/xchina-puppeteer.ts
```

**完成！** ✨

---

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| [tests/utils/puppeteer-helper.ts](tests/utils/puppeteer-helper.ts) | 核心工具类 |
| [tests/update-cookies-puppeteer.ts](tests/update-cookies-puppeteer.ts) | Cookie更新工具 |
| [tests/xchina-puppeteer.ts](tests/xchina-puppeteer.ts) | Puppeteer版爬虫 |
| [tests/puppeteer-example.ts](tests/puppeteer-example.ts) | 使用示例 |
| [tests/PUPPETEER-SOLUTION.md](tests/PUPPETEER-SOLUTION.md) | 详细文档 |
| [tests/xchina/cookies-puppeteer.json](tests/xchina/cookies-puppeteer.json) | Cookie存储 |

---

## 🎬 工作原理

```
原方案（cloudscraper）               Puppeteer方案
      ❌ 403                            ✅ 200

1. 发送HTTP请求           →     1. 启动真实浏览器
2. 携带过期Cookie         →     2. 模拟人类访问
3. 被Cloudflare拦截       →     3. 自动完成验证
4. 返回403错误            →     4. 获取有效Cookie
                                5. 正常访问页面
```

---

## 💡 核心优势

| 特性 | cloudscraper | Puppeteer |
|------|--------------|-----------|
| 绕过Cloudflare | ❌ | ✅ |
| 自动化程度 | 低 | 高 |
| JavaScript支持 | ❌ | ✅ |
| Cookie管理 | 手动 | 自动 |
| 调试能力 | 差 | 强 |
| 成功率 | 低 | 高 |

---

## 🔄 遇到403？

```bash
# 重新更新Cookie（最快方案）
npx tsx tests/update-cookies-puppeteer.ts
```

**原因:** Cookie通常5分钟到2小时后过期

---

## 📝 代码示例

### 最简单的用法

```typescript
import { fetchWithPuppeteer } from './utils/puppeteer-helper';

const result = await fetchWithPuppeteer('https://xchina.co/');
console.log(result.html);
```

### 高级用法

```typescript
import { PuppeteerCloudflareBypass } from './utils/puppeteer-helper';

const helper = new PuppeteerCloudflareBypass();
await helper.init({ headless: true });
await helper.loadCookies();

// 批量请求
for (const url of urls) {
  const result = await helper.fetch(url);
  // ...
}

await helper.close();
```

---

## ⚙️ 配置选项

### 更新Cookie时

```bash
# 有界面（推荐，可以看到过程）
npx tsx tests/update-cookies-puppeteer.ts

# 无头模式（后台运行）
npx tsx tests/update-cookies-puppeteer.ts --headless

# 自定义URL
npx tsx tests/update-cookies-puppeteer.ts --url=https://example.com
```

### 代码中使用代理

```typescript
await helper.init({
  headless: true,
  proxy: 'http://proxy.example.com:8080'
});
```

---

## 🐛 故障排查

### 问题1: 安装失败

```bash
# 清除缓存后重试
npm cache clean --force
npm install puppeteer
```

### 问题2: 浏览器启动失败

Linux系统可能需要安装依赖:

```bash
# Ubuntu/Debian
sudo apt-get install -y chromium-browser

# 或让Puppeteer下载Chrome
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
npm install puppeteer
```

### 问题3: Cookie仍然无效

```bash
# 使用有界面模式查看问题
npx tsx tests/update-cookies-puppeteer.ts

# 等待更长时间
# 在代码中修改 waitTime: 20000
```

---

## 📊 性能对比

| 操作 | 时间 |
|------|------|
| 更新Cookie | 10-15秒 |
| 首次请求（需绕过CF） | 15-20秒 |
| 后续请求（有Cookie） | 2-5秒 |
| 批量请求（复用浏览器） | 3-6秒/页 |

---

## 🎓 学习路径

1. **新手入门** → [README-PUPPETEER.md](tests/xchina/README-PUPPETEER.md)
2. **看示例** → [puppeteer-example.ts](tests/puppeteer-example.ts)
3. **深入学习** → [PUPPETEER-SOLUTION.md](tests/PUPPETEER-SOLUTION.md)

---

## 🔗 相关命令

```bash
# 查看示例
npx tsx tests/puppeteer-example.ts

# 运行特定示例
npx tsx tests/puppeteer-example.ts 1

# 查看帮助
npx tsx tests/update-cookies-puppeteer.ts --help
```

---

## ⚡ 提示

- ✅ 首次使用建议用**有界面模式**，可以看到验证过程
- ✅ 遇到403立即重新更新Cookie，不要尝试多次请求
- ✅ 添加**随机延迟**（3-6秒），避免被检测为爬虫
- ✅ **复用浏览器实例**进行批量请求，提升效率
- ✅ 爬取完成后记得**关闭浏览器** (`await helper.close()`)

---

## 📞 需要更多帮助?

- 📚 详细文档: [PUPPETEER-SOLUTION.md](tests/PUPPETEER-SOLUTION.md)
- 💻 代码示例: [puppeteer-example.ts](tests/puppeteer-example.ts)
- 🎯 快速指南: [README-PUPPETEER.md](tests/xchina/README-PUPPETEER.md)

---

**享受无403的爬虫体验！** 🎉
