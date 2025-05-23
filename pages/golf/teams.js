// pages/golf/teams.js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';

export default function Teams() {
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 정렬 상태
  const [sortBy, setSortBy] = useState('team_name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // 정렬 옵션
  const sortOptions = [
    { value: 'team_name', label: '팀 이름' },
    { value: 'team_created_at', label: '생성일' }
  ];

  // 팀 데이터 가져오기
  useEffect(() => {
    const fetchTeams = async () => {
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
        const response = await fetch(`/api/golf/teams?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('팀 목록을 가져오는데 실패했습니다');
        }
        
        const data = await response.json();
        setTeams(data.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError('팀 목록을 가져오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeams();
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
        <title>team | Sveltt Golf</title>
        <meta name="description" content="골프 앱 팀 관리" />
      </Head>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/golf" className="text-green-400 hover:text-green-300 mb-4 inline-block">
            &larr; Home
          </Link>
          
          <div className="flex justify-between items-center mt-4">
            <h1 className="text-3xl font-bold text-green-400 mb-6">
              Team Management
            </h1>
            
            <Link href="/golf/teams/new">
              <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300">
                New
              </button>
            </Link>
          </div>
        </div>
        
        {/* 정렬 */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="sort-by" className="block text-sm font-medium text-gray-300 mb-2">
                sort by
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
            <p className="text-gray-300">팀 목록을 불러오는 중...</p>
          </div>
        )}
        
        {/* 에러 메시지 */}
        {error && !isLoading && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        
        {/* 팀 목록 */}
        {!isLoading && !error && (
          <>
            {teams.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-gray-300">등록된 팀이 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((team) => (
                  <div key={team.team_id} className="bg-gray-800 rounded-lg overflow-hidden shadow-md hover:bg-gray-700 transition-colors duration-300 border border-gray-700">
                    <div className="p-4 flex items-center">
                      {/* 팀명 (좌측) */}
                      <div className="w-1/3 pr-4">
                        <h2 className="text-lg font-semibold text-green-400">
                          {team.team_name}
                        </h2>
                      </div>
                      
                      {/* 팀원 정보 (중앙/우측) */}
                      <div className="w-2/3 flex justify-between items-center">
                        {/* 첫 번째 팀원 */}
                        <div className="flex flex-col items-center mr-2">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 mb-2 flex-shrink-0">
                            {team.user1_profile_image ? (
                              <img
                                src={team.user1_profile_image}
                                alt={team.user1_display_name || team.user1_username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                                👤
                              </div>
                            )}
                          </div>
                          <span className="text-gray-300 text-sm text-center">
                            {team.user1_display_name || team.user1_username}
                          </span>
                        </div>
                        
                        {/* 두 번째 팀원 */}
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 mb-2 flex-shrink-0">
                            {team.user2_profile_image ? (
                              <img
                                src={team.user2_profile_image}
                                alt={team.user2_display_name || team.user2_username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                                👤
                              </div>
                            )}
                          </div>
                          <span className="text-gray-300 text-sm text-center">
                            {team.user2_display_name || team.user2_username}
                          </span>
                        </div>
                        
                        {/* 작업 버튼 */}
                        <button 
                          onClick={() => router.push(`/golf/teams/${team.team_id}`)}
                          className="text-green-400 hover:text-green-300 p-1 ml-2"
                        >
                          상세
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
