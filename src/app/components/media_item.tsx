"use client";

import React, { useState } from "react";
import Image from "next/image";

function MediaSkeleton({ width, height ,type}: { width: number; height: number,type: string }) {
  return (
    <div
      className="bg-gray-200 animate-pulse rounded-lg justify-center items-center flex mb-2"
      style={{ width, height }}
    >
      <p>{type} loading...</p>
    </div>
  );
}

export function MediaItem({
  src,
  type,
  alt,
  width,
}: {
  src: string;
  type: "image" | "video";
  alt?: string;
  width: number;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative">
      {!loaded && <MediaSkeleton width={width} height={300} type={type}/>}

      {type === "image" ? (
        <Image
          src={src}
          width={width}
          height={0} // 让高度自适应
          alt={alt || ""}
          className={`rounded-lg mb-2 transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0 absolute"
          }`}
          onLoad={() => setLoaded(true)}
          priority={true}
        />
      ) : (
        <video
          width={width}
          height={300}
          className={`rounded-lg mb-2 transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0 absolute"
          }`}
          controls
          onLoadedData={() => setLoaded(true)}
        >
          <source src={src} type="video/mp4" />
          <source src={src} type="video/quicktime" />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}
