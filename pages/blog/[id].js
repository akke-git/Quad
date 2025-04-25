// pages/blog/[id].js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import ReactMarkdown from 'react-markdown';

// 임시 데이터 (실제로는 API에서 가져올 예정)
const DUMMY_POSTS = [
  {
    id: 1,
    title: '리눅스 서버 보안 강화하기',
    content: `
# 리눅스 서버 보안 강화하기

리눅스 서버의 보안을 강화하기 위한 10가지 필수 설정을 알아봅니다.

## 1. SSH 설정 강화

기본 SSH 포트(22)를 변경하고, 루트 로그인을 비활성화합니다.

\`\`\`bash
# /etc/ssh/sshd_config 파일 수정
Port 2222
PermitRootLogin no
PasswordAuthentication no
\`\`\`

## 2. 방화벽 설정

UFW(Uncomplicated Firewall)를 사용하여 필요한 포트만 개방합니다.

\`\`\`bash
sudo ufw allow 2222/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
\`\`\`

## 3. 자동 업데이트 설정

보안 업데이트를 자동으로 설치하도록 설정합니다.

\`\`\`bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
\`\`\`

## 4. Fail2Ban 설치

무차별 로그인 시도를 차단합니다.

\`\`\`bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
\`\`\`

## 5. 불필요한 서비스 비활성화

사용하지 않는 서비스를 비활성화하여 공격 표면을 줄입니다.

\`\`\`bash
sudo systemctl disable <service-name>
sudo systemctl stop <service-name>
\`\`\`

## 6. 사용자 계정 관리

sudo 권한이 있는 일반 사용자 계정을 사용하고, 강력한 암호 정책을 적용합니다.

## 7. 파일 시스템 보안

중요 파일 및 디렉토리의 권한을 적절하게 설정합니다.

## 8. 로깅 및 모니터링

로그를 정기적으로 검토하고 모니터링 도구를 설치합니다.

## 9. 백업 설정

정기적인 백업을 설정하여 데이터 손실을 방지합니다.

## 10. 보안 감사 도구 사용

Lynis와 같은 보안 감사 도구를 사용하여 정기적으로 시스템을 점검합니다.

\`\`\`bash
sudo apt install lynis
sudo lynis audit system
\`\`\`
    `,
    date: '2025-04-20',
    category: '서버 관리',
    source: 'https://example.com/linux-security',
    thumbnail: '/images/blog/linux-security.jpg'
  },
  {
    id: 2,
    title: 'Docker 컨테이너 최적화 방법',
    content: `
# Docker 컨테이너 최적화 방법

Docker 컨테이너의 성능을 최적화하고 리소스 사용을 줄이는 방법을 알아봅니다.

## 1. 경량 베이스 이미지 사용

Alpine Linux와 같은 경량 이미지를 사용하여 이미지 크기를 줄입니다.

\`\`\`dockerfile
FROM alpine:3.14
# 대신에
# FROM ubuntu:20.04
\`\`\`

## 2. 다단계 빌드 사용

빌드 도구와 종속성을 최종 이미지에 포함시키지 않습니다.

\`\`\`dockerfile
# 빌드 단계
FROM node:14 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 실행 단계
FROM node:14-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
\`\`\`

## 3. 레이어 최소화

RUN, COPY, ADD 명령을 결합하여 레이어 수를 줄입니다.

## 4. .dockerignore 파일 사용

불필요한 파일이 이미지에 포함되지 않도록 합니다.

## 5. 리소스 제한 설정

컨테이너의 CPU 및 메모리 사용량을 제한합니다.

\`\`\`bash
docker run --memory="512m" --cpus="1.0" my-container
\`\`\`

## 6. 캐시 최적화

빌드 캐시를 효율적으로 사용하여 빌드 시간을 단축합니다.

## 7. 불필요한 서비스 제거

컨테이너 내에서 필요하지 않은 서비스와 패키지를 제거합니다.

## 8. 적절한 로깅 설정

로그 드라이버를 최적화하여 디스크 I/O를 줄입니다.

## 9. 네트워크 최적화

적절한 네트워크 모드를 선택하고 불필요한 포트 노출을 피합니다.

## 10. 정기적인 이미지 정리

사용하지 않는 이미지, 컨테이너, 볼륨을 정기적으로 정리합니다.

\`\`\`bash
docker system prune -a
\`\`\`
    `,
    date: '2025-04-15',
    category: 'Docker',
    source: 'https://example.com/docker-optimization',
    thumbnail: '/images/blog/docker-optimization.jpg'
  },
  {
    id: 3,
    title: 'Next.js와 Tailwind CSS로 반응형 웹 만들기',
    content: `
# Next.js와 Tailwind CSS로 반응형 웹 만들기

Next.js와 Tailwind CSS를 활용하여 모바일 친화적인 반응형 웹사이트를 구축하는 방법을 알아봅니다.

## 1. 프로젝트 설정

Next.js와 Tailwind CSS를 설치합니다.

\`\`\`bash
npx create-next-app my-project
cd my-project
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
\`\`\`

## 2. Tailwind 설정

tailwind.config.js 파일을 구성합니다.

\`\`\`javascript
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
\`\`\`

## 3. 글로벌 스타일 설정

globals.css 파일에 Tailwind 지시어를 추가합니다.

\`\`\`css
@tailwind base;
@tailwind components;
@tailwind utilities;
\`\`\`

## 4. 반응형 디자인 구현

Tailwind의 반응형 접두사를 사용하여 모바일 우선 디자인을 구현합니다.

\`\`\`jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 내용 */}
</div>
\`\`\`

## 5. 다크 모드 지원

Tailwind의 다크 모드 기능을 활용합니다.

\`\`\`jsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  {/* 내용 */}
</div>
\`\`\`
    `,
    date: '2025-04-10',
    category: '웹 개발',
    source: 'https://example.com/nextjs-tailwind',
    thumbnail: '/images/blog/nextjs-tailwind.jpg'
  }
];

