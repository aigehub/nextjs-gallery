"use client";

import { useEffect, useRef, useState } from "react";

const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const ENCRYPTED_HEADER_BYTES = 18;

interface NewZZImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  plat?: number;
  onLoadedSrc?: (loadedSrc: string) => void;
}

function shiftBase64Character(character: string) {
  const index = BASE64_ALPHABET.indexOf(character);
  if (index < 0) return character;
  return BASE64_ALPHABET[index === 0 ? 63 : index - 1];
}

function isWebP(bytes: Uint8Array) {
  return (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  );
}

function detectGenericImageFormat(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length >= 6 && String.fromCharCode(...bytes.subarray(0, 4)) === "GIF8") return "image/gif";
  if (isWebP(bytes)) return "image/webp";
  return null;
}

/**
 * 新版至尊图片把前 18 字节对应的 24 个 Base64 字符循环前移了一位，这里执行逆变换。
 * 老至尊对象存储是不加密原图，直接按 magic bytes 识别原样返回。
 * 加密产物历史上是 WebP，2026-09 起新上传的批次改成 PNG，因此解码结果用
 * detectGenericImageFormat 兜底识别，不再硬性要求 WebP。
 */
export async function decodeZhizunImage(blob: Blob) {
  const encrypted = new Uint8Array(await blob.arrayBuffer());
  const plaintextType = detectGenericImageFormat(encrypted);
  if (plaintextType) {
    return new Blob([encrypted], { type: plaintextType });
  }
  if (encrypted.length < ENCRYPTED_HEADER_BYTES) {
    throw new Error("至尊图片数据过短，无法解码");
  }

  let binaryHeader = "";
  for (const byte of encrypted.subarray(0, ENCRYPTED_HEADER_BYTES)) {
    binaryHeader += String.fromCharCode(byte);
  }
  const decodedBase64 = btoa(binaryHeader)
    .split("")
    .map(shiftBase64Character)
    .join("");
  const decodedHeader = atob(decodedBase64);
  const output = new Uint8Array(encrypted);
  for (let index = 0; index < decodedHeader.length; index++) {
    output[index] = decodedHeader.charCodeAt(index);
  }

  const decodedType = detectGenericImageFormat(output);
  if (!decodedType) throw new Error("至尊图片解码后不是可识别的图片格式");
  return new Blob([output], { type: decodedType });
}

async function loadZhizunImage(src: string, signal: AbortSignal) {
  const proxyUrl = `/api/zz-image?src=${encodeURIComponent(src)}`;
  const response = await fetch(proxyUrl, { signal });
  if (!response.ok) {
    throw new Error(`至尊图片加载失败: HTTP ${response.status}`);
  }
  return URL.createObjectURL(await decodeZhizunImage(await response.blob()));
}

function resolveOtherPlatformImage(src: string, plat?: number) {
  if (plat === 4) return `https://proxy.okforks.com/meirentu/${src}`;
  if (plat === 5) return `https://proxy.okforks.com/xchina/${src}`;
  return src;
}

export default function NewZZImage({
  src,
  plat,
  onLoadedSrc,
  alt = "",
  className = "",
  ...props
}: NewZZImageProps) {
  const [loadedSrc, setLoadedSrc] = useState("");
  const [failed, setFailed] = useState(false);
  const onLoadedSrcRef = useRef(onLoadedSrc);

  useEffect(() => {
    onLoadedSrcRef.current = onLoadedSrc;
  }, [onLoadedSrc]);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = "";
    setFailed(false);
    setLoadedSrc("");

    if (!src) return () => controller.abort();

    if (plat !== 2) {
      const resolved = resolveOtherPlatformImage(src, plat);
      setLoadedSrc(resolved);
      onLoadedSrcRef.current?.(resolved);
      return () => controller.abort();
    }

    void loadZhizunImage(src, controller.signal)
      .then((url) => {
        objectUrl = url;
        setLoadedSrc(url);
        onLoadedSrcRef.current?.(url);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error("至尊图片解码失败:", src, error);
        setFailed(true);
        onLoadedSrcRef.current?.("");
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, plat]);

  const commonClassName = `rounded-lg mb-4 transition-opacity duration-500 w-fit object-cover ${className}`;
  if (!loadedSrc) {
    return (
      <div
        role="status"
        className={`flex items-center justify-center text-center ${commonClassName}`}
      >
        {failed ? "图片加载失败" : "图片加载中..."}
      </div>
    );
  }

  // Blob URL 需要浏览器原生 img 解码，不能经过 Next Image Optimizer。
  return <img src={loadedSrc} alt={alt} className={commonClassName} {...props} />;
}
