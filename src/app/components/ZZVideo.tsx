"use client";

import { useEffect, useState } from "react";

interface SmartVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  plat: number;
  isLargePreview: boolean;
}

/**
 * 在前端 fetch 视频得到 Blob URL，再用 <video src="blob:...">
 */
export default function SmartVideo({ isLargePreview = false, src, plat, poster, className, ...props }: SmartVideoProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;
    if (plat == 2) {
      let currentUrl: string | null = null;
      (async () => {
        try {
          const res = await fetch(src);
          if (!res || !res.ok) throw new Error("HTTP " + res.status);
          const blob = await res.blob();
          currentUrl = URL.createObjectURL(blob);
          setBlobUrl(currentUrl);
        } catch (e) {
          console.log(e);
          if (e instanceof Error) {
            console.log(e.stack);
          }
        }
      })().catch(console.error);

      // 组件卸载时释放 blob URL
      return () => {
        if (currentUrl) URL.revokeObjectURL(currentUrl);
      };
    } else {
      setBlobUrl(src);
    }
  }, [src, plat]);

  if (!blobUrl) return <div className={`bg-black rounded-lg transition-opacity duration-500 w-full h-full ${className}`}>视频加载中...</div>;
  return (
    <video
      {...props}
      controls={isLargePreview}
      poster={poster}
      src={blobUrl} // blob:xxxx
      className={`bg-black rounded-lg transition-opacity duration-500 w-full h-full ${className}`}
    />
  );
}