export default function BlogPost() {
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // API에서 데이터를 가져오는 코드
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        // 먼저 API에서 데이터 가져오기 시도
        const response = await fetch(`/api/blog/posts/${id}`);
        
        if (response.ok) {
          const data = await response.json();
          setPost(data);
        } else {
          // API 호출 실패 시 DUMMY_POSTS에서 찾기
          const postId = parseInt(id);
          const foundPost = DUMMY_POSTS.find(p => p.id === postId);
          
          if (foundPost) {
            setPost(foundPost);
          } else {
            // 포스트를 찾지 못한 경우 블로그 목록으로 리다이렉트
            router.push('/blog');
          }
        }
      } catch (error) {
        console.error('포스트를 가져오는 중 오류 발생:', error);
        
        // 오류 발생 시 DUMMY_POSTS에서 찾기
        try {
          const postId = parseInt(id);
          const foundPost = DUMMY_POSTS.find(p => p.id === postId);
          
          if (foundPost) {
            setPost(foundPost);
          } else {
            // 포스트를 찾지 못한 경우 블로그 목록으로 리다이렉트
            router.push('/blog');
          }
        } catch (fallbackError) {
          console.error('폴백 처리 중 오류 발생:', fallbackError);
          router.push('/blog');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300 font-nanum-gothic">포스트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>{post.title} | Sveltt's Web</title>
        <meta name="description" content={post.title} />
      </Head>

      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/blog" className="text-green-400 hover:text-green-300 mb-4 inline-block font-nanum-gothic">
            &larr; 블로그 목록으로 돌아가기
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-4 font-ubuntu-mono">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center text-sm text-gray-400 mb-6 space-x-4">
            <span className="font-ubuntu-mono">{post.date}</span>
            <span className="text-green-400 bg-green-900 bg-opacity-30 px-2 py-1 rounded font-nanum-gothic">
              {post.category}
            </span>
            {post.source && (
              <a 
                href={post.source}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-400 transition-colors duration-300 font-nanum-gothic"
              >
                원본 출처
              </a>
            )}
          </div>
        </div>
        
        {/* 썸네일 이미지 */}
        {post.thumbnail && (
          <div className="relative h-64 md:h-96 w-full mb-8 rounded-lg overflow-hidden">
            <img
              src={post.thumbnail}
              alt={post.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* 마크다운 컨텐츠 */}
        <div className="prose prose-invert prose-green max-w-none">
          <ReactMarkdown>
            {post.content}
          </ReactMarkdown>
        </div>
      </main>
    </div>
  );
}