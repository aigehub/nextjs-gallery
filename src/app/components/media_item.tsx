"use client";

import React, { useState } from "react";
import Image from "next/image";

function MediaSkeleton({ className, type }: { className: string; type: string }) {
  return (
    <div className={`${className} bg-gray-200 animate-pulse rounded-lg justify-center items-center flex mb-4 overflow-hidden`}>
      <p>{type} loading...</p>
    </div>
  );
}

export function MediaItem({
  src,
  type,
  alt,
  width,
  className,
}: {
  src: string;
  type: "image" | "video";
  alt?: string;
  width: number;
  className: string;
}) {
  // const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative border bg-white shadow-md rounded-lg ${className}`}>
      {type === "image" ? (
        <>
          {/* {!loaded && <MediaSkeleton className={className} type={type} />} */}
          <img
            src={src}
            alt={alt || ""}
            className={`rounded-lg mb-4 transition-opacity m-auto duration-500 w-fit object-cover ${className}`}
            referrerPolicy="no-referrer"
            // loading="lazy"
            width={1080}
            height={0}
            onLoad={(e) => {
              // setLoaded(true);
              console.log(
                "image loaded:",
                // e.currentTarget.src,
                e.currentTarget.alt
              );
            }}
            onError={(e) => {
              console.log(
                "loadImage error:",
                // e.currentTarget.src,
                e.currentTarget.alt
              );
            }}
          />
        </>
      ) : (
        <>
          {/* {!loaded && <MediaSkeleton className={className} type={type} />} */}
          <video
            className={`bg-black rounded-lg mb-4 transition-opacity duration-500 w-full h-full ${className}`}
            id={alt}
            controls
            onLoadedData={(e) => {
              // setLoaded(true);
              console.log(
                "video loaded:",
                // e.currentTarget.src,
                e.currentTarget.id
              );
            }}
            onError={(e) => {
              console.log(
                "loadVideo error:",
                // e.currentTarget.src,
                e.currentTarget.id
              );
            }}
          >
            <source src={src} type="video/mp4" />
            <source src={src} type="video/quicktime" />
            Your browser does not support the video tag.
          </video>
        </>
      )}
    </div>
  );
}

