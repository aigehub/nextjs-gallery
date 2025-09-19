import { log } from "console";
import { get } from "http";

async function getProduct() {
  const res = await fetch("https://www.zz2025.cc/v1/product", {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
      "cache-control": "no-cache, no-store, must-revalidate",
      "content-type": "application/json",
      priority: "u=1, i",
      "sec-ch-ua":
        '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MSwiaXNzIjoiaXNzdWVyIiwiZXhwIjoxNzU5MTA2NzQyfQ.Wbv_b51faizOk663Zuf6VhtuWdz8xYXJfz_AqE8Qs6I",
    //   cookie:
    //     "__vtins__3LXbMpY3HA4LNEfR=%7B%22sid%22%3A%20%221c1c6dd4-1c18-584c-8ad4-e139aeb90c63%22%2C%20%22vd%22%3A%201%2C%20%22stt%22%3A%200%2C%20%22dr%22%3A%200%2C%20%22expires%22%3A%201758244496584%2C%20%22ct%22%3A%201758242696584%7D; __51uvsct__3LXbMpY3HA4LNEfR=1; __51vcke__3LXbMpY3HA4LNEfR=3f3b417e-d3c3-56f5-a840-07825429f121; __51vuft__3LXbMpY3HA4LNEfR=1758242696587",
      Referer: "https://www.zz2025.cc/",
    },
    body: '{"city_code":100,"district_code":0,"tag":0,"page_index":1,"premium":true}',
    method: "POST",
  });
    const json_str = await res.json();
  console.log(res, JSON.stringify(json_str,null,2));
}
async function verfiryToken() {
  //   fetch("https://www.zz2025.cc/v1/token", {
  //     headers: {
  //       accept: "application/json, text/plain, */*",
  //       "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
  //       "cache-control": "no-cache, no-store, must-revalidate",
  //       "content-type": "application/json",
  //       priority: "u=1, i",
  //       "sec-ch-ua":
  //         '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
  //       "sec-ch-ua-mobile": "?1",
  //       "sec-ch-ua-platform": '"Android"',
  //       "sec-fetch-dest": "empty",
  //       "sec-fetch-mode": "cors",
  //       "sec-fetch-site": "same-origin",
  //       cookie:
  //         "__vtins__3LXbMpY3HA4LNEfR=%7B%22sid%22%3A%20%221c1c6dd4-1c18-584c-8ad4-e139aeb90c63%22%2C%20%22vd%22%3A%201%2C%20%22stt%22%3A%200%2C%20%22dr%22%3A%200%2C%20%22expires%22%3A%201758244496584%2C%20%22ct%22%3A%201758242696584%7D; __51uvsct__3LXbMpY3HA4LNEfR=1; __51vcke__3LXbMpY3HA4LNEfR=3f3b417e-d3c3-56f5-a840-07825429f121; __51vuft__3LXbMpY3HA4LNEfR=1758242696587",
  //       Referer: "https://www.zz2025.cc/",
  //     },
  //     body: '{"code":"2088"}',
  //     method: "POST",
  //   });
  const res = await fetch("https://www.zz2025.cc/login", {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
      "cache-control": "no-cache, no-store, must-revalidate",
      "content-type": "application/json",
      priority: "u=1, i",
      token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MSwiaXNzIjoiaXNzdWVyIiwiZXhwIjoxNzU5MTA2NzQyfQ.Wbv_b51faizOk663Zuf6VhtuWdz8xYXJfz_AqE8Qs6I",
    },
    method: "GET",
  });
  console.log("verfiryToken res:");
  if (res.status !== 200) {
    console.log(res.status,res.statusText);
    return;
  } else {
    console.log(res, await res.text());
  }
}
getProduct();
// verfiryToken();
