/**
 * 至尊相册（新版站点）
 *
 * 新站会把 /api 下的真实路由编码成 /api/_e2/*，并且 Cloudflare 会拦截
 * Node/Undici 的网络指纹。因此抓取和解析仍由 Node.js 完成，网络请求使用
 * 系统 curl。可用环境变量：ZHIZUN_PASSWORD、ZHIZUN_CF_CLEARANCE、
 * ZHIZUN_PAGE_SIZE、ZHIZUN_CONCURRENCY。
 */
import fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import pLimit from "p-limit";
import { mkdirIfNotExists } from "./utils";

const execFileAsync = promisify(execFile);
const BASE_URL = "https://xc.xz0377.com";
const PHOTO_URL = `${BASE_URL}/photo`;
const OUTPUT_DIR = "json/zhizun";
const ALL_OUTPUT_DIR = "json/all";
const TOKEN_FILE = "tests/zhizun/new_zhizun_token.json";
const PASSWORD = process.env.ZHIZUN_PASSWORD || "123456";
const PAGE_SIZE = positiveInteger(process.env.ZHIZUN_PAGE_SIZE, 100);
const DETAIL_CONCURRENCY = positiveInteger(process.env.ZHIZUN_CONCURRENCY, 16);
const DETAILS_OUTPUT = `${ALL_OUTPUT_DIR}/new_zhizun_all_girls_details.json`;
const FALLBACK_CF_CLEARANCE =
  "WeQGGxyfph0bP4BMA81ApsPWijGRtvtn1ezV1V1JJXQ-1787299539-1.2.1.1-wu0r17TkGamgrWqhNcGJP4mjUuz1iY1l3qbmS9MrRwnGUbw3sozzmP39oPJTrfERty9fvPkpcemIe8YRPHRhnPftfHPiDllCn7CBq7JJfOrn9E9F9KPe7k98_MeaFIkR5nmVDW93YOYg_35Ur.wFvGoSYFzEPa9OwuUEMRW1fodYRtKWsl.qekCFkqBXu1hRAe9q6xZKZWy_NlDo.oT1Z0TEbz4DiTKmpqNemUnubGKDIm8RcxXf9P5F7wYpiK7xwI_LPAuDk4JeCczlxBjhbSa9mYfswOzHyp3wUCwnggs0Asz.VOYIcOoiK9bM2wwpDswq7.XFxx6v6yW_Qcmo4Kvxa9VHUPcf2X7jKUaZZR4";
const CF_CLEARANCE = process.env.ZHIZUN_CF_CLEARANCE || FALLBACK_CF_CLEARANCE;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36";

mkdirIfNotExists("tests/zhizun");
mkdirIfNotExists(OUTPUT_DIR);
mkdirIfNotExists(ALL_OUTPUT_DIR);

type Tier = "middle" | "premium";
type JsonObject = Record<string, unknown>;

interface ApiResponse<T> {
  code: number;
  message: string;
  errorCode?: string;
  data: T;
}

interface Tag {
  id: string;
  name: string;
}

interface District {
  code: number;
  name: string;
}

interface City {
  code: number;
  name: string;
  districts: District[];
}

interface OptionsData {
  cities: City[];
  tags: Tag[];
}

export interface AlbumItem {
  id: number | string;
  code: string;
  title: string;
  tier: Tier;
  cityCode: number;
  cityName: string;
  districtCode: number;
  districtName: string;
  poster: string;
  images: string[];
  videos: string[];
  authVideos: string[];
  tags: Tag[];
  [key: string]: unknown;
}

