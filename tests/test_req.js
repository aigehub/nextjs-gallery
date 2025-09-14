const result=await fetch("https://proxy.codelin.vip/https://pig.zwidi.cn/api/girl/getGirlById/21713", {
  "headers": {
    "accept": "*/*",
    "accept-language": "zh-CN,zh;q=0.9",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "cookie": "provinceCode=26; connect.sid=s%3A9d2997bc157b5570705cc2c7cc72abc3.cCI8hUcNXzOmWJR89DhzcIz%2FkzCN%2FJ0vVCTaHHudMr4; __verify_token=NjEuMTY5LjE1Mi43NToxNzU3ODIwNzk0MTE5OjFlYTQ2OTc2NGVmMWY5MjE5ZjRjOWZmYTI4OTEyN2VhOTdlYmIwZDMxNWM0MDc5NWM3MDcyOGRjMDhiZTY1Yzk%3D",
    "Referer": "https://pig.zwidi.cn/girlDetails.html?id=21713"
  },
  "body": null,
  "method": "GET"
});
console.log(await result.json())
// { success: false, message: '锁定' }