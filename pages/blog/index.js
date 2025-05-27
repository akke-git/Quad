// pages/blog/index.js

import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import BlogPostCard from '../../components/BlogPostCard';
import MarkdownEditor from '../../components/MarkdownEditor';
import axios from 'axios';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 포스트 및 태그 데이터 가져오기
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 포스트 데이터 가져오기
      const postsResponse = await axios.get('/api/blog/posts');
      setPosts(postsResponse.data);
      
      // 태그 데이터 가져오기
      const tagsResponse = await axios.get('/api/blog/tags');
      setTags(tagsResponse.data);
    } catch (error) {
      console.error('데이터를 가져오는 중 오류 발생:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 검색 기능 구현
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  
  // 검색 함수
  const handleSearch = useCallback(async (query) => {
    if (!query || query.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await axios.get(`/api/blog/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('검색 중 오류 발생:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  // 검색어 입력 시 검색 실행 (디바운스 적용)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms 디바운스
    
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);
  
  // 태그 및 검색어로 포스트 필터링
  const filteredPosts = searchQuery 
    ? searchResults.filter(post => selectedTag ? post.tags && post.tags.some(tag => tag.id === selectedTag) : true)
    : posts.filter(post => selectedTag ? post.tags && post.tags.some(tag => tag.id === selectedTag) : true);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>blog | Sveltt's Web</title>
        <meta name="description" content="Sveltt의 개인 블로그" />
      </Head>

      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-left mb-8">
          <h1 className="text-6xl font-bold text-green-400 mb-4 font-apple-gothic">
            Blog
          </h1>
          <p className="text-xl text-gray-300 font-apple-gothic">
            Markdown : dev, news, article, edu doc, etc
          </p>
        </div>

        {/* 블로그 컨트롤 */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
          {/* 검색 필드 */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="검색어를 입력하세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-nanum-gothic"
            />
            <div className="absolute right-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>           
          </div>
          
          {/* 새 글 작성 버튼 및 태그 관리 버튼 */}
          <div className="flex space-x-3">
            <Link href="/blog/tags" className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors duration-300 font-apple-gothic">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              Tags
            </Link>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white transition-colors duration-300 font-apple-gothic"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New
            </button>
          </div>
        </div>

        {/* 태그 필터 */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 font-nanum-gothic ${
                selectedTag === null
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              전체
            </button>
            
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 font-nanum-gothic ${
                  selectedTag === tag.id
                    ? `bg-${tag.color} text-white`
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                style={{ backgroundColor: selectedTag === tag.id ? tag.color : '' }}
              >
                {tag.name}
              </button>
            ))}
          </div>
          <br></br>
        </div>

        {/* 로딩 상태 */}
        {isLoading || isSearching ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400 font-nanum-gothic">
              {isSearching ? '검색 중...' : '포스트를 불러오는 중...'}
            </p>
          </div>
        ) : (
          <>
            {/* 블로그 포스트 목록 */}
            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
                {filteredPosts.map(post => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                {searchQuery ? (
                  <div>
                    <p className="text-gray-400 font-nanum-gothic mb-2">
                      <span className="text-green-400 font-semibold">"{searchQuery}"</span>
                      에 대한 검색 결과가 없습니다.
                    </p>
                    <p className="text-gray-500 text-sm font-nanum-gothic">다른 검색어를 사용하거나 태그를 선택해 보세요.</p>
                  </div>
                ) : selectedTag ? (
                  <p className="text-gray-400 font-nanum-gothic">선택한 태그에 해당하는 게시물이 없습니다.</p>
                ) : (
                  <p className="text-gray-400 font-nanum-gothic">등록된 게시물이 없습니다.</p>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* 새 글 작성 모달 */}
      {isCreateModalOpen && (
        <CreatePostModal 
          onClose={() => setIsCreateModalOpen(false)} 
          onSuccess={() => {
            fetchData();
            setIsCreateModalOpen(false);
          }}
          tags={tags}
        />
      )}
    </div>
  );
}

// 새 글 작성 모달 컴포넌트
function CreatePostModal({ onClose, onSuccess, tags }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [markdownFile, setMarkdownFile] = useState(null);
  const [previewContent, setPreviewContent] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  
  const handleTagToggle = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'text/markdown' && !file.name.endsWith('.md')) {
      setError('Markdown 파일(.md)만 업로드 가능합니다.');
      return;
    }
    
    setMarkdownFile(file);
    
    // 파일 내용 읽기
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      setContent(content);
      setPreviewContent(content);
      
      // 제목 추출 시도 (첫 번째 # 헤더)
      const titleMatch = content.match(/^#\s+(.+)$/m);
      if (titleMatch && titleMatch[1] && !title) {
        setTitle(titleMatch[1].trim());
      }
      
      // 요약 추출 (첫 100자)
      if (!excerpt) {
        const plainText = content.replace(/#{1,6}\s+.+\n|```[\s\S]*?```|\[.*?\]\(.*?\)|\*\*|__/g, '').trim();
        setExcerpt(plainText.substring(0, 150) + (plainText.length > 150 ? '...' : ''));
      }
    };
    reader.readAsText(file);
  };
  
  // 썸네일 이미지 업로드 핸들러
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 이미지 파일 확인
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      setError('이미지 파일(JPG, PNG, GIF, WebP)만 업로드 가능합니다.');
      return;
    }
    
    setThumbnailFile(file);
    
    // 이미지 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnailPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!title || !content) {
      setError('제목과 내용은 필수입니다.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // 포스트 저장 요청
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('excerpt', excerpt || content.substring(0, 150) + (content.length > 150 ? '...' : ''));
      formData.append('tags', JSON.stringify(selectedTags));
      
      // 마크다운 파일 추가
      if (markdownFile) {
        formData.append('markdown_file', markdownFile);
      }
      
      // 썸네일 이미지 추가
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }
      
      const response = await axios.post('/api/blog/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // 성공 시 콜백 호출
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      console.error('포스트 저장 중 오류 발생:', error);
      setError(error.response?.data?.message || '포스트를 저장하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white font-apple-gothic">New Post</h2>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-900 bg-opacity-50 text-red-200 rounded-md font-nanum-gothic">
              {error}
            </div>
          )}
          
          {/* 제목 입력 */}
          <div className="mb-4">
            <label className="block text-gray-300 mb-2 font-apple-gothic">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-nanum-gothic"
              placeholder="제목을 입력하세요"
            />
          </div>
          
          {/* 태그 선택 */}
          <div className="mb-4">
            <label className="block text-gray-300 mb-2 font-apple-gothic">태그</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors duration-300 font-nanum-gothic ${
                    selectedTags.includes(tag.id)
                      ? `bg-${tag.color} text-white`
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  style={{ backgroundColor: selectedTags.includes(tag.id) ? tag.color : '' }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* 썸네일 이미지 업로드 */}
          <div className="mb-4">
            <label className="block text-gray-300 mb-2 font-apple-gothic">썸네일 이미지 (선택사항)</label>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleThumbnailChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-apple-gothic"
                />
                <p className="mt-1 text-xs text-gray-400 font-apple-gothic">
                  이미지 파일(JPG, PNG, GIF, WebP)을 업로드하세요. 이미지가 없으면 기본 문서 아이콘이 표시됩니다.
                </p>
              </div>
              {thumbnailPreview && (
                <div className="w-24 h-24 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                  <img src={thumbnailPreview} alt="썸네일 미리보기" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
          
          {/* 마크다운 파일 업로드 */}
          <div className="mb-4">
            <label className="block text-gray-300 mb-2 font-apple-gothic">Markdown 파일 업로드</label>
            <input
              type="file"
              accept=".md,text/markdown"
              onChange={handleFileChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-apple-gothic"
            />
            <p className="mt-1 text-xs text-gray-400 font-apple-gothic">
              Markdown 파일(.md)을 업로드하면 내용이 자동으로 채워집니다.
            </p>
          </div>
          
          {/* 내용 입력 - 마크다운 에디터 사용 */}
          <div className="mb-4">
            <label className="block text-gray-300 mb-2 font-apple-gothic">내용 (Markdown)</label>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              height="400px"
            />
          </div>
          
          {/* 요약 입력 */}
          <div className="mb-4">
            <label className="block text-gray-300 mb-2 font-apple-gothic">요약 (선택사항)</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-nanum-gothic h-24"
              placeholder="포스트 목록에 표시될 요약을 입력하세요 (입력하지 않으면 자동 생성됩니다)"
            />
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors duration-300 font-nanum-gothic"
            disabled={isLoading}
          >
            cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white transition-colors duration-300 font-nanum-gothic flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                save...
              </>
            ) : 'save'}
          </button>
        </div>
      </div>
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
          <h3 className="text-xl font-bold text-white font-apple-gothic">웹에서 글 가져오기</h3>
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