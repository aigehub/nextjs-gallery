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
      <Pagination totalPages={totalPages} className="mb-4 mt-4" />

      {/* 外层：纵向排列每个 item */}
      <div
        className="flex flex-wrap gap-4 items-start  ">
        {dataset.map((item: any, index) => (
          < >
            {/* 描述模块 */}
            <div className="flex-1 w-[40rem] h-[60rem] border bg-white rounded-lg shadow-md">
              <h1 className="text-emerald-500 border-l-4 pl-2 mb-2">{item.name}</h1>
              <p className="text-sm text-gray-500 mb-2">
                年龄：{item.age}, 身高：{item.height}, 体重：{item.weight}, 罩杯：
                {item.bust}
              </p>
              <p className="text-sm text-gray-500 mb-2">
                {item.province + " " + item.city + " " + item.address}
              </p>
              <p className="text-sm text-gray-400 mb-2">{item.price}</p>
              <p className="text-sm text-gray-500 mb-2">{item.skill}</p>
            </div>

            {/* 图片和视频模块 */}
            {Array.from({ length: 6 }).map((_, idx) => {
              if (item[`photo${idx + 1}`]) {
                return (
                  <MediaItem
                    key={`photo-${idx}`}
                    src={IMG_BASE_URL + item[`photo${idx + 1}`]}
                    width={300}
                    alt={item.title}
                    type="image"
                  />
                );
              }
            })}

            {Array.from({ length: 3 }).map((_, idx) => {
              let videoItem =
                idx === 0 ? item[`video`] : item[`video${idx + 1}`];
              if (videoItem) {
                return (
                  <MediaItem
                    key={`video-${idx}`}
                    src={IMG_BASE_URL + videoItem}
                    type="video"
                    width={300}
                  />
                );
              }
            })}
          </>
        ))}
      </div>


      <Pagination totalPages={totalPages} className="p-2" />
    </>
  );
}
