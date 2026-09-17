import Link from "next/link";
import { notFound } from "next/navigation";
import { apiUrl, getGirl } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function VideoPage({
  params,
  searchParams,
}: {
  params: Promise<{ dir: string; src: string; idx: string }>;
  searchParams: Promise<{ tier?: string }>;
}) {
  const { dir, src, idx } = await params;
  const sp = await searchParams;
  const tier = sp.tier ?? "";
  if (!tier) notFound();
  const girl = getGirl(tier, decodeURIComponent(dir));
  if (!girl) notFound();

  const i = parseInt(decodeURIComponent(idx), 10);
  if (Number.isNaN(i) || i < 0) notFound();
  const list = src === "auth" ? girl.authVideos : girl.videos;
  const video = list[i];
  if (!video) notFound();

  const girlSelf = `/girl/${encodeURIComponent(dir)}?tier=${encodeURIComponent(tier)}`;
  const poster = girl.posterPath ? apiUrl(girl.posterPath) : undefined;

  return (
    <div className="space-y-4">
      <nav className="text-sm text-zinc-500">
        <Link href={girlSelf} className="hover:text-amber-300">
          ← 返回 {girl.title}
        </Link>
        <span className="mx-3 text-zinc-400">
          {src === "auth" ? `认证视频 ${i + 1}` : `视频 ${i + 1}`}
        </span>
      </nav>

      <video
        controls
        preload="metadata"
        playsInline
        poster={poster}
        src={apiUrl(video)}
        className="w-full rounded-xl border border-zinc-800 bg-black"
      />

      <p className="break-all text-xs text-zinc-500">{video}</p>
    </div>
  );
}
