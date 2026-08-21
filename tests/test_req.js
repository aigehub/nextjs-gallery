// import fs from "fs";
// const result = await fetch("https://test.xn--fiqa24e59ix1fezpezjsm1b4qeqwm.com:2000/13773/1957334697029668864.jpg", {
//   "headers": {
//     "accept": "application/json, text/plain, */*",
//     "cache-control": "public, max-age=31536000",
//     "sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"",
//     "sec-ch-ua-mobile": "?1",
//     "sec-ch-ua-platform": "\"Android\"",
//     "source": "blob",
//     // "Referer": "https://xc.xz0377.com/"
//   },
//   "body": null,
//   "method": "GET"
// });
// console.log(result, result.status, result.statusText);
// fs.writeFileSync("tests/req_result.jpg", Buffer.from(await result.arrayBuffer()));
// // { success: false, message: '锁定' }




// let hls=new Hls()
// hls.loadSource()
// hls.logger.log()


const result = await fetch("https://dailybing.com/api/v1", {
  "headers": {
    // "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "priority": "u=0, i",
    "sec-ch-ua": "\"Google Chrome\";v=\"141\", \"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"141\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "cookie": "LangSet=zh-cn; __51vcke__3HNxp0IE54gaunRy=a8ea7643-5197-59ed-b1ac-f102b6e4c212; __51vuft__3HNxp0IE54gaunRy=1761550946423; Hm_lvt_72116ab6d9030aac74bf03a6343f5941=1761550947; HMACCOUNT=8FC017D8559F80D6; PHPSESSID=86dd1431a17e7550bcb9bde7c4903a95; __vtins__3HNxp0IE54gaunRy=%7B%22sid%22%3A%20%22c9423c06-d0f2-5e01-8adb-96ace6cdda69%22%2C%20%22vd%22%3A%201%2C%20%22stt%22%3A%200%2C%20%22dr%22%3A%200%2C%20%22expires%22%3A%201761558087567%2C%20%22ct%22%3A%201761556287567%7D; __51uvsct__3HNxp0IE54gaunRy=2; Hm_lpvt_72116ab6d9030aac74bf03a6343f5941=1761556288"
  },
  "body": null,
  "method": "GET"
});

console.log(result, result.status, result.statusText);
