"use client";

import Hls from "./hls.mjs";
import { useEffect, useRef, useState } from "react";
import { fetchImageAsBase64 } from "./ZZImage";

interface SmartVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  plat: number;
  isLargePreview?: boolean;
}

/**
 * 在前端 fetch 视频得到 Blob URL，再用 <video src="blob:...">
 */

export default function SmartVideo({ isLargePreview = false, src, plat, poster, className, ...props }: SmartVideoProps) {
  const [blobUrl, setBlobUrl] = useState<string | undefined>(undefined);
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!src) return;
    if (plat == 2 && ref.current) {
      ref.current.preload = "none";
    }
    if (plat == 2) {
      if ((src as unknown) instanceof Array) {
        // console.log("has more than one video link", src);
        src = src[0];
        // console.log("after video link", src);
      }
      const videoSrc = src + "/index.m3u8";
      // (async () => {
      //   const coverImage = src + "/index.jpg";
      //   const result = await fetchImageAsBase64(coverImage);
      //   setPosterrSrc(result);
      // })().catch((e)=>{});
      if (Hls.isSupported()) {
        let hls = new Hls();
        hls.loadSource(videoSrc);

        if (ref.current) hls.attachMedia(ref.current);
        return () => {
          if (ref.current) ref.current.src = "";
          ref.current = null;
          hls.destroy();
        };
      }
    } else if (plat == 5) {
      let proxy = "https://proxy.codelin.vip/xchina/" + src;
      setBlobUrl(proxy);
    } else {
      setBlobUrl(src);
    }
    return () => {
      if (ref.current) ref.current.src = "";
      ref.current = null;
    };
  }, [src, plat]);

  // if (!blobUrl) return <div className={`bg-black flex items-center justify-center text-center rounded-lg transition-opacity duration-500 w-full h-full ${className}`}>视频加载中...</div>;
  return (
    <video
      ref={ref}
      {...props}
      controls={isLargePreview}
      src={blobUrl}
      // poster={posterrSrc}
      className={`bg-black rounded-lg transition-opacity duration-500 w-full h-full ${className}`}
    />
  );
}
