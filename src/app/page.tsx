import Image from "next/image";
import { Suspense } from "react";
import { Gallery } from "@/app/components/gallery";
import TopButton from "./components/TopButton";
export default async function Home(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await props.searchParams; // ✅ 这里要 await
  const page = params.page ?? "1";

  console.log("Home page:", page);
  return (
    <main className="flex min-h-screen flex-col items-center justify-between md:p-14 sm:p-5 p-5">
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
        <Gallery page={parseInt(page, 10)} />
      </Suspense>
       <TopButton />
    </main>
  );
}
