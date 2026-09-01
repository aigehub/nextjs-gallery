/**
 * 下载新版至尊相册的媒体资源。
 *
 * 模式：
 *   --mode today    只下载 updatedAt 落在本地今日零点之后的条目（默认）
 *   --mode full     下载清单里全部条目
 *   --since <date>  只下载 updatedAt >= 给定日期的条目（YYYY-MM-DD）
 *
 * 其它常用参数：
 *   --limit <n>            只处理前 n 条
 *   --images-only          只下载图片
 *   --videos-only          只下载视频
 *   --concurrency <n>      条目级并发，默认 4
 *   --force                无视本地已有文件，全部重下
 *
 * 下载前去重规则：
 *   - 已完整下载过的条目整体跳过，连 metadata.json 都不重写
 *   - 部分文件缺失 / 损坏时，只重下坏的那部分
 *   - 图片：文件头必须是合法 WebP（匹配已解码或原始加密产物）
 *   - 视频：要求 .complete 标记 + 至少一个 video.* / auth.* (>0)
 *
 * 默认输入：json/zhizun/new_zhizun_all_list.json
 * 默认输出：downloads/new_zhizun
 */
import fs from "node:fs";
import path from "node:path";
import { createDecipheriv, createHash } from "node:crypto";
import { spawn } from "node:child_process";
import ffmpeg from "@ffmpeg-installer/ffmpeg";
import pLimit from "p-limit";

const DEFAULT_INPUT = "json/zhizun/new_zhizun_all_list.json";
const DEFAULT_OUTPUT = "downloads/new_zhizun";
const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const ENCRYPTED_HEADER_BASE64_LENGTH = 24;

type Mode = "full" | "today" | "since";

interface AlbumItem {
  id: number | string;
  code?: string;
  name?: string;
  title?: string;
  tier?: string;
  poster?: string;
  images?: string[];
  videos?: string[];
  authVideos?: string[];
  updatedAt?: string;
}

interface DownloadOptions {
  input: string;
  output: string;
  concurrency: number;
  segmentConcurrency: number;
  limit?: number;
  force: boolean;
  downloadImages: boolean;
  downloadVideos: boolean;
  mode: Mode;
  since?: string;
  dryRun: boolean;
}

interface Failure {
  itemId: string;
  kind: string;
  url: string;
  error: string;
}

interface ItemEntry {
  url: string;
  name: string;
  kind: "poster" | "image" | "video" | "auth-video";
  isHls: boolean;
}

const options = parseArguments(process.argv.slice(2));
const failures: Failure[] = [];
const itemLimit = pLimit(options.concurrency);
const resourceLimit = pLimit(options.segmentConcurrency);
const segmentLimit = pLimit(options.segmentConcurrency);
// 静态 ffmpeg 同时启动多个进程会瞬间占用较多内存，串行封装更稳定。
const ffmpegLimit = pLimit(1);
let downloadedFiles = 0;
let skippedFiles = 0;
let skippedItems = 0;

