"use client";

import { useEffect, useState } from "react";

interface SmartVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
}

/**
 * 在前端 fetch 视频得到 Blob URL，再用 <video src="blob:...">
 */
export default function SmartVideo({ src, poster, className, ...props }: SmartVideoProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;

    let currentUrl: string | null = null;

    (async () => {
      const res = await fetch(src);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const blob = await res.blob();
      currentUrl = URL.createObjectURL(blob);
      setBlobUrl(currentUrl);
    })().catch(console.error);

    // 组件卸载时释放 blob URL
    return () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [src]);

  if (!blobUrl) return <div className={className}>视频加载中...</div>;
  return (
    <video
      {...props}
      controls
      poster={poster}
      src={blobUrl} // blob:xxxx
      className={`bg-black rounded-lg mb-4 transition-opacity duration-500 w-full h-full ${className}`}
    />
  );
}
