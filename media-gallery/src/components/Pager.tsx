import Link from "next/link";
import React from "react";

export default function Pager({
  page,
  total,
  pageSize,
  baseUrl,
}: {
  page: number;
  total: number;
  pageSize: number;
  /** URL builder for a given page number */
  baseUrl: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const win = 2;
  const start = Math.max(1, page - win);
  const end = Math.min(pages, page + win);
  const nums: number[] = [];
  for (let i = start; i <= end; i++) nums.push(i);

  const btn = (label: React.ReactNode, p: number, active = false, disabled = false) => (
    <Link
      key={`${label}-${p}`}
      prefetch={false}
      href={disabled ? "#" : baseUrl(p)}
      aria-disabled={disabled}
      className={
        "rounded-md border px-3 py-1 text-sm " +
        (active
          ? "border-amber-500 bg-amber-500/10 text-amber-300"
          : disabled
            ? "pointer-events-none border-zinc-800 text-zinc-600"
            : "border-zinc-700 text-zinc-300 hover:border-amber-500/60 hover:text-amber-300")
      }
    >
      {label}
    </Link>
  );

  return (
    <nav className="mt-6 flex flex-wrap items-center gap-2">
      {btn("« 上一页", Math.max(1, page - 1), false, page <= 1)}
      {start > 1 && (
        <>
          {btn(1, 1)}
          {start > 2 && <span className="px-1 text-zinc-500">…</span>}
        </>
      )}
      {nums.map((n) => btn(n, n, n === page))}
      {end < pages && (
        <>
          {end < pages - 1 && <span className="px-1 text-zinc-500">…</span>}
          {btn(pages, pages)}
        </>
      )}
      {btn("下一页 »", Math.min(pages, page + 1), false, page >= pages)}
      <span className="ml-2 text-xs text-zinc-500">
        共 {total} 条 / {pages} 页
      </span>
    </nav>
  );
}
