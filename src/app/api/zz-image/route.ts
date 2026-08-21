import { NextRequest, NextResponse } from "next/server";

function isAllowedImageUrl(url: URL) {
  return (
    url.protocol === "https:" &&
    (url.hostname === "im4ge.net" || url.hostname.endsWith(".im4ge.net"))
  );
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("src");
  if (!source) {
    return NextResponse.json({ error: "缺少 src 参数" }, { status: 400 });
  }

  let imageUrl: URL;
  try {
    imageUrl = new URL(source);
  } catch {
    return NextResponse.json({ error: "src 不是有效 URL" }, { status: 400 });
  }
  if (!isAllowedImageUrl(imageUrl)) {
    return NextResponse.json({ error: "不允许代理该图片域名" }, { status: 403 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        referer: "https://xc.xz0377.com/",
      },
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: `远程图片返回 HTTP ${response.status}` },
        { status: response.status },
      );
    }

    return new NextResponse(await response.arrayBuffer(), {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=2592000, immutable",
        "Content-Type": response.headers.get("content-type") || "application/octet-stream",
      },
    });
  } catch (error) {
    console.error("至尊图片代理失败:", imageUrl.toString(), error);
    return NextResponse.json({ error: "远程图片请求失败" }, { status: 502 });
  }
}
