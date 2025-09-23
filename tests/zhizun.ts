/**
 * 至尊
 */
import fs from "fs";
import { mkdirIfNotExists } from "./utils";

const token_json_file = "tests/zhizun/zhizun_token.json";
mkdirIfNotExists("tests/zhizun");

let token: string | null = null;
async function getProduct(params: QUERY_BODY = data) {
  if (!token) {
    token = await checkTokenExpires();
    if (!token) {
      console.log("获取token失败");
      return;
    }
  } else {
    console.log("已有token:", token);
  }

  const res = await fetch("https://www.zz2025.cc/v1/product", {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
      "cache-control": "no-cache, no-store, must-revalidate",
      "content-type": "application/json",
      priority: "u=1, i",
      "sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      token: token,
      //   cookie:
      //     "__vtins__3LXbMpY3HA4LNEfR=%7B%22sid%22%3A%20%221c1c6dd4-1c18-584c-8ad4-e139aeb90c63%22%2C%20%22vd%22%3A%201%2C%20%22stt%22%3A%200%2C%20%22dr%22%3A%200%2C%20%22expires%22%3A%201758244496584%2C%20%22ct%22%3A%201758242696584%7D; __51uvsct__3LXbMpY3HA4LNEfR=1; __51vcke__3LXbMpY3HA4LNEfR=3f3b417e-d3c3-56f5-a840-07825429f121; __51vuft__3LXbMpY3HA4LNEfR=1758242696587",
      Referer: "https://www.zz2025.cc/",
    },
    body: JSON.stringify(params),
    method: "POST",
  });
  if (res.status !== 200) {
    console.log(res, res.status, res.statusText);
    return null;
  }
  try {
    const json_str = await res.json();
    if (json_str && json_str.code === 0) {
      // console.log(res, JSON.stringify(json_str, null, 2));
      mkdirIfNotExists("json/zhizun");
      fs.writeFileSync(`json/zhizun/${params.premium ? "大圈" : "中圈"}zhizun_page_${params.page_index}.json`, JSON.stringify(json_str, null, 2));
      return json_str;
    } else {
      console.log("请求失败:", res, res.status, res.statusText, await res.text());
    }
  } catch (err) {
    console.log("解析json失败:", err);
    return null;
  }
}
async function requestToken() {
  const res = await fetch("https://www.zz2025.cc/v1/token", {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
      "cache-control": "no-cache, no-store, must-revalidate",
      "content-type": "application/json",
      priority: "u=1, i",
      "sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      // cookie:  "__vtins__3LXbMpY3HA4LNEfR=%7B%22sid%22%3A%20%221c1c6dd4-1c18-584c-8ad4-e139aeb90c63%22%2C%20%22vd%22%3A%201%2C%20%22stt%22%3A%200%2C%20%22dr%22%3A%200%2C%20%22expires%22%3A%201758244496584%2C%20%22ct%22%3A%201758242696584%7D; __51uvsct__3LXbMpY3HA4LNEfR=1; __51vcke__3LXbMpY3HA4LNEfR=3f3b417e-d3c3-56f5-a840-07825429f121; __51vuft__3LXbMpY3HA4LNEfR=1758242696587",
      Referer: "https://www.zz2025.cc/",
    },
    body: '{"code":"2088"}',
    method: "POST",
  });
  // const res = await fetch("https://www.zz2025.cc/login", {
  //   headers: {
  //     accept: "application/json, text/plain, */*",
  //     "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
  //     "cache-control": "no-cache, no-store, must-revalidate",
  //     "content-type": "application/json",
  //     priority: "u=1, i",
  //     token:
  //       "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MSwiaXNzIjoiaXNzdWVyIiwiZXhwIjoxNzU5MTA2NzQyfQ.Wbv_b51faizOk663Zuf6VhtuWdz8xYXJfz_AqE8Qs6I",
  //   },
  //   method: "GET",
  // });
  // console.log("verfiryToken res:");
  if (res.status !== 200) {
    console.log("zhizun", res, res.status, res.statusText);
    return null;
  } else {
    const json_str = await res.json();
    console.log("zhizun", res, json_str);
    json_str.expires = Date.now() + 1000 * 60 * 30;//30分钟过期
    fs.writeFileSync(token_json_file, JSON.stringify(json_str, null, 2), {
      encoding: "utf-8",
    });
    return json_str.data.token;
  }
}
export async function checkTokenExpires() {
  try {
    if (fs.existsSync(token_json_file)) {
      const res = fs.readFileSync(token_json_file, { encoding: "utf-8" });
      const json_str = JSON.parse(res);
      const time = new Date(json_str.expires).getTime();
      const now = new Date().getTime();
      if (now > time) {
        return requestToken();
      } else {
        return json_str.data.token;
      }
    }

  } catch (err) {
    console.log("zhizun getToken err:", err);
    return null;
  }
}
async function getTag() {
  const res = await fetch("https://www.zz2025.cc/v1/tag", {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
      "cache-control": "no-cache, no-store, must-revalidate",
      priority: "u=1, i",
      "sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      // "cookie": "__51vcke__3LXbMpY3HA4LNEfR=3f3b417e-d3c3-56f5-a840-07825429f121; __51vuft__3LXbMpY3HA4LNEfR=1758242696587; __vtins__3LXbMpY3HA4LNEfR=%7B%22sid%22%3A%20%22e868ddc9-47a4-5d94-a80f-f4ec55a600d0%22%2C%20%22vd%22%3A%201%2C%20%22stt%22%3A%200%2C%20%22dr%22%3A%200%2C%20%22expires%22%3A%201758297599999%2C%20%22ct%22%3A%201758296124903%7D; __51uvsct__3LXbMpY3HA4LNEfR=2",
      Referer: "https://www.zz2025.cc/",
    },
    body: null,
    method: "GET",
  });
  if (res.status !== 200) {
    console.log(res, res.status, res.statusText);
    return null;
  }
  const json_str = await res.json();
  console.log(res, JSON.stringify(json_str, null, 2));
  mkdirIfNotExists("json/zhizun");
  fs.writeFileSync(`json/zhizun/zhizun_tag.json`, JSON.stringify(json_str, null, 2));
  return json_str;
}

