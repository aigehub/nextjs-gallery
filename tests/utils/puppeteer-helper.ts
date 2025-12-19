import puppeteer, { Browser, Page } from 'puppeteer';
import { log } from 'console';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface CookieData {
  cookies: any[];
  userAgent: string;
  timestamp: number;
}

export class PuppeteerCloudflareBypass {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private cookieFilePath: string;

  constructor(cookieFilePath: string = './tests/xchina/cookies-puppeteer.json') {
    this.cookieFilePath = cookieFilePath;
  }

  /**
   * 初始化浏览器实例
   */
  async init(options: {
    headless?: boolean;
    proxy?: string;
  } = {}) {
    const { headless = true, proxy } = options;

    const launchOptions: any = {
      headless: headless ? 'new' : false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-web-security',
      ],
    };

    if (proxy) {
      launchOptions.args.push(`--proxy-server=${proxy}`);
    }

    try {
      this.browser = await puppeteer.launch(launchOptions);
      this.page = await this.browser.newPage();

      // 设置视口大小
      await this.page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });

      // 设置真实的用户代理
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
      await this.page.setUserAgent(userAgent);

      // 隐藏自动化特征
      await this.page.evaluateOnNewDocument(() => {
        // 覆盖 navigator.webdriver
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });

        // 覆盖 chrome 对象
        (window as any).chrome = {
          runtime: {},
        };

        // 覆盖 permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters: any) =>
          parameters.name === 'notifications'
            ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
            : originalQuery(parameters);
      });

      log('✅ Puppeteer浏览器初始化成功');
      return true;
    } catch (error) {
      log('❌ Puppeteer浏览器初始化失败:', error);
      return false;
    }
  }

  /**
   * 访问页面并等待Cloudflare验证完成
   */
  async bypassCloudflare(url: string, options: {
    waitTime?: number;
    maxRetries?: number;
  } = {}): Promise<boolean> {
    const { waitTime = 10000, maxRetries = 3 } = options;

    if (!this.page) {
      log('❌ 浏览器未初始化，请先调用 init()');
      return false;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        log(`🌐 正在访问页面 (尝试 ${attempt}/${maxRetries}): ${url}`);

        // 访问页面
        const response = await this.page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 60000,
        });

        if (!response) {
          throw new Error('页面响应为空');
        }

        log(`📡 响应状态码: ${response.status()}`);

        // 检测Cloudflare挑战
        const hasChallenge = await this.detectCloudflareChallenge();

        if (hasChallenge) {
          log('🔍 检测到Cloudflare挑战，等待验证...');

          // 等待挑战完成
          await this.waitForChallengeCompletion(waitTime);

          // 验证是否通过
          const stillHasChallenge = await this.detectCloudflareChallenge();
          if (stillHasChallenge) {
            log(`⚠️  尝试 ${attempt}: Cloudflare挑战未完成`);
            if (attempt < maxRetries) {
              await this.page.waitForTimeout(2000);
              continue;
            }
            return false;
          }
        }

        // 检查最终状态
        const finalStatus = response.status();
        if (finalStatus === 403) {
          log(`⚠️  尝试 ${attempt}: 仍然收到403状态码`);
          if (attempt < maxRetries) {
            await this.page.waitForTimeout(3000);
            continue;
          }
          return false;
        }

        log('✅ 成功通过Cloudflare验证');

        // 保存cookies
        await this.saveCookies();

        return true;
      } catch (error: any) {
        log(`❌ 尝试 ${attempt} 失败:`, error.message);
        if (attempt < maxRetries) {
          await this.page.waitForTimeout(3000);
        }
      }
    }

    return false;
  }

  /**
   * 检测页面是否有Cloudflare挑战
   */
  private async detectCloudflareChallenge(): Promise<boolean> {
    if (!this.page) return false;

    try {
      const indicators = await this.page.evaluate(() => {
        const title = document.title.toLowerCase();
        const bodyText = document.body.innerText.toLowerCase();

        return {
          hasTitle: title.includes('just a moment') || title.includes('attention required'),
          hasText: bodyText.includes('cloudflare') || bodyText.includes('checking your browser'),
          hasChallengeForm: !!document.querySelector('#challenge-form'),
          hasCfChallenge: !!document.querySelector('.cf-challenge-running'),
        };
      });

      return Object.values(indicators).some(v => v);
    } catch (error) {
      return false;
    }
  }

  /**
   * 等待Cloudflare挑战完成
   */
  private async waitForChallengeCompletion(maxWaitTime: number): Promise<void> {
    if (!this.page) return;

    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const hasChallenge = await this.detectCloudflareChallenge();

      if (!hasChallenge) {
        log('✅ Cloudflare挑战已完成');
        return;
      }

      await this.page.waitForTimeout(500);
    }

    log('⏱️  等待超时');
  }

  /**
   * 保存cookies到文件
   */
  async saveCookies(): Promise<void> {
    if (!this.page) return;

    try {
      const cookies = await this.page.cookies();
      const userAgent = await this.page.evaluate(() => navigator.userAgent);

      const cookieData: CookieData = {
        cookies,
        userAgent,
        timestamp: Date.now(),
      };

      writeFileSync(this.cookieFilePath, JSON.stringify(cookieData, null, 2), 'utf-8');

      log(`💾 Cookies已保存到: ${this.cookieFilePath}`);
      log(`📊 保存了 ${cookies.length} 个cookies`);

      // 显示重要的cookies
      const cfClearance = cookies.find(c => c.name === 'cf_clearance');
      if (cfClearance) {
        log(`🔑 cf_clearance: ${cfClearance.value.substring(0, 20)}...`);
      }
    } catch (error) {
      log('❌ 保存cookies失败:', error);
    }
  }

  /**
   * 从文件加载cookies
   */
  async loadCookies(): Promise<boolean> {
    if (!this.page) return false;

    try {
      if (!existsSync(this.cookieFilePath)) {
        log('⚠️  Cookie文件不存在');
        return false;
      }

      const cookieData: CookieData = JSON.parse(
        readFileSync(this.cookieFilePath, 'utf-8')
      );

      // 检查cookies是否过期
      const age = Date.now() - cookieData.timestamp;
      const ageMinutes = Math.floor(age / 60000);

      log(`📁 从文件加载cookies: ${this.cookieFilePath}`);
      log(`🕐 Cookie年龄: ${ageMinutes}分钟`);

      if (ageMinutes > 120) {
        log('⚠️  Cookies可能已过期（超过2小时）');
      }

      // 设置cookies
      await this.page.setCookie(...cookieData.cookies);

      // 设置用户代理
      if (cookieData.userAgent) {
        await this.page.setUserAgent(cookieData.userAgent);
      }

      log(`✅ 已加载 ${cookieData.cookies.length} 个cookies`);
      return true;
    } catch (error) {
      log('❌ 加载cookies失败:', error);
      return false;
    }
  }

  /**
   * 获取页面HTML内容
   */
  async getHTML(): Promise<string> {
    if (!this.page) return '';
    return await this.page.content();
  }

  /**
   * 获取页面标题
   */
  async getTitle(): Promise<string> {
    if (!this.page) return '';
    return await this.page.title();
  }

  /**
   * 访问URL并返回HTML内容
   */
  async fetch(url: string, options: {
    useSavedCookies?: boolean;
    bypassCloudflare?: boolean;
  } = {}): Promise<{ ok: boolean; status: number; html: string }> {
    const { useSavedCookies = true, bypassCloudflare: bypass = true } = options;

    if (!this.page) {
      await this.init();
    }

    if (!this.page) {
      return { ok: false, status: 0, html: '' };
    }

    try {
      // 尝试加载已保存的cookies
      if (useSavedCookies) {
        await this.loadCookies();
      }

      // 访问页面
      const response = await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      if (!response) {
        return { ok: false, status: 0, html: '' };
      }

      const status = response.status();

      // 如果遇到403并且需要绕过Cloudflare
      if (status === 403 && bypass) {
        log('⚠️  收到403，尝试绕过Cloudflare...');
        const success = await this.bypassCloudflare(url);

        if (!success) {
          return { ok: false, status: 403, html: '' };
        }

        // 重新获取内容
        const html = await this.getHTML();
        return { ok: true, status: 200, html };
      }

      const html = await this.getHTML();
      return { ok: status >= 200 && status < 300, status, html };
    } catch (error: any) {
      log('❌ 请求失败:', error.message);
      return { ok: false, status: 0, html: '' };
    }
  }

  /**
   * 等待指定时间
   */
  async wait(ms: number): Promise<void> {
    if (this.page) {
      await this.page.waitForTimeout(ms);
    }
  }

  /**
   * 截图（调试用）
   */
  async screenshot(path: string): Promise<void> {
    if (this.page) {
      await this.page.screenshot({ path, fullPage: true });
      log(`📸 截图已保存: ${path}`);
    }
  }

  /**
   * 关闭浏览器
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      log('🔒 浏览器已关闭');
    }
  }
}

/**
 * 使用Puppeteer获取页面内容的便捷函数
 */
export async function fetchWithPuppeteer(
  url: string,
  options: {
    cookieFilePath?: string;
    headless?: boolean;
    useSavedCookies?: boolean;
  } = {}
): Promise<{ ok: boolean; status: number; html: string }> {
  const helper = new PuppeteerCloudflareBypass(options.cookieFilePath);

  try {
    await helper.init({ headless: options.headless });
    const result = await helper.fetch(url, {
      useSavedCookies: options.useSavedCookies
    });
    return result;
  } finally {
    await helper.close();
  }
}
