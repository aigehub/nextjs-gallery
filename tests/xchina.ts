import { log } from "console";
import { retryLoop, timeCost } from "./utils";
import parse from "node-html-parser";
import pLimit from "p-limit";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { deprecate } from "util";
import prisma from "../prisma/database_api";
import { randomInt } from "crypto";
import { join } from "path";
// 使用 cloudscraper 绕过 Cloudflare 保护
const cloudscraper = require('cloudscraper');

const baseURl = "https://xchina.co";
const sigoHomeURL = `https://xchina.co/photos/series-66600a3a227ee.html`;
const JVIDHOMEURL = "https://xchina.co/photos/series-637b2029d2347.html";

/**
 * ⚠️  如何更新 Cookie（当遇到 403 错误时）：
 *
 * 方法1: 从文件加载（推荐）
 *   - 编辑 tests/xchina/cookies.json
 *   - 按照 tests/update-cookies.md 的步骤获取Cookie
 *   - 将Cookie粘贴到 cookies.json 的 cookies 字段
 *
 * 方法2: 直接修改代码
 *   - 手动更新下面 getHeaders() 函数中的 cookie 字段
 *
 * 注意：cf_clearance cookie 通常有效期约5分钟到2小时
 */

// 从文件加载Cookie配置
function loadCookiesFromFile(): { cookies: string; userAgent: string } | null {
  const cookieFilePath = join(__dirname, 'xchina', 'cookies.json');

  if (existsSync(cookieFilePath)) {
    try {
      const cookieData = JSON.parse(readFileSync(cookieFilePath, 'utf-8'));

      // 检查Cookie是否有效
      if (cookieData.cookies && cookieData.cookies !== '请在这里粘贴你的完整Cookie字符串' && cookieData.cookies.length > 50) {
        const cookieAge = Date.now() - (cookieData.timestamp || 0);
        const ageMinutes = Math.floor(cookieAge / 60000);

        log(`📁 从文件加载Cookie: ${cookieFilePath}`);
        log(`🕐 Cookie年龄: ${ageMinutes}分钟前`);

        if (ageMinutes > 120) {
          log(`⚠️  Cookie可能已过期（超过2小时），建议更新`);
        }

        return {
          cookies: cookieData.cookies,
          userAgent: cookieData.userAgent || "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36"
        };
      }
    } catch (e) {
      log(`❌ 读取Cookie文件失败: ${e}`);
    }
  }

  log(`⚠️  未找到有效的Cookie文件，使用默认配置（可能已过期）`);
  return null;
}

// 获取请求头
function getHeaders() {
  const cookieConfig = loadCookiesFromFile();

  const headers = {
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
    "cache-control": "no-cache",
    dnt: "1",
    pragma: "no-cache",
    priority: "u=0, i",
    "sec-ch-ua": '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "user-agent": cookieConfig?.userAgent || "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36",
    cookie: cookieConfig?.cookies || "pv_punch_pc=%7B%22count%22%3A1%2C%22expiry%22%3A1766212667%7D; showed_adscarat_shuffle_box=1; ck_theme=dark; _ga=GA1.1.1370686643.1766126414; pv_punch_mobile=%7B%22count%22%3A1%2C%22expiry%22%3A1766212833%7D; _ga_F0JXM9DQXX=GS2.1.s1766126413$o1$g1$t1766126433$j40$l0$h0; deviceType=1; cf_clearance=m8wiuzwRNLDU4YX2lw8OXcA1VctbXL3e7PHXsmTI6Qk-1766126435-1.2.1.1-N7XF_7q8ZJuw79yE2pk6506UXnjchjP69GbQYYih6PrrFyGW32BDmrMb_JZc0h0dLwZD_3JFVbQuHiR9K2pGUyRLCjw4NAHo5DaRFjFlHaQ5aLYKZdLsg87Mba9kmj1fPvEMfMOA5Atqc0bTdDRy8wQ1XL3YMgTle2fePMBueiLcVgKY_GvzsOGll8erN4yuM365C1MjV23BvAOHnzPrC4ZApfvaOxVz5172xxb5smU"
  };

  return headers;
}

async function fetchWithHeaders(url: string) {
  try {
    // 使用 cloudscraper 自动绕过 Cloudflare
    const html = await cloudscraper.get({
      uri: url,
      headers: {
        'User-Agent': getHeaders()['user-agent'],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      timeout: 30000,
    });

    log(`✅ cloudscraper 请求成功: ${url.substring(0, 60)}...`);

    // 返回一个类似 fetch Response 的对象
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => html,
    };
  } catch (error: any) {
    log(`❌ cloudscraper 请求失败: ${error.message}`);
    return {
      ok: false,
      status: error.statusCode || 500,
      statusText: error.message,
      text: async () => "",
    };
  }
}

/**
 * @deprecate composeDetailPageImage
 *
 */
async function loadDetailPage(detail_url: string) {
  const pageCount = await getPageCount({ url: `${baseURl}${detail_url}` });
  //加载每一页
  async function load(page: number, imageUrls: string[]) {
    const res = await fetchWithHeaders(`${baseURl}${detail_url.replace(".html", `/${page}.html`)}`);
    if (res.ok) {
      const html = await res.text();
      const pageDoc = parse(html);
      //解析每一页的图片item，并合并到数组里
      const imgArray = pageDoc.querySelectorAll(".item.photo-image div.img");
      log("imgArray length:", imgArray.length);
      for (let i = 0; i < imgArray.length; i++) {
        const element = imgArray[i];
        const url = element.attributes["style"].split(";")[0].replace("background-image:url('", "").replace("')", "");
        log("parsed image:", url);
        imageUrls.push(url);
      }
    }
  }
  let plimit = pLimit(1);

  let allTask = [];
  let imageUrls: string[] = [];
  for (let pageIndex = 1; pageIndex < pageCount; pageIndex++) {
    allTask.push(
      plimit(async () => {
        await retryLoop(0, load, pageIndex, imageUrls);
      })
    );
    //test
    // break;
  }
  await Promise.all(allTask);
  return imageUrls;
}

