import { log } from "console";
import data from "../json/all/all_girls_details.json" with {type: "json"};
import { Girl, PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

function normalizeBust(bust:string) {
  let res:string;
   let math_group = bust
        .match(/([A-Za-zＡ-Ｚａ-ｚ])/g)
        ?.map((c) => toHalfWidth(c));
      console.log("math_group:", math_group);
      if (math_group) {
        res = math_group[0].toLowerCase()
      }else{
        res="-1"
      }
      return res
}
function toHalfWidth(str:string) {
  return str.replace(/[\uFF21-\uFF3A\uFF41-\uFF5A]/g, (c) => {
    // 全角大写 A-Z \uFF21-\uFF3A
    // 全角小写 a-z \uFF41-\uFF5A
    return String.fromCharCode(c.charCodeAt(0) - 0xfee0);
  });
}
async function insertData() {
  const map_data = data.map((girl) => {
    const girl_id = girl.id
    let bust = girl.bust
    if (bust) {
     bust=normalizeBust(bust)
    }
    return {
      ...girl,
      girl_id
    }
  });
  const result = await prisma.girl.createMany({ data: map_data });
  console.log("create result:", result.count);

}
async function query({ bust, max_price, tag, province }:{ bust?:string, max_price?:number, tag?:string, province?:string}) {
  const result = await prisma.girl.findMany({
    where: {
      bust: {
        gte: bust?.toLowerCase() ?? ""            // bust >= 90
      },
      price: {
        lte: max_price ?? 10_0000// price <= 200
      },
      skill: {
        contains: tag ?? ""       // skill 包含 'swim'
      },
      province: {
        contains: province ?? ""
      }
    }
  });
  console.log("query result:", result.length);
  return result;
}
async function  update(dataGirl:{where:any|string,update:Girl}){
  // 批量更新
  await prisma.girl.updateMany({
    where: { name: { contains: dataGirl.where } },
    data: { ...dataGirl.update }
  });
}
async function updateBust({where,update}:{where:number;update:string}){
 // 批量更新
  return await prisma.girl.updateMany({
    where: { id: { equals: where } },
    data: { rank_bust:update }
  });

}
// try {
//   await insertData();
// } catch (e) {
//   console.log(e);
//   process.exit(1);
// } finally {
//   await prisma.$disconnect();
// }
async function testFilter(filter:any) {
  
  const dataResult = await query(filter)
  console.log(dataResult.length,dataResult.slice(0,10))
  return dataResult;
}

async function update_test() {
  const origin_data = await testFilter({});

  for (const item of origin_data) {
    const update_bust = normalizeBust(item.bust);
    const result = await updateBust({ where: item.id, update: update_bust });
    console.log("update bust rank:", result);
  }

  // 所有更新做完再断开连接
  await prisma.$disconnect();
}
// update_test()

async function testImages(){
  let images:number[]=[]
  addImages(images)
  log("images:",images)
   const res = await fetch("https://www.zz2025.cc/v1/product/", {
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
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MSwiaXNzIjoiaXNzdWVyIiwiZXhwIjoxNzYxOTY2MjQyfQ.wZfKJwaI6LjcjJMEilW1Zv8-Sugl6lZvzRlD2DlQ3pg",
        // "cookie": "__51vcke__3LXbMpY3HA4LNEfR=3f3b417e-d3c3-56f5-a840-07825429f121; __51vuft__3LXbMpY3HA4LNEfR=1758242696587; __51uvsct__3LXbMpY3HA4LNEfR=3; __vtins__3LXbMpY3HA4LNEfR=%7B%22sid%22%3A%20%22db3a81d8-5596-5dc4-952e-491291bf250b%22%2C%20%22vd%22%3A%202%2C%20%22stt%22%3A%20217248%2C%20%22dr%22%3A%20217248%2C%20%22expires%22%3A%201758299762861%2C%20%22ct%22%3A%201758297962861%7D",
        Referer: "https://www.zz2025.cc/",
      },
      body: JSON.stringify({
        city_code: 100,
        district_code: 0,
        tag: 0,
        page_index: 35,
        premium: false, //false 中圈，true 大圈
      }),
      method: "POST",
    });
console.log(res,await res.json())
}
function addImages(images:number[]){
  images.push(1)
}
// testImages()

