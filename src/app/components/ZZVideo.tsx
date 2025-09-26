"use client";

import Hls from "hls.js";
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
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [posterrSrc, setPosterrSrc] = useState<string>("");
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!src) return;
    if (plat == 2 && ref.current) {
      ref.current.preload = "none"
    }
    if (plat == 2) {
      const videoSrc = src + "/index.m3u8";
      (async () => {
        const coverImage = src + "/index.jpg"
        const result = await fetchImageAsBase64(coverImage)
        setPosterrSrc(result)
      })().catch(console.error);
      if (Hls.isSupported()) {
        var hls = new Hls();
        hls.loadSource(videoSrc);
        if (ref.current)
          hls.attachMedia(ref.current);
      }
    } else {
      if (ref.current) {
        ref.current.preload = "auto"
        ref.current.src = src
      }
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
      poster={posterrSrc}
      className={`bg-black rounded-lg transition-opacity duration-500 w-full h-full ${className}`}
    />
  );
}
