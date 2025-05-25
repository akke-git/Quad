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
  const [teams, setTeams] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'user', 'team'
  
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
  
  // 팀 목록 불러오기
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/golf/teams');
        if (response.ok) {
          const data = await response.json();
          console.log('팀 API 응답:', data);
          
          // API 응답 처리
          let processedTeamsData = [];
          if (data && Array.isArray(data)) {
            // 응답 자체가 배열인 경우
            processedTeamsData = data;
          } else if (data && typeof data === 'object') {
            if (data.data && Array.isArray(data.data)) {
              // data 필드에 배열이 있는 경우
              processedTeamsData = data.data;
            } else if (data.teams && Array.isArray(data.teams)) {
              // teams 필드에 배열이 있는 경우
              processedTeamsData = data.teams;
            } else {
              // 객체를 배열로 변환 시도
              processedTeamsData = Object.values(data).filter(item => 
                item && typeof item === 'object'
              );
            }
          }
          
          // 팀 데이터 구조 변환 (필드명 매핑)
          const formattedTeams = processedTeamsData.map(team => ({
            id: team.team_id || team.id,
            name: team.team_name || team.name,
            members: [
              {
                id: team.user1_id,
                name: team.user1_display_name || team.user1_username
              },
              {
                id: team.user2_id,
                name: team.user2_display_name || team.user2_username
              }
            ].filter(member => member.id) // id가 있는 멤버만 포함
          }));
          
          console.log('처리된 팀 데이터:', formattedTeams);
          setTeams(formattedTeams);
        } else {
          console.error('팀 목록을 불러오는 중 오류가 발생했습니다.');
          setTeams([]);
        }
      } catch (error) {
        console.error('팀 목록을 불러오는 중 오류가 발생했습니다:', error);
        setTeams([]);
      }
    };
    
    fetchTeams();
  }, []);
  
  // URL 쿼리 파라미터 처리
  useEffect(() => {
    // 필터 타입 처리
    if (router.query.filter) {
      setFilterType(router.query.filter);
    }
    
    // 사용자 ID 처리
    if (router.query.user && users.length > 0) {
      const userId = router.query.user;
      const user = users.find(u => u.id === userId);
      if (user) {
        setSelectedUser(user);
        setFilterType('user');
      }
    }
    
    // 팀 ID 처리
    if (router.query.team && teams.length > 0) {
      const teamId = router.query.team;
      const team = teams.find(t => t.id === teamId);
      if (team) {
        setSelectedTeam(team);
        setFilterType('team');
      }
    }
  }, [router.query, users, teams]);
  
  // 팀 매치 목록 불러오기
  useEffect(() => {
    const fetchTeamMatches = async () => {
      setLoading(true);
      try {
        let url = '/api/golf/team-matches';
        
        // 필터 타입에 따라 URL 변경
        if (filterType === 'user' && selectedUser) {
          url = `/api/golf/users/${selectedUser.id}/team-matches`;
        }
        // 팀 필터링은 클라이언트 측에서 처리
        
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
          
          // 팀 필터링 처리
          let filteredData = formattedData;
          if (filterType === 'team' && selectedTeam) {
            console.log('필터링 시작 - 선택된 팀:', selectedTeam);
            const selectedTeamId = String(selectedTeam.id);
            
            filteredData = formattedData.filter(match => {
              // 1. 팀 객체 안에 있는 ID로 확인
              if (match.teams && match.teams.length > 0) {
                for (const teamEntry of match.teams) {
                  // 팀 ID 추출 및 문자열로 변환
                  const teamId = teamEntry.team ? String(teamEntry.team.id) : String(teamEntry.id);
                  if (teamId === selectedTeamId) {
                    console.log('매치 ID:', match.id, '팀 ID 일치:', teamId);
                    return true;
                  }
                }
              }
              
              // 2. team1_id, team2_id로 확인
              if (match.team1_id && String(match.team1_id) === selectedTeamId) {
                console.log('매치 ID:', match.id, 'team1_id 일치:', match.team1_id);
                return true;
              }
              
              if (match.team2_id && String(match.team2_id) === selectedTeamId) {
                console.log('매치 ID:', match.id, 'team2_id 일치:', match.team2_id);
                return true;
              }
              
              return false;
            });
            
            console.log('필터링 결과:', filteredData.length, '개의 매치 발견');
          }
          
          setTeamMatches(filteredData);
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
  }, [filterType, selectedUser, selectedTeam]);
  
  // 필터 선택 핸들러 (사용자 또는 팀)
  const handleFilterChange = (e) => {
    const value = e.target.value;
    
    // "all"을 선택한 경우
    if (value === 'all') {
      setFilterType('all');
      setSelectedUser(null);
      setSelectedTeam(null);
      router.push('/golf/team-matches', undefined, { shallow: true });
      return;
    }
    
    // 사용자 선택인 경우 (user_{id} 형태)
    if (value.startsWith('user_')) {
      const userId = value.replace('user_', '');
      const user = users.find(u => u.id === userId);
      if (user) {
        setFilterType('user');
        setSelectedUser(user);
        setSelectedTeam(null);
        router.push(`/golf/team-matches?filter=user&user=${userId}`, undefined, { shallow: true });
      }
      return;
    }
    
    // 팀 선택인 경우 (team_{id} 형태)
    if (value.startsWith('team_')) {
      const teamId = value.replace('team_', '');
      console.log('팀 선택:', teamId);
      
      // ID가 문자열이나 숫자일 수 있으므로 두 경우 모두 확인
      const team = teams.find(t => String(t.id) === String(teamId));
      console.log('찾은 팀:', team);
      
      if (team) {
        setFilterType('team');
        setSelectedTeam(team);
        setSelectedUser(null);
        router.push(`/golf/team-matches?filter=team&team=${teamId}`, undefined, { shallow: true });
        
        // 디버깅용 - 팀 선택 후 즉시 필터링 적용
        setTimeout(() => {
          console.log('현재 필터 상태:', { filterType: 'team', selectedTeam: team });
        }, 100);
      }
      return;
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
        {/* 반응형 레이아웃 - md 사이즈 이상에서는 한 줄에 나열, 모바일에서는 제목 아래로 버튼들 이동 */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <h1 className="text-4xl font-bold text-green-400 mb-4 md:mb-0 font-ubuntu-mono">Team Matches</h1>
          
          {/* 모바일에서는 오른쪽 정렬 */}
          <div className="flex justify-end space-x-4">
            {/* 필터 드롭다운 - All과 팀 리스트를 하나의 드롭다운에 표시 */}
            <div className="relative">
              <select
                value={
                  filterType === 'all' ? 'all' : 
                  filterType === 'user' && selectedUser ? `user_${selectedUser.id}` : 
                  filterType === 'team' && selectedTeam ? `team_${selectedTeam.id}` : 'all'
                }
                onChange={handleFilterChange}
                className="bg-gray-800 text-white border border-gray-700 rounded-md py-2 px-4 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 w-40"
              >
                <option value="all">All</option>
                
                {/* 팀 리스트 */}
                {teams.length > 0 && (
                  <>
                    <option disabled>──────────</option>
                    <optgroup label="Teams">
                      {teams.map(team => (
                        <option key={team.id} value={`team_${team.id}`}>{team.name}</option>
                      ))}
                    </optgroup>
                  </>
                )}
                
                {/* 사용자 리스트 */}
                {users.length > 0 && (
                  <>
                    <option disabled>──────────</option>
                    <optgroup label="Users">
                      {users.map(user => (
                        <option key={user.id} value={`user_${user.id}`}>{user.name}</option>
                      ))}
                    </optgroup>
                  </>
                )}
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
                New
              </button>
            </Link>
          </div>
        </div>
        
        {/* 팀 매치 목록 */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : teamMatches.length === 0 ? (
          <div className="text-center py-8 text-gray-300">
            <p>No team matches found.</p>
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
                          <div className={`flex-1 relative ${(() => {
  const team1Total = (typeof match.team1_wins === 'number' ? match.team1_wins : 0) + (match.handicap_team === 1 ? (match.handicap_amount || 0) : 0);
  const team2Total = (typeof match.team2_wins === 'number' ? match.team2_wins : 0) + (match.handicap_team === 2 ? (match.handicap_amount || 0) : 0);
  return team1Total > team2Total ? 'border-4 border-yellow-500 rounded-lg p-2' : '';
})()}`}>
                            <div className="flex md:flex-row flex-col items-center">
                              <div className="flex -space-x-2 md:mr-2 mb-2 md:mb-0">
                                {/* 팀 멤버 이미지 표시 */}
                                {match.teams[0].members && match.teams[0].members.length > 0 ? (
                                  match.teams[0].members.slice(0, 2).map((member, idx) => {
                                    // 이름 가져오기 (display_name 또는 username 사용)
                                    const displayName = member.display_name || member.username || '#';
                                    
                                    return (
                                      <div key={idx} className="w-14 h-14 rounded-full overflow-hidden bg-gray-700 border border-gray-800 flex-shrink-0">
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
                                    <div className="w-14 h-14 rounded-full bg-gray-700 border border-gray-800 flex items-center justify-center text-gray-400 text-xl">👤</div>
                                    <div className="w-14 h-14 rounded-full bg-gray-700 border border-gray-800 flex items-center justify-center text-gray-400 text-xl">👤</div>
                                  </>
                                )}
                              </div>
                              <div className="text-center md:text-left">
                                <div className="text-white font-medium flex items-center">{match.teams[0].team?.name || `팀 1`}{(() => {
  const team1Total = (typeof match.team1_wins === 'number' ? match.team1_wins : 0) + (match.handicap_team === 1 ? (match.handicap_amount || 0) : 0);
  const team2Total = (typeof match.team2_wins === 'number' ? match.team2_wins : 0) + (match.handicap_team === 2 ? (match.handicap_amount || 0) : 0);
  if (team1Total > team2Total) {
    return <span className="ml-2 text-yellow-400 font-bold flex items-center">🏆</span>;
  }
  return null;
})()}</div>
                              </div>
                              
                              {/* 승리팀 표시 (이 팀이 승리한 경우) */}
                              
                            </div>
                          </div>
                          
                          {/* 공백 구분자 */}
                          <div className="mx-4"></div>
                          
                          {/* 팀 2 */}
                          <div className={`flex-1 relative ${(() => {
  const team1Total = (typeof match.team1_wins === 'number' ? match.team1_wins : 0) + (match.handicap_team === 1 ? (match.handicap_amount || 0) : 0);
  const team2Total = (typeof match.team2_wins === 'number' ? match.team2_wins : 0) + (match.handicap_team === 2 ? (match.handicap_amount || 0) : 0);
  return team2Total > team1Total ? 'border-4 border-yellow-500 rounded-lg p-2' : '';
})()}`}>
                            <div className="flex md:flex-row flex-col items-center">
                              <div className="flex -space-x-2 md:mr-2 mb-2 md:mb-0">
                                {/* 팀 멤버 이미지 표시 */}
                                {match.teams[1].members && match.teams[1].members.length > 0 ? (
                                  match.teams[1].members.slice(0, 2).map((member, idx) => {
                                    // 이름 가져오기 (display_name 또는 username 사용)
                                    const displayName = member.display_name || member.username || '#';
                                    
                                    return (
                                      <div key={idx} className="w-14 h-14 rounded-full overflow-hidden bg-gray-700 border border-gray-800 flex-shrink-0">
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
                                    <div className="w-14 h-14 rounded-full bg-gray-700 border border-gray-800 flex items-center justify-center text-gray-400 text-xl">👤</div>
                                    <div className="w-14 h-14 rounded-full bg-gray-700 border border-gray-800 flex items-center justify-center text-gray-400 text-xl">👤</div>
                                  </>
                                )}
                              </div>
                              <div className="text-center md:text-left">
                                <div className="text-white font-medium flex items-center">{match.teams[1].team?.name || `팀 2`}{(() => {
  const team1Total = (typeof match.team1_wins === 'number' ? match.team1_wins : 0) + (match.handicap_team === 1 ? (match.handicap_amount || 0) : 0);
  const team2Total = (typeof match.team2_wins === 'number' ? match.team2_wins : 0) + (match.handicap_team === 2 ? (match.handicap_amount || 0) : 0);
  if (team2Total > team1Total) {
    return <span className="ml-2 text-yellow-400 font-bold flex items-center">🏆</span>;
  }
  return null;
})()}</div>
                              </div>
                              
                              {/* 승리팀 표시 (이 팀이 승리한 경우) */}
                              
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
