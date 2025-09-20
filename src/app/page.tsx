"use server";
import Image from "next/image";
import { Suspense } from "react";
import { Gallery } from "@/app/components/gallery";
import TopButton from "./components/TopButton";
import SearchComponent from "./components/Search";
import { PAGE_SIZE, PLAT, queryData } from "./libs/data";

export default async function Home(props: {
  searchParams: Promise<{
    page?: string;
    max_price?: number;
    p?: number; //platform
    province?: string;
    bust?: string;
    name?: string;
    district_name?: string;
    tel?: boolean;
  }>;
}) {
  const params = await props.searchParams; // ✅ 这里要 await
  const { max_price, province, bust, name, district_name, p } = params;
  const page = parseInt(params.page || "1");
  let platform: PLAT = "jimei";
  let plat = parseInt(p?.toString() || "1");
  switch (plat) {
    case 2:
      platform = "zhizun";
      break;
    case 3:
      platform = "58kv";
      break;
    default:
      platform = "jimei";
  }

  console.log("Home page params:", params);
  const { total, page_data } = await queryData({
    max_price,
    province,
    bust,
    offset: page || 1,
    limit: PAGE_SIZE,
    name,
    district_name,
    platform,
  });
  return (
    <main className="flex min-h-screen flex-col items-center justify-between md:p-14 sm:p-5 p-5">
      <div className="relative z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl">Gallery 相册</h1>
        <div className="flex lg:ml-auto lg:text-right mt-4 lg:mt-0 font-bold justify-center">
          <a
        href="/?p=1"
        className={`mx-1 ${plat === 1 ? "text-blue-700" : ""}`}
          >
        相册1
          </a>
          <span className="mx-1 text-gray-400 select-none" style={{ fontWeight: 100 }}>|</span>
          <a
        href="/?p=2"
        className={`mx-1 ${plat === 2 ? "text-blue-700" : ""}`}
          >
        相册2
          </a>
          <span className="mx-1 text-gray-400 select-none" style={{ fontWeight: 100 }}>|</span>
          <a
        href="/?p=3"
        className={`mx-1 ${plat === 3 ? "text-blue-700" : ""}`}
          >
        相册3
          </a>
        </div>
      </div>
      <SearchComponent max_price={params.max_price} page={page} province={params.province} bust={params.bust} />
      <Suspense fallback={<div className="w-full h-full">Loading...</div>}>
        <Gallery total={total} page_data={page_data} show_tel={params.tel} plat={platform} />
      </Suspense>
      <TopButton />
    </main>
  );
}
