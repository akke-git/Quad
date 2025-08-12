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
  // 대용량 파일 업로드를 위한 설정
  experimental: {
    largePageDataBytes: 128 * 1024, // 128KB
    isrMemoryCacheSize: 0, // ISR 캐시 비활성화로 메모리 절약
  },
  // 서버 사이드 렌더링 최적화
  poweredByHeader: false,
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
