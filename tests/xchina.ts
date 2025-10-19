import { log } from "console";
import { retryLopp, timeCost } from "./utils";
import parse from "node-html-parser";
import pLimit from "p-limit";
import { readFileSync, writeFileSync } from "fs";
import { deprecate } from "util";
import prisma from "../prisma/database_api";
import { randomInt } from "crypto";
const baseURl = "https://xchina.co";
const sigoHomeURL = `https://xchina.co/photos/series-66600a3a227ee.html`;
const JVIDHOMEURL = "https://xchina.co/photos/series-637b2029d2347.html";

/**
 * @deprecate composeDetailPageImage
 *
 */
async function loadDetailPage(detail_url: string) {
  const pageCount = await getPageCount({ url: `${baseURl}${detail_url}` });
  //加载每一页
  async function load(page: number, imageUrls: string[]) {
    const res = await fetch(`${baseURl}${detail_url.replace(".html", `/${page}.html`)}`);
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
        await retryLopp(0, load, pageIndex, imageUrls);
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
      const res = await fetch(url);
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
  return await retryLopp(0, load);
}
async function loadAllByPage(url: string, page: number, allItems: any[]) {
  async function load() {
    const res = await fetch(`${url.replace(".html", `/${page}.html`)}`);
    // log("loadAllByPage:", res.status,res.statusText);
    if (!res.ok) {
      log("loadAllByPage failed:", res.status, res.statusText);
      throw Error(res.statusText);
    }
    const html = await res.text();
    const doc = parse(html);
    const itemPhotos = doc.querySelectorAll(".item.photo");
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
  await retryLopp(0, load);
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
  let plimit = pLimit(3);

  for (let page = 1; page <= pageCount; page++) {
    log(`load page ${page}`);
    tasks.push(
      plimit(async () => {
        await new Promise((resolve) => setTimeout(resolve, randomInt(3) * 100));
        await loadAllByPage(url, page, allItems);
      })
    );
    // break; //test
  }
  await Promise.all(tasks);
  writeFileSync(jsonPath, JSON.stringify(allItems, null, 2), { encoding: "utf-8" });
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
