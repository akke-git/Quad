// pages/blog/index.js

// 1. 필요한 외부 라이브러리와 컴포넌트 import
// - React의 상태/생명주기 관리 훅, Next.js의 head/라우팅, 커스텀 컴포넌트, HTTP 요청 라이브러리
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import BlogPostCard from '../../components/BlogPostCard';
import MarkdownEditor from '../../components/MarkdownEditor';
import axios from 'axios';

// 2. Blog 메인 컴포넌트 함수 시작
export default function Blog() {
  // 2-1. 상태 선언: 화면에서 관리할 데이터
  // - 글, 태그, 선택된 태그, 검색어, 모달, 로딩 상태 등
  const [posts, setPosts] = useState([]); // 글 목록
  const [tags, setTags] = useState([]); // 태그 목록
  const [selectedTag, setSelectedTag] = useState(null); // 선택된 태그
  const [searchQuery, setSearchQuery] = useState(''); // 검색어
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // 새 글 작성 모달
  const [isLoading, setIsLoading] = useState(true); // 데이터 로딩 상태

  // 3. 데이터 불러오기 함수 (글/태그)
  // - 서버에서 글 목록과 태그 목록을 받아와 상태에 저장
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true); // 로딩 시작
      // 글 목록 요청
      const postsResponse = await axios.get('/api/blog/posts');
      setPosts(postsResponse.data);
      // 태그 목록 요청
      const tagsResponse = await axios.get('/api/blog/tags');
      setTags(tagsResponse.data);
    } catch (error) {
      console.error('데이터를 가져오는 중 오류 발생:', error);
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  }, []);

  // 3-1. 컴포넌트가 처음 화면에 나타날 때 데이터 불러오기
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 4. 검색 관련 상태 및 함수
  const [isSearching, setIsSearching] = useState(false); // 검색 중 여부
  const [searchResults, setSearchResults] = useState([]); // 검색 결과

  // 4-1. 검색 함수: 입력된 검색어로 서버에 검색 요청
  const handleSearch = useCallback(async (query) => {
    if (!query || query.trim() === '') {
      setSearchResults([]); // 검색어 없으면 결과 비움
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

  // 4-2. 검색어 입력시 0.5초 후 검색 실행(디바운스)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms 대기
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);
  
  // 5. 태그와 검색어로 글 목록 필터링
  // - 검색어가 있으면 검색 결과에서, 없으면 전체 글에서 선택된 태그만 남김
  const filteredPosts = searchQuery 
    ? searchResults.filter(post => selectedTag ? post.tags && post.tags.some(tag => tag.id === selectedTag) : true)
    : posts.filter(post => selectedTag ? post.tags && post.tags.some(tag => tag.id === selectedTag) : true);

  // 6. 실제 화면에 보여줄 UI 반환(JSX)
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 6-1. 페이지 <head> 설정 */}
      <Head>
        <title>blog | Sveltt's Web</title>
        <meta name="description" content="Sveltt의 개인 블로그" />
      </Head>
      {/* 6-2. 상단 네비게이션 */}
      <Navbar />
      {/* 6-3. 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-8">
        {/* 6-3-1. 블로그 타이틀 및 설명 */}
        <div className="text-left mb-8">
          <h1 className="text-6xl font-bold text-green-400 mb-4 font-apple-gothic">Blog</h1>
          <p className="text-xl text-gray-300 font-apple-gothic">
            Markdown : dev, news, article, edu doc, etc
          </p>
        </div>
        {/* 6-3-2. 검색/태그/새글 버튼 컨트롤 */}
        {/* 검색창, 태그 관리, 새 글 작성 버튼이 한 줄에 배치됨 */}
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
          {/* 태그 관리 및 새 글 작성 버튼 */}
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
        {/* 6-3-3. 태그 필터 버튼 */}
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
        {/* 6-3-4. 로딩/검색 중 안내 */}
        {isLoading || isSearching ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400 font-nanum-gothic">
              {isSearching ? '검색 중...' : '포스트를 불러오는 중...'}
            </p>
          </div>
        ) : (
          <>
            {/* 6-3-5. 블로그 포스트 목록 or 안내 메시지 */}
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

