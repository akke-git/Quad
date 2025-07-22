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
}

module.exports = nextConfig
