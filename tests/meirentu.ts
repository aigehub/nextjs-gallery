import { log } from "console";
import { URL } from "url";
import { parse, HTMLElement } from "node-html-parser";
export function httpHeaders() {
  return {
    dnt: "1",
    method: "GET",
    pragma: "no-cache",
    "cache-control": "no-cache",
    priority: "u=1, i",
    referrer: "https://meirentu.cc/",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
    accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "accept-encoding": "gzip, deflate, br, zstd",
    // "sec-fetch-dest": "image",
    // "sec-fetch-mode": "no-cors",
    // "sec-fetch-site": "cross-site",
    // "sec-ch-ua":
    //     "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
    // "sec-ch-ua-mobile": "?0",
    // "sec-ch-ua-platform": "\"Windows\"",
  };
}
import { decompress } from "@mongodb-js/zstd";
import { Buffer } from "node:buffer";
import pLimit from "p-limit";
import { PLIMIT_COUNT } from "./common_spide";

export async function loadHomePage(page: number) {
  const res = await fetch(`https://meirentu.cc/index/${page}.html`, {
    headers: httpHeaders(),
    method: "GET",
  });
  console.log("loadHomePage", res.status);

  if (res && res.status === 200) {
    // 获取压缩后的二进制内容
    let html = await parseResponseText(res);

    console.log("html", html.slice(0, 500)); // 只打印前 500 字符
    const doc = parse(html);
    return parseHomePageImageList(doc);
  }

  return null;
}
async function parseResponseText(res: Response) {
  const buffer = Buffer.from(await res.arrayBuffer());

  // 检查 content-encoding
  const encoding = res.headers.get("content-encoding");
  let html;

  if (encoding === "zstd") {
    const decompressed = await decompress(buffer);
    html = decompressed.toString("utf-8");
  } else {
    html = buffer.toString("utf-8");
  }
  return html;
}

export async function retryLopp(retry_count = 0, callback: Function, ...argArray: any) {
  try {
    // log("retryLopp params:", callback.name, ...argArray);
    return await callback(...argArray);
  } catch (e) {
    if (++retry_count > 3) {
      log("retry loading over 3");
      return null;
    }
    log(e, "retry loading retry_count:", retry_count);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return retryLopp(retry_count, callback, ...argArray);
  }
}

export async function loadDetailPage(item: MeiRenTuImageData) {
  const url = `https://meirentu.cc${item.href}`;
  let res = await fetch(url, {
    headers: httpHeaders(),
    method: "GET",
  });
  log(`loadDetailPage res ${res.status}`);
  if (res.status == 200) {
    let html = await parseResponseText(res);
    const doc = parse(html);
    let detailImages = await parseDetailImage(doc);
    item.girl_desc = detailImages?.girl_desc;
    item.images = detailImages?.images;
    item.tags = detailImages?.tags;
    const count = item.images?.split(",");

    log(url, "all images:", count, count?.length);
    return item;
  } else {
    log("load data not success");
    return item;
  }
}

function parseHomePageImageList(doc: HTMLElement): MeiRenTuImageData[] | undefined {
  let querySelectorAll = doc.querySelectorAll(".update_area .list_n2");
  console.log(`parseImageUrl=${querySelectorAll.length}`);
  if (querySelectorAll.length > 0) {
    let list: MeiRenTuImageData[] = [];
    querySelectorAll.forEach((item) => {
      let el = item.querySelector("div.case_info");
      let title = el?.querySelector("div.meta-title")?.text;
      let time = el?.querySelector("div.meta-post")?.children[1]?.text.trim();
      let href = item.querySelector("a")?.attributes["href"];
      log(`href=${href}`);
      let imageEl = item.querySelector("img");
      let src = imageEl?.attributes["data-src"];
      let alt = imageEl?.attributes["alt"];
      log(`src=${src} alt=${alt}`, title, time);
      const data = new MeiRenTuImageData(href, src, alt);
      data.album_desc = title;
      data.time = time;
      list.push(data);
    });
    return list;
  } else {
    return undefined;
  }
}

