import { NextRequest, NextResponse } from "next/server";

const VIDEO_HOST = "im4ge.net";

function isAllowedVideoUrl(url: URL) {
  return (
    url.protocol === "https:" &&
    (url.hostname === VIDEO_HOST || url.hostname.endsWith(`.${VIDEO_HOST}`))
  );
}

function proxyUrl(request: NextRequest, source: string, base: URL) {
  const absolute = new URL(source, base);
  if (!isAllowedVideoUrl(absolute)) {
    throw new Error(`m3u8 包含不允许的媒体域名: ${absolute.hostname}`);
  }
  const proxy = new URL("/api/zz-video", request.nextUrl.origin);
  proxy.searchParams.set("src", absolute.toString());
  return proxy.toString();
}

function rewriteManifest(request: NextRequest, manifest: string, source: URL) {
  return manifest
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (!trimmed.startsWith("#")) return proxyUrl(request, trimmed, source);

      return line.replace(
        /URI=(?:"([^"]+)"|([^,\s]+))/g,
        (_match, quoted: string | undefined, plain: string | undefined) =>
          `URI="${proxyUrl(request, quoted || plain || "", source)}"`,
      );
    })
    .join("\n");
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("src");
  if (!source) {
    return NextResponse.json({ error: "缺少 src 参数" }, { status: 400 });
  }

  let videoUrl: URL;
  try {
    videoUrl = new URL(source);
  } catch {
    return NextResponse.json({ error: "src 不是有效 URL" }, { status: 400 });
  }
  if (!isAllowedVideoUrl(videoUrl)) {
    return NextResponse.json({ error: "不允许代理该视频域名" }, { status: 403 });
  }

  const headers = new Headers({
    accept: request.headers.get("accept") || "*/*",
    referer: "https://xc.xz0377.com/",
  });
  const range = request.headers.get("range");
  if (range) headers.set("range", range);

  try {
    const response = await fetch(videoUrl, {
      headers,
      redirect: "manual",
      signal: request.signal,
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: `远程视频返回 HTTP ${response.status}` },
        { status: response.status },
      );
    }

    const contentType = response.headers.get("content-type") || "";
    const isManifest =
      videoUrl.pathname.endsWith(".m3u8") ||
      contentType.includes("mpegurl");
    if (isManifest) {
      const manifest = rewriteManifest(request, await response.text(), videoUrl);
      return new NextResponse(manifest, {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=3600",
          "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
        },
      });
    }

    const responseHeaders = new Headers({
      "Cache-Control": "public, max-age=14400, s-maxage=86400",
      "Content-Type": contentType || "application/octet-stream",
    });
    for (const name of ["accept-ranges", "content-length", "content-range"]) {
      const value = response.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("至尊视频代理失败:", videoUrl.toString(), error);
    return NextResponse.json({ error: "远程视频请求失败" }, { status: 502 });
  }
}
