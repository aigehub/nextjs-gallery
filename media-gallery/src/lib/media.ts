import fs from "fs";
import path from "path";

export const MEDIA_ROOT = path.resolve(
  process.env.MEDIA_ROOT || path.join(process.cwd(), "..", "downloads")
);

export interface GirlItem {
  /** raw directory name (rawurl-encoded by the route helpers) */
  dir: string;
  /** tier: middle | premium */
  tier: string;
  /** id + title parsed from metadata.json */
  id: number | null;
  title: string;
  city: string;
  displayPrice: number | null;
  imagesCount: number;
  videosCount: number;
  authVideosCount: number;
  /** relative URL path under /api/files */
  posterPath: string | null;
  /** mtime for sorting (ms) */
  mtime: number;
}

export interface GirlDetail extends GirlItem {
  images: string[];       // relative paths
  videos: string[];       // relative paths to .mp4
  authVideos: string[];
}

const IMAGE_EXT = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif", ".avif"]);
const VIDEO_EXT = new Set([".mp4", ".webm", ".m3u8", ".mov"]);

/** Resolve a user-supplied relative path inside MEDIA_ROOT with traversal protection. */
export function resolveMedia(relPath: string): string {
  // strip leading slashes so path.join doesn't restart at the filesystem root
  const cleaned = relPath.replace(/^[/\\]+/, "");
  const abs = path.resolve(MEDIA_ROOT, cleaned);
  if (!abs.startsWith(MEDIA_ROOT + path.sep) && abs !== MEDIA_ROOT) {
    throw new Error("Path escapes media root");
  }
  return abs;
}

function exists(p: string): boolean {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function listMediaFilesRecursive(dir: string, exts: Set<string>): string[] {
  const out: string[] = [];
  if (!exists(dir)) return out;
  const stack: string[] = [dir];
  while (stack.length) {
    const cur = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) {
        stack.push(full);
      } else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        if (exts.has(ext)) out.push(full);
      }
    }
  }
  return out;
}

/** relative path from MEDIA_ROOT with forward slashes (used as /api/files?path=… query) */
export function relPath(abs: string): string {
  return path.relative(MEDIA_ROOT, abs).split(path.sep).join("/");
}

function readMetadata(girlDir: string): Record<string, unknown> | null {
  const p = path.join(girlDir, "metadata.json");
  if (!exists(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

export function listTiers(): { tier: string; count: number }[] {
  if (!exists(MEDIA_ROOT)) return [];
  const tops = fs.readdirSync(MEDIA_ROOT, { withFileTypes: true });
  const result: { tier: string; count: number }[] = [];
  for (const top of tops) {
    if (!top.isDirectory()) continue;
    // e.g. new_zhizun -> top-level; iterate tiers inside it
    const topPath = path.join(MEDIA_ROOT, top.name);
    let tierDirs: fs.Dirent[] = [];
    try {
      tierDirs = fs.readdirSync(topPath, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const t of tierDirs) {
      if (!t.isDirectory()) continue;
      const tierRel = `${top.name}/${t.name}`;
      const tierPath = path.join(MEDIA_ROOT, top.name, t.name);
      let count = 0;
      try {
        count = fs.readdirSync(tierPath).filter((n) => {
          try {
            return fs.statSync(path.join(tierPath, n)).isDirectory();
          } catch {
            return false;
          }
        }).length;
      } catch {
        count = 0;
      }
      result.push({ tier: tierRel, count });
    }
  }
  return result.sort((a, b) => a.tier.localeCompare(b.tier));
}

/** List girls inside a tier (e.g. "new_zhizun/middle") with pagination. */
export function listGirls(
  tier: string,
  page: number,
  pageSize: number
): { items: GirlItem[]; total: number } {
  const tierPath = resolveMedia(tier);
  if (!exists(tierPath)) return { items: [], total: 0 };
  const names = fs
    .readdirSync(tierPath, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  const total = names.length;
  const start = (page - 1) * pageSize;
  const slice = names.slice(start, start + pageSize);
  const items: GirlItem[] = slice.map((name) => {
    const dir = path.join(tierPath, name);
    return describeGirl(tier, name, dir);
  });
  return { items, total };
}

function describeGirl(tier: string, dirName: string, dir: string): GirlItem {
  let stat: fs.Stats | null = null;
  try {
    stat = fs.statSync(dir);
  } catch {
    /* ignore */
  }
  const meta = readMetadata(dir);
  const imagesDir = path.join(dir, "images");
  const videos = listMediaFilesRecursive(path.join(dir, "videos"), VIDEO_EXT);
  const authVideos = listMediaFilesRecursive(path.join(dir, "auth-videos"), VIDEO_EXT);

  let posterPath: string | null = null;
  if (exists(path.join(imagesDir, "poster.webp"))) {
    posterPath = relPath(path.join(imagesDir, "poster.webp"));
  } else {
    const images = fs.existsSync(imagesDir)
      ? fs.readdirSync(imagesDir).find((n) => IMAGE_EXT.has(path.extname(n).toLowerCase()))
      : undefined;
    if (images) posterPath = relPath(path.join(imagesDir, images));
  }

  const title =
    (typeof meta?.title === "string" && meta.title) ||
    dirName.split("_").slice(2).join("_") ||
    dirName;
  const id = typeof meta?.id === "number" ? meta.id : null;
  const city = typeof meta?.cityName === "string" ? meta.cityName : "";
  const displayPrice =
    typeof meta?.displayPrice === "number" ? meta.displayPrice : null;

  let imagesCount = 0;
  try {
    imagesCount = fs
      .readdirSync(imagesDir)
      .filter((n) => IMAGE_EXT.has(path.extname(n).toLowerCase())).length;
  } catch {
    /* ignore */
  }

  return {
    dir: dirName,
    tier,
    id,
    title,
    city,
    displayPrice,
    imagesCount,
    videosCount: videos.length,
    authVideosCount: authVideos.length,
    posterPath,
    mtime: stat?.mtimeMs ?? 0,
  };
}

export function getGirl(tier: string, dirName: string): GirlDetail | null {
  const tierPath = resolveMedia(tier);
  const dir = path.join(tierPath, dirName);
  if (!exists(dir) || !fs.statSync(dir).isDirectory()) return null;
  const base = describeGirl(tier, dirName, dir);
  const imagesDir = path.join(dir, "images");
  const images = exists(imagesDir)
    ? fs
        .readdirSync(imagesDir)
        .filter((n) => IMAGE_EXT.has(path.extname(n).toLowerCase()))
        .sort()
        .map((n) => relPath(path.join(imagesDir, n)))
    : [];
  const videos = listMediaFilesRecursive(path.join(dir, "videos"), VIDEO_EXT).map(relPath);
  const authVideos = listMediaFilesRecursive(path.join(dir, "auth-videos"), VIDEO_EXT).map(relPath);
  return { ...base, images, videos, authVideos };
}

export function apiUrl(rel: string): string {
  return `/api/files?path=${encodeURIComponent(rel)}`;
}
