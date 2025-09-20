import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["pig.zwidi.cn","test.xn--fiqa24e59ix1fezpezjsm1b4qeqwm.com"],
  },
};

export default nextConfig;
