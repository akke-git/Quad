// pages/blog/[id].js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import ReactMarkdown from 'react-markdown';


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
          <p className="text-gray-300 font-ubuntu-mono">Pulling Post...</p>
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
          <Link href="/blog" className="text-green-400 hover:text-green-300 mb-4 inline-block font-ubuntu-mono">
            &larr; Back to Blog
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
                className="text-yellow-400 hover:text-green-400 bg-green-900 bg-opacity-30 px-2 py-1 rounded transition-colors duration-300 font-ubuntu-mono"
              >
                original source
              </a>
            )}
          </div>
        </div>
        
        
        <hr className="border-t border-gray-700 my-6" />
        <br/><br/>
        
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
        <div className="prose prose-invert prose-green max-w-none font-ubuntu-mono">
          <ReactMarkdown>
            {post.content}
          </ReactMarkdown>
        </div>
      </main>
    </div>
  );
}