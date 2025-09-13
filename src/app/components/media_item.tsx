"use client";

import React, { useState } from "react";
import Image from "next/image";

function MediaSkeleton({ width, height ,type}: { width: number; height: number,type: string }) {
  return (
    <div
      className="bg-gray-200 animate-pulse rounded-lg justify-center items-center flex mb-4 w-full overflow-hidden aspect-[5/3]"
      style={{ height }}
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
  className
}: {
  src: string;
  type: "image" | "video";
  alt?: string;
  width: number;
  className:string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative border bg-white shadow-md  rounded-lg ${className}`}>

      {type === "image" ? (
        <>
        {/* {!loaded && <MediaSkeleton width={500} height={300} type={type}/>} */}
        <img
          src={src}
          alt={alt || ""}
          className={`rounded-lg mb-4 transition-opacity duration-500 w-fit h-fit`}
          loading="lazy"
        />
        </>
      ) : (
        <video          
          className={`bg-black rounded-lg mb-4 transition-opacity duration-500 w-full h-full`}
          controls
        >
          <source src={src} type="video/mp4" />
          <source src={src} type="video/quicktime" />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}
