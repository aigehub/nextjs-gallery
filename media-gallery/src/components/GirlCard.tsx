import Link from "next/link";
import { apiUrl, GirlItem } from "@/lib/media";

export default function GirlCard({ item }: { item: GirlItem }) {
  const detailHref = `/girl/${encodeURIComponent(item.dir)}?tier=${encodeURIComponent(item.tier)}`;
  return (
    <Link
      href={detailHref}
      prefetch={false}
      className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm transition hover:border-amber-500/60"
    >
      <div className="aspect-square w-full overflow-hidden bg-zinc-800">
        {item.posterPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={apiUrl(item.posterPath)}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-500">
            无封面
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <p className="text-xs text-zinc-400">
          {item.city || "—"} · {" "}
          {item.displayPrice != null ? `¥${item.displayPrice}` : "—"}
        </p>
        <p className="text-xs text-zinc-500">
          📷 {item.imagesCount} ・ 🎬 {item.videosCount + item.authVideosCount}
        </p>
      </div>
    </Link>
  );
}
