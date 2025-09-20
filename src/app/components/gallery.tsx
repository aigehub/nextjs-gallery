// 创建图片库组件
import React from "react";
import { PLAT, queryData } from "@/app/libs/data";
import { MediaItem } from "./media_item";
import Pagination from "./pagination";
import { Girl } from "@/generated/prisma";
import SmartImage from "./ZZImage";
import SmartVideo from "./ZZVideo";
const PAGE_SIZE = 20; // 每页显示的图片数量
const IMG_BASE_URL = "https://pig.zwidi.cn"; // 替换为你的图片基础URL
export async function Gallery({ plat, total, page_data, show_tel }: { plat: PLAT; total: number; show_tel?: boolean; page_data: any[] }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);

  console.log("Gallery dataset: total", total, "totalPages:", totalPages);
  const item_width = "sm:w-[18rem] sm:h-[23rem] max-sm:w-[18rem] max-sm:h-[23rem] ";
  return (
    <>
      {/* 分页组件 */}
      <Pagination totalPages={totalPages} className="mb-4 mt-4" />

      {/* 外层：纵向排列每个 item */}
      <div className="flex flex-wrap gap-4 items-start justify-center">
        {page_data.map((item: any, index) => (
          <ModelGirl
            plat={plat}
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
  plat,
}: {
  plat: PLAT;
  item: any;
  index: number;
  item_width: string;
  show_tel?: boolean;
}): React.JSX.Element {
  return (
    <>
      {/* 描述模块 */}
      <div className={`p-4 border bg-white rounded-lg shadow-md  ${item_width}`}>
        <h1 className="text-emerald-500 border-l-4 pl-2 mb-2 font-extrabold text-2xl">{item.name ?? item.titlename}</h1>
        <p className="text-sm text-gray-500 mb-2">
          年龄：{item.age}, 身高：{item.height}, 体重：{item.weight}, 罩杯：
          {item.bust}
        </p>
        <p className="text-sm text-gray-500 mb-2">
          {item.province ?? item.provinceCity ?? item.city_name + " " + (item.city ?? item.district_name ?? item.region) + " " + item.address}
        </p>
        <p className="text-sm text-gray-400 mb-2">{item.price}</p>
        <p className="text-sm text-gray-500 mb-2">{item.skill ?? item.tag_name ?? item.characteristics}</p>
        {show_tel == true && (
          <>
            <p className="text-sm text-gray-400 mb-2">uu；{item.xl}</p>
            <p className="text-sm text-gray-500 mb-2">wx：{item.vx}</p>
            <p className="text-sm text-gray-400 mb-2">与你：{item.yn}</p>
            <p className="text-sm text-gray-500 mb-2">QQ：{item.qq}</p>
            <p className="text-sm text-gray-500 mb-2">编号：{item.code_ref ?? `Z${item.code}` ?? `M${item.ladyid}`}</p>
          </>
        )}
      </div>

      {/* 图片模块 */}
      {getImageTag(item, item_width, plat)}
      {/* 视频 */}
      {getVideoComponent(item, item_width, plat)}
      {/* </div> */}
    </>
  );
}
function getVideoComponent(item: any, item_width: string, plat: PLAT) {
  switch (plat) {
    case "58kv":
      item.video = item.video ? JSON.parse(item.video) : null;
      if (item.video) {
        return item.video.forEach((video: string, idx: number) => {
          if (video) {
            return (
              <MediaItem
                key={`${item.id}${item.titlename}video-${idx}`}
                src={video}
                type="video"
                width={300}
                alt={item.titlename}
                className={item_width}
              />
            );
          }
        });
      }
      return <></>;
    case "zhizun":
      item.medium = item.medium ? JSON.parse(item.medium) : null;
      if (item.medium) {
        return item.medium.forEach((video: string, idx: number) => {
          if (video) {
            return (
              <SmartVideo key={`${item.id}${item.name}video-${idx}`} src={video} width={300} className={item_width} />
            );
          }
        });
      }
      return <> </>;
    default:
    case "jimei":
      return Array.from({ length: 3 }).map((_, idx) => {
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
      });
  }
}

function getImageTag(item: any, item_width: string, plat: PLAT) {
  switch (plat) {
    case "58kv":
      let data: any[] | null = item.data ? JSON.parse(item.data) : null;
      if (data) {
        data.push(JSON.parse(item.cover)); // 58kv的封面图也放到图集中
        return data.map((img: string, idx: number) => {
          if (img) {
            return (
              <MediaItem
                key={`${item.id}${item.titlename}photo-${idx}`}
                src={img}
                width={300}
                alt={item.titlename}
                type="image"
                className={item_width}
              />
            );
          }
        });
      }
      return <></>;
    case "zhizun":
      let images = item.images ? JSON.parse(item.images) : null;
      if (images) {
        images.unshift(item.poster); // zhizun的封面图也放到图集中
        return images.map((img: string, idx: number) => {
          if (img) {
            return <SmartImage key={`${item.id}${item.name}photo-${idx}`} src={img} width={300} alt={item.name} className={item_width} />;
          }
        });
      }
      return <> </>;
    default:
    case "jimei":
      return Array.from({ length: 6 }).map((_, idx) => {
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
      });
  }
}
