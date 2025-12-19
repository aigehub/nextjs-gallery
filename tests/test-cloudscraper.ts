/**
 * 测试 cloudscraper 是否能绕过 Cloudflare
 */

import { log } from "console";
const cloudscraper = require('cloudscraper');

const testUrl = "https://xchina.co/photos/series-66600a3a227ee.html";

async function testCloudscraper() {
  log('🧪 测试 cloudscraper 绕过 Cloudflare...\n');
  log(`🌐 目标URL: ${testUrl}`);
  log('⏳ 发送请求（可能需要几秒钟）...\n');

  try {
    const startTime = Date.now();

    const html = await cloudscraper.get({
      uri: testUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      timeout: 30000,
    });

    const elapsed = Date.now() - startTime;

    log(`✅ 请求成功！耗时: ${elapsed}ms`);
    log(`📄 响应大小: ${(html.length / 1024).toFixed(2)} KB`);

    // 检查页面内容
    const hasPhotoItems = html.includes('item photo');
    const hasCloudflareChallenge = html.includes('cf-challenge') || html.includes('Checking your browser');

    log(`✓ 包含照片项: ${hasPhotoItems ? '是' : '否'}`);
    log(`✓ 是否被Cloudflare拦截: ${hasCloudflareChallenge ? '是 ⚠️' : '否 ✅'}`);

    if (hasPhotoItems && !hasCloudflareChallenge) {
      log('\n🎉 cloudscraper 成功绕过 Cloudflare！');
      log('💡 现在可以运行爬虫了: npm run test');

      // 显示页面片段
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      if (titleMatch) {
        log(`📌 页面标题: ${titleMatch[1]}`);
      }
    } else if (hasCloudflareChallenge) {
      log('\n⚠️  仍然被 Cloudflare 拦截');
      log('可能原因:');
      log('1. Cloudflare 启用了更严格的保护');
      log('2. 需要使用带有浏览器环境的解决方案（如 Puppeteer）');
    } else {
      log('\n⚠️  页面内容异常，请检查');
    }

  } catch (error: any) {
    log(`\n❌ 请求失败: ${error.message}`);

    if (error.errorType === 1) {
      log('错误类型: Cloudflare 验证失败');
      log('建议: 可能需要使用更高级的绕过方法');
    } else if (error.errorType === 2) {
      log('错误类型: 验证码挑战');
      log('建议: 需要人工完成验证码');
    } else {
      log(`错误详情: ${JSON.stringify(error, null, 2)}`);
    }
  }
}

// 运行测试
testCloudscraper();