async function main() {
  const allItems = readItems(options.input);
  const filtered = filterByMode(allItems);
  const selected = options.limit ? filtered.slice(0, options.limit) : filtered;
  fs.mkdirSync(options.output, { recursive: true });

  const totals = countResources(selected);
  console.log("新版至尊媒体下载开始", {
    input: options.input,
    output: options.output,
    mode: options.mode,
    since: options.since ?? null,
    itemsTotal: allItems.length,
    itemsInScope: filtered.length,
    itemsSelected: selected.length,
    ...totals,
    concurrency: options.concurrency,
    segmentConcurrency: options.segmentConcurrency,
    force: options.force,
    dryRun: options.dryRun,
  });
  if (options.dryRun) {
    console.log("[dry-run] 不实际下载，仅打印要处理的条目概览");
    selected.slice(0, 5).forEach((item, index) => {
      console.log(
        `  #${index + 1} id=${item.id} code=${item.code ?? "-"} updatedAt=${item.updatedAt ?? "-"} ` +
        `images=${1 + (item.images?.length ?? 0)} videos=${(item.videos?.length ?? 0) + (item.authVideos?.length ?? 0)}`,
      );
    });
    if (selected.length > 5) console.log(`  … 共 ${selected.length} 条`);
    return;
  }

  let completed = 0;
  await Promise.all(
    selected.map((item) =>
      itemLimit(async () => {
        await downloadItem(item);
        completed++;
        if (completed % 10 === 0 || completed === selected.length) {
          console.log(
            `进度 ${completed}/${selected.length}，下载 ${downloadedFiles}，跳过文件 ${skippedFiles}，跳过条目 ${skippedItems}，失败 ${failures.length}`,
          );
        }
      }),
    ),
  );

  const report = {
    finishedAt: new Date().toISOString(),
    input: options.input,
    output: options.output,
    mode: options.mode,
    since: options.since ?? null,
    itemsTotal: allItems.length,
    itemsInScope: filtered.length,
    itemsSelected: selected.length,
    skippedItems,
    downloadedFiles,
    skippedFiles,
    failed: failures.length,
    failures,
  };
  await writeJsonAtomic(path.join(options.output, "download-report.json"), report);
  console.log("下载完成", {
    skippedItems,
    downloadedFiles,
    skippedFiles,
    failed: failures.length,
    report: path.join(options.output, "download-report.json"),
  });
  if (failures.length > 0) process.exitCode = 1;
}

function readItems(input: string) {
  if (!fs.existsSync(input)) {
    throw new Error(`输入文件不存在: ${input}，请先运行 new_zhizun.loadAllData()`);
  }
  const json = JSON.parse(fs.readFileSync(input, "utf8"));
  const items = Array.isArray(json) ? json : json?.data?.items;
  if (!Array.isArray(items)) throw new Error(`输入文件不是至尊列表数组: ${input}`);
  return items as AlbumItem[];
}

function countResources(items: AlbumItem[]) {
  let images = 0;
  let videos = 0;
  for (const item of items) {
    images += new Set([item.poster, ...(item.images || [])].filter(Boolean)).size;
    videos += new Set([...(item.videos || []), ...(item.authVideos || [])].filter(Boolean)).size;
  }
  return { images, videos };
}

/**
 * 按 options.mode 从全量清单中筛选本轮要下载的条目。
 * - full：直接返回全部
 * - today：取本地当日零点作为 since 边界
 * - since：使用用户传入的 YYYY-MM-DD
 */
function filterByMode(items: AlbumItem[]) {
  if (options.mode === "full") return items;
  const since = options.mode === "today" ? localToday() : options.since!;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since)) {
    throw new Error(`--since 需要 YYYY-MM-DD 格式，收到: ${since}`);
  }
  // updatedAt 形如 "2026-08-23 00:00:00"，字典序与日期序一致
  return items.filter((item) => {
    const updated = String(item.updatedAt ?? "");
    return updated.slice(0, 10) >= since;
  });
}

function localToday() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 把一个条目所有要拉取的媒体资源列成平铺列表。
 * 供「去重判断」和「下载执行」共用，避免两边各自拼路径造成不一致。
 */
function buildEntries(item: AlbumItem): ItemEntry[] {
  const entries: ItemEntry[] = [];
  if (item.poster) {
    entries.push({
      url: item.poster,
      name: "poster.webp",
      kind: "poster",
      isHls: false,
    });
  }
  [...new Set((item.images || []).filter(isString))]
    .filter((url) => url !== item.poster)
    .forEach((url, index) => {
      entries.push({
        url,
        name: `image_${String(index + 1).padStart(3, "0")}.webp`,
        kind: "image",
        isHls: false,
      });
    });

  const ordinary = [...new Set((item.videos || []).filter(isString))];
  const authentication = [...new Set((item.authVideos || []).filter(isString))];
  ordinary.forEach((url, index) => {
    entries.push({
      url,
      name: `video_${String(index + 1).padStart(3, "0")}`,
      kind: "video",
      isHls: /\.m3u8(?:\?|$)/i.test(url) || !hasFileExtension(url),
    });
  });
  authentication.forEach((url, index) => {
    entries.push({
      url,
      name: `auth_${String(index + 1).padStart(3, "0")}`,
      kind: "auth-video",
      isHls: /\.m3u8(?:\?|$)/i.test(url) || !hasFileExtension(url),
    });
  });
  return entries;
}

