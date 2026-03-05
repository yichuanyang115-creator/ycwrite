import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 允许外部图片域名（apicore.ai 生成的图片 URL）
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.filesystem.site' },
      { protocol: 'https', hostname: '**.apicore.ai' },
    ],
  },
}

export default nextConfig