async function getDistrict() {
  const res = await fetch("https://www.zz2025.cc/v1/district", {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
      "cache-control": "no-cache, no-store, must-revalidate",
      priority: "u=1, i",
      "sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      // cookie:
      //   "__51vcke__3LXbMpY3HA4LNEfR=3f3b417e-d3c3-56f5-a840-07825429f121; __51vuft__3LXbMpY3HA4LNEfR=1758242696587; __51uvsct__3LXbMpY3HA4LNEfR=2; __vtins__3LXbMpY3HA4LNEfR=%7B%22sid%22%3A%20%22e868ddc9-47a4-5d94-a80f-f4ec55a600d0%22%2C%20%22vd%22%3A%202%2C%20%22stt%22%3A%2022438%2C%20%22dr%22%3A%2022438%2C%20%22expires%22%3A%201758297599999%2C%20%22ct%22%3A%201758296147341%7D",
      Referer: "https://www.zz2025.cc/",
    },
    body: null,
    method: "GET",
  });
  if (res.status !== 200) {
    console.log(res, res.status, res.statusText);
    return null;
  }
  const json_str = await res.json();
  console.log(res, JSON.stringify(json_str, null, 2));
  mkdirIfNotExists("json/zhizun");
  fs.writeFileSync(`json/zhizun/zhizun_district.json`, JSON.stringify(json_str, null, 2));
  return json_str;
}

const data = {
  city_code: 100,
  district_code: 0,
  tag: 0,
  page_index: 1,
  premium: false, //false 中圈，true 大圈
};
type QUERY_BODY = typeof data;

async function loadAllData() {
  for (let i = 1; i <= 100; i++) {
    data.page_index = i;
    const jsondata = await getProduct({ ...data, page_index: i });
    if (!jsondata || jsondata.code !== 0 || !jsondata.data.product) {
      console.log("获取中圈数据失败，停止，page_index=", i);
      break;
    }
  }
  for (let i = 1; i <= 100; i++) {
    data.page_index = i;
    const jsondata = await getProduct({
      ...data,
      page_index: i,
      premium: true,
    });
    if (!jsondata || jsondata.code !== 0 || !jsondata.data.product) {
      console.log("获取大圈数据失败，停止page_index=", i);
      break;
    }
  }
}

async function getGirlDetails(id: number) {
  const res = await fetch("https://www.zz2025.cc/v1/product/" + id, {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
      "cache-control": "no-cache, no-store, must-revalidate",
      priority: "u=1, i",
      "sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      token: token ?? "",
      // "cookie": "__51vcke__3LXbMpY3HA4LNEfR=3f3b417e-d3c3-56f5-a840-07825429f121; __51vuft__3LXbMpY3HA4LNEfR=1758242696587; __51uvsct__3LXbMpY3HA4LNEfR=3; __vtins__3LXbMpY3HA4LNEfR=%7B%22sid%22%3A%20%22db3a81d8-5596-5dc4-952e-491291bf250b%22%2C%20%22vd%22%3A%202%2C%20%22stt%22%3A%20217248%2C%20%22dr%22%3A%20217248%2C%20%22expires%22%3A%201758299762861%2C%20%22ct%22%3A%201758297962861%7D",
      Referer: "https://www.zz2025.cc/",
    },
    body: null,
    method: "GET",
  });
  if (res.status !== 200) {
    console.log(res, res.status, res.statusText);
    return null;
  }
  const json_str = await res.json();
  // console.log(res, JSON.stringify(json_str, null, 2));
  return json_str;
}

async function saveAllDetails() {
  if (!token) {
    token = await checkTokenExpires();
    if (!token) {
      console.log("获取token失败");
      return;
    }
  } else {
    console.log("已有token:", token);
  }

  const dir = "json/zhizun";
  mkdirIfNotExists(dir);
  const files = fs.readdirSync(dir);
  let all_girls_details: any[] = [];
  for (const file of files) {
    if (file.startsWith("中圈") || file.startsWith("大圈")) {
      const fullpath = dir + "/" + file;
      console.log("处理文件：", fullpath);
      const res = fs.readFileSync(fullpath, { encoding: "utf-8" });
      const jsondata = JSON.parse(res);
      if (jsondata && jsondata.code === 0 && jsondata.data.product) {
        for (let i = 0; i < jsondata.data.product.length; i++) {
          const json_data = await getGirlDetails(jsondata.data.product[i].id);
          if (json_data) {
            all_girls_details.push(json_data);
            // break;
          }
        }
      }
    }
  }
  console.log("所有详情数据：", all_girls_details.length);
  fs.writeFileSync(`json/all/zhizun_all_girls_details.json`, JSON.stringify(all_girls_details, null, 2));
}

export { getTag, getDistrict, loadAllData, saveAllDetails };