function entryDir(entry: ItemEntry) {
  if (entry.kind === "poster" || entry.kind === "image") return "images";
  if (entry.kind === "auth-video") return "auth-videos";
  return "videos";
}

/**
 * 找一条 image entry 在磁盘上的实际文件。
 * 历史版本可能存成 .webp（加密产物/已解码），新版按真实格式存成 .jpg/.png/.webp。
 * 命中任一且文件头是合法图片即返回路径，否则 null。
 */
function findExistingImageFile(itemDirectory: string, entry: ItemEntry): string | null {
  const dir = path.join(itemDirectory, entryDir(entry));
  const stem = baseName(entry.name);
  const candidates = [".webp", ".jpg", ".jpeg", ".png", ".gif"].map((ext) =>
    path.join(dir, stem + ext),
  );
  for (const file of candidates) {
    if (isValidImageFile(file)) return file;
  }
  return null;
}

function entryFileName(entry: ItemEntry) {
  if (entry.kind === "poster" || entry.kind === "image") return entry.name; // poster.webp / image_NNN.webp
  return entry.name + ".mp4";
}

function baseName(file: string) {
  return file.replace(/\.[^.]+$/, "");
}

function entryKey(entry: ItemEntry) {
  return `${entry.kind}:${entry.name}`;
}

/**
 * 落盘的"图片文件"是否已下载且合法：
 * 不再只限 WebP — im4ge 偶尔按 Accept 返回明文 JPEG/PNG，
 * 这些也应该视为合法已下载，避免反复回源。
 * 文件名统一仍是 entry.name(.webp)，只校验内容。
 */
function isValidImageFile(filename: string) {
  if (!fs.existsSync(filename)) return false;
  const descriptor = fs.openSync(filename, "r");
  try {
    const header = Buffer.alloc(16);
    const n = fs.readSync(descriptor, header, 0, 16, 0);
    if (n < 3) return false;
    return detectGenericImageFormat(header.subarray(0, n)) !== null;
  } finally {
    fs.closeSync(descriptor);
  }
}

/**
 * 视频判定：
 *   HLS    — 目录下要有 .complete 标记 + video.mp4 (>0)
 *   非 HLS — 目录下要有 .complete 标记 + 至少一个 video.* / auth.* (>0)
 */
function fileLooksLikeVideo(directory: string, isHls: boolean): boolean {
  const marker = path.join(directory, ".complete");
  if (!fs.existsSync(marker)) return false;
  if (isHls) {
    const target = path.join(directory, "video.mp4");
    return fs.existsSync(target) && fs.statSync(target).size > 0;
  }
  try {
    return fs
      .readdirSync(directory)
      .filter((name) => /^(video|auth)\./i.test(name))
      .some((name) => fs.statSync(path.join(directory, name)).size > 0);
  } catch {
    return false;
  }
}

/**
 * 判定单个条目是否已"完整下载过"。
 * 返回每条 entry 的合法性 Map，方便调用方只重下坏的那部分。
 */
function itemIsComplete(item: AlbumItem, itemDirectory: string): {
  complete: boolean;
  entryValid: Map<string, boolean>;
} {
  const entryValid = new Map<string, boolean>();
  let complete = true;
  for (const entry of buildEntries(item)) {
    if (!options.downloadImages && (entry.kind === "poster" || entry.kind === "image")) continue;
    if (!options.downloadVideos && (entry.kind === "video" || entry.kind === "auth-video")) continue;
    let ok: boolean;
    if (entry.kind === "poster" || entry.kind === "image") {
      const filePath = findExistingImageFile(itemDirectory, entry);
      ok = filePath !== null;
    } else {
      ok = fileLooksLikeVideo(path.join(itemDirectory, entryDir(entry)), entry.isHls);
    }
    entryValid.set(entryKey(entry), ok);
    if (!ok) complete = false;
  }
  return { complete, entryValid };
}

