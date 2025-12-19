import { log } from "console";
import { retryLoop, timeCost } from "./utils";
import parse from "node-html-parser";
import pLimit from "p-limit";
import { readFileSync, writeFileSync, existsSync } from "fs";
import prisma from "../prisma/database_api";
import { randomInt } from "crypto";
import { join } from "path";
import { PuppeteerCloudflareBypass, fetchWithPuppeteer } from "./utils/puppeteer-helper";

const baseURl = "https://xchina.co";
const sigoHomeURL = `https://xchina.co/photos/series-66600a3a227ee.html`;
const JVIDHOMEURL = "https://xchina.co/photos/series-637b2029d2347.html";

/**
 * 🎯 Puppeteer版本的xchina爬虫
 *
 * 优势：
 * 1. 自动绕过Cloudflare验证
 * 2. 模拟真实浏览器行为
 * 3. 自动处理JavaScript渲染
 * 4. 更好的反爬虫规避
 *
 * 使用步骤：
 * 1. 首次运行前，先更新Cookie:
 *    npx tsx tests/update-cookies-puppeteer.ts
 *
 * 2. 运行爬虫:
 *    npx tsx tests/xchina-puppeteer.ts
 */

// Puppeteer实例（共享）
let puppeteerHelper: PuppeteerCloudflareBypass | null = null;

/**
 * 初始化Puppeteer
 */
async function initPuppeteer() {
  if (!puppeteerHelper) {
    puppeteerHelper = new PuppeteerCloudflareBypass('./tests/xchina/cookies-puppeteer.json');
    await puppeteerHelper.init({ headless: true });
    // 加载已保存的cookies
    await puppeteerHelper.loadCookies();
    log('✅ Puppeteer已初始化');
  }
  return puppeteerHelper;
}

/**
 * 使用Puppeteer获取页面内容
 */
async function fetchWithPuppeteerHelper(url: string, retryCount = 0): Promise<{ ok: boolean; status: number; text: () => Promise<string> }> {
  const helper = await initPuppeteer();

  try {
    log(`🌐 请求: ${url.substring(0, 80)}...`);

    const result = await helper.fetch(url, {
      useSavedCookies: true,
      bypassCloudflare: true,
    });

    if (!result.ok && result.status === 403 && retryCount < 2) {
      log(`⚠️  收到403，尝试重新绕过Cloudflare... (重试 ${retryCount + 1}/2)`);

      // 重新绕过Cloudflare
      const success = await helper.bypassCloudflare(url, {
        waitTime: 15000,
        maxRetries: 2,
      });

      if (success) {
        // 重试请求
        return fetchWithPuppeteerHelper(url, retryCount + 1);
      }
    }

    return {
      ok: result.ok,
      status: result.status,
      text: async () => result.html,
    };
  } catch (error: any) {
    log(`❌ Puppeteer请求失败: ${error.message}`);
    return {
      ok: false,
      status: 0,
      text: async () => "",
    };
  }
}

async function getPageCount({ url, doc }: { url?: string; doc?: any }) {
  async function load() {
    let pager;
    if (url) {
      const res = await fetchWithPuppeteerHelper(url);
      log("getPageCount:", url, "statuscode:", res.status);
      const html = await res.text();
      const document = parse(html);
      pager = document.querySelectorAll("div.pager a");
    } else {
      pager = doc.querySelectorAll("div.pager a");
    }
    if (pager) {
      const pageCount = parseInt(pager[pager?.length - 2].text);
      return pageCount;
    }
  }
  return await retryLoop(0, load);
}

async function loadAllByPage(url: string, page: number, allItems: any[]) {
  async function load() {
    const pageUrl = `${url.replace(".html", `/${page}.html`)}`;
    log(`正在请求第${page}页: ${pageUrl}`);

    const res = await fetchWithPuppeteerHelper(pageUrl);
    log(`loadAllByPage 第${page}页:`, res.status);

    if (!res.ok) {
      if (res.status === 403) {
        log("⚠️  403 Forbidden - Puppeteer也无法绕过");
        log("  建议:");
        log("  1. 等待几分钟后重试");
        log("  2. 运行: npx tsx tests/update-cookies-puppeteer.ts");
        log("  3. 考虑使用代理");
      }
      throw Error(`${res.status}`);
    }

    const html = await res.text();
    const doc = parse(html);
    const itemPhotos = doc.querySelectorAll(".item.photo");
    log(`第${page}页找到 ${itemPhotos.length} 个项目`);

    let plimit = pLimit(50);

    let task = [];
    for (const el of itemPhotos) {
      const url = el.querySelector("a")?.attributes["href"];
      let base_image_url = el.querySelector("div.img")?.attributes["style"].split(";")[0].replace("background-image:url('", "").replace("')", "");
      //去除两段路径，得到基础路径
      base_image_url = base_image_url?.substring(0, base_image_url.lastIndexOf("/"));
      base_image_url = base_image_url?.substring(0, base_image_url.lastIndexOf("/") + 1);
      const subs = el.querySelector(".subs")?.text;
      const title = el.querySelector(".title")?.text;
      const model = el.querySelector(".model-container")?.text;
      const model_href = el.querySelector(".model-container a")?.attributes["href"];
      task.push(
        plimit(async () => {
          let itemObj = {
            title,
            subs,
            model,
            model_href,
            detail_url: url,
          };
          const images = await composeDetailPageImage(el);
          if (images) {
            let newItem = { base_image_url, picInfo: images.picInfo, imageCount: images.imageCount, videoCount: images.videoCount, ...itemObj };
            log(newItem);
            allItems.push(newItem);
          }
        })
      );
    }
    await Promise.all(task);
  }
  await retryLoop(0, load);
}

