// pages/blog/[id].js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
// remark-gfm 사용하지 않고 기본 마크다운만 사용
// import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github-dark.css';
import axios from 'axios';

export default function BlogPost() {
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;

    // 코드 하이라이팅 스타일 로드
    import('highlight.js').then(hljs => {
      hljs.default.highlightAll();
    });

    // API에서 데이터를 가져오는 코드
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        // 포스트 데이터 가져오기
        const response = await axios.get(`/api/blog/posts/${id}`);
        setPost(response.data);
        
        // 관련 포스트 가져오기 (같은 태그를 가진 다른 포스트)
        if (response.data.tags && response.data.tags.length > 0) {
          const tagIds = response.data.tags.map(tag => tag.id).join(',');
          const relatedResponse = await axios.get(`/api/blog/posts/related?tags=${tagIds}&exclude=${id}`);
          setRelatedPosts(relatedResponse.data);
        }
      } catch (error) {
        console.error('포스트를 가져오는 중 오류 발생:', error);
        router.push('/blog');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id, router]);
  
  // 코드 하이라이팅 적용
  useEffect(() => {
    if (post && post.content) {
      import('highlight.js').then(hljs => {
        hljs.default.highlightAll();
      });
    }
  }, [post]);

  // 포스트 삭제 처리 함수
  const handleDelete = async () => {
    if (!confirm('정말로 이 포스트를 삭제하시겠습니까?')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await axios.delete(`/api/blog/posts/${post.id}`);
      alert('포스트가 삭제되었습니다.');
      router.push('/blog');
    } catch (error) {
      console.error('포스트 삭제 중 오류 발생:', error);
      alert('포스트 삭제 중 오류가 발생했습니다.');
      setIsDeleting(false);
    }
  };
  
  // 조회수 증가 처리
  useEffect(() => {
    if (post && post.id) {
      // 포스트가 로드된 후 조회수 증가 API 호출
      const incrementViewCount = async () => {
        try {
          await axios.post(`/api/blog/posts/${post.id}/view`);
        } catch (error) {
          console.error('조회수 증가 중 오류 발생:', error);
        }
      };
      
      incrementViewCount();
    }
  }, [post]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300 font-apple-gothic">포스트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ko-KR', options);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>{post.title} | Sveltt's Web</title>
        <meta name="description" content={post.excerpt || post.title} />
        {/* Open Graph 태그 */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || post.title} />
        {post.thumbnail && <meta property="og:image" content={post.thumbnail} />}
        <meta property="og:type" content="article" />
      </Head>

      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Link href="/blog" className="text-green-400 hover:text-green-300 inline-block font-apple-gothic">
              &larr; 블로그로 돌아가기
            </Link>
            
            <div className="flex space-x-2">
              <Link 
                href={`/blog/edit/${post.id}`}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-apple-gothic transition-colors duration-300"
              >
                수정
              </Link>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-apple-gothic transition-colors duration-300 disabled:opacity-50"
              >
                {isDeleting ? '삭제중...' : '삭제'}
              </button>
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-4 font-apple-gothic">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center text-sm text-gray-400 mb-6 gap-4">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-apple-gothic">{formatDate(post.created_at || post.date)}</span>
            </div>
            
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="font-apple-gothic">{post.view_count || 0}회</span>
            </div>
            
            {post.updated_at && post.updated_at !== post.created_at && (
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="font-apple-gothic">수정일: {formatDate(post.updated_at)}</span>
              </div>
            )}
          </div>
          
          {/* 태그 목록 */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map(tag => (
                <Link 
                  href={`/blog?tag=${tag.id}`} 
                  key={tag.id}
                  className="px-3 py-1 rounded-full text-sm font-medium transition-colors duration-300 font-apple-gothic"
                  style={{ backgroundColor: tag.color || '#4B5563', color: '#fff' }}
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>
        
        <hr className="border-t border-gray-700 my-6" />
        
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
        
        {/* 마크다운 콘텐츠 */}
        <article className="max-w-none mb-12">
          <div className="markdown-body">
            {post.content ? (
              <div className="prose prose-invert prose-lg max-w-none">
                <ReactMarkdown 
                  rehypePlugins={[rehypeRaw, rehypeHighlight]} 
                  components={{
                    // 기타 커스텀 컴포넌트 설정
                    a: ({node, ...props}) => <a className="text-green-400 hover:text-green-300" {...props} />,
                    code: ({node, inline, ...props}) => (
                      inline ? 
                        <code className="bg-gray-800 px-1 py-0.5 rounded text-sm" {...props} /> :
                        <code {...props} />
                    ),
                    // 테이블 관련 커스텀 렌더링 제거
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-400 font-apple-gothic">콘텐츠를 불러올 수 없습니다.</p>
            )}
          </div>
        </article>
        
        {/* 관련 포스트 */}
        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6 font-apple-gothic">관련 포스트</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.slice(0, 3).map(relatedPost => (
                <div 
                  key={relatedPost.id} 
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-green-500 transition-colors duration-300"
                >
                  <Link href={`/blog/${relatedPost.id}`}>
                    <h3 className="text-lg font-bold text-white mb-2 hover:text-green-400 transition-colors duration-300 font-apple-gothic">
                      {relatedPost.title}
                    </h3>
                  </Link>
                  <p className="text-gray-400 text-sm mb-2 font-apple-gothic line-clamp-2">{relatedPost.excerpt}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-apple-gothic">{formatDate(relatedPost.created_at)}</span>
                    <Link 
                      href={`/blog/${relatedPost.id}`}
                      className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors duration-300 font-apple-gothic"
                    >
                      읽기 &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}