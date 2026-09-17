import Link from "next/link";
import { notFound } from "next/navigation";
import { listGirls } from "@/lib/media";
import GirlCard from "@/components/GirlCard";
import Pager from "@/components/Pager";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 48;

export default async function TierPage({
  params,
  searchParams,
}: {
  params: Promise<{ tier: string[] }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { tier } = await params;
  const sp = await searchParams;
  const tierPath = tier.map(decodeURIComponent).join("/");
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const { items, total } = listGirls(tierPath, page, PAGE_SIZE);
  if (page > 1 && items.length === 0) notFound();
  if (page === 1 && items.length === 0) notFound();

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const tierUrl = `/tier/${tier.map(encodeURIComponent).join("/")}`;
  const baseUrl = (p: number) => (p <= 1 ? tierUrl : `${tierUrl}?page=${p}`);

  return (
    <div className="space-y-4">
      <nav className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-amber-300">
          全部
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">{tierPath}</span>
      </nav>

      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">{tierPath}</h1>
        <span className="text-sm text-zinc-500">
          共 {total} 条 · 第 {page}/{pages} 页
        </span>
      </header>

      {items.length === 0 ? (
        <p className="text-zinc-500">该目录为空。</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <GirlCard key={item.dir} item={item} />
          ))}
        </div>
      )}

      <Pager page={page} total={total} pageSize={PAGE_SIZE} baseUrl={baseUrl} />
    </div>
  );
}
