// 创建图片库组件
import React from "react";
import Image from "next/image";
import { loadAllGirlsJSONData } from "@/app/libs/data";
import { MediaItem } from "./media_item";
export async function Gallery() {
  // 这里可以调用异步函数获取数据
  const dataset: object[] = await loadAllGirlsJSONData();
  console.log("Gallery dataset:", dataset.length);
  const IMG_BASE_URL = "https://pig.zwidi.cn"; // 替换为你的图片基础URL
  return (
    <>
      <h1>图片库组件</h1>
      <div className="card grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-5xl mt-10 h-full">
        {dataset.slice(0, 20).map(
          (item: any, index) => (
            console.log("Gallery item:", item),
            (
              <div key={index} className="card-item flex flex-col items-center">
                <p>{item.name}</p>

                {Array.from({ length: 6 }).map((_, idx) => {
                  if (item[`photo${idx + 1}`]) {
                    return (
                      <MediaItem
                        key={idx}
                        src={IMG_BASE_URL + item[`photo${idx + 1}`]}
                        width={200}
                        alt={item.title}
                        type="image"
                      />
                    );
                  }
                })}
                {Array.from({ length: 3 }).map((_, idx) => {
                  let videoItem =
                    idx == 0 ? item[`video`] : item[`video${idx + 1}`];
                  console.log("Gallery videoItem:", videoItem);
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
            )
          )
        )}
      </div>
    </>
  );
}
