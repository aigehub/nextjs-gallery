// 创建图片库组件
import React from "react";
import { cachedGirlsData, loadAllGirlsJSONData } from "@/app/libs/data";
import { MediaItem } from "./media_item";
import Pagination from "./pagination";
const PAGE_SIZE = 20; // 每页显示的图片数量
export async function Gallery({ page }: { page?: number }) {
  // 这里可以调用异步函数获取数据
  const dataset: object[] = await loadAllGirlsJSONData({
    page_no: page || 1,
    page_size: PAGE_SIZE,
  });
  const totalPages = Math.ceil(cachedGirlsData.length / PAGE_SIZE);

  console.log(
    "Gallery dataset: total",
    cachedGirlsData.length,
    "totalPages:",
    totalPages
  );
  const IMG_BASE_URL = "https://pig.zwidi.cn"; // 替换为你的图片基础URL
  return (
    <>
      {/* 分页组件 */}
      <Pagination totalPages={totalPages} className="mb-4" />
      {/* 使用 CSS 列布局来实现瀑布流效果 */}
      {/* columns-1 sm:columns-2 md:columns-3 lg:columns-4 */}
      {/* gap-4 */}
      {/* 每个图片项使用 break-inside-avoid 来避免内容被拆分 */}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4  w-full h-full">
        {dataset.map((item: any, index) => (
          // console.log("Gallery item:", item),
          <div key={index} className="card-item mb-4 break-inside-avoid">
            <h1 className="text-emerald-500 border-l-4 pl-2 mb-2">
              {item.name}
            </h1>
            <p className="text-sm text-gray-500 mb-2">
              年龄：{item.age}, 身高：{item.height}, 体重：{item.weight}, 罩杯：
              {item.bust}
            </p>
            <p className="text-sm text-gray-500 mb-2">
              {item.province + " " + item.city + " " + item.address}
            </p>
            <p className="text-sm text-gray-400 mb-2">
              {item.price}
            </p>
            <p className="text-sm text-gray-500 mb-2">{item.skill}</p>
            {Array.from({ length: 6 }).map((_, idx) => {
              if (item[`photo${idx + 1}`]) {
                return (
                  <MediaItem
                    key={idx}
                    src={IMG_BASE_URL + item[`photo${idx + 1}`]}
                    width={100}
                    alt={item.title}
                    type="image"
                  />
                );
              }
            })}
            {Array.from({ length: 3 }).map((_, idx) => {
              let videoItem =
                idx == 0 ? item[`video`] : item[`video${idx + 1}`];
              // console.log("Gallery videoItem:", videoItem);
              if (videoItem) {
                return (
                  <MediaItem
                    key={idx}
                    src={IMG_BASE_URL + videoItem}
                    type="video"
                    width={200}
                  />
                );
              }
            })}
          </div>
        ))}
      </div>
      <Pagination totalPages={totalPages} className="p-2" />
    </>
  );
}
