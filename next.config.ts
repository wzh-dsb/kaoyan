import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 隐藏开发模式右下角的 N 调试面板(仅 dev 显示,生产环境无)
  devIndicators: false,
};

export default nextConfig;
