import Link from "next/link";
import { notFound } from "next/navigation";
import { apiUrl, getGirl } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ dir: string }>;
  searchParams: Promise<{ tier?: string; index?: string }>;
}) {
  const { dir } = await params;
  const sp = await searchParams;
  const tier = sp.tier ?? "";
  if (!tier) notFound();
  const girl = getGirl(tier, decodeURIComponent(dir));
  if (!girl || girl.images.length === 0) notFound();

  const index = Math.min(
    Math.max(0, parseInt(sp.index ?? "0", 10) || 0),
    girl.images.length - 1
  );
  const src = girl.images[index];
  const girlSelf = `/girl/${encodeURIComponent(dir)}?tier=${encodeURIComponent(tier)}`;
  const galleryBase = `${girlSelf}/gallery`;

  const prev = index > 0 ? index - 1 : null;
  const next = index < girl.images.length - 1 ? index + 1 : null;

  return (
    <div className="space-y-4">
      <nav className="text-sm text-zinc-500">
        <Link href={girlSelf} className="hover:text-amber-300">
          ← 返回 {girl.title}
        </Link>
        <span className="mx-3 text-zinc-400">
          {index + 1} / {girl.images.length}
        </span>
      </nav>

      <div className="relative flex items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={apiUrl(src)}
          alt={`${girl.title} ${index + 1}`}
          className="max-h-[85vh] w-auto max-w-full object-contain"
        />
      </div>

      <div className="flex items-center justify-between">
        <Link
          prefetch={false}
          href={prev != null ? `${galleryBase}&index=${prev}` : "#"}
          aria-disabled={prev == null}
          className={
            "rounded-md border px-4 py-2 text-sm " +
            (prev != null
              ? "border-zinc-700 hover:border-amber-500/60"
              : "pointer-events-none border-zinc-800 text-zinc-600")
          }
        >
          ← 上一张
        </Link>
        <a
          href={apiUrl(src)}
          download
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm hover:border-amber-500/60"
        >
          下载原图
        </a>
        <Link
          prefetch={false}
          href={next != null ? `${galleryBase}&index=${next}` : "#"}
          aria-disabled={next == null}
          className={
            "rounded-md border px-4 py-2 text-sm " +
            (next != null
              ? "border-zinc-700 hover:border-amber-500/60"
              : "pointer-events-none border-zinc-800 text-zinc-600")
          }
        >
          下一张 →
        </Link>
      </div>

      <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
        {girl.images.map((p, i) => (
          <Link
            key={p}
            prefetch={false}
            href={`${galleryBase}&index=${i}`}
            className={
              "overflow-hidden rounded-md border " +
              (i === index ? "border-amber-500" : "border-zinc-800 hover:border-amber-500/60")
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={apiUrl(p)}
              alt={`${i + 1}`}
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
