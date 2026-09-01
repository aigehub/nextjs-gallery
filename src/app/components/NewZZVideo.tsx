"use client";

import type HlsType from "hls.js";
import { useEffect, useRef, useState } from "react";
import { decodeZhizunImage } from "./NewZZImage";

interface NewZZVideoProps
  extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  plat: number;
  isLargePreview?: boolean;
}

function normalizeZhizunSource(source: string) {
  const url = new URL(source);
  if (/\.m3u8$/i.test(url.pathname)) return url.toString();
  if (/\.[a-z0-9]{2,8}$/i.test(url.pathname)) return url.toString();
  url.pathname = `${url.pathname.replace(/\/$/, "")}/index.m3u8`;
  return url.toString();
}

function zhizunProxyUrl(source: string) {
  return `/api/zz-video?src=${encodeURIComponent(source)}`;
}

export default function NewZZVideo({
  isLargePreview = false,
  src,
  plat,
  poster,
  className = "",
  autoPlay,
  controls,
  style,
  width,
  height,
  ...props
}: NewZZVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [posterUrl, setPosterUrl] = useState(() =>
    plat === 2 ? undefined : poster,
  );
  const [directSource, setDirectSource] = useState<string>();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!poster || plat !== 2) {
      setPosterUrl(poster);
      return;
    }

    const controller = new AbortController();
    let objectUrl = "";
    setPosterUrl(undefined);
    void fetch(`/api/zz-image?src=${encodeURIComponent(poster)}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.blob();
      })
      .then(decodeZhizunImage)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setPosterUrl(objectUrl);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          console.error("至尊视频封面解码失败:", poster, reason);
          setPosterUrl(undefined);
        }
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [plat, poster]);

  useEffect(() => {
    const video = videoRef.current;
    setError("");
    setDirectSource(undefined);
    if (!video || !src) return;

    if (plat !== 2) {
      setDirectSource(
        plat === 5 ? `https://proxy.okforks.com/xchina/${src}` : src,
      );
      return;
    }

    // 列表缩略图只展示封面，用户打开弹窗后才请求 HLS，避免同时加载大量分片。
    if (!isLargePreview) return;

    let hls: HlsType | undefined;
    let disposed = false;
    let networkRecoveries = 0;
    const source = normalizeZhizunSource(src);
    const playbackUrl = zhizunProxyUrl(source);
    const fail = (message: string) => {
      if (!disposed) setError(message);
    };

    if (/\.m3u8(?:\?|$)/i.test(source)) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = playbackUrl;
        if (autoPlay) void video.play().catch(() => undefined);
      } else {
        // 只在用户打开播放弹窗时加载较大的 hls.js 客户端代码。
        void import("hls.js").then(({ default: Hls }) => {
          if (disposed) return;
          if (!Hls.isSupported()) {
            fail("当前浏览器不支持 HLS 视频播放");
            return;
          }
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
          });
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal || !hls) return;
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR && networkRecoveries < 2) {
              networkRecoveries++;
              hls.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              fail(`视频解析失败：${data.details}`);
              hls.destroy();
              hls = undefined;
            }
          });
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (autoPlay) void video.play().catch(() => undefined);
          });
          hls.loadSource(playbackUrl);
          hls.attachMedia(video);
        }).catch((reason: unknown) => {
          console.error("加载 hls.js 失败:", reason);
          fail("视频播放器加载失败");
        });
      }
    } else {
      setDirectSource(zhizunProxyUrl(source));
    }

    return () => {
      disposed = true;
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [autoPlay, isLargePreview, plat, src]);

  return (
    <video
      ref={videoRef}
      {...props}
      src={directSource}
      poster={posterUrl}
      autoPlay={autoPlay}
      controls={isLargePreview || controls}
      playsInline
      preload={isLargePreview ? "metadata" : "none"}
      width={width}
      height={height}
      style={style}
      data-video-error={error || undefined}
      className={`bg-black rounded-lg transition-opacity duration-500 w-full h-full object-contain ${className}`}
    />
  );
}
