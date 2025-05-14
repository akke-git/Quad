// pages/golf/rounds/index.js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Navbar from '../../../components/Navbar';

export default function RoundRecords() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [rounds, setRounds] = useState([]);
  const [loadingRounds, setLoadingRounds] = useState(false);

  // 사용자 데이터 가져오기 및 저장된 사용자 정보 불러오기
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        // 결과 제한 수 증가 (최대 1000개까지)
        const params = new URLSearchParams();
        params.append('limit', '1000');
        
        // API 호출
        const response = await fetch(`/api/golf/users?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('사용자 목록을 가져오는데 실패했습니다');
        }
        
        const data = await response.json();
        const userList = data.data || [];
        setUsers(userList);
        setError(null);
        
        // 저장된 사용자 정보가 있는지 확인
        const savedUserData = localStorage.getItem('selectedGolfUser');
        if (savedUserData) {
          try {
            const savedUser = JSON.parse(savedUserData);
            // 저장된 사용자가 현재 사용자 목록에 있는지 확인
            const foundUser = userList.find(user => user.id === savedUser.id);
            if (foundUser) {
              setSelectedUser(foundUser);
              // 인증 완료 상태로 설정
              setShowPasswordModal(false);
              // 라운드 기록 가져오기
              fetchUserRounds(foundUser.id);
            }
          } catch (e) {
            console.error('Error parsing saved user data:', e);
            localStorage.removeItem('selectedGolfUser');
          }
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err.message || '사용자 목록을 가져오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // 사용자 선택 핸들러
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
    setPassword('');
    setError(null);
  };

  // 사용자의 라운드 기록 가져오기
  const fetchUserRounds = async (userId) => {
    setLoadingRounds(true);
    try {
      const response = await fetch(`/api/golf/rounds?user_id=${userId}&limit=4`);
      
      if (!response.ok) {
        throw new Error('라운드 기록을 가져오는데 실패했습니다');
      }
      
      const data = await response.json();
      setRounds(data.data || []);
    } catch (err) {
      console.error('Error fetching rounds:', err);
      setError(err.message || '라운드 기록을 가져오는데 실패했습니다');
    } finally {
      setLoadingRounds(false);
    }
  };
  
  // 비밀번호 인증 핸들러
  const handleAuthenticate = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요');
      return;
    }
    
    setIsAuthenticating(true);
    
    try {
      const response = await fetch('/api/golf/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: selectedUser.username,
          password: password
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '인증에 실패했습니다');
      }
      
      // 인증 성공 시 모달 닫기
      setShowPasswordModal(false);
      
      // 선택된 사용자 정보를 로컬 스토리지에 저장
      localStorage.setItem('selectedGolfUser', JSON.stringify(selectedUser));
      
      // 사용자의 라운드 기록 가져오기
      await fetchUserRounds(selectedUser.id);
      
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || '인증에 실패했습니다');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowPasswordModal(false);
    setSelectedUser(null);
    setPassword('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Round Records | Sveltt Golf</title>
        <meta name="description" content="Golf round records" />
      </Head>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/golf" className="text-green-400 hover:text-green-300 mb-4 inline-block font-ubuntu-mono">
            &larr; Golf Home
          </Link>
          
          <h1 className="text-3xl font-bold text-green-400 mt-4 mb-6 font-ubuntu-mono">
            Round Records
          </h1>
        </div>

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-300 font-ubuntu-mono">Loading users...</p>
          </div>
        )}
        
        {/* 에러 메시지 */}
        {error && !isLoading && !showPasswordModal && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        
        {/* 사용자 목록 (가로 스크롤) */}
        {!isLoading && !error && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-green-400 mb-4 font-ubuntu-mono">Select User</h2>
            
            {users.length === 0 ? (
              <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-gray-300 font-ubuntu-mono">No users found.</p>
                <Link href="/golf/users/new">
                  <button className="mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300 font-ubuntu-mono">
                    Create New User
                  </button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto pb-4">
                <div className="flex space-x-4 min-w-max">
                  {users.map((user) => (
                    <div 
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className={`bg-gray-800 rounded-lg p-4 border border-gray-700 hover:bg-gray-700 transition-colors duration-300 cursor-pointer w-40 flex flex-col items-center ${selectedUser?.id === user.id ? 'ring-2 ring-green-500' : ''}`}
                    >
                      {/* 프로필 이미지 */}
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700 mb-3">
                        {user.profile_image ? (
                          <img
                            src={user.profile_image}
                            alt={user.display_name || user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">
                            👤
                          </div>
                        )}
                      </div>
                      
                      {/* 사용자 정보 */}
                      <h3 className="text-center font-semibold text-green-400 truncate w-full">
                        {user.display_name || user.username}
                      </h3>
                      <p className="text-gray-400 text-xs text-center truncate w-full">
                        @{user.username}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 비밀번호 인증 모달 */}
        {showPasswordModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
              <h2 className="text-xl font-semibold text-green-400 mb-4 font-ubuntu-mono">
                Authentication Required
              </h2>
              
              <div className="flex items-center mb-6">
                {/* 프로필 이미지 */}
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 mr-4">
                  {selectedUser.profile_image ? (
                    <img
                      src={selectedUser.profile_image}
                      alt={selectedUser.display_name || selectedUser.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                      👤
                    </div>
                  )}
                </div>
                
                {/* 사용자 정보 */}
                <div>
                  <h3 className="font-semibold text-white">
                    {selectedUser.display_name || selectedUser.username}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    @{selectedUser.username}
                  </p>
                </div>
              </div>
              
              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-center">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              
              {/* 비밀번호 입력 폼 */}
              <form onSubmit={handleAuthenticate}>
                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2 font-ubuntu-mono">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter password"
                    autoFocus
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md font-ubuntu-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-ubuntu-mono"
                  >
                    {isAuthenticating ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* 선택된 사용자의 라운드 기록 (인증 후 표시) */}
        {selectedUser && !showPasswordModal && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center mb-6">
              {/* 프로필 이미지 */}
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 mr-4">
                {selectedUser.profile_image ? (
                  <img
                    src={selectedUser.profile_image}
                    alt={selectedUser.display_name || selectedUser.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                    👤
                  </div>
                )}
              </div>
              
              {/* 사용자 정보 */}
              <div>
                <h3 className="font-semibold text-white text-xl font-ubuntu-mono">
                  {selectedUser.display_name || selectedUser.username}의 라운드
                </h3>
                <p className="text-gray-400 text-sm">
                  핸디캡: {selectedUser.handicap || 'N/A'}
                </p>
              </div>
              
              {/* 새 라운드 기록 버튼 */}
              <div className="ml-auto">
                <Link href={`/golf/rounds/new?user=${selectedUser.id}`}>
                  <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300 font-ubuntu-mono">
                    새 라운드
                  </button>
                </Link>
              </div>
            </div>
            
            {/* 라운드 기록 목록 */}
            {loadingRounds ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-gray-300 font-ubuntu-mono">라운드 기록을 불러오는 중...</p>
              </div>
            ) : rounds.length === 0 ? (
              <div className="text-center py-8 text-gray-300">
                <p className="font-ubuntu-mono">라운드 기록이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {rounds.map((round) => (
                  <div key={round.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    {/* 라운드 요약 정보 - 수정된 레이아웃 */}
                    <div className="flex flex-col mb-4">
                      {/* 코스명과 합산 타수 - 크게 강조 */}
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h4 className="text-sm text-gray-400 font-ubuntu-mono">course</h4>
                          <p className="text-white font-bold text-xl font-ubuntu-mono">{round.course_name}</p>
                        </div>
                        <div className="text-right">
                          <h4 className="text-sm text-gray-400 font-ubuntu-mono">Score</h4>
                          <p className="text-green-400 font-bold text-5xl font-ubuntu-mono">{round.total_score}</p>
                        </div>
                      </div>
                      
                      {/* 날짜와 지역 - 작게 2열로 */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <h4 className="text-xs text-gray-400 font-ubuntu-mono">날짜</h4>
                          <p className="text-gray-300 text-sm">
                            {new Date(round.play_date).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs text-gray-400 font-ubuntu-mono">지역</h4>
                          <p className="text-gray-300 text-sm">{round.course_location}</p>
                        </div>
                      </div>
                    </div>
                    

                    
                    {/* 라운드 상세 보기 버튼 */}
                    <div className="mt-4 text-right">
                      <Link href={`/golf/rounds/${round.id}`}>
                        <button className="text-green-400 hover:text-green-300 text-sm font-ubuntu-mono">
                          상세 보기 &rarr;
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
