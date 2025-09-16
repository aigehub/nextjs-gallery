"use server";
import Image from "next/image";
import { Suspense } from "react";
import { Gallery } from "@/app/components/gallery";
import TopButton from "./components/TopButton";
import SearchComponent from "./components/Search";
import { PAGE_SIZE, queryData } from "./libs/data";


export default async function Home(props: {
  searchParams: Promise<{
    page?: string;
    max_price?: number;
    province?: string;
    bust?: string;
    tel?: boolean;
  }>;
}) {
  const params = await props.searchParams; // ✅ 这里要 await
  const {
      max_price,
      province,
      bust}=params
  const page = parseInt(params.page || "1");
  console.log("Home page params:", params);
      const { total, page_data } = await queryData({
      max_price,
      province,
      bust,
      offset: page || 1,
      limit: PAGE_SIZE,
    });
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
      <SearchComponent
        max_price={params.max_price}
        page={page}
        province={params.province}
        bust={params.bust}
      />
      <Suspense fallback={<div className="w-full h-full">Loading...</div>}>
        <Gallery total={total} page_data={page_data} show_tel={params.tel} />
      </Suspense>
      <TopButton />
    </main>
  );
}