async function getPageCount({ url, doc }: { url?: string; doc?: any }) {
  async function load() {
    let pager;
    if (url) {
      const res = await fetchWithHeaders(url);
      log("getPageCount:", url, "statuscode:", res.status, res.statusText);
      const html = await res.text();
      const document = parse(html);
      pager = document.querySelectorAll("div.pager a");
    } else {
      pager = doc.querySelectorAll("div.pager a");
    }
    if (pager) {
      // log("children count", pager.length);
      const pageCount = parseInt(pager[pager?.length - 2].text);
      // log("page count:", pageCount);
      return pageCount;
    }
  }
  return await retryLoop(0, load);
}
async function loadAllByPage(url: string, page: number, allItems: any[]) {
  async function load() {
    const pageUrl = `${url.replace(".html", `/${page}.html`)}`;
    log(`正在请求: ${pageUrl}`);

    const res = await fetchWithHeaders(pageUrl);
    log(`loadAllByPage 第${page}页:`, res.status, res.statusText);

    if (!res.ok) {
      if (res.status === 403) {
        log("⚠️  403 Forbidden - 可能原因:");
        log("  1. Cloudflare cf_clearance cookie已过期");
        log("  2. 请求频率过高，触发反爬虫");
        log("  3. User-Agent被识别为爬虫");
        log("  建议: 手动访问网站，获取新的 cf_clearance cookie");
      }
      throw Error(`${res.status} ${res.statusText}`);
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
      // break; //test
    }
    await Promise.all(task);
  }
  await retryLoop(0, load);
}
async function composeDetailPageImage(doc: any) {
  log("composeDetailPageImage start");
  // const res = await fetch(`${baseURl}${detail_url}`);
  // if (!res.ok) {
  //   return null;
  // }
  // const html = await res.text();
  // const doc = parse(html);
  // let pageCount = await getPageCount({ doc: doc });
  // const video = doc.querySelector(".mp4-player-in-photo video");
  // const index = doc.querySelector(".mp4-player-in-photo .index");
  const picInfo = doc.querySelector(".tags").children[0]?.text;
  let videoCount = 0;
  // if (index) {
  //   const count = index.text;
  //   log("video count", count);
  //   if (count && count.includes("/")) {
  //     try {
  //       videoCount = parseInt(count.split("/")[1].replace('"', "").trim());
  //       log("parseInt video count", videoCount);
  //     } catch (e) {
  //       log("parseInt error", count);
  //     }
  //   }
  // }

  let imageCount = 0;
  const array = picInfo?.split("P");
  // log("array:", array, array.length);
  imageCount = parseInt(array[0]);
  if (array.length > 1 && array[1] !== "") {
    videoCount = parseInt(array[1].trim().replace("+", "").replace("V", "").trim());
  }
  // log("composeDetailPageImage pageCount:", pageCount);
  // if (pageCount == 0) {
  //   imageCount = doc.querySelectorAll(".item.photo-image div.img").length;
  // } else {
  //   // let imageUrls: string[] = [];
  //   // for (let index = 1; index < pageCount * 15; index++) {
  //   //   const id = detail_url.substring(detail_url.indexOf("-") + 1, detail_url.indexOf(".html"));
  //   //   // log(index, "composeDetailPageImage id:", id);
  //   //   const formatted = index.toString().padStart(4, "0");
  //   //   let imageUrl = "https://img.xchina.io/photos2/" + id + "/" + formatted + ".jpg";
  //   //   // log("composed imageUrl", imageUrl);
  //   //   imageUrls.push(imageUrl);
  //   // }
  //   imageCount = (pageCount - 1) * 15;
  //   const response = await fetch(`${baseURl}${detail_url.replace(".html", `/${pageCount}.html`)}`);
  //   if (response.ok) {
  //     const html = await response.text();
  //     const pageDoc = parse(html);
  //     imageCount += pageDoc.querySelectorAll(".item.photo-image div.img").length;
  //   }
  // }
  const result = { imageCount, videoCount, picInfo };
  log("picInfo:", result);
  return result;
}

async function main(jsonPath: string, { count, url }: { count?: number; url: string }) {
  log("main", count, url);
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
        // 增加随机延迟时间（2-5秒），模拟人类行为
        const delay = 2000 + randomInt(3000);
        log(`等待 ${delay}ms 后请求第${page}页...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        await loadAllByPage(url, page, allItems);
      })
    );
    // break; //test
  }
  await Promise.all(tasks);
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
export async function spidexchina() {
  // loadAllByPage(1);
  // getPageCount({ url: sigoHomeURL });

  let jsonPath = "./tests/xchina/xchina_sigou.json";
  await main(jsonPath, { count: 1, url: sigoHomeURL });
  await insert(jsonPath);

  jsonPath = "./tests/xchina/xchina_jvid.json";
  await main(jsonPath, { count: 1, url: JVIDHOMEURL });
  await insert(jsonPath);
}
// timeCost(spidexchina);
