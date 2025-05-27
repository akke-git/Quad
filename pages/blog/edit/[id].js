// pages/blog/edit/[id].js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../../../components/Navbar';
import dynamic from 'next/dynamic';
import axios from 'axios';

// 마크다운 에디터를 클라이언트 사이드에서만 로드
const MarkdownEditor = dynamic(() => import('../../../components/MarkdownEditor'), {
  ssr: false,
});

export default function EditPost() {
  const router = useRouter();
  const { id } = router.query;
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // 포스트 데이터 로드
  useEffect(() => {
    if (!id) return;

    const fetchPostData = async () => {
      setIsLoading(true);
      try {
        // 포스트 데이터 가져오기
        const response = await axios.get(`/api/blog/posts/${id}`);
        const post = response.data;
        
        setTitle(post.title || '');
        setContent(post.content || '');
        setExcerpt(post.excerpt || '');
        
        if (post.tags && Array.isArray(post.tags)) {
          setSelectedTags(post.tags.map(tag => tag.id));
        }
        
        // 사용 가능한 태그 목록 가져오기
        const tagsResponse = await axios.get('/api/blog/tags');
        setAvailableTags(tagsResponse.data);
      } catch (error) {
        console.error('포스트 데이터를 가져오는 중 오류 발생:', error);
        setError('포스트 데이터를 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostData();
  }, [id]);

  // 포스트 저장 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !content) {
      setError('제목과 내용은 필수입니다.');
      return;
    }
    
    setIsSaving(true);
    setError('');
    
    try {
      const response = await axios.put(`/api/blog/posts/${id}`, {
        title,
        content,
        excerpt: excerpt || content.substring(0, 150) + (content.length > 150 ? '...' : ''),
        tags: selectedTags
      });
      
      router.push(`/blog/${id}`);
    } catch (error) {
      console.error('포스트 저장 중 오류 발생:', error);
      setError('포스트 저장 중 오류가 발생했습니다.');
      setIsSaving(false);
    }
  };

  // 태그 선택 처리
  const handleTagToggle = (tagId) => {
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300 font-apple-gothic">포스트 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>포스트 수정 | Sveltt's Web</title>
      </Head>

      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href={`/blog/${id}`} className="text-green-400 hover:text-green-300 mb-4 inline-block font-apple-gothic">
            &larr; 포스트로 돌아가기
          </Link>
          
          <h1 className="text-3xl font-bold text-white mt-4 mb-6 font-apple-gothic">
            포스트 수정
          </h1>
          
          {error && (
            <div className="bg-red-900 text-white p-3 rounded-md mb-4 font-apple-gothic">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-gray-300 mb-2 font-apple-gothic">
                제목
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-apple-gothic"
                placeholder="포스트 제목"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="excerpt" className="block text-gray-300 mb-2 font-apple-gothic">
                요약 (선택사항)
              </label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-apple-gothic"
                placeholder="포스트 요약 (입력하지 않으면 본문에서 자동 생성)"
                rows="2"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-2 font-apple-gothic">
                태그
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-300 font-apple-gothic ${
                      selectedTags.includes(tag.id)
                        ? 'bg-opacity-100'
                        : 'bg-opacity-50'
                    }`}
                    style={{ 
                      backgroundColor: selectedTags.includes(tag.id) 
                        ? tag.color || '#4B5563' 
                        : '#1F2937',
                      color: '#fff' 
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="content" className="block text-gray-300 mb-2 font-apple-gothic">
                내용
              </label>
              <div className="bg-gray-800 border border-gray-700 rounded-md overflow-hidden">
                <MarkdownEditor
                  value={content}
                  onChange={setContent}
                  placeholder="마크다운으로 포스트 내용을 작성하세요..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Link
                href={`/blog/${id}`}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md font-apple-gothic transition-colors duration-300"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-apple-gothic transition-colors duration-300 disabled:opacity-50"
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