async function downloadItem(item: AlbumItem) {
  const itemId = String(item.id);
  const girlName = item.name || item.title || "unnamed";
  const directoryName = sanitize(
    `${item.code || "no-code"}_${itemId}_${girlName}`,
  );
  const itemDirectory = path.join(
    options.output,
    sanitize(item.tier || "unknown"),
    directoryName,
  );

  // ===== 下载前去重 =====
  // 整个条目已完整 → 直接跳过，连 metadata.json 都不重写，
  // 避免 today 模式重跑时反复覆盖已下好的条目。
  if (!options.force && fs.existsSync(path.join(itemDirectory, "metadata.json"))) {
    const { complete, entryValid } = itemIsComplete(item, itemDirectory);
    if (complete) {
      skippedItems++;
      return;
    }
    // 部分文件缺失/损坏：只重下坏的那部分
    const pending = buildEntries(item).filter((entry) => {
      if (!options.downloadImages && (entry.kind === "poster" || entry.kind === "image")) return false;
      if (!options.downloadVideos && (entry.kind === "video" || entry.kind === "auth-video")) return false;
      return !entryValid.get(entryKey(entry));
    });
    fs.mkdirSync(itemDirectory, { recursive: true });
    await writeJsonAtomic(path.join(itemDirectory, "metadata.json"), item);
    await runEntries(itemId, itemDirectory, pending);
    return;
  }

  fs.mkdirSync(itemDirectory, { recursive: true });
  await writeJsonAtomic(path.join(itemDirectory, "metadata.json"), item);

  const entries = buildEntries(item).filter((entry) => {
    if (!options.downloadImages && (entry.kind === "poster" || entry.kind === "image")) return false;
    if (!options.downloadVideos && (entry.kind === "video" || entry.kind === "auth-video")) return false;
    return true;
  });
  await runEntries(itemId, itemDirectory, entries);
}

async function runEntries(itemId: string, itemDirectory: string, entries: ItemEntry[]) {
  const tasks = entries.map((entry) =>
    resourceLimit(() =>
      captureFailure(itemId, entry.kind, entry.url, async () => {
        const targetDir = path.join(itemDirectory, entryDir(entry));
        if (entry.kind === "poster" || entry.kind === "image") {
          await downloadDecodedImage(entry.url, itemDirectory, entry);
        } else {
          await downloadVideo(entry.url, path.join(targetDir, entry.name));
        }
      }),
    ),
  );
  await Promise.all(tasks);
}

/**
 * 按真实格式落盘：同一 entry 只会保留一种扩展名（.webp / .jpg / .png / .gif），
 * 与 findExistingImageFile 配合确保跨扩展名去重。
 */
async function downloadDecodedImage(
  url: string,
  itemDirectory: string,
  entry: ItemEntry,
) {
  const existing = findExistingImageFile(itemDirectory, entry);
  if (!options.force && existing) {
    skippedFiles++;
    return;
  }

  const fetched = await fetchBuffer(url);
  const { data, ext } = decodeZhizunImage(fetched);

  const dir = path.join(itemDirectory, entryDir(entry));
  const stem = baseName(entry.name);
  const destination = path.join(dir, stem + ext);
  // 同 entry 只保留一份；如果之前按别的扩展名落过盘（比如旧版强制 .webp），清理掉
  for (const suffix of [".webp", ".jpg", ".jpeg", ".png", ".gif"]) {
    if (suffix === ext) continue;
    const stale = path.join(dir, stem + suffix);
    if (fs.existsSync(stale)) {
      try { fs.unlinkSync(stale); } catch { /* ignore */ }
    }
  }
  await writeFileAtomic(destination, data);
  downloadedFiles++;
}

/**
 * 与前端 NewZZImage.decodeZhizunImage 对齐：
 * - 先按 magic bytes 识别明文图（JPEG / PNG / GIF / WebP），匹配则原样返回
 *   （im4ge 偶尔会按 Accept 头返回明文 JPEG，URL 看起来是 .webp 但实际不是）
 * - 不匹配才走 18 字节 base64 位移反变换，结果是 webp
 * 返回值带 mimeType，方便下载方决定落盘扩展名
 */
