import { json } from "stream/consumers";

async function getCharacterList() {
  const res = await fetch("https://58kv.com/api/sys/lady/getCharacteristic", {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
      authorization: "73ce2d482730403c8792d91b0afee763",
      "sec-ch-ua":
        '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
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
  console.log(res, await res.json());
}
async function getPageData() {
  fetch(
    "https://58kv.com/api/sys/lady/page?nameLadyid=&page=1&limit=10&ladytype=1&accuracy=&dimension=&adcode=310100",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
        authorization: "73ce2d482730403c8792d91b0afee763",
        "sec-ch-ua":
          '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        Referer: "https://58kv.com/",
      },
      body: null,
      method: "GET",
    }
  );
}
getCharacterList();
