// 创建图片库组件
import React from "react";
import { queryData } from "@/app/libs/data";
import { MediaItem } from "./media_item";
import Pagination from "./pagination";
import { Girl } from "@/generated/prisma";
const PAGE_SIZE = 20; // 每页显示的图片数量
const IMG_BASE_URL = "https://pig.zwidi.cn"; // 替换为你的图片基础URL
export async function Gallery({
  total,
  page_data,
  show_tel,
}: {
  total: number;
  show_tel?: boolean;
  page_data: Girl[];
}) {
  // const dataset: object[] = await loadAllGirlsJSONData({
  //   page_no: page || 1,
  //   page_size: PAGE_SIZE,
  // });
  const totalPages = Math.ceil(total / PAGE_SIZE);

  console.log("Gallery dataset: total", total, "totalPages:", totalPages);
  const item_width =
    "sm:w-[18rem] sm:h-[23rem] max-sm:w-[18rem] max-sm:h-[23rem] ";
  return (
    <>
      {/* 分页组件 */}
      <Pagination totalPages={totalPages} className="mb-4 mt-4" />

      {/* 外层：纵向排列每个 item */}
      <div className="flex flex-wrap gap-4 items-start justify-center">
        {page_data.map((item: Girl, index) => (
          <ModelGirl
            key={`${item.id}${item.name}${index}-${item.girl_id}`}
            item={item}
            index={index}
            item_width={item_width}
            show_tel={show_tel}
          />
        ))}
      </div>

      <Pagination totalPages={totalPages} className="p-2" />
    </>
  );
}
function ModelGirl({
  item,
  index,
  item_width,
  show_tel,
}: {
  item: Girl;
  index: number;
  item_width: string;
  show_tel?: boolean;
}): React.JSX.Element {
  return (
    <>
      {/* 描述模块 */}
      <div
        className={`p-4 border bg-white rounded-lg shadow-md  ${item_width}`}
      >
        <h1 className="text-emerald-500 border-l-4 pl-2 mb-2 font-extrabold text-2xl">
          {item.name}
        </h1>
        <p className="text-sm text-gray-500 mb-2">
          年龄：{item.age}, 身高：{item.height}, 体重：{item.weight}, 罩杯：
          {item.bust}
        </p>
        <p className="text-sm text-gray-500 mb-2">
          {item.province + " " + item.city + " " + item.address}
        </p>
        <p className="text-sm text-gray-400 mb-2">{item.price}</p>
        <p className="text-sm text-gray-500 mb-2">{item.skill}</p>
        {show_tel==true && (
          <>
            <p className="text-sm text-gray-400 mb-2">uu；{item.xl}</p>
            <p className="text-sm text-gray-500 mb-2">wx：{item.vx}</p>
            <p className="text-sm text-gray-400 mb-2">与你：{item.yn}</p>
            <p className="text-sm text-gray-500 mb-2">QQ：{item.qq}</p>
            <p className="text-sm text-gray-500 mb-2">编号：{item.code_ref}</p>
          </>
        )}
      </div>

      {/* 图片和视频模块 */}
      {Array.from({ length: 6 }).map((_, idx) => {
        const index = `photo${idx + 1}` as keyof typeof item;
        if (item[index]) {
          return (
            <MediaItem
              key={`${item.id}${item.girl_id}photo-${idx}`}
              src={IMG_BASE_URL + item[index]}
              width={300}
              alt={item.name}
              type="image"
              className={item_width}
            />
          );
        }
      })}

      {Array.from({ length: 3 }).map((_, idx) => {
        const index = `video${idx + 1}` as keyof typeof item;
        let videoItem = idx === 0 ? item[`video`] : item[index];
        if (videoItem) {
          return (
            <MediaItem
              key={`${item.id}${item.girl_id}video-${idx}`}
              src={IMG_BASE_URL + videoItem}
              type="video"
              width={300}
              alt={item.name}
              className={item_width}
            />
          );
        }
      })}
      {/* </div> */}
    </>
  );
}
