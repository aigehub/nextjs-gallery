import fs from "fs";
export let COCKIES: string[] = [];
async function userLogin() {
  const res = await fetch("https://pig.zwidi.cn/api/auth/userLogin", {
    headers: {
      accept: "*/*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
      "content-type": "application/json",
      // "priority": "u=1, i",
      // "sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"",
      // "sec-ch-ua-mobile": "?0",
      // "sec-ch-ua-platform": "\"Windows\"",
      // "sec-fetch-dest": "empty",
      // "sec-fetch-mode": "cors",
      // "sec-fetch-site": "same-origin",
      // "cookie": "provinceCode=26; __verify_token=MTM5LjIyNi4xNjEuNTg6MTc1ODEyOTI5ODExMTo1NDk3NWIyYmI5YzA1MmM0MmZiNDg2MDAwZWNlMjg3YzFkYTg1NmNhODU3NDRjMWM5ZTM0ZTc1NjNhMmU5OWFl; connect.sid=s%3A07f3eff0e11640328ce5dcfb9d0b03ea.s4dxBTqy97xFpxS1UCuEeOutTucAiAztksebHvnjkQc",
      Referer: "https://pig.zwidi.cn/userlogin.html",
    },
    body: '{"username":"667788","password":"667788"}',
    method: "POST",
  });
  if (res.status == 200) {
    console.log(res, await res.json());
    const cockies = res.headers.getSetCookie();
    console.log(cockies);
    parseCockie(cockies);
    return true;
  } else {
    console.log(res.status, await res.text(), await res.json());
  }
  return false;
}
let data_string: string | undefined;
function parseCockie(cockies: string[]) {
  COCKIES = [];
  cockies.forEach((item) => {
    const array = item.split(";");
    const first = array[0];
    COCKIES.push(first);
    if (!data_string)
      data_string = array.find((value, index, array) => {
        if (value.includes("Expires=")) {
          const date = Date.parse(value.replace("Expires=", ""));
          console.log("parse date ", date);
          return `${date}`;
        }
      });
  });

  console.log("all cockies array:", COCKIES);
  const data = {
    cockies: COCKIES,
    expires: "",
  };
  if (data_string) {
    console.log("data_string:", data_string);
    data.expires = new Date(Date.parse(data_string)).toISOString();
  }
  fs.writeFileSync("./cockie.json", JSON.stringify(data, null, 2), {
    encoding: "utf-8",
  });
}
async function userAuth() {
  const res = await fetch("https://pig.zwidi.cn/api/auth/user", {
    headers: {
      accept: "*/*",
      "accept-language": "zh-CN,zh;q=0.9",
      priority: "u=1, i",
      "sec-ch-ua":
        '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      // "cookie": "provinceCode=26; __verify_token=MTM5LjIyNi4xNjEuNTg6MTc1ODEzMDYyMDY0NTpjYmU2YmU3OWJlNWYwZDBjMTQyNTkwNDNiOGU1MTZhYTA5YTE0NzU5OTQ3NGE3ZjJjOGEwMzljOGZiMDEzMzUz; connect.sid=s%3Aa0155c61e8548f28a2a70e762be56dc2.dCT5Nig0V0deip3d9pu6gqPdwoZqQQzUG3XapLU%2BS8M",
      Referer: "https://pig.zwidi.cn/homePage.html",
    },
    body: null,
    method: "GET",
  });
  console.log(res, await res.json());
}
const json = {
  cockies: [
    "provinceCode=26",
    "__verify_token=MTM5LjIyNi4xNjEuNTg6MTc1ODEzNDY4ODU1Njo2Mjc0Y2I1ZTBlOWY4NzFlZTc5NWMwMGVkOGFkY2M3NWFlY2E3MjYxNWI2MTNkYTFhZjJhODE4MzY5MGY1OWJh",
    "connect.sid=s%3A14dc99e7720042fd4b342e9922469fb3.vTdv3pAb%2FAC7WLAYJ3KWtBqeurGB1MjbZwK5qP1WgXI",
  ],
  expires: "2025-09-18T06:44:48.000Z",
};
type COCKIES_TYPE = typeof json;

async function checkExpires() {
  const res = fs.readFileSync("./cockie.json", { encoding: "utf-8" });
  const cockie: COCKIES_TYPE = JSON.parse(res);
  COCKIES = cockie.cockies;
  if (Date.now() > Date.parse(cockie.expires)) {
    await userLogin();
  }
  return true;
}
export default checkExpires;
// userLogin();
