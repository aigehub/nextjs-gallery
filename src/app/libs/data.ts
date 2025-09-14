import { Girl } from "@/generated/prisma";
import prisma from "../../../prisma/database_api";
export let cachedGirlsData: Array<Girl> = [];
export const PAGE_SIZE = 20; // 每页显示的图片数量
export async function filterByArgs({
  city,
  bust,
  tag,
  max_price,
  page_no,
  page_size,
}: {
  city?: string;
  bust?: string;
  tag?: string;
  max_price?: number;
  page_no: number;
  page_size: number;
}) {
  if (cachedGirlsData.length == 0) {
    const { total, page_data } = await queryData({});
    cachedGirlsData = page_data;
  }
  const array = cachedGirlsData.filter((item) => {
    if (city) {
      let res = item.province.includes(city) || item.city.includes(city);
      // console.log("includes", res, item.city, city)
      return res;
    }
  });

  console.log(city, array.length);

  let resultData = array.filter((item, idx) => {
    let result = true;
    console.log(
      "item.bust >= bust:",
      item.bust >= (bust ?? "NONE"),
      item.skill.includes(tag ?? "NONE"),
      item.price <= (max_price ?? 0),
      "filter result:",
      result
    );

    if (bust) {
      let math_group = item.bust
        .match(/([A-Za-zＡ-Ｚａ-ｚ])/g)
        ?.map((c) => toHalfWidth(c));

      console.log("math_group:", math_group);
      if (math_group)
        result =
          math_group[0].toLowerCase() > toHalfWidth(bust).toLowerCase() &&
          result;
      else result = false;
    }
    if (tag) result = item.skill.includes(tag) && result;
    if (max_price) result = item.price <= max_price && result;

    return result;
  });

  return {
    length: resultData.length,
    page_data: resultData.slice((page_no - 1) * page_size, page_no * page_size),
  };
}
function toHalfWidth(str: string) {
  return str.replace(/[\uFF21-\uFF3A\uFF41-\uFF5A]/g, (c) => {
    // 全角大写 A-Z \uFF21-\uFF3A
    // 全角小写 a-z \uFF41-\uFF5A
    return String.fromCharCode(c.charCodeAt(0) - 0xfee0);
  });
}

type M = Pick<Girl, "bust" | "name" | "price" | "age" | "height" | "weight">;

function mapGirlsToM(girls: Girl[]): M[] {
  return girls.map(({ bust, name, price, age, height, weight }) => ({
    bust,
    name,
    price,
    age,
    height,
    weight,
  }));
}
// async function testFilter() {
//   const res = await filterByArgs({ max_price: 2000, city: "上海", bust: "d",page_no:1,page_size:200 });
//   const resjson = JSON.stringify(mapGirlsToM(res), null, 2);
//   fs.writeFileSync("./上海D.json", resjson);
//   console.log("===》过滤的人：", res.length);
// }
// testFilter();
export async function queryData({
  bust,
  max_price,
  tag,
  province,
  offset = 1,//page no
  limit = PAGE_SIZE,
}: {
  bust?: string;
  max_price?: number;
  tag?: string;
  province?: string;
  offset?: number;
  limit?: number;
}) {
  // 共用条件对象
  const where = {
    bust: bust ? { gte: bust.toLowerCase() } : undefined,
    price: max_price ? { lte: max_price } : undefined,
    skill: tag ? { contains: tag } : undefined,
    province: province ? { contains: province } : undefined,
  };

  // 1️⃣ 查数据
  const rows = await prisma.girl.findMany({
    where,
    skip: (offset - 1) * limit,
    take: limit,
    orderBy: { id: "asc" }, // 建议加排序
  });

  // 2️⃣ 查总数
  const total = await prisma.girl.count({ where });

  console.log(`query result: ${rows.length} / total: ${total}`);

  // 3️⃣ 一起返回
  return {
    total,
    page_data: rows,
  };
}
function normalizeBust(bust: string) {
  let res: string;
  let math_group = bust
    .match(/([A-Za-zＡ-Ｚａ-ｚ])/g)
    ?.map((c) => toHalfWidth(c));
  console.log("math_group:", math_group);
  if (math_group) {
    res = math_group[0].toLowerCase();
  } else {
    res = "-1";
  }
  return res;
}
type GIRL_JSON = typeof import("../../../json/all/all_girls_details.json");

export async function mapData(data: GIRL_JSON) {
  const map_data = data.map((girl) => {
    const { id, ...rest } = girl;
    const girl_id = id;
    let bust = girl.bust;
    if (bust) {
      bust = normalizeBust(bust);
    }
    return {
      ...rest,
      rank_bust: bust,
      girl_id,
    };
  });
  return map_data;
}
export async function insertData(data: Girl[]) {
  const map_data = await mapData(data);
  const result = await prisma.girl.createMany({
    data: map_data,
    // skipDuplicates: true as boolean,
  });
  console.log("create result:", result.count);
  return result;
}

export async function insertOne(data: Girl) {
  const res = await prisma.girl.findUnique({
    where: { girl_id: data.girl_id },
  });
  console.log(res);
  if (res) {
    return 0;
  }
  const { id, ...rest } = data;
  const count = await prisma.girl.create({ data: rest });
  console.log(count);
  return count;
}