interface ListData {
  items: AlbumItem[];
  total: number;
  pageNum: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ListQuery {
  pageNum?: number;
  pageSize?: number;
  tier?: Tier;
  cityCode?: number;
  districtCode?: number;
  tagIds?: string[];
  keyword?: string;
  [key: string]: unknown;
}

let token: string | null = null;

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** 与新版前端的路由编码函数完全一致。 */
export function encodeApiPath(path: string, params?: JsonObject) {
  const route = appendQuery(path, params);
  const xorSeed = 367 * 11 - 21 * 259 + 1492;
  const encodedSeed = [
    5367 + 255 * -20 - 250,
    -2425 + 2 * -2951 + -8369 * -1,
    -1115 + 26 + 1198,
    13,
    -17 * -16 - 930 + 713,
    105,
    -7919 + -11 * -721,
    6549 - 1303 * 5,
    4987 * -1 + 7405 + 773 * -3,
    -1097 * 7 + 9857 + 180 * -12,
    -3986 * 2 + -4370 + 12394,
    2996 + 35 * 186 - 9402,
    4404 - 25 * 287 + 2782,
    -2528 + -2707 * 3 + 10711,
    111,
    -9409 + 1443 + 3987 * 2,
  ];
  const key = encodedSeed.map((value) => value ^ xorSeed);
  const input = Buffer.from(route, "utf8");
  const output = Buffer.alloc(input.length);
  for (let index = 0; index < input.length; index++) {
    output[index] = (input[index] ^ (key[index % key.length] + index)) & 255;
  }
  return `/_e2/${output.toString("base64url")}`;
}

function appendQuery(path: string, params?: JsonObject) {
  if (!params) return path;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) query.append(key, String(item));
    } else {
      query.append(key, String(value));
    }
  }
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}

async function curlRequest(
  method: "GET" | "POST",
  path: string,
  options: { body?: unknown; token?: string; params?: JsonObject } = {},
) {
  const url = `${BASE_URL}/api${encodeApiPath(path, options.params)}`;
  const args = [
    "--silent", "--show-error", "--location",
    "--connect-timeout", "10", "--max-time", "30",
    "--retry", "3", "--retry-all-errors",
    "--request", method, "--url", url,
    "--header", "accept: application/json, text/plain, */*",
    "--header", "accept-language: zh-CN,zh;q=0.9,en;q=0.8",
    "--header", "origin: https://xc.xz0377.com",
    "--header", `referer: ${PHOTO_URL}`,
    "--user-agent", USER_AGENT,
    "--cookie", `cf_clearance=${CF_CLEARANCE}`,
  ];
  if (options.token) args.push("--header", `X-Album-Token: ${options.token}`);
  if (options.body !== undefined) {
    args.push("--header", "content-type: application/json", "--data-raw", JSON.stringify(options.body));
  }
  args.push("--write-out", "\n%{http_code}");

  const { stdout } = await execFileAsync("curl", args, {
    timeout: 40_000,
    maxBuffer: 32 * 1024 * 1024,
  });
  const splitAt = stdout.lastIndexOf("\n");
  if (splitAt < 0) throw new Error("curl 响应中缺少 HTTP 状态码");
  return { body: stdout.slice(0, splitAt), status: Number(stdout.slice(splitAt + 1)) };
}

async function apiRequest<T>(
  method: "GET" | "POST",
  path: string,
  options: { body?: unknown; token?: string; params?: JsonObject } = {},
): Promise<ApiResponse<T>> {
  const response = await curlRequest(method, path, options);
  if (response.status < 200 || response.status >= 300) {
    const blocked = /cloudflare|Sorry, you have been blocked/i.test(response.body);
    throw new Error(
      `${path} HTTP ${response.status}${blocked ? "（Cloudflare 拦截，请更新 ZHIZUN_CF_CLEARANCE）" : ""}: ${response.body.slice(0, 300)}`,
    );
  }
  let json: ApiResponse<T>;
  try {
    json = JSON.parse(response.body) as ApiResponse<T>;
  } catch {
    throw new Error(`${path} 返回了非 JSON 内容: ${response.body.slice(0, 300)}`);
  }
  if (json.code !== 200) {
    throw new Error(`${path} 请求失败: ${json.code} ${json.errorCode || ""} ${json.message}`);
  }
  return json;
}

async function requestToken() {
  const response = await apiRequest<{ token: string }>("POST", "/app/photo/public/verify", {
    body: { password: PASSWORD },
  });
  if (!response.data?.token) throw new Error("登录成功但响应中没有 token");
  const cache = { token: response.data.token, expires: Date.now() + 25 * 60 * 1000 };
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(cache, null, 2), "utf8");
  token = cache.token;
  return token;
}