function detectGenericImageFormat(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: "image/jpeg", ext: ".jpg" };
  }
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { mime: "image/png", ext: ".png" };
  }
  if (buf.length >= 6 && buf.subarray(0, 4).toString("ascii") === "GIF8") {
    return { mime: "image/gif", ext: ".gif" };
  }
  if (isWebP(buf)) {
    return { mime: "image/webp", ext: ".webp" };
  }
  return null;
}

export function decodeZhizunImage(encrypted: Buffer): { data: Buffer; mime: string; ext: string } {
  const plain = detectGenericImageFormat(encrypted);
  if (plain) return { data: encrypted, ...plain };
  if (encrypted.length < 18) throw new Error("图片内容太短，无法解码");

  const encoded = encrypted.toString("base64");
  const decodedHeader = encoded
    .slice(0, ENCRYPTED_HEADER_BASE64_LENGTH)
    .split("")
    .map((character) => {
      const index = BASE64_ALPHABET.indexOf(character);
      if (index < 0) return character;
      return BASE64_ALPHABET[index === 0 ? 63 : index - 1];
    })
    .join("");
  const decoded = Buffer.from(
    decodedHeader + encoded.slice(ENCRYPTED_HEADER_BASE64_LENGTH),
    "base64",
  );
  // 至尊 CDN 的加密产物已见过 WebP / PNG 两种，后续再加格式就放宽成 magic bytes 全部接受
  const decodedKind = detectGenericImageFormat(decoded);
  if (!decodedKind) throw new Error("解码后不是可识别的图片格式");
  return { data: decoded, ...decodedKind };
}

async function downloadVideo(source: string, destinationDirectory: string) {
  fs.mkdirSync(destinationDirectory, { recursive: true });
  const completeMarker = path.join(destinationDirectory, ".complete");
  const isHls = /\.m3u8(?:\?|$)/i.test(source) || !hasFileExtension(source);
  const expectedVideo = path.join(
    destinationDirectory,
    isHls ? "video.mp4" : `video${extensionFromUrl(source, ".mp4")}`,
  );
  if (
    !options.force &&
    fs.existsSync(completeMarker) &&
    fs.existsSync(expectedVideo) &&
    fs.statSync(expectedVideo).size > 0
  ) {
    skippedFiles++;
    return;
  }

  if (isHls) {
    const manifestUrl = /\.m3u8(?:\?|$)/i.test(source)
      ? source
      : `${source.replace(/\/$/, "")}/index.m3u8`;
    await downloadHlsAsMp4(manifestUrl, destinationDirectory);
  } else {
    const extension = extensionFromUrl(source, ".mp4");
    await writeFileAtomic(
      path.join(destinationDirectory, `video${extension}`),
      await fetchBuffer(source),
    );
    downloadedFiles++;
  }
  await writeFileAtomic(completeMarker, Buffer.from(new Date().toISOString()));
}

async function downloadHlsAsMp4(
  manifestUrl: string,
  destinationDirectory: string,
) {
  const temporaryDirectory = await fs.promises.mkdtemp(
    path.join(destinationDirectory, ".hls-"),
  );
  const destination = path.join(destinationDirectory, "video.mp4");
  const temporaryOutput = path.join(
    destinationDirectory,
    `.video.${process.pid}.${shortHash(manifestUrl)}.part.mp4`,
  );

  try {
    const streamFile = path.join(temporaryDirectory, "stream.ts");
    await downloadDecryptedHls(manifestUrl, streamFile);
    await ffmpegLimit(() =>
      runFfmpeg(streamFile, temporaryOutput),
    );
    await fs.promises.rename(temporaryOutput, destination);
    downloadedFiles++;
  } finally {
    await fs.promises.rm(temporaryDirectory, { recursive: true, force: true });
    await fs.promises.rm(temporaryOutput, { force: true });
  }
}

