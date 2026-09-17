import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import type { Stats } from "node:fs";
import { Readable } from "node:stream";
import { extname } from "node:path";
import type { NextRequest } from "next/server";
import { resolveMedia } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m3u8": "application/vnd.apple.mpegurl",
  ".json": "application/json",
};

function cors(extra?: Record<string, string>) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
    "Cache-Control": "public, max-age=3600, immutable",
    ...extra,
  };
}

export function OPTIONS() {
  return new Response(null, { headers: cors({ "Access-Control-Allow-Methods": "GET, OPTIONS" }) });
}

export async function GET(req: NextRequest) {
  const rel = req.nextUrl.searchParams.get("path");
  if (!rel) return new Response("Missing ?path=", { status: 400, headers: cors() });

  let filePath: string;
  try {
    filePath = resolveMedia(rel);
  } catch {
    return new Response("Forbidden", { status: 403, headers: cors() });
  }

  let s: Stats;
  try {
    s = await stat(filePath);
  } catch {
    return new Response("Not Found", { status: 404, headers: cors() });
  }
  if (!s.isFile()) return new Response("Not Found", { status: 404, headers: cors() });

  const size = s.size;
  const mime = MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream";
  const baseHeaders: Record<string, string> = {
    "Accept-Ranges": "bytes",
    "Content-Type": mime,
  };

  const range = req.headers.get("range");
  if (mime.startsWith("video/") && range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (m && (m[1] || m[2])) {
      if (!m[1]) {
        // suffix range: last N bytes
        const n = Math.min(size, parseInt(m[2], 10) || 0);
        const start = Math.max(0, size - n);
        const end = size - 1;
        const len = end - start + 1;
        const stream = createReadStream(filePath, { start, end });
        return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
          status: 206,
          headers: cors({
            ...baseHeaders,
            "Content-Range": `bytes ${start}-${end}/${size}`,
            "Content-Length": String(len),
          }),
        });
      }
      const start = parseInt(m[1], 10);
      if (start >= size) {
        return new Response(null, {
          status: 416,
          headers: cors({ "Content-Range": `bytes */${size}` }),
        });
      }
      const end = m[2] ? Math.min(parseInt(m[2], 10), size - 1) : size - 1;
      const len = end - start + 1;
      const stream = createReadStream(filePath, { start, end });
      return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
        status: 206,
        headers: cors({
          ...baseHeaders,
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Content-Length": String(len),
        }),
      });
    }
  }

  const stream = createReadStream(filePath);
  return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
    status: 200,
    headers: cors({ ...baseHeaders, "Content-Length": String(size) }),
  });
}