export async function checkTokenExpires() {
  if (token) return token;
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const cache = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8")) as {
        token?: string;
        expires?: number;
      };
      if (cache.token && cache.expires && cache.expires > Date.now()) {
        token = cache.token;
        return token;
      }
    }
  } catch (error) {
    console.warn("读取新版至尊 token 缓存失败，将重新登录:", error);
  }
  return requestToken();
}

export async function getMeta() {
  const response = await apiRequest<{ title: string }>("GET", "/app/photo/public/meta");
  fs.writeFileSync(`${OUTPUT_DIR}/new_zhizun_meta.json`, JSON.stringify(response, null, 2));
  return response;
}

export async function getOptions() {
  const albumToken = await checkTokenExpires();
  const response = await apiRequest<OptionsData>("GET", "/app/photo/public/options", {
    token: albumToken,
  });
  fs.writeFileSync(`${OUTPUT_DIR}/new_zhizun_options.json`, JSON.stringify(response, null, 2));
  return response;
}

// 保留旧脚本的调用名称。
export async function getTag() {
  return (await getOptions()).data.tags;
}

export async function getDistrict() {
  return (await getOptions()).data.cities;
}

export async function getProduct(query: ListQuery = {}) {
  const albumToken = await checkTokenExpires();
  const params: ListQuery = {
    pageNum: query.pageNum ?? 1,
    pageSize: query.pageSize ?? PAGE_SIZE,
    ...query,
  };
  const response = await apiRequest<ListData>("POST", "/app/photo/public/list", {
    body: params,
    token: albumToken,
  });
  const tier = params.tier || "all";
  const filename = `${OUTPUT_DIR}/new_zhizun_${tier}_page_${response.data.pageNum}.json`;
  fs.writeFileSync(filename, JSON.stringify(response, null, 2));
  console.log(`保存 ${filename}: ${response.data.items.length} 条，共 ${response.data.total} 条`);
  return response;
}

/**
 * 列表抓取的并发度，比较低以保护源站：
 * 大圈内圈各一个 worker，再并发 ~4 页，合计峰值约 8 req/突发。
 * 想更慢改 ZHIZUN_LIST_CONCURRENCY=1，行为退回老的串行翻页。
 */
const LIST_CONCURRENCY = positiveInteger(process.env.ZHIZUN_LIST_CONCURRENCY, 4);

/**
 * 顺序抓 Tier 下所有分页的改良版：
 * 第 1 页直接拿到 total/hasMore，算出总页数后用 pLimit(LIST_CONCURRENCY)
 * 并发拉剩下页。边界异常（一边拉一边新增导致某页变空）自动收敛，不会死循环。
 */
async function loadTier(tier: Tier) {
  const first = await getProduct({ pageNum: 1, pageSize: PAGE_SIZE, tier });
  const totalPages = Math.max(1, Math.ceil(first.data.total / PAGE_SIZE));
  const items: AlbumItem[] = [...first.data.items];
  if (!first.data.hasMore || totalPages <= 1) return items;

  const limit = pLimit(LIST_CONCURRENCY);
  const pageNums = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
  const pages = await Promise.all(
    pageNums.map((pageNum) =>
      limit(() => getProduct({ pageNum, pageSize: PAGE_SIZE, tier })),
    ),
  );
  for (const page of pages) items.push(...page.data.items);
  return items;
}

export async function loadAllData() {
  console.log("开始抓取新版至尊相册列表");
  await Promise.all([getMeta(), getOptions()]);
  // 两个 tier 同时跑（内部每 tier 再按 LIST_CONCURRENCY 并发翻页），
  // 想退回串行设 ZHIZUN_LIST_CONCURRENCY=1 即可。
  const [middle, premium] = await Promise.all([loadTier("middle"), loadTier("premium")]);
  const all = deduplicate([...middle, ...premium]);
  fs.writeFileSync(`${OUTPUT_DIR}/new_zhizun_all_list.json`, JSON.stringify(all, null, 2));
  console.log(`列表完成：中圈 ${middle.length}，大圈 ${premium.length}，去重后 ${all.length}`);
  return all;
}

export async function getGirlDetails(id: number | string) {
  const albumToken = await checkTokenExpires();
  const response = await apiRequest<AlbumItem>("GET", `/app/photo/public/${id}`, {
    token: albumToken,
  });
  return response.data;
}