async function runFfmpeg(input: string, output: string) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      ffmpeg.path,
      [
        "-hide_banner",
        "-nostdin",
        "-loglevel",
        "error",
        "-y",
        "-i",
        input,
        "-map",
        "0:v?",
        "-map",
        "0:a?",
        "-c",
        "copy",
        "-movflags",
        "+faststart",
        output,
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr = (stderr + chunk).slice(-20_000);
    });
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) resolve();
      else {
        const reason = signal ? `信号 ${signal}` : `退出码 ${code}`;
        reject(new Error(`ffmpeg 转换失败（${reason}）：${stderr.trim()}`));
      }
    });
  });
}

interface HlsKey {
  method: string;
  url?: string;
  iv?: Buffer;
}

interface HlsSegment {
  url: string;
  sequence: number;
  key?: HlsKey;
}

async function downloadDecryptedHls(manifestUrl: string, destination: string) {
  const { segments, initUrl } = await loadMediaPlaylist(manifestUrl);
  if (segments.length === 0) throw new Error("m3u8 中没有媒体分片");

  const keyCache = new Map<string, Promise<Buffer>>();
  const buffers = await Promise.all(
    segments.map((segment) =>
      segmentLimit(async () => {
        const encrypted = await fetchBuffer(segment.url);
        if (!segment.key || segment.key.method === "NONE") return encrypted;
        if (segment.key.method !== "AES-128" || !segment.key.url) {
          throw new Error(`暂不支持 HLS 加密方式: ${segment.key.method}`);
        }
        let keyPromise = keyCache.get(segment.key.url);
        if (!keyPromise) {
          keyPromise = fetchBuffer(segment.key.url);
          keyCache.set(segment.key.url, keyPromise);
        }
        const key = await keyPromise;
        const iv = segment.key.iv || sequenceToIv(segment.sequence);
        const decipher = createDecipheriv("aes-128-cbc", key, iv);
        return Buffer.concat([decipher.update(encrypted), decipher.final()]);
      }),
    ),
  );

  if (initUrl) buffers.unshift(await fetchBuffer(initUrl));
  await writeFileAtomic(destination, Buffer.concat(buffers));
}

async function loadMediaPlaylist(
  manifestUrl: string,
): Promise<{ segments: HlsSegment[]; initUrl?: string }> {
  const manifest = (await fetchBuffer(manifestUrl)).toString("utf8");
  if (!manifest.includes("#EXTM3U")) throw new Error("视频地址未返回有效 m3u8");

  const lines = manifest.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const nested = lines
    .filter((line) => !line.startsWith("#"))
    .map((line) => new URL(line, manifestUrl).toString())
    .find((url) => /\.m3u8(?:\?|$)/i.test(url));
  if (nested) return loadMediaPlaylist(nested);

  let mediaSequence = 0;
  let segmentIndex = 0;
  let currentKey: HlsKey | undefined;
  let initUrl: string | undefined;
  const segments: HlsSegment[] = [];

  for (const line of lines) {
    if (line.startsWith("#EXT-X-MEDIA-SEQUENCE:")) {
      mediaSequence = Number(line.slice(line.indexOf(":") + 1)) || 0;
    } else if (line.startsWith("#EXT-X-KEY:")) {
      const attributes = parseHlsAttributes(line.slice(line.indexOf(":") + 1));
      currentKey = {
        method: attributes.METHOD || "NONE",
        url: attributes.URI
          ? new URL(attributes.URI, manifestUrl).toString()
          : undefined,
        iv: attributes.IV ? parseHlsIv(attributes.IV) : undefined,
      };
    } else if (line.startsWith("#EXT-X-MAP:")) {
      const attributes = parseHlsAttributes(line.slice(line.indexOf(":") + 1));
      if (attributes.URI) initUrl = new URL(attributes.URI, manifestUrl).toString();
    } else if (!line.startsWith("#")) {
      segments.push({
        url: new URL(line, manifestUrl).toString(),
        sequence: mediaSequence + segmentIndex++,
        key: currentKey ? { ...currentKey } : undefined,
      });
    }
  }
  return { segments, initUrl };
}

