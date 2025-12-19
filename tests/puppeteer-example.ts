/**
 * Puppeteer使用示例
 *
 * 这个文件展示了如何使用Puppeteer绕过Cloudflare并抓取网页内容
 */

import { PuppeteerCloudflareBypass, fetchWithPuppeteer } from './utils/puppeteer-helper';
import { log } from 'console';

/**
 * 示例1: 使用便捷函数（推荐用于简单场景）
 */
async function example1() {
  log('\n=== 示例1: 使用便捷函数 ===\n');

  const result = await fetchWithPuppeteer('https://xchina.co/', {
    cookieFilePath: './tests/xchina/cookies-puppeteer.json',
    headless: true,
    useSavedCookies: true,
  });

  if (result.ok) {
    log('✅ 成功获取页面');
    log(`📄 HTML长度: ${result.html.length} 字符`);
    log(`🔍 页面标题: ${result.html.match(/<title>(.*?)<\/title>/)?.[1] || '未找到'}`);
  } else {
    log('❌ 获取失败:', result.status);
  }
}

/**
 * 示例2: 使用类（推荐用于需要多次请求的场景）
 */
async function example2() {
  log('\n=== 示例2: 使用PuppeteerCloudflareBypass类 ===\n');

  const helper = new PuppeteerCloudflareBypass('./tests/xchina/cookies-puppeteer.json');

  try {
    // 1. 初始化浏览器
    log('1️⃣  初始化浏览器...');
    await helper.init({ headless: true });

    // 2. 尝试加载已保存的cookies
    log('2️⃣  加载已保存的cookies...');
    const loaded = await helper.loadCookies();
    if (!loaded) {
      log('⚠️  没有已保存的cookies');
    }

    // 3. 访问页面
    log('3️⃣  访问页面...');
    const result = await helper.fetch('https://xchina.co/photos/', {
      useSavedCookies: true,
      bypassCloudflare: true,
    });

    if (result.ok) {
      log('✅ 成功获取页面');

      // 4. 获取页面标题
      const title = await helper.getTitle();
      log(`📄 页面标题: ${title}`);

      // 5. 可选：截图
      // await helper.screenshot('./tests/xchina/screenshot.png');
    } else {
      log('❌ 获取失败:', result.status);
    }
  } finally {
    // 6. 确保关闭浏览器
    await helper.close();
  }
}

/**
 * 示例3: 批量请求（复用浏览器实例）
 */
async function example3() {
  log('\n=== 示例3: 批量请求 ===\n');

  const helper = new PuppeteerCloudflareBypass('./tests/xchina/cookies-puppeteer.json');

  try {
    await helper.init({ headless: true });
    await helper.loadCookies();

    const urls = [
      'https://xchina.co/photos/series-66600a3a227ee.html',
      'https://xchina.co/photos/series-637b2029d2347.html',
    ];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      log(`\n请求 ${i + 1}/${urls.length}: ${url}`);

      const result = await helper.fetch(url, {
        useSavedCookies: true,
        bypassCloudflare: true,
      });

      if (result.ok) {
        log(`✅ 成功 (HTML长度: ${result.html.length})`);
      } else {
        log(`❌ 失败 (状态码: ${result.status})`);
      }

      // 添加延迟，避免请求过快
      if (i < urls.length - 1) {
        const delay = 2000 + Math.random() * 2000; // 2-4秒
        log(`⏳ 等待 ${Math.round(delay / 1000)}秒...`);
        await helper.wait(delay);
      }
    }
  } finally {
    await helper.close();
  }
}

/**
 * 示例4: 错误处理和自动重试
 */
async function example4() {
  log('\n=== 示例4: 错误处理和自动重试 ===\n');

  const helper = new PuppeteerCloudflareBypass('./tests/xchina/cookies-puppeteer.json');

  try {
    await helper.init({ headless: true });
    await helper.loadCookies();

    const url = 'https://xchina.co/';
    let result = await helper.fetch(url);

    // 如果遇到403，尝试重新绕过Cloudflare
    if (result.status === 403) {
      log('⚠️  收到403，尝试重新绕过Cloudflare...');

      const success = await helper.bypassCloudflare(url, {
        waitTime: 15000,
        maxRetries: 3,
      });

      if (success) {
        log('✅ 成功绕过Cloudflare，重新请求...');
        result = await helper.fetch(url);
      }
    }

    if (result.ok) {
      log('✅ 最终成功');
    } else {
      log('❌ 最终失败:', result.status);

      // 保存错误截图
      await helper.screenshot('./tests/xchina/error-screenshot.png');
      log('📸 错误截图已保存');
    }
  } finally {
    await helper.close();
  }
}

/**
 * 示例5: 使用代理
 */
async function example5() {
  log('\n=== 示例5: 使用代理 ===\n');

  const helper = new PuppeteerCloudflareBypass('./tests/xchina/cookies-puppeteer.json');

  try {
    // 使用代理服务器
    await helper.init({
      headless: true,
      proxy: 'http://proxy.example.com:8080', // 替换为实际的代理地址
    });

    const result = await helper.fetch('https://xchina.co/', {
      bypassCloudflare: true,
    });

    if (result.ok) {
      log('✅ 通过代理成功获取页面');
    }
  } finally {
    await helper.close();
  }
}

// 主程序
async function main() {
  const examples = [
    { name: '示例1: 便捷函数', fn: example1 },
    { name: '示例2: 使用类', fn: example2 },
    { name: '示例3: 批量请求', fn: example3 },
    { name: '示例4: 错误处理', fn: example4 },
    // { name: '示例5: 使用代理', fn: example5 }, // 需要配置实际代理
  ];

  // 从命令行参数选择要运行的示例
  const exampleNum = process.argv[2];

  if (exampleNum) {
    const num = parseInt(exampleNum) - 1;
    if (num >= 0 && num < examples.length) {
      log(`\n运行 ${examples[num].name}\n`);
      await examples[num].fn();
    } else {
      log('❌ 无效的示例编号');
      showHelp();
    }
  } else {
    // 运行所有示例
    for (const example of examples) {
      try {
        await example.fn();
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        log(`\n❌ ${example.name} 失败:`, error.message);
      }
    }
  }
}

function showHelp() {
  log(`
使用方法:
  npx tsx tests/puppeteer-example.ts [示例编号]

示例编号:
  1 - 使用便捷函数
  2 - 使用PuppeteerCloudflareBypass类
  3 - 批量请求
  4 - 错误处理和自动重试
  5 - 使用代理

示例:
  npx tsx tests/puppeteer-example.ts 1
  npx tsx tests/puppeteer-example.ts
  `);
}

// 运行
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  main().catch(error => {
    log('\n❌ 发生错误:', error);
    process.exit(1);
  });
}
