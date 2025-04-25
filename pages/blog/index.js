// pages/blog/index.js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import BlogPostCard from '../../components/BlogPostCard';
import axios from 'axios';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // API에서 포스트 데이터 가져오기
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/blog/posts');
        setPosts(response.data);
        
        // 카테고리 추출
        const uniqueCategories = ['전체', ...new Set(response.data.map(post => post.category))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('포스트를 가져오는 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const filteredPosts = selectedCategory === '전체' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>블로그 | Sveltt's Web</title>
        <meta name="description" content="Sveltt의 개인 블로그" />
      </Head>

      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-400 mb-4 font-ubuntu-mono">
            Blog
          </h1>
          <p className="text-xl text-gray-300 font-ubuntu-mono">
            import HTML to Markdown
          </p>
        </div>

        {/* 블로그 컨트롤 */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 font-nanum-gothic ${
                  selectedCategory === category
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          
          {/* 새 글 가져오기 버튼 */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white transition-colors duration-300 font-nanum-gothic"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            웹에서 글 가져오기
          </button>
        </div>

        {/* 로딩 상태 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400 font-nanum-gothic">포스트를 불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* 블로그 포스트 목록 */}
            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map(post => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 font-nanum-gothic">해당 카테고리에 게시물이 없습니다.</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* 웹 크롤링 모달 */}
      {isImportModalOpen && (
        <ImportModal 
          onClose={() => setIsImportModalOpen(false)} 
          onSuccess={(newPost) => {
            setPosts(prevPosts => [newPost, ...prevPosts]);
            setIsImportModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// 웹 크롤링 모달 컴포넌트
function ImportModal({ onClose, onSuccess }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [selector, setSelector] = useState('article');
  const [isLoading, setIsLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [error, setError] = useState('');
  
  // 자주 사용하는 셀렉터 목록
  const commonSelectors = [
    { label: '기본 (article)', value: 'article' },
    { label: '본문 (div.content)', value: 'div.content' },
    { label: '블로그 포스트 (div.post-content)', value: 'div.post-content' },
    { label: '미디엄 스타일 (article.article)', value: 'article.article' }
  ];

  const handleFetchPreview = async () => {
    if (!url) {
      setError('URL을 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // 실제 API 호출로 변경
      const response = await axios.post('/api/blog/preview', {
        url,
        selector
      });
      
      setPreviewContent(response.data.content);
      
      // URL에서 제목 추출 시도
      if (!title && response.data.title) {
        setTitle(response.data.title);
      }
    } catch (error) {
      console.error('미리보기 중 오류 발생:', error);
      setError(error.response?.data?.message || '미리보기를 가져오는 중 오류가 발생했습니다.');
      setPreviewContent('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!url || !title || !category || !previewContent) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // 서버에 저장 요청
      const response = await axios.post('/api/blog/crawl', {
        url,
        title,
        category,
        selector
      });
      
      // 성공 시 콜백 호출
      if (onSuccess) {
        onSuccess({
          id: response.data.id,
          title,
          excerpt: previewContent.substring(0, 150) + '...',
          date: new Date().toISOString().split('T')[0],
          category,
          source: url,
          thumbnail: null
        });
      }
    } catch (error) {
      console.error('저장 중 오류 발생:', error);
      setError(error.response?.data?.message || '포스트 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white font-ubuntu-mono">웹에서 글 가져오기</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 overflow-auto max-h-[calc(90vh-8rem)]">
          {error && (
            <div className="bg-red-900 bg-opacity-50 text-red-200 p-3 rounded mb-4 font-nanum-gothic">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {/* URL 입력 */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-1 font-nanum-gothic">
                URL
              </label>
              <div className="flex">
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="flex-1 bg-gray-700 text-white rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleFetchPreview}
                  disabled={isLoading || !url}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-r font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 font-nanum-gothic"
                >
                  {isLoading ? '가져오는 중...' : '미리보기'}
                </button>
              </div>
            </div>
            
            {/* 제목 입력 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1 font-nanum-gothic">
                제목
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="글 제목"
                className="w-full bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            {/* 카테고리 입력 */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1 font-nanum-gothic">
                카테고리
              </label>
              <input
                type="text"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="카테고리"
                className="w-full bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            {/* 셀렉터 선택 */}
            <div>
              <label htmlFor="selector" className="block text-sm font-medium text-gray-300 mb-1 font-nanum-gothic">
                HTML 셀렉터
              </label>
              <div className="flex">
                <select
                  id="selector"
                  value={selector}
                  onChange={(e) => setSelector(e.target.value)}
                  className="flex-1 bg-gray-700 text-white rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {commonSelectors.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={selector}
                  onChange={(e) => setSelector(e.target.value)}
                  placeholder="직접 입력"
                  className="flex-1 bg-gray-700 text-white border-l border-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 font-nanum-gothic">
                웹 페이지에서 가져올 콘텐츠의 CSS 셀렉터를 선택하거나 직접 입력하세요.
              </p>
            </div>
            
            {/* 미리보기 */}
            {previewContent && (
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2 font-nanum-gothic">미리보기</h4>
                <div className="bg-gray-900 p-4 rounded border border-gray-700 prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono">
                    {previewContent}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors duration-300 font-nanum-gothic"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !url || !title || !category || !previewContent}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 font-nanum-gothic"
          >
            {isLoading ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
}