function parseHlsAttributes(value: string) {
  const attributes: Record<string, string> = {};
  for (const match of value.matchAll(/([A-Z0-9-]+)=("[^"]*"|[^,]*)/gi)) {
    attributes[match[1].toUpperCase()] = match[2].replace(/^"|"$/g, "");
  }
  return attributes;
}

function parseHlsIv(value: string) {
  const hex = value.replace(/^0x/i, "").padStart(32, "0");
  return Buffer.from(hex, "hex");
}

function sequenceToIv(sequence: number) {
  const iv = Buffer.alloc(16);
  iv.writeBigUInt64BE(BigInt(sequence), 8);
  return iv;
}

async function fetchBuffer(url: string, attempts = 4): Promise<Buffer> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetch(url, {
        headers: { referer: "https://xc.xz0377.com/" },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await delay(attempt * 1000);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

async function captureFailure(
  itemId: string,
  kind: string,
  url: string,
  task: () => Promise<void>,
) {
  try {
    await task();
  } catch (error) {
    failures.push({ itemId, kind, url, error: errorText(error) });
    console.error(`[失败] ${kind} item=${itemId} ${url}: ${errorText(error)}`);
  }
}

async function writeFileAtomic(destination: string, data: Buffer) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.${shortHash(destination)}.part`;
  await fs.promises.writeFile(temporary, data);
  await fs.promises.rename(temporary, destination);
}

async function writeJsonAtomic(destination: string, value: unknown) {
  await writeFileAtomic(destination, Buffer.from(JSON.stringify(value, null, 2)));
}

function isWebP(buffer: Buffer | Uint8Array) {
  return (
    buffer.length >= 12 &&
    Buffer.from(buffer.subarray(0, 4)).toString() === "RIFF" &&
    Buffer.from(buffer.subarray(8, 12)).toString() === "WEBP"
  );
}

function extensionFromUrl(url: string, fallback: string) {
  const extension = path.extname(new URL(url).pathname).toLowerCase();
  // 避免 TypeScript 将 HLS 的 .ts 视频分片误认为源码文件。
  if (extension === ".ts") return ".mpegts";
  return /^\.[a-z0-9]{1,8}$/.test(extension) ? extension : fallback;
}

function hasFileExtension(url: string) {
  return Boolean(path.extname(new URL(url).pathname));
}

function shortHash(value: string) {
  return createHash("sha1").update(value).digest("hex").slice(0, 10);
}

function sanitize(value: string) {
  return value.replace(/[<>:"/\\|?* -]/g, "_").slice(0, 120);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function parseArguments(args: string[]): DownloadOptions {
  const value = (name: string) => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const number = (name: string, fallback: number) => {
    const parsed = Number(value(name));
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  };
  const imagesOnly = args.includes("--images-only");
  const videosOnly = args.includes("--videos-only");
  if (imagesOnly && videosOnly) throw new Error("--images-only 和 --videos-only 不能同时使用");

  const modeArg = (value("--mode") || "today").toLowerCase();
  const sinceArg = value("--since");
  let mode: Mode;
  let since: string | undefined;
  if (sinceArg) {
    mode = "since";
    since = sinceArg;
  } else if (modeArg === "full") {
    mode = "full";
  } else if (modeArg === "today") {
    mode = "today";
  } else {
    throw new Error(`--mode 只支持 today | full，收到: ${modeArg}`);
  }

  return {
    input: value("--input") || DEFAULT_INPUT,
    output: value("--output") || DEFAULT_OUTPUT,
    concurrency: number("--concurrency", 4),
    segmentConcurrency: number("--segment-concurrency", 12),
    limit: value("--limit") ? number("--limit", 1) : undefined,
    force: args.includes("--force"),
    downloadImages: !videosOnly,
    downloadVideos: !imagesOnly,
    mode,
    since,
    dryRun: args.includes("--dry-run") || args.includes("--dry"),
  };
}

void main().catch((error) => {
  console.error("新版至尊媒体下载失败:", error);
  process.exitCode = 1;
});
