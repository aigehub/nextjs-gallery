import Link from "next/link";
import { listGirls, listTiers } from "@/lib/media";
import GirlCard from "@/components/GirlCard";

export const dynamic = "force-dynamic";

export default function Home() {
  const tiers = listTiers();
  const featured = tiers.map((t) => ({
    tier: t,
    sample: listGirls(t.tier, 1, 6),
  }));

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-bold">本地相册</h1>
        <p className="mt-1 text-sm text-zinc-400">
          从 <code className="rounded bg-zinc-800 px-1">../downloads</code> 流式提供的图片与视频。
        </p>
        <ul className="mt-4 flex flex-wrap gap-3 text-sm">
          {tiers.map((t) => (
            <li key={t.tier}>
              <Link
                href={`/tier/${t.tier.split("/").map(encodeURIComponent).join("/")}`}
                className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-300 hover:border-amber-500/60 hover:text-amber-300"
              >
                {t.tier} <span className="ml-1 text-zinc-500">({t.count})</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {featured.map(({ tier, sample }) => (
        <section key={tier.tier}>
          <header className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">{tier.tier}</h2>
            <Link
              href={`/tier/${tier.tier.split("/").map(encodeURIComponent).join("/")}`}
              className="text-sm text-amber-400 hover:underline"
            >
              查看全部 {tier.count} 条 →
            </Link>
          </header>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {sample.items.map((item) => (
              <GirlCard key={item.dir} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
