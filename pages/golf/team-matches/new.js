// pages/golf/team-matches/new.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
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

export default function NewTeamMatch() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState({
    team1: null,
    team2: null
  });
  
  // 홀별 업다운 상태 추가
  const [holeResults, setHoleResults] = useState(Array(18).fill(null).map((_, index) => ({
    hole_number: index + 1,
    winner_team: 0 // 0: A.S(All Square), 1: 1팀 UP, 2: 2팀 UP
  })));
  
  const [formData, setFormData] = useState({
    match_date: formatDate(new Date()),
    course_id: '',
    handicap_team: 1, // 기본값으로 1팀 선택
    handicap_amount: 0 // 핸디캡 수량
  });
  
  // 코스 및 팀 목록 불러오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 코스 목록 불러오기 - 제한 개수를 명시적으로 1200개로 지정
        const coursesResponse = await fetch('/api/golf/courses?limit=1200');
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          
          // API 응답 처리
          let processedCoursesData = [];
          if (coursesData && Array.isArray(coursesData.data)) {
            // data 필드에 배열이 있는 경우
            processedCoursesData = coursesData.data;
          } else if (coursesData && Array.isArray(coursesData)) {
            // 응답 자체가 배열인 경우
            processedCoursesData = coursesData;
          } else if (coursesData && typeof coursesData === 'object') {
            // 객체인 경우 처리
            if (coursesData.data && Array.isArray(coursesData.data)) {
              processedCoursesData = coursesData.data;
            } else {
              console.log('코스 데이터 구조:', coursesData);
              // 객체를 배열로 변환 시도
              processedCoursesData = Object.values(coursesData).filter(item => 
                item && typeof item === 'object' && 'id' in item && 'name' in item
              );
            }
          }
          
          console.log('처리된 코스 데이터:', processedCoursesData);
          
          setCourses(processedCoursesData);
          // 첫 번째 코스를 기본값으로 설정
          if (processedCoursesData.length > 0 && !formData.course_id) {
            setFormData(prev => ({ ...prev, course_id: processedCoursesData[0].id }));
          }
        } else {
          console.error('코스 목록을 불러오는 중 오류가 발생했습니다.');
          setCourses([]);
        }
        
        // 팀 목록 불러오기
        const teamsResponse = await fetch('/api/golf/teams');
        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          console.log('팀 API 응답:', teamsData);
          
          // API 응답 처리
          let processedTeamsData = [];
          if (teamsData && Array.isArray(teamsData)) {
            // 응답 자체가 배열인 경우
            processedTeamsData = teamsData;
          } else if (teamsData && typeof teamsData === 'object') {
            if (teamsData.data && Array.isArray(teamsData.data)) {
              // data 필드에 배열이 있는 경우
              processedTeamsData = teamsData.data;
            } else if (teamsData.teams && Array.isArray(teamsData.teams)) {
              // teams 필드에 배열이 있는 경우
              processedTeamsData = teamsData.teams;
            } else {
              // 객체를 배열로 변환 시도
              processedTeamsData = Object.values(teamsData).filter(item => 
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
            ]
          }));
          
          console.log('처리된 팀 데이터:', formattedTeams);
          setTeams(formattedTeams);
        } else {
          console.error('팀 목록을 불러오는 중 오류가 발생했습니다.');
          setTeams([]);
        }
      } catch (error) {
        console.error('데이터를 불러오는 중 오류가 발생했습니다:', error);
      }
    };
    
    fetchData();
  }, []);
  
  // 입력 필드 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'initial_handicap' || name === 'course_id' ? parseInt(value) : value
    }));
  };
  
  // 팀 변경 처리
  const handleTeamChange = (teamNumber, teamId) => {
    const teamKey = `team${teamNumber}`;
    
    // 팀 ID로 팀 객체 찾기
    const selectedTeam = teamId ? teams.find(team => team.id === parseInt(teamId) || team.id === teamId) : null;
    console.log(`선택한 팀 ${teamNumber}:`, selectedTeam);
    
    setSelectedTeams(prev => ({
      ...prev,
      [teamKey]: selectedTeam
    }));
  };
  
  // 홀 결과 변경 핸들러
  const handleHoleResultChange = (holeNumber, winnerTeam) => {
    setHoleResults(prev => {
      const newResults = [...prev];
      const index = holeNumber - 1;
      
      // 현재 선택된 값과 같은 값을 다시 클릭하면 A.S로 변경
      const currentWinner = newResults[index].winner_team;
      const newWinner = currentWinner === winnerTeam ? 0 : winnerTeam;
      
      newResults[index] = {
        ...newResults[index],
        winner_team: newWinner
      };
      return newResults;
    });
  };
  
  // 팀 매치 생성 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!formData.course_id) {
      alert('코스를 선택해주세요.');
      return;
    }
    
    // 팀 구성 검증
    if (!selectedTeams.team1 || !selectedTeams.team2) {
      alert('모든 팀을 선택해주세요.');
      return;
    }
    
    setLoading(true);
    
    try {
      // 팀 매치 생성 요청 데이터 준비
      // API가 기대하는 구조로 데이터 준비
      const requestData = {
        name: `${selectedTeams.team1.name} vs ${selectedTeams.team2.name}`,
        match_date: formData.match_date,
        course_id: parseInt(formData.course_id),
        initial_handicap: parseInt(formData.handicap_amount),
        handicap_team: parseInt(formData.handicap_team),
        team1_id: selectedTeams.team1.id,
        team2_id: selectedTeams.team2.id,
        // 홀 결과 데이터 추가 - 모든 홀 데이터 전송 (A.S도 포함)
        hole_results: holeResults
      };
      
      console.log('팀 매치 생성 요청 데이터:', requestData);
      
      // API 요청
      const response = await fetch('/api/golf/team-matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('팀 매치 생성 성공:', data);
        // 생성된 팀 매치 상세 페이지로 이동
        router.push(`/golf/team-matches/${data.id || data.team_match_id}`);
      } else {
        const errorText = await response.text();
        let errorMessage = '팀 매치 생성 중 오류가 발생하였습니다';
        
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.message || errorMessage;
        } catch (e) {
          console.error('응답 파싱 오류:', e);
        }
        
        console.error('팀 매치 생성 오류:', errorText);
        alert(errorMessage);
      }
    } catch (error) {
      console.error('팀 매치 생성 중 오류가 발생했습니다:', error);
      alert('팀 매치 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>새 팀 매치 | Quad</title>
      </Head>
      
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">New Match</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 매치 이름 필드 제거 */}
            
            {/* 기본 정보 - 한 줄에 날짜와 코스 선택 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 날짜 - 캘린더 UI 개선 */}
              <div>
                <label htmlFor="match_date" className="block text-sm font-medium text-gray-300 mb-1">
                  날짜 *
                </label>
                <input
                  type="date"
                  id="match_date"
                  name="match_date"
                  value={formData.match_date}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 calendar-dark"
                  required
                  placeholder="YYYY-MM-DD"
                  pattern="\d{4}-\d{2}-\d{2}"
                  onClick={(e) => {
                    // 모바일에서 캘린더 UI가 표시되도록 클릭 이벤트 처리
                    e.currentTarget.showPicker();
                  }}
                />
              </div>
              
              {/* 코스 선택 */}
              <div>
                <label htmlFor="course_id" className="block text-sm font-medium text-gray-300 mb-1">
                  코스 *
                </label>
                <select
                  id="course_id"
                  name="course_id"
                  value={formData.course_id}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">코스를 선택하세요</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.region})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* 팀 구성 - 더 조밀하게 */}
            <div className="pt-3 border-t border-gray-700">
              <h2 className="text-lg font-semibold mb-3">팀 구성</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1팀 */}
                <div className="bg-gray-800 p-3 rounded-md border border-gray-700">
                  <h3 className="text-base font-medium mb-2">1팀</h3>
                  
                  <div className="mb-2">
                    <select
                      value={selectedTeams.team1?.id || ''}
                      onChange={(e) => handleTeamChange(1, e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-1.5 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">팀을 선택하세요</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {selectedTeams.team1 && (
                    <div className="p-2 bg-gray-700 rounded-md text-xs">
                      <div className="flex flex-wrap gap-1">
                        {selectedTeams.team1.members?.map((member, idx) => (
                          <span key={idx} className="text-white">{member.name || '멤버 정보 없음'}{idx < selectedTeams.team1.members.length - 1 ? ', ' : ''}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 2팀 */}
                <div className="bg-gray-800 p-3 rounded-md border border-gray-700">
                  <h3 className="text-base font-medium mb-2">2팀</h3>
                  
                  <div className="mb-2">
                    <select
                      value={selectedTeams.team2?.id || ''}
                      onChange={(e) => handleTeamChange(2, e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-1.5 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">팀을 선택하세요</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {selectedTeams.team2 && (
                    <div className="p-2 bg-gray-700 rounded-md text-xs">
                      <div className="flex flex-wrap gap-1">
                        {selectedTeams.team2.members?.map((member, idx) => (
                          <span key={idx} className="text-white">{member.name || '멤버 정보 없음'}{idx < selectedTeams.team2.members.length - 1 ? ', ' : ''}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 초기 핸디캡 - 더 조밀하게 */}
            <div className="pt-3 border-t border-gray-700">
              <h2 className="text-lg font-semibold mb-2">초기 핸디캡</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 핸디캡 팀 선택 */}
                <div>
                  <label htmlFor="handicap_team" className="block text-sm font-medium text-gray-300 mb-1">
                    핸디캡 부여 팀
                  </label>
                  <select
                    id="handicap_team"
                    name="handicap_team"
                    value={formData.handicap_team}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md py-1.5 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value={1}>1팀</option>
                    <option value={2}>2팀</option>
                  </select>
                </div>
                
                {/* 핸디캡 수량 */}
                <div>
                  <label htmlFor="handicap_amount" className="block text-sm font-medium text-gray-300 mb-1">
                    핸디캡 UP 수
                  </label>
                  <input
                    type="number"
                    id="handicap_amount"
                    name="handicap_amount"
                    value={formData.handicap_amount}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full bg-gray-800 border border-gray-700 rounded-md py-1.5 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
            
            {/* 홀별 업다운 기록 */}
            <div className="pt-3 border-t border-gray-700">
              <h2 className="text-lg font-semibold mb-2">홀별 업다운 기록</h2>
              <p className="text-xs text-gray-400 mb-3">각 홀에서 업(UP)을 차지한 팀을 선택하세요. 기본값은 A.S(All Square)입니다.</p>
              
              <div className="bg-gray-800 p-3 rounded-md border border-gray-700 mb-4">
                <div className="grid grid-cols-12 gap-1 text-center text-sm font-medium mb-3 text-gray-300">
                  <div className="col-span-2">홀</div>
                  <div className="col-span-4">
                    {selectedTeams.team1 ? selectedTeams.team1.name : '1팀'}
                  </div>
                  <div className="col-span-2">A.S</div>
                  <div className="col-span-4">
                    {selectedTeams.team2 ? selectedTeams.team2.name : '2팀'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {holeResults.map((hole, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center text-center text-sm">
                      <div className="col-span-2 bg-gray-700 py-2 rounded font-medium">{hole.hole_number}</div>
                      <div className="col-span-4">
                        <button 
                          type="button"
                          onClick={() => handleHoleResultChange(hole.hole_number, 1)}
                          className={`w-full py-2 rounded ${hole.winner_team === 1 ? 'bg-green-600 font-medium' : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'}`}
                        >
                          {hole.winner_team === 1 ? 'UP' : ' '}
                        </button>
                      </div>
                      <div className="col-span-2">
                        <button 
                          type="button"
                          onClick={() => handleHoleResultChange(hole.hole_number, 0)}
                          className={`w-full py-2 rounded ${hole.winner_team === 0 ? 'bg-blue-600 font-medium' : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'}`}
                        >
                          A.S
                        </button>
                      </div>
                      <div className="col-span-4">
                        <button 
                          type="button"
                          onClick={() => handleHoleResultChange(hole.hole_number, 2)}
                          className={`w-full py-2 rounded ${hole.winner_team === 2 ? 'bg-green-600 font-medium' : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'}`}
                        >
                          {hole.winner_team === 2 ? 'UP' : ' '}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 제출 버튼 */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md mr-2 transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
