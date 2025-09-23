import fs, { mkdir } from "fs";
import { mkdirIfNotExists } from "./utils";
const dir = "json/58kv";
const save_character_path = "tests/58kv/58kv_character.json";
const save_token_path = "tests/58kv/58kv_token.json";
mkdirIfNotExists("tests/58kv");
mkdirIfNotExists(dir);

const token_temp = {
  code: 0,
  msg: "success",
  data: {
    accessTokenExpire: "2025-09-27 01:16:00",
    refreshTokenExpire: "2025-09-27 01:16:00",
    access_token: "c3280fb144ce4477899f96fde43e85ee",
    refresh_token: "39f7940365c54406b0f586d10f3a7c84",
  },
};
type TOKEN_TYPE = typeof token_temp;
async function getCharacterList() {
  await checkExpires();
  if (!tokenObj) {
    console.log("tokenObj is null");
    return null;
  }
  const res = await fetch("https://58kv.com/api/sys/lady/getCharacteristic", {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
      authorization: tokenObj ? tokenObj.data.access_token : "",
      "sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      Referer: "https://58kv.com/",
    },
    body: null,
    method: "GET",
  });
  const jsonData = await res.json();
  console.log(res, jsonData);
  fs.writeFileSync(save_character_path, JSON.stringify(jsonData, null, 2));
}
let tokenObj: TOKEN_TYPE | null = null;

async function checkExpires() {
  try {
    if (fs.existsSync(save_token_path) == false) {
      tokenObj = await authAlbum();
      return tokenObj;
    }
    const res = fs.readFileSync(save_token_path, { encoding: "utf-8" });
    tokenObj = JSON.parse(res);
    if (tokenObj && Date.now() > Date.parse(tokenObj.data.accessTokenExpire)) {
      //过期重新获取
      tokenObj = await authAlbum();
      return tokenObj;
    }
    console.log("5bkv tokenObj is valid:", tokenObj);
    return true;
  } catch (error) {
    console.log("5bkv read tokenObj.json error:", error);
    tokenObj = await authAlbum();
    return tokenObj;
  }
}
async function authAlbum() {
  try {
    const res = await fetch("https://58kv.com/api/sys/user/authalbum", {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
        authorization: "",
        "content-type": "application/json",
        "sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        Referer: "https://58kv.com/",
      },
      body: '{"invitecode":"","albumpwd":"58"}',
      method: "POST",
    });
    if (res.status == 200) {
      const jsonData = await res.json();
      console.log(res, JSON.stringify(jsonData, null, 2));
      mkdirIfNotExists("tests/58kv");
      fs.writeFileSync(save_token_path, JSON.stringify(jsonData, null, 2));
      return jsonData;
    } else {
      console.log(res.status, await res.text());
      return null;
    }
  } catch (error) {
    console.log("5bkv read token error:", error);
  }
  return null;
}
let queryPageParam = {
  ladytype: "1", //1:中圈 2: 大圈
  nameLadyid: "",
  accuracy: "",
  page: "1",
  limit: "500",
  dimension: "0",
  adcode: "310100", //地区
};
type queryPageParamType = typeof queryPageParam;
async function getPageData(queryPageParam: queryPageParamType) {
  await checkExpires();
  if (!tokenObj) {
    console.log("tokenObj is null");
    return null;
  }
  // nameLadyid=&page=${}&limit=${}&ladytype=1&accuracy=&dimension=&adcode=310100
  let query = new URLSearchParams({
    ...queryPageParam,
    limit: "500",
  });
  const query_str = query.toString();
  console.log("query:", query_str);
  const res = await fetch("https://58kv.com/api/sys/lady/page?" + query_str, {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
      authorization: tokenObj ? tokenObj.data.access_token : "",
      "sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      Referer: "https://58kv.com/",
    },
    body: null,
    method: "GET",
  });
  if (res.status == 200) {
    const jsonData = await res.json();
    // console.log(res, JSON.stringify(jsonData, null, 2));
    mkdirIfNotExists("json/58kv");
    if (jsonData.code !== 0 || !jsonData.data) {
      console.log("获取58kv数据失败:", jsonData);
      return jsonData;
    }
    fs.writeFileSync(
      `json/58kv/${queryPageParam.ladytype == "1" ? "中圈" : "大圈"}58kv_page_${queryPageParam.page}.json`,
      JSON.stringify(jsonData, null, 2)
    );
    return jsonData;
  } else {
    console.log(res.status, await res.text());
    return null;
  }
}

async function loadAllData() {
  for (let i = 1; i <= 100; i++) {
    queryPageParam.page = `${i}`;
    const jsondata = await getPageData({ ...queryPageParam, page: `${i}` });
    if (!jsondata || jsondata.code !== 0 || (jsondata.data && jsondata.data.list && jsondata.data.list.length === 0)) {
      console.log("获取58kv 中圈数据失败，停止 index:", i);
      break;
    }
  }
  for (let i = 1; i <= 100; i++) {
    queryPageParam.page = `${i}`;
    const jsondata = await getPageData({
      ...queryPageParam,
      page: `${i}`,
      ladytype: "2",
    });
    if (!jsondata || jsondata.code !== 0 || (jsondata.data && jsondata.data.list && jsondata.data.list.length === 0)) {
      console.log("获取58kv 大圈数据失败，停止 index:", i);
      break;
    }
  }
}
async function saveAllDetails() {
  await checkExpires();

  if (!tokenObj) {
    console.log("tokenObj is null");
    return null;
  }
  let all_58kv_data: any = [];

  const files = fs.readdirSync(dir);
  for (let i = 0; i < files.length; i++) {
    const fullpath = dir + "/" + files[i];
    console.log("处理读取文件：", fullpath);
    const res = fs.readFileSync(fullpath, { encoding: "utf-8" });
    const jsondata = JSON.parse(res);
    all_58kv_data.push(...jsondata.data.list);
  }
  console.log("所有58kv数据：", all_58kv_data.length);
  mkdirIfNotExists("json/all");
  fs.writeFileSync(`json/all/all_58kv_data.json`, JSON.stringify(all_58kv_data, null, 2));
}
export { getCharacterList, authAlbum, loadAllData, saveAllDetails, checkExpires };
// getCharacterList();
// authAlbum();
// loadAllData();
// saveAllDetails();
