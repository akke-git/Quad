// pages/golf/teams.js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';

export default function Users() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 정렬 상태
  const [sortBy, setSortBy] = useState('username');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // 정렬 옵션
  const sortOptions = [
    { value: 'username', label: '사용자명' },
    { value: 'display_name', label: '표시 이름' },
    { value: 'handicap', label: '핸디캡' },
    { value: 'created_at', label: '등록일' }
  ];

  // 사용자 데이터 가져오기
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        // 쿼리 파라미터 구성
        const params = new URLSearchParams();
        if (sortBy) {
          params.append('sort', sortBy);
          params.append('order', sortOrder);
        }
        // 결과 제한 수 증가 (최대 1000개까지)
        params.append('limit', '1000');
        
        // API 호출
        const response = await fetch(`/api/golf/users?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('사용자 목록을 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setUsers(data.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('사용자 목록을 불러오는데 문제가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [sortBy, sortOrder]);
  
  // 정렬 변경 핸들러
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };
  
  // 정렬 순서 토글
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>사용자 관리 | Sveltt Golf</title>
        <meta name="description" content="골프 앱 사용자 관리" />
      </Head>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/golf" className="text-green-400 hover:text-green-300 mb-4 inline-block font-ubuntu-mono">
            &larr; 골프 홈으로
          </Link>
          
          <div className="flex justify-between items-center mt-4">
            <h1 className="text-3xl font-bold text-green-400 mb-6 font-ubuntu-mono">
              사용자 관리
            </h1>
            
            <Link href="/golf/teams/new">
              <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300">
                새 사용자 등록
              </button>
            </Link>
          </div>
        </div>
        
        {/* 정렬 */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="sort-by" className="block text-sm font-medium text-gray-300 mb-2">
                정렬 기준
              </label>
              <div className="flex">
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={handleSortChange}
                  className="bg-gray-700 text-white border border-gray-600 rounded-l-md px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={toggleSortOrder}
                  className="bg-gray-700 border border-gray-600 border-l-0 rounded-r-md px-3 py-2 hover:bg-gray-600"
                  title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 로딩 상태 */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-300">사용자 목록을 불러오는 중...</p>
          </div>
        )}
        
        {/* 에러 메시지 */}
        {error && !isLoading && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        
        {/* 사용자 목록 */}
        {!isLoading && !error && (
          <>
            {users.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-gray-300">등록된 사용자가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map((user) => (
                  <div key={user.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-md hover:bg-gray-700 transition-colors duration-300 border border-gray-700">
                    <div className="p-4 flex items-center">
                      {/* 프로필 이미지 */}
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 mr-4 flex-shrink-0">
                        {user.profile_image ? (
                          <Image
                            src={user.profile_image}
                            alt={user.display_name || user.username}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            unoptimized={true}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                            👤
                          </div>
                        )}
                      </div>
                      
                      {/* 사용자 정보 */}
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-green-400">
                          {user.display_name || user.username}
                        </h2>
                        <p className="text-gray-300 text-sm">@{user.username}</p>
                        <p className="text-gray-400 text-sm mt-1">
                          핸디캡: {user.handicap || 'N/A'}
                        </p>
                      </div>
                      
                      {/* 작업 버튼 */}
                      <div className="ml-2">
                        <Link href={`/golf/teams/${user.id}`}>
                          <button className="text-green-400 hover:text-green-300 p-1">
                            수정
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* 결과 수 표시 */}
            <div className="mt-6 text-right text-gray-400 text-sm">
              총 {users.length}명의 사용자
            </div>
          </>
        )}
      </main>

      <footer className="bg-gray-800 text-gray-300 py-3 border-t border-gray-700 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p> 2025 Sveltt Golf Score</p>
        </div>
      </footer>
    </div>
  );
}