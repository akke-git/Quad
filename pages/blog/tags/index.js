// pages/blog/tags/index.js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import Navbar from '../../../components/Navbar';

export default function TagManagement() {
  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [newTag, setNewTag] = useState({ name: '', color: '#007bff' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 태그 목록 가져오기
  const fetchTags = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/blog/tags');
      setTags(response.data);
      setError('');
    } catch (err) {
      console.error('태그를 가져오는 중 오류 발생:', err);
      setError('태그를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // 태그 추가
  const handleAddTag = async (e) => {
    e.preventDefault();
    
    if (!newTag.name.trim()) {
      setError('태그 이름은 필수입니다.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post('/api/blog/tags', newTag);
      setTags([...tags, response.data]);
      setNewTag({ name: '', color: '#007bff' });
      setSuccess('태그가 성공적으로 추가되었습니다.');
      setTimeout(() => setSuccess(''), 3000);
      setError('');
    } catch (err) {
      console.error('태그를 추가하는 중 오류 발생:', err);
      setError('태그를 추가하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 태그 수정 모드 시작
  const startEditing = (tag) => {
    setEditingTag({ ...tag });
    setIsEditing(true);
  };

  // 태그 수정 취소
  const cancelEditing = () => {
    setEditingTag(null);
    setIsEditing(false);
  };

  // 태그 수정 저장
  const handleUpdateTag = async (e) => {
    e.preventDefault();
    
    if (!editingTag.name.trim()) {
      setError('태그 이름은 필수입니다.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.put('/api/blog/tags', editingTag);
      
      // 태그 목록 업데이트
      setTags(tags.map(tag => tag.id === editingTag.id ? response.data : tag));
      
      setIsEditing(false);
      setEditingTag(null);
      setSuccess('태그가 성공적으로 수정되었습니다.');
      setTimeout(() => setSuccess(''), 3000);
      setError('');
    } catch (err) {
      console.error('태그를 수정하는 중 오류 발생:', err);
      setError('태그를 수정하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 태그 삭제
  const handleDeleteTag = async (tagId) => {
    if (!confirm('정말로 이 태그를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setIsLoading(true);
      await axios.delete('/api/blog/tags', { data: { id: tagId } });
      
      // 태그 목록에서 삭제된 태그 제거
      setTags(tags.filter(tag => tag.id !== tagId));
      
      setSuccess('태그가 성공적으로 삭제되었습니다.');
      setTimeout(() => setSuccess(''), 3000);
      setError('');
    } catch (err) {
      console.error('태그를 삭제하는 중 오류 발생:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('태그를 삭제하는 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>태그 관리 | Sveltt's Web</title>
        <meta name="description" content="블로그 태그 관리" />
      </Head>

      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-400 mb-2 font-apple-gothic">태그 관리</h1>
            <p className="text-gray-300 font-apple-gothic">블로그 포스트에 사용할 태그를 관리합니다.</p>
          </div>
          <Link 
            href="/blog"
            className="px-4 py-2 bg-gray-800 rounded text-white hover:bg-gray-700 transition-colors duration-300 font-apple-gothic"
          >
            블로그로 돌아가기
          </Link>
        </div>

        {/* 알림 메시지 */}
        {error && (
          <div className="bg-red-900 text-white p-4 rounded mb-6 font-apple-gothic">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-900 text-green-100 p-4 rounded mb-6 font-apple-gothic">
            {success}
          </div>
        )}

        {/* 태그 추가 폼 */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-4 font-apple-gothic">새 태그 추가</h2>
          <form onSubmit={handleAddTag} className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <input
                type="text"
                placeholder="태그 이름"
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-apple-gothic"
              />
            </div>
            <div className="w-full md:w-48">
              <input
                type="color"
                value={newTag.color}
                onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-apple-gothic"
            >
              {isLoading ? '처리 중...' : '태그 추가'}
            </button>
          </form>
        </div>

        {/* 태그 목록 */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4 font-apple-gothic">태그 목록</h2>
          
          {isLoading && !isEditing ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-400 font-apple-gothic">태그를 불러오는 중...</p>
            </div>
          ) : tags.length === 0 ? (
            <p className="text-gray-400 text-center py-8 font-apple-gothic">등록된 태그가 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-4 py-2 text-left font-apple-gothic">ID</th>
                    <th className="px-4 py-2 text-left font-apple-gothic">이름</th>
                    <th className="px-4 py-2 text-left font-apple-gothic">색상</th>
                    <th className="px-4 py-2 text-right font-apple-gothic">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {tags.map(tag => (
                    <tr key={tag.id} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="px-4 py-3 font-apple-gothic">{tag.id}</td>
                      <td className="px-4 py-3 font-apple-gothic">{tag.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div 
                            className="w-6 h-6 rounded-full mr-2" 
                            style={{ backgroundColor: tag.color }}
                          ></div>
                          <span className="font-apple-gothic">{tag.color}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => startEditing(tag)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm transition-colors duration-300 mr-2 font-apple-gothic"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm transition-colors duration-300 font-apple-gothic"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 태그 수정 모달 */}
        {isEditing && editingTag && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 font-apple-gothic">태그 수정</h2>
              
              <form onSubmit={handleUpdateTag}>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2 font-apple-gothic">태그 이름</label>
                  <input
                    type="text"
                    value={editingTag.name}
                    onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-apple-gothic"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-300 mb-2 font-apple-gothic">태그 색상</label>
                  <input
                    type="color"
                    value={editingTag.color}
                    onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors duration-300 font-apple-gothic"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-apple-gothic"
                  >
                    {isLoading ? '처리 중...' : '저장'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
