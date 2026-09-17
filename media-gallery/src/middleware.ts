import type { NextRequest, NextFetchEvent } from "next/server";
import { NextResponse } from "next/server";

/**
 * 本地访问白名单 — 仅监听来自本机 / RFC1918 内网 / CGNAT 段的请求。
 * 想放开公网就删掉这个文件，或设环境变量 MEDIA_GALLERY_ALLOW_ALL=1。
 */
const ALLOW_ALL = process.env.MEDIA_GALLERY_ALLOW_ALL === "1";

function isPrivate(ip: string | null | undefined): boolean {
  if (!ip) return false;
  if (ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("169.254.")) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(ip)) return true;
  if (ip === "0.0.0.0" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) return true;
  return false;
}

export function middleware(req: NextRequest, _ev: NextFetchEvent) {
  if (ALLOW_ALL) return NextResponse.next();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    // Next 15 exposes req.ip in middleware but it's typed optional — ignore if missing
    (req as unknown as { ip?: string }).ip ||
    null;
  if (!isPrivate(ip)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
