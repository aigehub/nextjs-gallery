import { Girl, Girl58Kv, ZhizunGirl } from "@/generated/prisma";
import prisma from "../prisma/database_api";
import { checkTokenExpires, loadAllData as loadAllDataZz, saveAllDetails as saveAllDetailsZz } from "./zhizun";
import { checkExpires as checkExpires58, loadAllData, saveAllDetails } from "./58kv_com";
import { checkTokenExpires  as checkTokenExpiresJimei} from "./jimei_userLogin";
import { testLoadAllCitiesGirlsData, testSaveAllGirlsDetails } from "./jimei_spider";
import { mapData } from "@/app/libs/data";

const needSpideAllData_arg: boolean = process.argv[2] === "true"; // true / false

/**
 * 步骤：
 * 1、检查 token 是否过期
 * 2、如果需要，爬取所有数据并保存到本地 json 文件
 * 3、读取本地 json 文件，插入到数据库
 *
 * @param param0
 * @returns
 */
export async function runStartSpider<GirlModel>({
  girlsPlatform,
  platforn_name = "",
  checkTokenExpires,
  insertOne,
  mapData,
  all_data_file_path,
  needSpideAllData = needSpideAllData_arg,
}: {
  girlsPlatform: GirlsPlatform<GirlModel>;
  checkTokenExpires?: () => Promise<boolean>;
  insertOne?: (data: Omit<any, "id">, platforn_name: string) => Promise<any>;
  mapData?: (data: any[]) => Promise<any[]>;
  all_data_file_path: string;
  needSpideAllData?: boolean;
  platforn_name?: string;
}) {
  console.log("common spider start checkTokenExpires：")
  if (checkTokenExpires) {
    const check = await checkTokenExpires();
    if (!check) {
      console.log("common spidercheckTokenExpires result：",platforn_name, "token 过期");
      return;
    }
    console.log(platforn_name, "token 有效");
  }
  console.log("needSpideAllData_arg:", needSpideAllData_arg)
  if (needSpideAllData) {
    await girlsPlatform.loadAllData();
    await girlsPlatform.saveAllDetails();
  }

  if (insertOne) {
    import(all_data_file_path).then(async (module) => {
      let all_data = module.default;
      if (mapData) all_data = await mapData(all_data);
      console.log(platforn_name, "all_data length:", all_data.length);
      let add_count = 0;
      for (let i = 0; i < all_data.length; i++) {
        const res = await insertOne(all_data[i], platforn_name);
        if (res) {
          add_count += 1;
        }
      }
      console.log(platforn_name, "薪增的个数:", add_count);
    });
  }
}
export async function insertOne<T extends Omit<any, "id">>(data: T, girlsPlatform: GirlsPlatform<T>, platforn_name: string): Promise<number> {
  const res = await girlsPlatform.findFirst(data);
  if (res) {
    // console.log(platforn_name,"已存在", data?.name, data?.code_ref);
    return 0;
  }
  const { id, ...rest } = data;
  try {
    const count = await girlsPlatform.prismaCreateOne(rest);
    // console.log(count);
    console.log(platforn_name, "新增", data.name, data.titlename, data.address);
    if (count) {
      return 1;
    }
    return 0;
  } catch (e) {
    console.log(platforn_name, " not insert", e);
    return 0;
  }
}
/**
 * 抽象类，定义爬取不同平台的通用方法
 */
export abstract class GirlsPlatform<T> {
  public abstract mapData(data: any[]): Promise<T[]>;
  public abstract loadAllData(): Promise<any>;
  public abstract saveAllDetails(): Promise<any>;
  public abstract findFirst<T>(data: T): Promise<T | null>;
  public abstract prismaCreateOne<T>(rest: Omit<T, "id">): Promise<number>;
}

// ZhizunPlatform
export class ZhizunPlatform extends GirlsPlatform<ZhizunGirl> {
  public async mapData(data: any[]): Promise<ZhizunGirl[]> {
    //简单数据
    //   image           String //[]
    //   media           String //[]
    //   tags            String //[]
    //   authentication  String //[]
    //   //详细数据
    //   tag_name        String //[]
    //   images          String //[]
    //   medium          String //[]
    //   authentications String //[]
    // 把数组字符串转为 JSON 字符串存储
    const map_data = data.flatMap((item) => {
      item.image = JSON.stringify(item.image ? item.image : "");
      item.media = JSON.stringify(item.media ? item.media : "");
      item.tags = JSON.stringify(item.tag ? item.tag : "");
      delete item.tag;
      item.authentication = JSON.stringify(item.authentication ? item.authentication : "");
      item.tag_name = JSON.stringify(item.tag_name ? item.tag_name : "");
      item.images = JSON.stringify(item.images ? item.images : "");
      item.medium = JSON.stringify(item.medium ? item.medium : "");
      item.authentications = JSON.stringify(item.authentications ? item.authentications : "");
      return { ...item, url_id: item.id };
    });
    return Promise.resolve(map_data);
  }
  public async loadAllData(): Promise<any> {
    return await loadAllDataZz();
  }
  public async saveAllDetails(): Promise<any> {
    return await saveAllDetailsZz();
  }
  public async prismaCreateOne<zhizunGirl>(rest: Omit<zhizunGirl, "id">): Promise<number> {
    if (await this.findFirst(rest as any)) {
      return 0;
    }
    const count = await prisma.zhizunGirl.create({ data: rest as any });
    return count ? (count as unknown as number) : 0;
  }
  public async findFirst<zhizunGirl>(data: zhizunGirl): Promise<zhizunGirl | null> {
    const res = await prisma.zhizunGirl.findFirst({
      where: { code: (data as any).code },
    });
    return res as any;
  }
}

