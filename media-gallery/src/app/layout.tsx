import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "本地相册",
  description: "Local media gallery — images & videos from the downloads folder",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight hover:text-amber-300">
              本地相册
            </Link>
            <nav className="flex items-center gap-4 text-sm text-zinc-400">
              <Link href="/tier/new_zhizun/middle" className="hover:text-zinc-100">
                Middle
              </Link>
              <Link href="/tier/new_zhizun/premium" className="hover:text-zinc-100">
                Premium
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 pb-10 text-xs text-zinc-500">
          served from <code>../downloads</code>
        </footer>
      </body>
    </html>
  );
}
