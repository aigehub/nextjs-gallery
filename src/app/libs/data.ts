import { Girl } from "@/generated/prisma";
import prisma from "../../../prisma/database_api";
export let cachedGirlsData: Array<any> = [];
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
      let math_group = item.bust.match(/([A-Za-zＡ-Ｚａ-ｚ])/g)?.map((c: string) => toHalfWidth(c));

      console.log("math_group:", math_group);
      if (math_group) result = math_group[0].toLowerCase() > toHalfWidth(bust).toLowerCase() && result;
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

// async function testFilter() {
//   const res = await filterByArgs({ max_price: 2000, city: "上海", bust: "d",page_no:1,page_size:200 });
//   const resjson = JSON.stringify(mapGirlsToM(res), null, 2);
//   fs.writeFileSync("./上海D.json", resjson);
//   console.log("===》过滤的人：", res.length);
// }
// testFilter();
export type PLAT = number; //"jimei" | "zhizun" |58kv" ;
export async function queryData({
  bust,
  max_price,
  tag,
  province,
  district_name,
  name,
  offset = 1, //page no
  limit = PAGE_SIZE,
  platform = 1,
}: {
  bust?: string;
  max_price?: number;
  tag?: string;
  name?: string;
  province?: string;
  district_name?: string;
  offset?: number;
  limit?: number;
  platform?: PLAT;
}) {
  console.log("queryData params:", { bust, max_price, tag, province, district_name, name, offset, limit, platform });
  switch (platform) {
    case 1: //"jimei":
      // 共用条件对象
      // 拆分每个字段并注释含义，提升可维护性
      const orConditions = [];
      // 按名称模糊查询
      if (name) orConditions.push({ name: { contains: name } });
      // 按 code_ref 模糊查询
      if (name) orConditions.push({ code_ref: { contains: name } });

      const where = {
        // 多条件 OR 查询
        ...(orConditions.length > 0 ? { OR: orConditions } : {}),
        // 胸围大于等于指定值
        ...(bust ? { bust: { gte: bust.toLowerCase() } } : {}),
        // 价格小于等于指定值
        ...(max_price ? { price: { lte: max_price } } : {}),
        // 技能包含指定标签
        ...(tag ? { skill: { contains: tag } } : {}),
        // 省份包含指定值
        ...(province ? { province: { contains: province } } : {}),
        // 区域名称包含指定值
        ...(district_name ? { city: { contains: district_name } } : {}),
      };

      // 1️⃣ 查数据
      const rows = await prisma.girl.findMany({
        where,
        skip: (offset - 1) * limit,
        take: limit,
        orderBy: { create_timestamps: "desc" }, // 建议加排序
      });

      // 2️⃣ 查总数
      const total = await prisma.girl.count({ where });

      console.log(`query result: ${rows.length} / total: ${total}`);

      // 3️⃣ 一起返回
      return {
        total,
        page_data: rows,
      };
    case 2: //"zhizun":
      // 共用条件对象，过滤掉无效字段，确保类型正确
      const orArr = [];
      if (name) orArr.push({ name: { contains: name } });
      if (name) {
        // 如果 name 全是数字（整数）
        if (/^\d+$/.test(name)) {
          // name 看起来是数字
          orArr.push({ code: Number(name) }); // 或 String(name) 取决于你的字段类型
        }
      }

      const where_zz: any = {};
      if (orArr.length > 0) where_zz.OR = orArr;
      if (district_name) where_zz.district_name = { contains: district_name };
      if (province) where_zz.province = { contains: province };
      if (tag) where_zz.tag_name = { contains: tag };
      if (bust) where_zz.name = { contains: bust};

      // 1️⃣ 查数据
      const rows_zz = await prisma.zhizunGirl.findMany({
        where: where_zz,
        skip: (offset - 1) * limit,
        take: limit,
        orderBy: { create_timestamps: "desc" }, // 建议加排序
      });
      // 2️⃣ 查总数
      const total_zz = await prisma.zhizunGirl.count({ where: where_zz });

      console.log(`query result: ${rows_zz.length} / total: ${total_zz}`);
      // 3️⃣ 一起返回
      return {
        total: total_zz,
        page_data: rows_zz,
      };
    case 3: //"58kv":
      // 共用条件对象
      const orArr_58 = [];
      if (name) {
        orArr_58.push({ titlename: { contains: name } });
        orArr_58.push({ ladyid: { contains: name } });
      }
      const where_58 = {
        ...(orArr_58.length > 0 ? { OR: orArr_58 } : {}),
        region: district_name ? { contains: district_name } : undefined,
        price: max_price ? { lte: max_price } : undefined,
        characteristics: tag ? { contains: tag } : undefined,
        province: province ? { contains: province } : undefined,
        titlename: bust ? { contains: bust} : undefined,
      };
      // 1️⃣ 查数据
      const rows_58 = await prisma.girl58Kv.findMany({
        where: where_58,
        skip: (offset - 1) * limit,
        take: limit,
        orderBy: { create_timestamps: "desc" }, // 建议加排序
      });
      // 2️⃣ 查总数
      const total_58 = await prisma.girl58Kv.count({ where: where_58 });
      console.log(`query result: ${rows_58.length} / total: ${total_58}`);
      // 3️⃣ 一起返回
      return {
        total: total_58,
        page_data: rows_58,
      };
    default:
      return {
        total: 0,
        page_data: [],
      };
  }
}
function normalizeBust(bust: string) {
  let res: string;
  let math_group = bust.match(/([A-Za-zＡ-Ｚａ-ｚ])/g)?.map((c) => toHalfWidth(c));
  // console.log("math_group:", math_group);
  if (math_group) {
    res = math_group[0].toLowerCase();
  } else {
    res = "-1";
  }
  return res;
}
// type GIRL_JSON = typeof import("../../../json/all/all_girls_details.json");

export async function mapData(data: any[]) {
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
  const res = await prisma.girl.findFirst({
    where: { girl_id: data.girl_id },
  });
  if (res) {
    // console.log("已存在", data?.name, data?.code_ref)
    return 0;
  }
  const { id, ...rest } = data;
  try {
    const count = await prisma.girl.create({ data: rest });
    // console.log(count);
    console.log("新增", data?.name, data.girl_id, data.address);
    return count;
  } catch (e) {
    console.log(" not insert");
  }
}