// 58kvPlatform
export class Kv58Platform extends GirlsPlatform<Girl58Kv> {
  public mapData(data: any[]): Promise<Girl58Kv[]> {
    //       cover           String? //[]
    //   data            String? //[]
    //   video           String? //[]
    //   characteristics String? //[]
    // 把数组字符串转为 JSON 字符串存储
    const map_data = data.flatMap((item) => {
      item.cover = JSON.stringify(item.cover ? item.cover : "");
      item.data = JSON.stringify(item.data ? item.data : "");
      item.video = JSON.stringify(item.video ? item.video : "");
      item.characteristics = JSON.stringify(item.characteristics ? item.characteristics : "");
      return item;
    });
    return Promise.resolve(map_data);
  }
  public async loadAllData(): Promise<any> {
    await loadAllData();
    return Promise.resolve(null);
  }
  public async saveAllDetails(): Promise<any> {
    await saveAllDetails();
    return Promise.resolve(null);
  }
  public async prismaCreateOne<Girl58Kv>(rest: Omit<Girl58Kv, "id">): Promise<number> {
    if (await this.findFirst(rest as any)) {
      return 0;
    }
    const count = await prisma.girl58Kv.create({ data: rest as any });
    return count ? (count as unknown as number) : 0;
  }
  public async findFirst<Girl58Kv>(data: Girl58Kv): Promise<Girl58Kv | null> {
    const res = await prisma.girl58Kv.findFirst({
      where: { ladyid: (data as any).ladyid },
    });
    return res as Girl58Kv | null;
  }
}

// JimeiPlatform
export class JimeiPlatform extends GirlsPlatform<Girl> {
  public mapData(data: []): Promise<any[]> {
    return mapData(data);
  }
  public async loadAllData(): Promise<any> {
    await testLoadAllCitiesGirlsData();
    return Promise.resolve(null);
  }
  public async saveAllDetails(): Promise<any> {
    await testSaveAllGirlsDetails();
    return Promise.resolve(null);
  }
  public async prismaCreateOne<Girl>(rest: Omit<Girl, "id">): Promise<number> {
    if (await this.findFirst(rest as any)) {
      return 0;
    }
    const count = await prisma.girl.create({ data: rest as any });
    return count ? (count as unknown as number) : 0;
  }
  public async findFirst<Girl>(data: Girl): Promise<Girl | null> {
    const res = await prisma.girl.findFirst({
      where: { girl_id: (data as any).girl_id },
    });
    return res as any;
  }
}

const zz = new ZhizunPlatform();
//zhizun
 start_spide<ZhizunGirl>({
   girlsPlatform: zz,
   platforn_name: "zhizun",
   checkTokenExpires: checkTokenExpires,
   mapData: async (data) => await zz.mapData(data),
   insertOne: async (data, platforn_name) => await insertOne(data, zz, platforn_name),
   all_data_file_path: "../json/all/zhizun_all_girls_details.json",
 });
 const kv58 = new Kv58Platform();
// //58kv
 start_spide<Girl58Kv>({
   girlsPlatform: kv58,
   platforn_name: "58kv",
checkTokenExpires: async () => (await checkExpires58()) !== null,
insertOne: async (data, platforn_name) => await insertOne(data, kv58, platforn_name),
mapData: async (data) => await kv58.mapData(data),
all_data_file_path: "../json/all/all_58kv_data.json",
 });

// jimei
const jimei = new JimeiPlatform();
runStartSpider<Girl>({
  girlsPlatform: jimei,
  platforn_name: "jimei",
  checkTokenExpires: checkTokenExpiresJimei,
  insertOne: async (data, platforn_name) => await insertOne(data, jimei, platforn_name),
  mapData: async (data) => await mapData(data),
  all_data_file_path: "../json/all/all_girls_details.json",
});
