import * as fs from "fs";
import * as path from "path";
import * as provinces from "./provinces.json";

const API_URL = "https://pig.zwidi.cn/";

const json_path = path.join(
  process.cwd(),
  "json",
  "all",
  "all_girls_details.json"
);

const navItems = {
  0: [
    { text: "首页", link: "homePage.html" },
    { text: "登录", link: "userlogin.html" },
    { text: "EXIT", link: "#" },
  ],
  1: [
    { text: "首页", link: "homePage.html" },
    { text: "用户管理", link: "userManage.html" },
    { text: "视频审核", link: "videoStateManage.html" },
    { text: "编号/工作", link: "codeJobManage.html" },
    { text: "TOP", link: "topManage.html" },
    { text: "IPBAN", link: "ipBanManage.html" },
    { text: "修改密码", link: "editPassword.html" },
    { text: "EXIT", link: "#" },
  ],
  2: [
    { text: "首页", link: "homePage.html" },
    { text: "相册管理", link: "picManage.html" },
    { text: "金币记录", link: "rmbLog.html" },
    { text: "浏览统计", link: "browseLog.html" },
    { text: "修改密码", link: "editPassword.html" },
    { text: "EXIT", link: "#" },
  ],
  3: [
    //
    { text: "首页", link: "homePage.html" },
    { text: "发单设置", link: "createGuest.html" },
    { text: "拉黑管理", link: "blockManage.html" },
    { text: "金币记录", link: "rmbLog.html" },
    { text: "修改密码", link: "editPassword.html" },
    { text: "EXIT", link: "#" },
  ],
  4: [
    { text: "首页", link: "homePage.html" },
    { text: "EXIT", link: "#" },
  ],
};
// window.LOGIN_RESTRICT_START = 3;
// window.LOGIN_RESTRICT_END = 10;
// const hostname = window.location.hostname;
// if (hostname === 'ppjimei.com') {
// 	window.API_URL = 'https://ppjimei.com';
// } else if (hostname === 'xxjimei.com') {
// 	window.API_URL = 'https://xxjimei.com';
// } else if (hostname === 'niu.mvay.cn') {
// 	window.API_URL = 'https://niu.mvay.cn';
// } else if (hostname === 'niu.oognb.cn') {
// 	window.API_URL = 'https://niu.oognb.cn';
// } else if (hostname === 'niu.pqten.cn') {
// 	window.API_URL = 'https://niu.pqten.cn';
// } else if (hostname === 'pig.zwidi.cn') {
// 	window.API_URL = 'https://pig.zwidi.cn';
// } else if (hostname === 'pig.owknm.cn') {
// 	window.API_URL = 'https://pig.owknm.cn';
// } else if (hostname === 'lisi.mvay.cn') {
// 	window.API_URL = 'https://lisi.mvay.cn';
// } else if (hostname === 'lisi.oognb.cn') {
// 	window.API_URL = 'https://lisi.oognb.cn';
// } else if (hostname === 'lisi.pqten.cn') {
// 	window.API_URL = 'https://lisi.pqten.cn';
// }
// 欢迎来到集美相册,本网站在twitter、tiktok、ins、facebook、Telegram、P站等均有推广
// 客服发单时,设置完成后请自行截图保存
// 如果发中圈就设置中圈价格,此时客人访问时只展示中圈的价格
// 如果发大圈就设置大圈价格,此时客人访问时只展示大圈的价格
// 如果同时设置中圈/大圈价格,此时客人访问时则展示对应设置的中圈/大圈价格,两者互不影响
// 为防止大家设置相同邀请码导致价格混乱,故随机生成邀请码,保存设置后务必截图(邀请码3天有效)
// 若想检验自己设置的价格,保存设置后退出或直接扫描二维码输入邀请码即可

async function fetchUser() {
  const defaultUser = { role: 0, username: "guest" };
  try {
    const response = await fetch(`${API_URL}/api/auth/user`, {
      method: "GET",
      credentials: "include",
    });
    const safeUser = await response.json();
    if (response.ok) {
      const user = safeUser || defaultUser;
      sessionStorage.setItem("user", JSON.stringify(user));
      return user;
    } else {
      sessionStorage.setItem("user", JSON.stringify(defaultUser));
      return defaultUser;
    }
  } catch (error) {
    console.error("获取数据错误:", error);
    throw error;
  }
}

