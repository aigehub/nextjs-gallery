/**
 * 测试 Cookie 是否有效的快速脚本
 */

import { log } from "console";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import axios from "axios";

const testUrl = "https://xchina.co/photos/series-66600a3a227ee.html";

// 从文件加载Cookie
function loadCookiesFromFile(): { cookies: string; userAgent: string } | null {
  const cookieFilePath = join(__dirname, 'xchina', 'cookies.json');

  if (existsSync(cookieFilePath)) {
    try {
      const cookieData = JSON.parse(readFileSync(cookieFilePath, 'utf-8'));

      if (cookieData.cookies && cookieData.cookies !== '请在这里粘贴你的完整Cookie字符串' && cookieData.cookies.length > 50) {
        const cookieAge = Date.now() - (cookieData.timestamp || 0);
        const ageMinutes = Math.floor(cookieAge / 60000);

        log(`📁 从文件加载Cookie: ${cookieFilePath}`);
        log(`🕐 Cookie年龄: ${ageMinutes}分钟前`);
        log(`📝 Cookie长度: ${cookieData.cookies.length} 字符`);

        // 检查是否包含关键字段
        const hasCfClearance = cookieData.cookies.includes('cf_clearance=');
        log(`✓ cf_clearance: ${hasCfClearance ? '存在' : '❌ 缺失'}`);

        if (ageMinutes > 120) {
          log(`⚠️  Cookie可能已过期（超过2小时），建议更新`);
        }

        return {
          cookies: cookieData.cookies,
          userAgent: cookieData.userAgent || "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36"
        };
      } else {
        log(`❌ Cookie文件内容无效`);
      }
    } catch (e) {
      log(`❌ 读取Cookie文件失败: ${e}`);
    }
  } else {
    log(`❌ Cookie文件不存在: ${cookieFilePath}`);
  }

  return null;
}

async function testCookie() {
  log('🧪 开始测试 Cookie...\n');

  const cookieConfig = loadCookiesFromFile();

  if (!cookieConfig) {
    log('\n❌ 无法加载有效的 Cookie，请检查 cookies.json 文件');
    process.exit(1);
  }

  log(`\n🌐 测试URL: ${testUrl}`);
  log('⏳ 发送请求...\n');

  try {
    const response = await axios.get(testUrl, {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
        "cache-control": "no-cache",
        "user-agent": cookieConfig.userAgent,
        cookie: cookieConfig.cookies
      },
      timeout: 30000,
      validateStatus: function (status) {
        return status < 500;
      },
    });

    if (response.status === 200) {
      log(`✅ Cookie 有效！状态码: ${response.status}`);
      log(`📄 页面大小: ${(response.data.length / 1024).toFixed(2)} KB`);

      // 检查页面内容是否正常
      const hasPhotoItems = response.data.includes('item photo');
      log(`✓ 包含照片项: ${hasPhotoItems ? '是' : '否'}`);

      log('\n🎉 测试通过！可以开始运行爬虫了');
      log('💡 运行命令: npm run test 或 npx tsx tests/xchina.ts');
    } else if (response.status === 403) {
      log(`❌ Cookie 无效或已过期！状态码: ${response.status}`);
      log('\n🔧 解决方案:');
      log('1. 打开 Chrome 无痕模式');
      log('2. 访问 https://xchina.co');
      log('3. 完成 Cloudflare 验证');
      log('4. F12 -> Network -> 复制 Cookie');
      log('5. 更新 tests/xchina/cookies.json');
      log('6. 设置 timestamp 为当前时间戳（毫秒）');
    } else {
      log(`⚠️  异常状态码: ${response.status} ${response.statusText}`);
    }

  } catch (error: any) {
    log(`❌ 请求失败: ${error.message}`);
    if (error.response) {
      log(`   状态码: ${error.response.status}`);
    }
  }
}

// 运行测试
testCookie();
