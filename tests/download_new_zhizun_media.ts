/**
 * 下载新版至尊相册的全部媒体资源。
 *
 * 默认输入：json/zhizun/new_zhizun_all_list.json
 * 默认输出：downloads/new_zhizun
 *
 * 示例：
 *   npx tsx tests/download_new_zhizun_media.ts
 *   npx tsx tests/download_new_zhizun_media.ts --limit 2
 *   npx tsx tests/download_new_zhizun_media.ts --images-only
 *   npx tsx tests/download_new_zhizun_media.ts --videos-only --concurrency 2
 *   npx tsx tests/download_new_zhizun_media.ts --force
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
}

interface Failure {
  itemId: string;
  kind: string;
  url: string;
  error: string;
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

async function main() {
  const items = readItems(options.input);
  const selected = options.limit ? items.slice(0, options.limit) : items;
  fs.mkdirSync(options.output, { recursive: true });

  const totals = countResources(selected);
  console.log("新版至尊媒体下载开始", {
    input: options.input,
    output: options.output,
    items: selected.length,
    ...totals,
    concurrency: options.concurrency,
    segmentConcurrency: options.segmentConcurrency,
  });

  let completed = 0;
  await Promise.all(
    selected.map((item) =>
      itemLimit(async () => {
        await downloadItem(item);
        completed++;
        if (completed % 10 === 0 || completed === selected.length) {
          console.log(
            `进度 ${completed}/${selected.length}，下载 ${downloadedFiles}，跳过 ${skippedFiles}，失败 ${failures.length}`,
          );
        }
      }),
    ),
  );

  const report = {
    finishedAt: new Date().toISOString(),
    input: options.input,
    output: options.output,
    items: selected.length,
    downloadedFiles,
    skippedFiles,
    failed: failures.length,
    failures,
  };
  await writeJsonAtomic(path.join(options.output, "download-report.json"), report);
  console.log("下载完成", {
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
  fs.mkdirSync(itemDirectory, { recursive: true });

  await writeJsonAtomic(path.join(itemDirectory, "metadata.json"), item);

  const tasks: Promise<void>[] = [];
  if (options.downloadImages) {
    const imageEntries: Array<{ url: string; name: string }> = [];
    if (item.poster) imageEntries.push({ url: item.poster, name: "poster.webp" });
    [...new Set((item.images || []).filter(isString))]
      .filter((url) => url !== item.poster)
      .forEach((url, index) => {
        imageEntries.push({
          url,
          name: `image_${String(index + 1).padStart(3, "0")}.webp`,
        });
      });
    imageEntries.forEach(({ url, name }) => {
      tasks.push(resourceLimit(() => captureFailure(itemId, "image", url, () => downloadDecodedImage(url, path.join(itemDirectory, "images", name)))));
    });
  }

  if (options.downloadVideos) {
    const ordinary = [...new Set((item.videos || []).filter(isString))];
    const authentication = [...new Set((item.authVideos || []).filter(isString))];
    ordinary.forEach((url, index) => {
      tasks.push(resourceLimit(() => captureFailure(itemId, "video", url, () => downloadVideo(url, path.join(itemDirectory, "videos", `video_${String(index + 1).padStart(3, "0")}`)))));
    });
    authentication.forEach((url, index) => {
      tasks.push(resourceLimit(() => captureFailure(itemId, "auth-video", url, () => downloadVideo(url, path.join(itemDirectory, "auth-videos", `auth_${String(index + 1).padStart(3, "0")}`)))));
    });
  }
  await Promise.all(tasks);
}

async function downloadDecodedImage(url: string, destination: string) {
  if (!options.force && isValidWebP(destination)) {
    skippedFiles++;
    return;
  }
  const encrypted = await fetchBuffer(url);
  const decoded = decodeZhizunImage(encrypted);
  await writeFileAtomic(destination, decoded);
  downloadedFiles++;
}

export function decodeZhizunImage(encrypted: Buffer) {
  if (isWebP(encrypted)) return encrypted;
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
  if (!isWebP(decoded)) throw new Error("解码后不是有效 WebP");
  return decoded;
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

function isValidWebP(filename: string) {
  if (!fs.existsSync(filename)) return false;
  const descriptor = fs.openSync(filename, "r");
  try {
    const header = Buffer.alloc(12);
    return fs.readSync(descriptor, header, 0, 12, 0) === 12 && isWebP(header);
  } finally {
    fs.closeSync(descriptor);
  }
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
  return value.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 120);
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

  return {
    input: value("--input") || DEFAULT_INPUT,
    output: value("--output") || DEFAULT_OUTPUT,
    concurrency: number("--concurrency", 4),
    segmentConcurrency: number("--segment-concurrency", 12),
    limit: value("--limit") ? number("--limit", 1) : undefined,
    force: args.includes("--force"),
    downloadImages: !videosOnly,
    downloadVideos: !imagesOnly,
  };
}

void main().catch((error) => {
  console.error("新版至尊媒体下载失败:", error);
  process.exitCode = 1;
});
