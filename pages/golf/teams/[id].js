// pages/golf/teams/[id].js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../../../components/Navbar';

export default function TeamDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [team, setTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 삭제 관련 상태
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  
  // 팀 데이터 가져오기
  useEffect(() => {
    if (!id) return;
    
    const fetchTeam = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/golf/teams/${id}`);
        
        if (!response.ok) {
          throw new Error('팀 정보를 가져오는데 실패했습니다');
        }
        
        const data = await response.json();
        setTeam(data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching team:', err);
        setError('팀 정보를 가져오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeam();
  }, [id]);
  
  // 팀 삭제 핸들러
  const handleDelete = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      const response = await fetch(`/api/golf/teams/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '팀 삭제에 실패했습니다');
      }
      
      // 삭제 성공 시 팀 목록 페이지로 이동
      router.push('/golf/teams');
    } catch (err) {
      console.error('Error deleting team:', err);
      setDeleteError(err.message || '팀 삭제에 실패했습니다');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>{team ? `${team.team_name} | Sveltt Golf` : 'Team Detail | Sveltt Golf'}</title>
        <meta name="description" content="골프 앱 팀 상세 정보" />
      </Head>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/golf/teams" className="text-green-400 hover:text-green-300 mb-4 inline-block">
            &larr; 팀 목록으로 돌아가기
          </Link>
        </div>
        
        {/* 로딩 상태 */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-300">팀 정보를 불러오는 중...</p>
          </div>
        )}
        
        {/* 에러 메시지 */}
        {error && !isLoading && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => router.push('/golf/teams')}
              className="mt-4 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300"
            >
              팀 목록으로 돌아가기
            </button>
          </div>
        )}
        
        {/* 팀 상세 정보 */}
        {!isLoading && !error && team && (
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700">
            {/* 팀 헤더 */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center">
                {/* 팀 이미지 */}
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700 mr-6 flex-shrink-0">
                  {team.team_image ? (
                    <img
                      src={team.team_image}
                      alt={team.team_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">
                      👥
                    </div>
                  )}
                </div>
                
                {/* 팀 기본 정보 */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-green-400 mb-2">
                    {team.team_name}
                  </h1>
                  <p className="text-gray-400 text-sm">
                    생성일: {new Date(team.team_created_at).toLocaleDateString()}
                  </p>
                </div>
                
                {/* 작업 버튼 */}
                <div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300"
                  >
                    팀 삭제
                  </button>
                </div>
              </div>
            </div>
            
            {/* 팀원 정보 */}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-green-400 mb-4">팀원 정보</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 첫 번째 팀원 */}
                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-600 mr-4 flex-shrink-0">
                      {team.user1_profile_image ? (
                        <img
                          src={team.user1_profile_image}
                          alt={team.user1_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                          👤
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-white">
                        {team.user1_display_name || team.user1_username}
                      </h3>
                      <p className="text-gray-400 text-sm">@{team.user1_username}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        핸디캡: {team.user1_handicap || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* 두 번째 팀원 */}
                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-600 mr-4 flex-shrink-0">
                      {team.user2_profile_image ? (
                        <img
                          src={team.user2_profile_image}
                          alt={team.user2_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                          👤
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-white">
                        {team.user2_display_name || team.user2_username}
                      </h3>
                      <p className="text-gray-400 text-sm">@{team.user2_username}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        핸디캡: {team.user2_handicap || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 팀 매치 이력 */}
            <div className="p-6 border-t border-gray-700">
              <h2 className="text-xl font-semibold text-green-400 mb-4">팀 매치 이력</h2>
              
              <div className="text-center py-6 text-gray-400">
                <p>아직 매치 이력이 없습니다.</p>
                <Link href="/golf/team-matches/new">
                  <button className="mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300">
                    새 팀 매치 등록하기
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {/* 삭제 확인 모달 */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">팀 삭제 확인</h3>
              <p className="text-gray-300 mb-6">
                정말로 <span className="text-green-400 font-semibold">{team.team_name}</span> 팀을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </p>
              
              {deleteError && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
                  <p className="text-red-400 text-sm">{deleteError}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300"
                  disabled={isDeleting}
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300"
                  disabled={isDeleting}
                >
                  {isDeleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
