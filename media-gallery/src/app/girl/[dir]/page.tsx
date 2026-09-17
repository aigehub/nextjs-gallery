import Link from "next/link";
import { notFound } from "next/navigation";
import { apiUrl, getGirl } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function GirlPage({
  params,
  searchParams,
}: {
  params: Promise<{ dir: string }>;
  searchParams: Promise<{ tier?: string }>;
}) {
  const { dir } = await params;
  const sp = await searchParams;
  const tier = sp.tier ?? "";
  if (!tier) notFound();
  const girl = getGirl(tier, decodeURIComponent(dir));
  if (!girl) notFound();

  const tierUrl = `/tier/${tier.split("/").map(encodeURIComponent).join("/")}`;
  const girlSelf = `/girl/${encodeURIComponent(dir)}?tier=${encodeURIComponent(tier)}`;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-amber-300">
          全部
        </Link>
        <span className="mx-2">/</span>
        <Link href={tierUrl} className="hover:text-amber-300">
          {tier}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">{girl.title}</span>
      </nav>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{girl.title}</h1>
        <p className="text-sm text-zinc-400">
          {girl.city || "—"}
          {girl.displayPrice != null && (
            <span className="ml-3 text-amber-300">¥{girl.displayPrice}</span>
          )}
          {girl.id != null && <span className="ml-3 text-zinc-500">#{girl.id}</span>}
        </p>
        <p className="text-xs text-zinc-500">
          📷 {girl.images.length} 张 · 🎬 普通视频 {girl.videos.length} 个 · 认证视频{" "}
          {girl.authVideos.length} 个
        </p>
      </header>

      {/* first-look preview strip */}
      {girl.posterPath && (
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={apiUrl(girl.posterPath)}
            alt={girl.title}
            className="h-auto w-full max-h-[70vh] object-cover"
          />
        </div>
      )}

      {/* actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`${girlSelf.replace("/girl/", "/girl/")}/gallery`}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
        >
          图库浏览 ({girl.images.length})
        </Link>
        {girl.videos.length + girl.authVideos.length > 0 && (
          <span className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300">
            视频 {girl.videos.length + girl.authVideos.length} 个
          </span>
        )}
        <a
          href={apiUrl(girl.posterPath ?? "")}
          download
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-amber-500/60"
        >
          下载封面
        </a>
      </div>

      {/* video list */}
      {(girl.videos.length > 0 || girl.authVideos.length > 0) && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">视频</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {girl.videos.map((v, i) => (
              <li key={`v-${i}`}>
                <Link
                  href={`${girlSelf}/video/media/${i}`}
                  className="block rounded-lg border border-zinc-800 bg-zinc-900 p-4 hover:border-amber-500/60"
                >
                  <p className="text-sm font-medium">视频 {i + 1}</p>
                  <p className="mt-1 break-all text-xs text-zinc-500">{v}</p>
                </Link>
              </li>
            ))}
            {girl.authVideos.map((v, i) => (
              <li key={`a-${i}`}>
                <Link
                  href={`${girlSelf}/video/auth/${i}`}
                  className="block rounded-lg border border-emerald-800 bg-emerald-950/40 p-4 hover:border-emerald-500/60"
                >
                  <p className="text-sm font-medium text-emerald-300">认证视频 {i + 1}</p>
                  <p className="mt-1 break-all text-xs text-zinc-500">{v}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