function readSavedList() {
  const combined = `${OUTPUT_DIR}/new_zhizun_all_list.json`;
  if (fs.existsSync(combined)) {
    return JSON.parse(fs.readFileSync(combined, "utf8")) as AlbumItem[];
  }
  const items: AlbumItem[] = [];
  for (const filename of fs.readdirSync(OUTPUT_DIR)) {
    if (!/^new_zhizun_(middle|premium)_page_\d+\.json$/.test(filename)) continue;
    const response = JSON.parse(fs.readFileSync(`${OUTPUT_DIR}/${filename}`, "utf8")) as ApiResponse<ListData>;
    if (Array.isArray(response.data?.items)) items.push(...response.data.items);
  }
  return deduplicate(items);
}

export async function saveAllDetails(items: AlbumItem[] = readSavedList()) {
  if (items.length === 0) throw new Error("没有列表数据，请先运行 loadAllData()");

  // ===== 增量优化：已抓过且 updatedAt 未变的详情直接复用 =====
  // 每天新增的通常只有几十~几百条，没必要重复回源 5000+ 次
  const existingById = loadCachedDetails();
  const refreshAll = process.env.ZHIZUN_REFRESH_DETAILS === "1";

  const cached: AlbumItem[] = [];
  const toFetch: AlbumItem[] = [];
  for (const item of items) {
    if (refreshAll) {
      toFetch.push(item);
      continue;
    }
    const key = String(item.id);
    const hit = existingById.get(key);
    if (hit && String(hit.updatedAt ?? "") === String(item.updatedAt ?? "")) {
      cached.push(hit);
    } else {
      toFetch.push(item);
    }
  }
  console.log(
    `详情复用 ${cached.length} 条，需重抓 ${toFetch.length} 条` +
      (refreshAll ? "（ZHIZUN_REFRESH_DETAILS=1，强制全量）" : ""),
  );

  const limit = pLimit(DETAIL_CONCURRENCY);
  let completed = 0;
  const details = await Promise.all(
    toFetch.map((item) =>
      limit(async () => {
        try {
          const detail = await retry(() => getGirlDetails(item.id), 3);
          completed++;
          if (completed % 25 === 0 || completed === toFetch.length) {
            console.log(`详情进度 ${completed}/${toFetch.length}`);
          }
          return detail;
        } catch (error) {
          console.error(`详情抓取失败 id=${item.id}:`, error);
          return null;
        }
      }),
    ),
  );
  const fetched = details.filter((item): item is AlbumItem => item !== null);
  // 缓存的旧详情只在最新的列表里；按列表顺序排，新抓回来的覆盖同 id 的旧记录
  const finalById = new Map<string, AlbumItem>();
  for (const d of cached) finalById.set(String(d.id), d);
  for (const d of fetched) finalById.set(String(d.id), d);
  const finalList = items
    .map((item) => finalById.get(String(item.id)))
    .filter((item): item is AlbumItem => Boolean(item));

  fs.writeFileSync(DETAILS_OUTPUT, JSON.stringify(finalList, null, 2));
  console.log(
    `详情完成：总 ${finalList.length} 条（复用 ${cached.length} + 新抓 ${fetched.length}），保存至 ${DETAILS_OUTPUT}`,
  );
  return finalList;
}

/**
 * 读取上次保存的详情文件，按 id 建索引。
 * 文件不存在 / 解析失败都视为无缓存（继续走全量抓取）。
 */
function loadCachedDetails() {
  const map = new Map<string, AlbumItem>();
  try {
    if (!fs.existsSync(DETAILS_OUTPUT)) return map;
    const parsed = JSON.parse(fs.readFileSync(DETAILS_OUTPUT, "utf8"));
    if (!Array.isArray(parsed)) return map;
    for (const item of parsed as AlbumItem[]) {
      if (item && item.id !== undefined) map.set(String(item.id), item);
    }
  } catch (error) {
    console.warn("读取历史详情缓存失败，将全量抓取:", error);
  }
  return map;
}

async function retry<T>(task: () => Promise<T>, attempts: number) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }
  throw lastError;
}

function deduplicate(items: AlbumItem[]) {
  return [...new Map(items.map((item) => [String(item.id), item])).values()];
}
