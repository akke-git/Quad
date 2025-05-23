// pages/golf/team-matches/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../../../components/Navbar';

// date-fns 대신 사용할 날짜 포맷 함수
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function TeamMatches() {
  const router = useRouter();
  const [teamMatches, setTeamMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // 사용자 목록 불러오기
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/golf/users');
        if (response.ok) {
          const data = await response.json();
          // API 응답이 배열인지 확인하고, 배열이 아니면 적절히 변환
          if (data && Array.isArray(data)) {
            setUsers(data);
          } else if (data && typeof data === 'object') {
            // 객체인 경우 users 속성이 있는지 확인
            if (Array.isArray(data.users)) {
              setUsers(data.users);
            } else {
              // 객체를 배열로 변환 시도
              const usersArray = Object.values(data).filter(item => 
                item && typeof item === 'object' && 'id' in item && 'name' in item
              );
              setUsers(usersArray);
            }
          } else {
            console.error('사용자 데이터 형식이 올바르지 않습니다:', data);
            setUsers([]);
          }
        } else {
          console.error('사용자 목록을 불러오는 중 오류가 발생했습니다.');
          setUsers([]);
        }
      } catch (error) {
        console.error('사용자 목록을 불러오는 중 오류가 발생했습니다:', error);
        setUsers([]);
      }
    };
    
    fetchUsers();
  }, []);
  
  // URL 쿼리 파라미터에서 사용자 ID 가져오기
  useEffect(() => {
    if (router.query.user && users.length > 0) {
      const userId = parseInt(router.query.user);
      const user = users.find(u => u.id === userId);
      if (user) {
        setSelectedUser(user);
      }
    }
  }, [router.query.user, users]);
  
  // 팀 매치 목록 불러오기
  useEffect(() => {
    const fetchTeamMatches = async () => {
      setLoading(true);
      try {
        let url = '/api/golf/team-matches';
        if (selectedUser) {
          url = `/api/golf/users/${selectedUser.id}/team-matches`;
        }
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          console.log('받은 팀 매치 데이터:', data);
          
          // API에서 받은 데이터를 그대로 사용
          // 필요한 경우에만 기본값 설정
          const formattedData = data.map(match => {
            console.log('팀 데이터 확인:', match.team1_name, match.team2_name);
            return {
              ...match,
              // course가 없는 경우에만 기본값 설정
              course: match.course || { 
                id: match.course_id, 
                name: match.course_name || '코스 정보 없음', 
                region: match.course_region || '' 
              },
              // teams가 없는 경우에만 기본값 설정
              teams: match.teams || [
                { 
                  id: match.team1_id,
                  team_number: 1,
                  team: {
                    id: match.team1_id,
                    name: match.team1_name || '1팀'
                  },
                  // 팀 멤버 정보 설정 (API에서 제공하는 경우 사용)
                  members: match.team1_members || []
                },
                { 
                  id: match.team2_id,
                  team_number: 2,
                  team: {
                    id: match.team2_id,
                    name: match.team2_name || '2팀'
                  },
                  // 팀 멤버 정보 설정 (API에서 제공하는 경우 사용)
                  members: match.team2_members || []
                }
              ],
              // status가 없는 경우에만 기본값 설정
              status: match.status || match.match_status || 'in_progress'
            };
          });
          
          setTeamMatches(formattedData);
        } else {
          console.error('팀 매치 목록을 불러오는 중 오류가 발생했습니다.');
        }
      } catch (error) {
        console.error('팀 매치 목록을 불러오는 중 오류가 발생했습니다:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamMatches();
  }, [selectedUser]);
  
  // 사용자 선택 핸들러
  const handleUserChange = (e) => {
    const userId = parseInt(e.target.value);
    if (userId) {
      const user = users.find(u => u.id === userId);
      setSelectedUser(user);
      router.push(`/golf/team-matches?user=${userId}`, undefined, { shallow: true });
    } else {
      setSelectedUser(null);
      router.push('/golf/team-matches', undefined, { shallow: true });
    }
  };
  
  // 팀 매치 상태에 따른 배경색 클래스
  const getStatusClass = (status) => {
    return status === 'completed' ? 'bg-green-700' : 'bg-yellow-700';
  };
  
  // 팀 멤버의 프로필 이미지 가져오기
  const getMemberProfileImage = (member) => {
    if (!member) return '/images/default-user.png';
    return member.profile_image || '/images/default-user.png';
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>팀 매치 | Quad</title>
      </Head>
      
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">팀 매치</h1>
          
          <div className="flex space-x-4">
            {/* 사용자 선택 드롭다운 */}
            <div className="relative">
              <select
                value={selectedUser ? selectedUser.id : ''}
                onChange={handleUserChange}
                className="bg-gray-800 text-white border border-gray-700 rounded-md py-2 px-4 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">모든 팀 매치</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            
            {/* 새 팀 매치 버튼 */}
            <Link href="/golf/team-matches/new">
              <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300">
                새 팀 매치
              </button>
            </Link>
          </div>
        </div>
        
        {/* 로딩 상태 */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : teamMatches.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p>팀 매치 기록이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {teamMatches.map((match) => (
              <Link key={match.id} href={`/golf/team-matches/${match.id}`}>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
                  <div className="flex items-center">
                    {/* 왼쪽: 코스 정보 및 날짜 */}
                    <div className="w-1/3 pr-4 border-r border-gray-700">
                      <h3 className="text-lg font-semibold text-green-400">
                        {match.course?.name || '코스 정보 없음'}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {match.match_date ? new Date(match.match_date).toLocaleDateString() : '날짜 정보 없음'}
                      </p>
                    </div>
                    
                    {/* 오른쪽: 팀 정보 */}
                    <div className="w-2/3 pl-4 flex items-center justify-between">
                      {match.teams && match.teams.length >= 2 && (
                        <>
                          {/* 팀 1 */}
                          <div className="flex-1 relative">
                            <div className="flex items-center">
                              <div className="flex -space-x-2 mr-2">
                                {/* 팀 멤버 이미지 표시 */}
                                {match.teams[0].members && match.teams[0].members.length > 0 ? (
                                  match.teams[0].members.slice(0, 2).map((member, idx) => {
                                    // 이름 가져오기 (display_name 또는 username 사용)
                                    const displayName = member.display_name || member.username || '#';
                                    
                                    return (
                                      <div key={idx} className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 border border-gray-800 flex-shrink-0">
                                        {member.profile_image ? (
                                          <img 
                                            src={member.profile_image} 
                                            alt={displayName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.target.style.display = 'none';
                                              e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400 text-xl">👤</div>`;
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                                            👤
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                ) : (
                                  <>
                                    <div className="w-16 h-16 rounded-full bg-gray-700 border border-gray-800 flex items-center justify-center text-gray-400 text-xl">👤</div>
                                    <div className="w-16 h-16 rounded-full bg-gray-700 border border-gray-800 flex items-center justify-center text-gray-400 text-xl">👤</div>
                                  </>
                                )}
                              </div>
                              <div>
                                <span className="text-white font-medium">{match.teams[0].team?.name || `팀 1`}</span>
                              </div>
                              
                              {/* 승리팀 표시 (완료된 경기이고 이 팀이 승리한 경우) */}
                              {match.status === 'completed' && match.winner_team_id === match.teams[0].team?.id && (
                                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-gray-800">
                                  WIN
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* 공백 구분자 */}
                          <div className="mx-4"></div>
                          
                          {/* 팀 2 */}
                          <div className="flex-1 relative">
                            <div className="flex items-center">
                              <div className="flex -space-x-2 mr-2">
                                {/* 팀 멤버 이미지 표시 */}
                                {match.teams[1].members && match.teams[1].members.length > 0 ? (
                                  match.teams[1].members.slice(0, 2).map((member, idx) => {
                                    // 이름 가져오기 (display_name 또는 username 사용)
                                    const displayName = member.display_name || member.username || '#';
                                    
                                    return (
                                      <div key={idx} className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 border border-gray-800 flex-shrink-0">
                                        {member.profile_image ? (
                                          <img 
                                            src={member.profile_image} 
                                            alt={displayName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.target.style.display = 'none';
                                              e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400 text-xl">👤</div>`;
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                                            👤
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                ) : (
                                  <>
                                    <div className="w-16 h-16 rounded-full bg-gray-700 border border-gray-800 flex items-center justify-center text-gray-400 text-xl">👤</div>
                                    <div className="w-16 h-16 rounded-full bg-gray-700 border border-gray-800 flex items-center justify-center text-gray-400 text-xl">👤</div>
                                  </>
                                )}
                              </div>
                              <div>
                                <span className="text-white font-medium">{match.teams[1].team?.name || `팀 2`}</span>
                              </div>
                              
                              {/* 승리팀 표시 (완료된 경기이고 이 팀이 승리한 경우) */}
                              {match.status === 'completed' && match.winner_team_id === match.teams[1].team?.id && (
                                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-gray-800">
                                  WIN
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