/**
 * 
 * @param p_number province code
 * @param c_number city code
 * @param rangeRef 区域参考 2-中圈 3-大圈
 * @param page_number 页数
 * @param page_size 每页数量
 * 
 * 返回数据格式{
    "id": 21176, // girl id
    "user_id": 5941,
    "code_ref": "M96135",
    "name": "闵行童颜巨乳",
    "age": "07",
    "height": "166",
    "weight": "45",
    "bust": "F",
    "skill": "SW#六九#萝莉#可外#可夜",
    "range_ref": 3,
    "price": 3000,
    "priceFlag": 4,
    "province": "上海",
    "p_number": 26,
    "city": "闵行",
    "c_number": 260008,
    "p_jd": "121.4737",
    "p_wd": "31.2304",
    "c_jd": "121.3758",
    "c_wd": "31.1128",
    "address": "闵行七韵美地苑",
    "vx": "",
    "qq": "",
    "xl": "0210007",
    "yn": "",
    "phone": "",
    "remarks": "不洗不冒，翘必究",
    "photo": "/images/vef449mz2174237/ln0i4bv32174238.jpg",
    "top": 0, //置顶
    "today_top": 0, // 今日已置顶
    "state_ref": 2 // 3-已认证 4-天宫
  }
 * 
 */

const guest_headers = {
  accept: "*/*",
  // "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
  // "priority": "u=1, i",
  // "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Google Chrome\";v=\"139\", \"Chromium\";v=\"139\"",
  // "sec-ch-ua-mobile": "?0",
  // "sec-ch-ua-platform": "\"Windows\"",
  // "sec-fetch-dest": "empty",
  // "sec-fetch-mode": "cors",
  // "sec-fetch-site": "same-origin",
  cookie:
    "provinceCode=26; __verify_token=MjQwODo4MjBjOjhmOGY6MjZjMTpiMDRjOmE3OWQ6N2E0NTphNTAwOjE3NTcxNjkyODIwMDA6YTI0YjAyODU0YTUxYTIxYTgyNDM2NWY2NWNlNGEzNmMxYzhjNmNkZThkZTM0MGMxM2EzZjFiOGRiZDEyNjgyZg%3D%3D; connect.sid=s%3Afb75232143c101ed7fff70b5035e8ef5.VTlNpiv%2Fs4XxTUBbjL1FAg4ebHCCArWa9JGeoOu7vyU",
  // "Referer": "https://pig.zwidi.cn/homePage.html"
};
const master_667788_headers = {
  //客服667788
  accept: "*/*",
  "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
  "if-none-match": 'W/"30569-6yXtwWzrLpIgKgAL52HQ4h6kSKI"',
  priority: "u=1, i",
  "sec-ch-ua":
    '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  cookie:
    "provinceCode=26; connect.sid=s%3Ad0df5351210c5beaeb5b30a3dce69d61.weVqqV1rCnUnA9P5238QRQMRDbUwwRim8vJekso03PU; __verify_token=MTcyLjI0NS4xNTIuOTc6MTc1NzE4MDgwMTUzMjo5ZTI2MmUwNDRkMTkzZWU0N2U3ZjA3NjMyNDQ3NDEwMzkxOTU3YjRjMzlhMjA0OTY2ODVmNTEzYjJlZDE4YjZj",
  Referer: "https://pig.zwidi.cn/homePage.html",
};
async function loadHomePageData({
  p_number = 26,
  c_number = 260008,
  rangeRef = 2,
  page_number = 1,
  page_size = 500,
}: {
  p_number: number;
  c_number: number;
  rangeRef: number;
  page_number: number;
  page_size: number;
}) {
  const res = fetch(
    `https://pig.zwidi.cn/api/girl/homePageData?p_number=${p_number}&c_number=${c_number}&rangeRef=${rangeRef}&page_number=${page_number}&page_size=${page_size}`,
    {
      headers: master_667788_headers,
      body: null,
      method: "GET",
    }
  );

  const data = await res;
  const jsonObj = await data.json();
  if (jsonObj.success !== true) {
    console.log(`"fetch error\n`, jsonObj);
  } else {
    const data_array: Array<object> = jsonObj.data;
    console.log(
      `==》page ${page_number}，数据数量：${data_array.length}:\n`,
      data_array[0]
    );
    if (data_array.length > 0) {
      //save json to local file system
      let rangeRefName = "";
      if (rangeRef == 3) {
        rangeRefName = "大圈";
      } else {
        rangeRefName = "中圈";
      }
      const filePath = path.join(
        process.cwd(),
        "json",
        `${rangeRefName}_${getProvinceNameByCode(p_number)}_${getCityNameByCode(
          c_number
        )}_page${page_number}.json`
      );
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(data_array, null, 2));
      console.log("JSON data saved to", filePath);
      // fetch next page
      await loadHomePageData({
        p_number,
        c_number,
        rangeRef,
        page_number: page_number + 1,
        page_size,
      });
    }
  }
}
function getProvinceNameByCode(p_number: number): string | null {
  const province = provinces.province.find((p) => p.p_number === p_number);
  return province
    ? province.name.replace("/", "_").replace(" ", "_").trim()
    : null;
}
function mkdirIfNotExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
function getCityNameByCode(c_number: number): string | null {
  const city = provinces.city.find((p) => p.c_number === c_number);
  return city ? city.name.replace("/", "_").replace(" ", "_").trim() : null;
}

