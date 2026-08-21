// 创建图片库组件
"use client";
import { useEffect, useState } from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import React from "react";
import { PLAT } from "@/app/libs/data";
import Pagination from "./pagination";
import SmartImage from "./NewZZImage";
import SmartVideo from "./ZZVideo";
import clsx from "clsx";
import { XCircleIcon } from "@heroicons/react/24/solid";
const PAGE_SIZE = 20; // 每页显示的图片数量
const IMG_BASE_URL = "https://pig.zwidi.cn"; // 替换为你的图片基础URL

export function Gallery({ plat, total, page_data, show_tel }: { plat: PLAT; total: number; show_tel?: boolean; page_data: any[] }) {
  const totalPages = Math.ceil(total / (plat == 4 || plat == 5 ? 1 : PAGE_SIZE));

  console.log("Gallery dataset: total", total, "totalPages:", totalPages);
  const item_width = "sm:w-[18rem] sm:h-[23rem] max-sm:w-[18rem] max-sm:h-[23rem] ";
  return (
    <>
      {/* 分页组件 */}
      <Pagination
        totalPages={totalPages}
        className="mb-4 mt-4"
      />

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

      <Pagination
        totalPages={totalPages}
        className="p-2"
      />
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
  // ...existing code...
  const images = getAllImageUrls(item, plat);
  const videos = getAllVideoUrls(item, plat);
  const posters = getAllPoster(item, plat);

  // 视频弹窗状态
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  function getDescription(item_width: string, item: any, show_tel: boolean | undefined) {
    let province = "";
    let skill = "";
    let num = item.code_ref;
    if (!num) {
      if (item.code) {
        num = `${item.code}`;
      } else if (item.ladyid) num = `M${item.ladyid}`;
    }
    switch (plat) {
      case 1: //jimei
        province = item.province + " " + item.city + " " + item.address;
        skill = item.skill;
        break;
      case 2: //zz
        province = item.city_name + " " + item.district_name + " " + item.address;
        if (item.tag_name) skill = (JSON.parse(item.tag_name) as Array<string>).join(",");
        break;
      case 3: //58kv
        province = item.provinceCity + " " + item.region + " " + item.address;
        if (item.characteristics) skill = (JSON.parse(item.characteristics) as Array<string>).join(",");
        break;
      case 4: //meirentu
        province = item.album_desc;
        if (item.tags) skill = item.tags;
        break;
      case 5: //xchina
        province = item.subs;
        if (item.title) skill = item.title;
        num = item.album_id;
        break;
    }
    return (
      <div className={`p-4 border bg-white rounded-lg shadow-md  ${item_width}`}>
        <h1 className="text-emerald-500 border-l-4 pl-2 mb-2 font-extrabold text-2xl">{item.name ?? item.titlename ?? item.girl_name}</h1>
        {item.age && (
          <p className="text-sm text-gray-500 mb-2">
            年龄：{item.age}, 身高：{item.height}, 体重：{item.weight}, 罩杯：
            {item.bust}
          </p>
        )}
        <p className="text-sm text-gray-500 mb-2">{province}</p>
        {item.price && <p className="text-sm text-gray-400 mb-2">{item.price}</p>}
        <p className="text-sm text-gray-500 mb-2">{skill}</p>
        {num && <p className="text-sm text-gray-500 mb-2">编号：{num}</p>}
        {show_tel == true && (
          <>
            <p className="text-sm text-gray-400 mb-2">uu；{item.xl}</p>
            <p className="text-sm text-gray-500 mb-2">wx：{item.vx}</p>
            <p className="text-sm text-gray-400 mb-2">与你：{item.yn}</p>
            <p className="text-sm text-gray-500 mb-2">QQ：{item.qq}</p>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {/* 描述模块 */}
      {getDescription(item_width, item, show_tel)}
      {/* 图片和视频模块 */}
      <PhotoProvider>
        {getImageComponent(images, item, plat, item_width)}
        {getVideoComponent(videos, posters, item, item_width, setVideoSrc, setVideoOpen, plat)}
      </PhotoProvider>
      {/* 视频弹窗 */}
      {videoOpen && videoSrc && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-10050 text-white">
          <XCircleIcon
            className="fixed top-6 right-6  h-6 w-6 cursor-pointer"
            onClick={() => setVideoOpen(false)}
          />
          <SmartVideo
            isLargePreview={true}
            plat={plat}
            src={videoSrc}
            controls
            autoPlay
            style={{ maxHeight: "80vh", maxWidth: "90vw" }}
          />
        </div>
      )}
    </>
  );
}

interface PhotoViewerProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  img: string;
  plat: number;
  name: string;
  item_width: string;
}

function PhotoViewer(props: PhotoViewerProps): React.JSX.Element {
  const [imgSrc, setImgSrc] = useState("");
  let dataSrc = "";
  if (props.plat == 4) {
    dataSrc = "https://proxy.okforks.com/meirentu/" + props.img;
  } else if (props.plat == 5) {
    dataSrc = "https://proxy.okforks.com/xchina/" + props.img;
  } else {
    dataSrc = props.plat == 2 ? imgSrc : props.img;
  }
  return (
    <PhotoView src={dataSrc}>
      <SmartImage
        onLoadedSrc={(src) => {
          setImgSrc(src);
        }}
        plat={props.plat}
        src={props.img}
        width={300}
        alt={props.name}
        className={clsx(props.item_width, "cursor-pointer")}
      />
    </PhotoView>
  );
}
function getImageComponent(images: string[], item: any, plat: number, item_width: string): React.ReactNode {
  return images.map((img: string, idx: number) => {
    return (
      <PhotoViewer
        key={idx + "PhotoViewer" + item.id}
        img={img}
        plat={plat}
        name={item.name}
        item_width={item_width}
      />
    );
  });
}

function getVideoComponent(
  videos: string[],
  posters: string[],
  item: any,
  item_width: string,
  setVideoSrc: React.Dispatch<React.SetStateAction<string | null>>,
  setVideoOpen: React.Dispatch<React.SetStateAction<boolean>>,
  plat: number
): React.ReactNode {
  return videos.map((video: string, idx: number) => (
    <div
      key={idx + "video" + item.id}
      className={item_width + " cursor-pointer rounded-lg relative flex items-center justify-center bg-black"}
      // style={{ width: 180, height: 230 }}
      onClick={() => {
        setVideoSrc(video);
        setVideoOpen(true);
      }}
    >
      <SmartVideo
        plat={plat}
        key={`${item.id}${item.name}video-${idx}`}
        poster={posters.length > 0 ? posters[idx] : undefined}
        src={video}
        width={300}
        className={item_width}
      />
      <span className="absolute text-white text-3xl">&#9654;</span>
    </div>
  ));
}

// 新增：收集所有图片URL
function getAllImageUrls(item: any, plat: PLAT): string[] {
  switch (plat) {
    case 3: //"58kv"
      let data: any[] | null = item.data ? JSON.parse(item.data) : null;
      if (data) {
        data.push(JSON.parse(item.cover));
        return data.filter(Boolean);
      }
      return [];
    case 2: //"zhizun"
      let images = item.images ? JSON.parse(item.images) : null;
      if (images) {
        images.unshift(item.poster);
        return images.filter(Boolean);
      }
      return [];
    case 4:
      let dataSet: any[] = item.images.split(",");
      if (dataSet) {
        dataSet.unshift(item.cover);
        dataSet.map((item) => {
          ("");
        });
        return dataSet.filter(Boolean);
      }
      return [];
    case 5: //xchina
      let xchinadataSet: any[] = [];
      for (let index = 1; index <= item.image_count; index++) {
        const name = index.toString().padStart(4, "0");
        const url = item.image_base_url + item.album_id + "/" + name + ".jpg";
        xchinadataSet.push(url);
      }
      return xchinadataSet;
    default:
    case 1: //"jimei"
      return Array.from({ length: 7 })
        .map((_, idx) => {
          let index;
          if (idx == 0) {
            index = `photo` as keyof typeof item;
          } else {
            index = `photo${idx}` as keyof typeof item;
          }
          return item[index] ? IMG_BASE_URL + item[index] : null;
        })
        .filter(Boolean) as string[];
  }
}

// 新增：收集所有视频URL
function getAllVideoUrls(item: any, plat: PLAT): string[] {
  switch (plat) {
    case 3: //"58kv"
      let videoArr: any[] | null = item.video ? JSON.parse(item.video) : null;
      return videoArr ? videoArr.filter(Boolean) : [];
    case 2: //"zhizun"
      let medium: any[] | null = item.medium ? JSON.parse(item.medium) : null;
      let authentications: any[] | null = item.authentications ? JSON.parse(item.authentications) : null;
      medium = medium ? medium.filter(Boolean) : [];
      authentications = authentications ? authentications.filter(Boolean) : [];
      medium.push(...authentications);
      return medium;
    case 4:
      return [];
    case 5: //xchina
      let xchinadataSet: any[] = [];
      for (let index = 1; index <= item.video_count; index++) {
        const name = index.toString().padStart(4, "0");
        const url = item.image_base_url + item.album_id + "/" + name + ".mp4";
        xchinadataSet.push(url);
      }
      return xchinadataSet;
    default:
    case 1: //"jimei"
      return Array.from({ length: 3 })
        .map((_, idx) => {
          const index = `video${idx + 1}` as keyof typeof item;
          let videoItem = idx === 0 ? item[`video`] : item[index];
          return videoItem ? IMG_BASE_URL + videoItem : null;
        })
        .filter(Boolean) as string[];
  }
}
function getAllPoster(item: any, plat: number) {
  let posters: any[] = [];
  if (item.poster) {
    posters.push(item.poster);
  }
  return posters;
}
