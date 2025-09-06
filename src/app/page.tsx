import Image from "next/image";
import { Suspense } from "react";
import { Gallery } from "@/app/components/gallery";
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <Image
          src="/next.svg"
          alt="Next.js Logo"
          className="dark:invert"
          width={180}
          height={37}
          priority
        />
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <Gallery />
      </Suspense>
    </main>
  );
}