async function composeDetailPageImage(doc: any) {
  log("composeDetailPageImage start");
  const picInfo = doc.querySelector(".tags").children[0]?.text;
  let videoCount = 0;

  let imageCount = 0;
  const array = picInfo?.split("P");
  imageCount = parseInt(array[0]);
  if (array.length > 1 && array[1] !== "") {
    videoCount = parseInt(array[1].trim().replace("+", "").replace("V", "").trim());
  }
  const result = { imageCount, videoCount, picInfo };
  log("picInfo:", result);
  return result;
}

async function main(jsonPath: string, { count, url }: { count?: number; url: string }) {
  log("main", count, url);

  // 初始化Puppeteer
  await initPuppeteer();

  let pageCount;
  if (!count) {
    pageCount = await getPageCount({ url: url });
  } else {
    pageCount = count;
  }
  let allItems: any[] = [];
  let tasks: any[] = [];
  // 降低并发数，避免触发反爬虫
  let plimit = pLimit(1);

  for (let page = 1; page <= pageCount; page++) {
    log(`load page ${page}/${pageCount}`);
    tasks.push(
      plimit(async () => {
        // 增加随机延迟时间（3-6秒），模拟人类行为
        const delay = 3000 + randomInt(3000);
        log(`等待 ${delay}ms 后请求第${page}页...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        await loadAllByPage(url, page, allItems);
      })
    );
  }
  await Promise.all(tasks);

  // 关闭Puppeteer
  if (puppeteerHelper) {
    await puppeteerHelper.close();
    puppeteerHelper = null;
  }

  writeFileSync(jsonPath, JSON.stringify(allItems, null, 2), { encoding: "utf-8" });
  log(`✅ 数据已保存到: ${jsonPath}, 共 ${allItems.length} 项`);
}

class XchinaItemData {
  title: string = "";
  image_base_url: string = "";
  subs: string = "";
  girl_name: string = "";
  album_id: string = ""; //@unique
  image_count: number = 0;
  video_count: number = 0;
}

async function insert(jsonPath: string) {
  const jsonData = readFileSync(jsonPath, { encoding: "utf-8" });
  const data = JSON.parse(jsonData);
  for (let index = 0; index < data.length; index++) {
    const item = data[index];
    const itemData = new XchinaItemData();
    itemData.subs = item.subs + " [" + item.picInfo + "]";
    itemData.title = item.title;
    itemData.girl_name = item.model ?? item.title;
    let detail_url = item.detail_url;
    const id = detail_url.substring(detail_url.indexOf("-") + 1, detail_url.indexOf(".html"));
    itemData.album_id = id;
    itemData.image_count = item.imageCount;
    itemData.video_count = item.videoCount;
    itemData.image_base_url = item.base_image_url;
    try {
      const find = await prisma.xChinaSigou.findFirst({
        where: { album_id: itemData.album_id },
      });
      if (find) {
        const insert = await prisma.xChinaSigou.updateMany({
          data: itemData,
          where: { album_id: itemData.album_id },
        });
        if (insert) {
          log("update:", insert.count, item.model ?? "", item.subs);
        }
      } else {
        const insert = await prisma.xChinaSigou.createMany({
          data: itemData,
        });
        if (insert) {
          log("insert:", insert.count, item.model ?? "", item.subs);
        }
      }
    } catch (e) {
      log(e);
    }
  }
  log("data count:", data.length);
}

export async function spidexchinaPuppeteer() {
  log("🚀 使用Puppeteer版本的爬虫");

  try {
    let jsonPath = "./tests/xchina/xchina_sigou.json";
    await main(jsonPath, { count: 1, url: sigoHomeURL });
    await insert(jsonPath);

    jsonPath = "./tests/xchina/xchina_jvid.json";
    await main(jsonPath, { count: 1, url: JVIDHOMEURL });
    await insert(jsonPath);

    log("✅ 爬取完成!");
  } catch (error) {
    log("❌ 爬取失败:", error);

    // 确保关闭浏览器
    if (puppeteerHelper) {
      await puppeteerHelper.close();
      puppeteerHelper = null;
    }

    throw error;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  timeCost(spidexchinaPuppeteer);
}
