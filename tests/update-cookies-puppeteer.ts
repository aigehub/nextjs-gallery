/**
 * 使用Puppeteer自动更新Cookie的工具
 *
 * 用法:
 * npx tsx tests/update-cookies-puppeteer.ts [--headless] [--url=URL]
 */

import { PuppeteerCloudflareBypass } from './utils/puppeteer-helper';
import { log } from 'console';

async function updateCookies() {
  // 解析命令行参数
  const args = process.argv.slice(2);
  const headless = args.includes('--headless');
  const urlArg = args.find(arg => arg.startsWith('--url='));
  const targetUrl = urlArg
    ? urlArg.split('=')[1]
    : 'https://xchina.co/photos/series-66600a3a227ee.html';

  log('🚀 开始使用Puppeteer更新Cookies...');
  log(`🌐 目标URL: ${targetUrl}`);
  log(`👀 显示模式: ${headless ? '无头模式' : '有界面模式'}`);

  const helper = new PuppeteerCloudflareBypass('./tests/xchina/cookies-puppeteer.json');

  try {
    // 初始化浏览器
    const initSuccess = await helper.init({ headless });
    if (!initSuccess) {
      log('❌ 浏览器初始化失败');
      process.exit(1);
    }

    // 绕过Cloudflare
    log('\n🔓 正在绕过Cloudflare验证...');
    const success = await helper.bypassCloudflare(targetUrl, {
      waitTime: 15000,
      maxRetries: 3,
    });

    if (success) {
      log('\n✅ 成功通过Cloudflare验证！');
      log('💾 Cookies已自动保存');

      // 获取页面标题确认
      const title = await helper.getTitle();
      log(`📄 页面标题: ${title}`);

      // 可选：截图验证
      if (!headless) {
        log('\n💡 提示：你可以在浏览器中查看页面是否正常加载');
        log('⏳ 等待5秒后自动关闭...');
        await helper.wait(5000);
      }

      log('\n✅ Cookie更新完成！');
      log('📝 现在你可以运行爬虫脚本了');
    } else {
      log('\n❌ 未能通过Cloudflare验证');
      log('💡 建议：');
      log('  1. 使用非无头模式查看问题: npx tsx tests/update-cookies-puppeteer.ts');
      log('  2. 检查网络连接');
      log('  3. 尝试使用代理');

      // 保存截图用于调试
      await helper.screenshot('./tests/xchina/error-screenshot.png');
      log('📸 错误截图已保存到: ./tests/xchina/error-screenshot.png');

      process.exit(1);
    }
  } catch (error) {
    log('\n❌ 发生错误:', error);
    process.exit(1);
  } finally {
    await helper.close();
  }
}

// 显示使用说明
function showHelp() {
  console.log(`
Puppeteer Cookie更新工具
========================

用法:
  npx tsx tests/update-cookies-puppeteer.ts [选项]

选项:
  --headless          使用无头模式（不显示浏览器界面）
  --url=URL           指定要访问的URL（默认：xchina.co）
  --help              显示此帮助信息

示例:
  # 有界面模式（推荐首次使用）
  npx tsx tests/update-cookies-puppeteer.ts

  # 无头模式
  npx tsx tests/update-cookies-puppeteer.ts --headless

  # 指定URL
  npx tsx tests/update-cookies-puppeteer.ts --url=https://xchina.co/

说明:
  此工具会自动打开浏览器，访问指定网站，等待Cloudflare验证完成，
  然后将有效的Cookies保存到文件中供爬虫使用。
  `);
}

// 主程序
if (process.argv.includes('--help')) {
  showHelp();
  process.exit(0);
}

updateCookies().catch(error => {
  log('❌ 致命错误:', error);
  process.exit(1);
});
