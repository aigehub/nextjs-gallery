"use client";
import { useEffect, useState } from "react";

// utils/base64Fetch.ts

function decode(t: string) {
  let e = "";
  for (let s = 0; s < t.length; s++) e += upgrade(t[s]);
  return e;
}
function upgrade(t: string) {
  const e = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let s = e.indexOf(t);
  return 0 == s ? (s = 63) : s--, e[s];
}

/**
 * 把远程图片转换成 DataURL(base64)
 * @param url 远程图片URL
 * @returns data:image/...;base64,xxx
 */
export async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      referrer: "https://xc.xz0377.com/",
    });
    if (!res || !res.ok) throw new Error("HTTP " + res.status);

    const blob = await res.blob();
    const base64: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert image to base64 string."));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // base64 = data:<mime>;base64,xxx
    const commaIndex = base64.indexOf(",") + 1;
    const prefix = base64.substring(0, commaIndex);
    const encoded = base64.substring(commaIndex, commaIndex + 24);
    const decoded = decode(encoded); // 这里填你原来的算法
    const rest = base64.substring(commaIndex + 24);
    return prefix + decoded + rest;
  } catch (e) {
    console.log(e);
    if (e instanceof Error) {
      console.log(e.stack);
    }
    return "";
  }
}

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  plat?: number;
  onLoadedSrc?: (loadedSrc: string) => void;
}
const LOADING_TEXT = "图片加载中...";
/**
 * 在前端把图片转成 base64 再展示
 */
export default function SmartImage({ src, onLoadedSrc, plat, alt = "", className = "", ...props }: SmartImageProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  function setOnLoadedUrl(url: string) {
    setDataUrl(url);
    if (onLoadedSrc) onLoadedSrc(url);
  }
  useEffect(() => {
    if (plat === 2 && src) {
      fetchImageAsBase64(src)
        .then(setOnLoadedUrl)
        .catch((e) => {
          console.error(e);
          setOnLoadedUrl("");
        });
    }
    if (plat == 4 && src) {
      fetchMeirentu(src)
        .then(setOnLoadedUrl)
        .catch((e) => {
          console.error(e);
          setOnLoadedUrl("");
        });
    }
    if (plat == 5 && src) {
      fetchXhcina(src)
        .then(setOnLoadedUrl)
        .catch((e) => {
          console.error(e);
          setOnLoadedUrl("");
        });
    }
  }, [src, plat]);

  function getImage(src: string | undefined) {
    return <img src={src} alt={alt} {...props} className={`rounded-lg mb-4 transition-opacity duration-500 w-fit object-cover ${className}`} />;
  }

  if (plat === 2 || plat === 4 || plat === 5) {
    if (!dataUrl)
      return (
        <div
          className={`flex items-center justify-center text-center  rounded-lg mb-4 transition-opacity duration-500 w-fit object-cover ${className}`}
        >
          图片加载中...
        </div>
      );
    return getImage(dataUrl);
  } else {
    return getImage(src);
  }
}
async function fetchMeirentu(src: string) {
  let proxy = "";
  // if (process.env.NODE_ENV == "development") {
  proxy = "https://proxy.okforks.com/meirentu/";
  // }
  // const res = await fetch(proxy + src, {
  //   referrer: "https://meirentu.cc/",
  //   method: "GET",
  // });
  // if (res.status == 200) {
  //   return URL.createObjectURL(await res.blob());
  // } else {
  //   return "";
  // }
  return proxy + src;
}
async function fetchXhcina(src: string) {
  console.log("fetchXhcina", src, "process.env.NODE_ENV:", process.env.NODE_ENV);
  let proxy = "https://proxy.okforks.com/xchina/";
  return proxy + src;
}