// download images and save to local file system

const downloadImage = async (image_url: string) => {
  const res = await fetch(image_url);
  if (!res.ok) {
    throw new Error(`HTTP error! Status: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const filePath = path.join(process.cwd(), "image.jpeg");
  fs.writeFileSync(filePath, buffer);

  console.log("? Image saved to", filePath);
};

const girls: {}[] = [];

// download().catch(console.error);
/**
 * 
 * @param id 
 * 返回数据格式{
  "success": true,
  "data": {
    "code_ref": "M99688",
    "name": "普陀静静",
    "age": "04",
    "height": "175",
    "weight": "53kg",
    "bust": "36c",
    "skill": "WT#KB#SW#SM#CP#六九#长腿#可外#可夜",
    "price": 1500,
    "province": "上海",
    "p_number": 26,
    "city": "普陀",
    "c_number": 260005,
    "p_jd": "121.4737",
    "p_wd": "31.2304",
    "c_jd": "121.3983",
    "c_wd": "31.2507",
    "address": "南泉苑西乡路91弄-60号",
    "vx": "y1748277",
    "qq": "",
    "xl": "3230",
    "yn": "",
    "phone": "",
    "remarks": "wt+2可口爆",
    "photo": "/images/6pjenhkm6353600/ei4wp55a6353601.jpg",
    "state_ref": 3,
    "photo1": "/images/xqgk5ld96624517/2sjv1yxj6625388.jpg",
    "photo2": "/images/36iwrz3g1232645/cy7hjzlg1232646.jpg",
    "photo3": "/images/36iwrz3g1232645/amiztdet1232670.jpg",
    "photo4": "/images/36iwrz3g1232645/qqzj59i41233115.jpg",
    "photo5": "/images/36iwrz3g1232645/v3xkqn1d1233471.jpg",
    "photo6": "/images/36iwrz3g1232645/antpa32w1233704.jpg",
    "video1": "/images/5xzbs4rp5751353/q0o7fbyu5753140.mp4",
    "video2": "/images/amwtc1y55786413/dimmja7s5786415.mp4",
    "video": "/images/dadodidc2426746/vlsnl52c2426747.mp4"
  }
}
 */

async function getGirlDetails(
  id: number,
  retryCount: number = 0,
  maxRetries: number = 3
): Promise<object | null> {
  try {
    const url = `https://pig.zwidi.cn/api/girl/getGirlById/${id}`;
    const res = await fetch(url, {
      headers: {
        accept: "*/*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        cookie:
          "provinceCode=26; __verify_token=MTcyLjI0NS4xNTIuOTc6MTc1NzE5MzEwNjcxODozOWFmNWNiZDZjODM2MTFhZjdhZmE5YjUxNDEyY2FiNGE3OWZkMjQ4OWU1ZGYyODU4ZDlmOTJlYjJiYjdiMmY4; connect.sid=s%3A16e2cb54cce37fcf067f988af0165b73.H2M50BBe7MOiJH6RM%2BC2ep9gH0IIgp4VBbhVR7JIZs0",
        Referer: "https://pig.zwidi.cn/homePage.html",
      },
      body: null,
      method: "GET",
    });

    const jsonObj = await res.json();
    if (jsonObj.success !== true) {
      console.log(`"fetch error\n`, jsonObj);
      return null;
    } else {
      console.log(`✅ fetch success for url=${url} `, jsonObj);
      const data_obj: any = jsonObj.data;
      console.log(`girl id=${id} details:\n`, data_obj);
      data_obj["id"] = id; // add id field
      data_obj["api_url"] = url; // add id field
      data_obj["web_url"] = "https://pig.zwidi.cn/girlDetails.html?id=" + id; // add id field
      girls.push(data_obj);
      return data_obj;
    }
  } catch (error) {
    console.error(`Error`, error);
    //sleep 1 second then retry
    if (retryCount >= maxRetries) {
      console.error(`Max retries reached for id=${id}. Skipping.`);
      return null;
    } else {
      console.log(`Retrying... (${retryCount + 1}/${maxRetries})`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return getGirlDetails(id, retryCount + 1, maxRetries);
  }
}

export let cachedGirlsData: Array<Girl> = [];

export async function loadAllGirlsJSONData({
  page_no = 1,
  page_size = 500,
  slice_by_page = true,
}: {
  page_no?: number;
  page_size?: number;
  slice_by_page?: boolean;
}) {
  if (cachedGirlsData.length === 0) {
    console.log("json_path", json_path);
    const content = fs.readFileSync(json_path, "utf-8");
    cachedGirlsData = JSON.parse(content);
    console.log(
      `==》loadAllGirlsJSONData，数据数量：${cachedGirlsData.length}:\n`,
      cachedGirlsData[0]
    );
  }
  if (slice_by_page)
    return cachedGirlsData.slice(
      (page_no - 1) * page_size,
      page_no * page_size
    );
  else return cachedGirlsData;
}

export default {
  API_URL,
  fetchUser,
  loadHomePageData,
  downloadImage,
  getCityNameByCode,
  getProvinceNameByCode,
  getGirlDetails,
  mkdirIfNotExists,
  navItems,
  testLoadAllCitiesGirlsData,
  testSaveAllGirlsDetails,
  testSumGilrs,
  mapGirlsToM,
};

/// test code load all cities data
export function testLoadAllCitiesGirlsData() {
  provinces.city.forEach((c) => {
    console.log(
      `${c.p_number}\t${getProvinceNameByCode(c.p_number)}\t${c.c_number}\t${
        c.name
      }`
    );
    loadHomePageData({
      p_number: c.p_number,
      c_number: c.c_number,
      rangeRef: 2, //中圈
      page_number: 1,
      page_size: 500,
    });
    loadHomePageData({
      p_number: c.p_number,
      c_number: c.c_number,
      rangeRef: 3, //大圈
      page_number: 1,
      page_size: 500,
    });
  });
}
// getGirlDetails(21176); 读取json路径文件列表，然后从文件读区数据列表中获取id，然后获取详情

import pLimit from "p-limit";
import prisma from "../../../prisma/database_api";
import { Girl } from "@/generated/prisma";

async function testSaveAllGirlsDetails() {
  const jsonDir = path.join(process.cwd(), "json");
  const files = fs.readdirSync(jsonDir);

  const limit = pLimit(5); // 设置最大并发数为 5

  const allRequests: Promise<void>[] = [];

  for (const file of files) {
    if (file.endsWith(".json")) {
      const filePath = path.join(jsonDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const data_array: Array<{ id: number }> = JSON.parse(content);

      // 使用 limit 来限制并行请求
      const requests = data_array.map(
        (item) => limit(() => getGirlDetails(item.id, 0, 3).then(() => {})) // 包裹请求以确保并发限制
      );
      allRequests.push(...requests); // 将每个请求添加到请求列表中
    }
  }

  // 等待所有请求完成
  await Promise.allSettled(allRequests);

  // 最后保存

  mkdirIfNotExists(path.dirname(json_path));
  if (girls.length > 0) {
    fs.writeFileSync(json_path, JSON.stringify(girls, null, 2), {
      encoding: "utf-8",
      flag: "w",
    });
    console.log(`✅ save all ${girls.length} girls details to`, json_path);
  } else {
    console.log(
      `✅ no data to save all ${girls.length} girls details to`,
      json_path
    );
  }
}

// testSaveAllGirlsDetails();

async function testSumGilrs() {
  mkdirIfNotExists(path.dirname(json_path));
  let content: string = fs.readFileSync(json_path, { encoding: "utf-8" });
  let jsonObj: Array<{
    province: string;
    city: string;
    age: number;
    price: number;
    code_ref: string;
  }> = JSON.parse(content);
  console.log(`✅ read girls ${jsonObj.length}`, typeof jsonObj);
  //filter city girls counts
  const girls = jsonObj.filter((girl) => girl["province"] == "上海");
  console.log(`✅ filter 上海 ${girls.length}`);
}
// testSumGilrs();

export async function filterByArgs({
  city,
  bust,
  tag,
  max_price,
  page_no,
  page_size,
}: {
  city?: string;
  bust?: string;
  tag?: string;
  max_price?: number;
  page_no: number;
  page_size: number;
}) {
  if (cachedGirlsData.length == 0) {
    loadAllGirlsJSONData({ slice_by_page: false });
  }
  const array = cachedGirlsData.filter((item) => {
    if (city) {
      let res = item.province.includes(city) || item.city.includes(city);
      // console.log("includes", res, item.city, city)
      return res;
    }
  });

  console.log(city, array.length);

  let resultData = array.filter((item, idx) => {
    let result = true;
    console.log(
      "item.bust >= bust:",
      item.bust >= (bust ?? "NONE"),
      item.skill.includes(tag ?? "NONE"),
      item.price <= (max_price ?? 0),
      "filter result:",
      result
    );

    if (bust) {
      let math_group = item.bust
        .match(/([A-Za-zＡ-Ｚａ-ｚ])/g)
        ?.map((c) => toHalfWidth(c));

      console.log("math_group:", math_group);
      if (math_group)
        result =
          math_group[0].toLowerCase() > toHalfWidth(bust).toLowerCase() &&
          result;
      else result = false;
    }
    if (tag) result = item.skill.includes(tag) && result;
    if (max_price) result = item.price <= max_price && result;

    return result;
  });

  return {
    length: resultData.length,
    page_data: resultData.slice((page_no - 1) * page_size, page_no * page_size),
  };
}
function toHalfWidth(str: string) {
  return str.replace(/[\uFF21-\uFF3A\uFF41-\uFF5A]/g, (c) => {
    // 全角大写 A-Z \uFF21-\uFF3A
    // 全角小写 a-z \uFF41-\uFF5A
    return String.fromCharCode(c.charCodeAt(0) - 0xfee0);
  });
}

type M = Pick<Girl, "bust" | "name" | "price" | "age" | "height" | "weight">;

function mapGirlsToM(girls: Girl[]): M[] {
  return girls.map(({ bust, name, price, age, height, weight }) => ({
    bust,
    name,
    price,
    age,
    height,
    weight,
  }));
}
// async function testFilter() {
//   const res = await filterByArgs({ max_price: 2000, city: "上海", bust: "d",page_no:1,page_size:200 });
//   const resjson = JSON.stringify(mapGirlsToM(res), null, 2);
//   fs.writeFileSync("./上海D.json", resjson);
//   console.log("===》过滤的人：", res.length);
// }
// testFilter();
export async function query({
  bust,
  max_price,
  tag,
  province,
  offset,
  limit,
}: {
  bust?: string;
  max_price?: number;
  tag?: string;
  province?: string;
  offset: number;
  limit: number;
}) {
  // 共用条件对象
  const where = {
    bust: bust ? { gte: bust.toLowerCase() } : undefined,
    price: max_price ? { lte: max_price } : undefined,
    skill: tag ? { contains: tag } : undefined,
    province: province ? { contains: province } : undefined,
  };

  // 1️⃣ 查数据
  const rows = await prisma.girl.findMany({
    where,
    skip: offset,
    take: limit,
    orderBy: { id: "asc" }, // 建议加排序
  });

  // 2️⃣ 查总数
  const total = await prisma.girl.count({ where });

  console.log(`query result: ${rows.length} / total: ${total}`);

  // 3️⃣ 一起返回
  return {
    total,
    page_data: rows,
  };
}
export function normalizeBust(bust: string) {
  let res: string;
  let math_group = bust
    .match(/([A-Za-zＡ-Ｚａ-ｚ])/g)
    ?.map((c) => toHalfWidth(c));
  console.log("math_group:", math_group);
  if (math_group) {
    res = math_group[0].toLowerCase();
  } else {
    res = "-1";
  }
  return res;
}
export async function insertData(data: Girl[]) {
  const map_data = data.map((girl) => {
    let bust = girl.bust;
    if (bust) {
      bust = normalizeBust(bust);
    }
    return {
      ...girl,
      rank_bust: bust,
    };
  });
  const result = await prisma.girl.createMany({
    data: map_data,
    // skipDuplicates: true as boolean,
  });
  console.log("create result:", result.count);
  return result;
}

export async function insertOne(data: Girl) {
  const res = await prisma.girl.findUnique({
    where: { girl_id: data.girl_id },
  });
  console.log(res);
  if (res) {
    return 0;
  }
  const count = await prisma.girl.create({ data });
  console.log(count);
  return count;
}
