import fs from "fs";
import * as path from "path";
import * as provinces from "../src/app/libs/provinces.json";
import pLimit from "p-limit";
import { Girl } from "@/generated/prisma";

const API_URL = "https://pig.zwidi.cn/";
const cookie =
  "provinceCode=26; connect.sid=s%3A9d2997bc157b5570705cc2c7cc72abc3.cCI8hUcNXzOmWJR89DhzcIz%2FkzCN%2FJ0vVCTaHHudMr4; __verify_token=NjEuMTY5LjE1Mi43NToxNzU3ODIwNzk0MTE5OjFlYTQ2OTc2NGVmMWY5MjE5ZjRjOWZmYTI4OTEyN2VhOTdlYmIwZDMxNWM0MDc5NWM3MDcyOGRjMDhiZTY1Yzk%3D";

const json_path = path.join(process.cwd(), "json", "all", "all_girls_details.json");

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
  // "Referer": "https://pig.zwidi.cn/homePage.html"
};
const master_667788_headers = {
  //客服667788
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "accept-language": "zh-CN,zh;q=0.9",
  "cache-control": "max-age=0",
  priority: "u=0, i",
  cookie: COCKIES.join(";"),
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
  console.log(JSON.stringify(master_667788_headers, null, 2));
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
    console.log(`jimei loadHomePageData fetch error`, jsonObj);
    if (jsonObj.message == "锁定" || jsonObj.message == "会话已过期") return jsonObj.message;
  } else {
    const data_array: Array<object> = jsonObj.data;
    console.log(`==》page ${page_number}，数据数量：${data_array.length}:\n`, data_array[0]);
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
        "jimei",
        `${rangeRefName}_${getProvinceNameByCode(p_number)}_${getCityNameByCode(c_number)}_page${page_number}.json`
      );
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(data_array, null, 2));
      console.log("JSON data saved to", filePath);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // fetch next page
      await loadHomePageData({
        p_number,
        c_number,
        rangeRef,
        page_number: page_number + 1,
        page_size,
      });
    }
    return true;
  }
}
function getProvinceNameByCode(p_number: number): string | null {
  const province = provinces.province.find((p) => p.p_number === p_number);
  return province ? province.name.replace("/", "_").replace(" ", "_").trim() : null;
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
// fetch("https://pig.zwidi.cn/homePage.html", {
//   "headers": {
//     "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
//     "accept-language": "zh-CN,zh;q=0.9",
//     "cache-control": "max-age=0",
//     "if-modified-since": "Sat, 30 Aug 2025 00:31:43 GMT",
//     "if-none-match": "W/\"489c-198f863236c\"",
//     "priority": "u=0, i",
//     "sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-platform": "\"Windows\"",
//     "sec-fetch-dest": "document",
//     "sec-fetch-mode": "navigate",
//     "sec-fetch-site": "same-origin",
//     "sec-fetch-user": "?1",
//     "upgrade-insecure-requests": "1",
//     "cookie": "provinceCode=26; connect.sid=s%3A9d2997bc157b5570705cc2c7cc72abc3.cCI8hUcNXzOmWJR89DhzcIz%2FkzCN%2FJ0vVCTaHHudMr4; __verify_token=NjEuMTY5LjE1Mi43NToxNzU3ODIwNzk0MTE5OjFlYTQ2OTc2NGVmMWY5MjE5ZjRjOWZmYTI4OTEyN2VhOTdlYmIwZDMxNWM0MDc5NWM3MDcyOGRjMDhiZTY1Yzk%3D",
//     "Referer": "https://pig.zwidi.cn/userlogin.html"
//   },
//   "body": null,
//   "method": "GET"
// });
async function getGirlDetails(id: number, retryCount: number = 0, maxRetries: number = 3): Promise<object | null> {
  try {
    const url = `https://pig.zwidi.cn/api/girl/getGirlById/${id}`;
    const res = await fetch(url, {
      headers: master_667788_headers,
      body: null,
      method: "GET",
    });

    const jsonObj = await res.json();
    if (jsonObj.success !== true) {
      console.log("jimei getGirlDetails", `fetch error`, jsonObj);
      return null;
    } else {
      if (jsonObj.messaage == "锁定" || jsonObj.messaage == "会话已过期") {
        console.log(res, "被锁定了，不再继续请求");
        return jsonObj.messaage;
      }
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

async function loadAllGirlsJSONData({
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
    console.log(`==》loadAllGirlsJSONData，数据数量：${cachedGirlsData.length}:\n`, cachedGirlsData[0]);
  }
  if (slice_by_page) return cachedGirlsData.slice((page_no - 1) * page_size, page_no * page_size);
  else return cachedGirlsData;
}

export {
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
};

/// test code load all cities data
async function testLoadAllCitiesGirlsData() {
  // await checkExpires();
  const conut = provinces.city.length;
  for (let i = 0; i < conut; i++) {
    const c = provinces.city[i];
    console.log("jimei provinces.city:", `${c.p_number}\t${getProvinceNameByCode(c.p_number)}\t${c.c_number}\t${c.name}`);
    const res = await loadHomePageData({
      p_number: c.p_number,
      c_number: c.c_number,
      rangeRef: 2, //中圈
      page_number: 1,
      page_size: 500,
    });
    if (res == "锁定" || res == "会话已过期") {
      console.log(res, "被锁定了，不再继续请求");
      break;
    }
    await loadHomePageData({
      p_number: c.p_number,
      c_number: c.c_number,
      rangeRef: 3, //大圈
      page_number: 1,
      page_size: 500,
    });
  }
}
// getGirlDetails(21176); 读取json路径文件列表，然后从文件读区数据列表中获取id，然后获取详情

async function testSaveAllGirlsDetails() {
  const jsonDir = path.join(process.cwd(), "json", "jimei");
  const files = fs.readdirSync(jsonDir);

  console.log("files.length:", files.length);
  const limit = pLimit(5); // 设置最大并发数为 5

  const allRequests: Promise<void>[] = [];

  for (const file of files) {
    if (file.endsWith(".json")) {
      const filePath = path.join(jsonDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const data_array: Array<{ id: number }> = JSON.parse(content);

      // 使用 limit 来限制并行请求
      let requests: any[] = [];
      for (const item of data_array) {
        requests.push(
          limit(
            async () => {
              const res = await getGirlDetails(item.id, 0, 3);
              if (res instanceof String && (res == "锁定" || res == "会话已过期")) {
                console.log(res, "被锁定了，不再继续请求");
                throw Error("被锁定了，不再继续请求");
              }
            } // 包裹请求以确保并发限制
          )
        );
        allRequests.push(...requests); // 将每个请求添加到请求列表中
      }
    }
  }

  // 等待所有请求完成
  await Promise.all(allRequests);

  // 最后保存

  mkdirIfNotExists(path.dirname(json_path));
  if (girls.length > 0) {
    fs.writeFileSync(json_path, JSON.stringify(girls, null, 2), {
      encoding: "utf-8",
      flag: "w",
    });
    console.log(`✅ save all ${girls.length} girls details to`, json_path);
  } else {
    console.log(`✅ no data to save all ${girls.length} girls details to`, json_path);
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
// testSumGilrs()
import { insertOne, mapData, queryData } from "../src/app/libs/data";
import { COCKIES, checkTokenExpires } from "./jimei_userLogin";
// import data from "../json/all/all_girls_details.json" with {type: "json"};

async function spide_jimei() {
  const res = await checkTokenExpires();
  if (!res) {
    return;
  }
  // await testLoadAllCitiesGirlsData();
  // await testSaveAllGirlsDetails();
  const data = await import("../json/all/all_girls_details.json");
  const map_data = await mapData(data.default);
  console.log("map_data.length:", map_data.length, map_data[0]);
  // insert to db
  for (let i = 0; i < map_data.length; i++) {
    const item = map_data[i];
    const girl = { id: item.girl_id, ...item };
    await insertOne(girl);
  }
}

async function count_total() {
  const result = await queryData({});
  console.log(result.total);
}

// try {
//   spide_jimei();
//   count_total();
// } catch (e) {
//   console.log("spide_jimei error:", e);
//   if (e instanceof Error) {
//     console.log(e.stack);
//   }
// }
