// import fs from "fs";
// const result = await fetch("https://test.xn--fiqa24e59ix1fezpezjsm1b4qeqwm.com:2000/13773/1957334697029668864.jpg", {
//   "headers": {
//     "accept": "application/json, text/plain, */*",
//     "cache-control": "public, max-age=31536000",
//     "sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"",
//     "sec-ch-ua-mobile": "?1",
//     "sec-ch-ua-platform": "\"Android\"",
//     "source": "blob",
//     // "Referer": "https://www.zz2025.cc/"
//   },
//   "body": null,
//   "method": "GET"
// });
// console.log(result, result.status, result.statusText);
// fs.writeFileSync("tests/req_result.jpg", Buffer.from(await result.arrayBuffer()));
// // { success: false, message: '锁定' }

const { default: Hls } = require("hls.js");

const result = await fetch("https://test.xn--fiqa24e59ix1fezpezjsm1b4qeqwm.com:2000/key/enc.key", {
  "headers": {
    "accept": "*/*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
    "sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    // "sec-fetch-mode": "cors",
    // "sec-fetch-site": "cross-site",
    "Referer": "https://www.zz2025.cc/",
    "Origin": "https://www.zz2025.cc/",
  },
  "body": null,
  "method": "GET"
});
console.log(result, result.status, result.statusText);
// let hls=new Hls()
// hls.loadSource()
// hls.logger.log()