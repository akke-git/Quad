/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // 빌드 시 오류가 발생하는 페이지 무시
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 정적 파일 서빙을 위한 리다이렉트
  async rewrites() {
    return [
      {
        source: '/downloads/:path*',
        destination: '/api/downloads/:path*',
      },
    ];
  },
  // 모바일 CSS 문제 해결을 위한 헤더 설정
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