function parseDetailImageSrc(doc: HTMLElement) {
  let imageTags = doc.querySelectorAll("div.content img");
  let images: string[] = [];
  imageTags.forEach((tag) => {
    let src = tag.attributes["src"];
    let alt = tag.attributes["alt"];
    // var data = new MeiRenTuImageData(undefined, src, alt);
    images.push(src);
  });
  //   log("imageTags count: ", imageTags.length, "images src count", images);
  return images;
}

async function parseDetailImage(doc: HTMLElement) {
  let querySelectorAll = doc.querySelectorAll("div.page a");
  let girl_desc = doc.querySelector("div.item_title article")?.textContent;
  let tagEl = doc.querySelectorAll("div.item_info a");
  let tag: string[] = [];
  tagEl.forEach((item) => {
    tag.push(item.textContent);
  });
  log(`parseDetailImage page size=${querySelectorAll.length}`);
  const plimit = pLimit(PLIMIT_COUNT); // 设置最大并发数为 5
  const allRequests: Promise<void>[] = [];
  if (querySelectorAll.length > 0) {
    //第一页的先获取一下
    let images: string[] = [];
    images = parseDetailImageSrc(doc);
    for (let i = 1; i < querySelectorAll.length; ++i) {
      const item = querySelectorAll[i];
      const hrefPath = item.attributes["href"];
    //   log("index:", i, "querySelectorAll  detail item hrefPath:", hrefPath);
      allRequests.push(
        plimit(async () => {
          await retryLopp(0, fetchDetail, hrefPath, images);
        })
      );
    }
    await Promise.all(allRequests);
    // log("images count:", images.length);
    return { images: images.join(","), girl_desc: girl_desc, tags: tag.join(",") };
  }
  return null;
}
async function fetchDetail(hrefPath: string, images: String[]) {
  log("fetchDetail:hrefPath:", hrefPath);
  let url = new URL("https://meirentu.cc" + hrefPath!);
  let res = await fetch(url, {
    headers: httpHeaders(),
    method: "GET",
  });
  if (res.status == 200) {
    let detailDoc = parse(await parseResponseText(res));
    const srcs = parseDetailImageSrc(detailDoc);
    if (!images.includes(srcs[0])) {
      images.push(...srcs);
      //   log("images push:", srcs.length);
    } else {
      log("already includes");
    }
  } else {
    log("fetchDetail error:", res);
  }
}

export async function loadDataByModelName(name: String, page: number) {
  const res = await fetch(`https://meirentu.cc/model/${name}-${page}.html`, { headers: httpHeaders(), method: "GET" });
  const code = res.status;
  if (code == 200) {
    const html = await parseResponseText(res);
    const doc = parse(html);
    return parseHomePageImageList(doc);
  } else {
    log("loadDataByModelName code ", code);
  }
  return code;
}
export class MeiRenTuImageData {
  //    tags: string;
  //   images: string;
  //   create_time: Date;
  //   create_timestamps: bigint;
  //   cover: string;
  //   girl_name: string;
  //   album_desc: string;
  //   time: string;
  href: String | undefined = "";
  girl_name: String | undefined = "";
  cover: String | undefined = "";
  time: String | undefined = "";

  images: String | undefined = "";
  album_desc: String | undefined = "";
  girl_desc: String | undefined = "";
  tags: String | undefined = "";

  constructor(href: String | undefined, cover: String | undefined, girl_name: String | undefined) {
    this.href = href;
    this.girl_name = girl_name;
    this.cover = cover;
  }
}

async function test() {
  let res = await loadHomePage(1);
  log(res?.length);
}

// test();
function testParam(one: String, two: String[]) {
  log(one);
  log(two);
  throw Error("test error");
}
// retryLopp(0, testParam, "helllo", [1, 23]);
