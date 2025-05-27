// components/BlogPostCard.js

import Link from 'next/link';

export default function BlogPostCard({ post }) {
  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ko-KR', options);
  };

  return (
    <Link href={`/blog/${post.id}`} className="block">
      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-700 h-full flex flex-col hover:border-green-500 group">
        <div className="flex p-5">
          {/* 왼쪽: 작은 이미지 */}
          <div className="w-24 h-24 flex-shrink-0 mr-4 overflow-hidden rounded-md">
            {post.thumbnail ? (
              <img
                src={post.thumbnail}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                {/* 기본 문서 이미지 - 마크다운 파일 아이콘 */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            )}
          </div>
          
          {/* 오른쪽: 콘텐츠 */}
          <div className="flex-1 flex flex-col">
            {/* 날짜 및 조회수 */}
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400 font-apple-gothic flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(post.created_at || post.date)}
              </span>
              
              {post.view_count !== undefined && (
                <span className="text-xs text-gray-400 font-apple-gothic flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {post.view_count}회
                </span>
              )}
            </div>
            
            {/* 제목 */}
            <h3 className="text-md font-bold text-white mb-2 font-apple-gothic group-hover:text-green-400 transition-colors duration-300">
              {post.title}
            </h3>
            
            {/* 요약 */}
            <p className="text-gray-300 text-xs mb-auto line-clamp-2 font-apple-gothic">
              {post.excerpt}
            </p>
          </div>
        </div>
        
        {/* 하단: 태그 및 상태 */}
        <div className="px-5 pb-4 mt-auto">
          <div className="flex justify-between items-center">
            {/* 태그 */}
            <div className="flex flex-wrap gap-1">
              {post.tags && post.tags.length > 0 ? (
                <>
                  {post.tags.slice(0, 3).map(tag => (
                    <span 
                      key={tag.id} 
                      className="text-xs px-2 py-0.5 rounded-full font-apple-gothic"
                      style={{ backgroundColor: tag.color || '#4B5563', color: '#fff' }}
                    >
                      {tag.name}
                    </span>
                  ))}
                  {post.tags.length > 3 && (
                    <span className="text-xs text-gray-400 font-apple-gothic">+{post.tags.length - 3}</span>
                  )}
                </>
              ) : (
                <span className="text-xs text-gray-500 font-apple-gothic">태그 없음</span>
              )}
            </div>
            
            {/* 상태 표시 */}
            {post.status && (
              <span className={`text-xs px-2 py-0.5 rounded font-apple-gothic ${post.status === 'published' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'}`}>
                {post.status === 'published' ? '공개' : '비공개'}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}