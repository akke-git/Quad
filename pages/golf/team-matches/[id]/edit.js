// pages/golf/team-matches/[id]/edit.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../../../components/Navbar';

// date-fns 대신 사용할 날짜 포맷 함수
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function EditTeamMatch() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [match, setMatch] = useState(null);
  
  // 홀별 업다운 상태
  const [holeResults, setHoleResults] = useState([]);
  
  const [formData, setFormData] = useState({
    handicap_team: 1,
    handicap_amount: 0
  });
  
  useEffect(() => {
    if (id) {
      fetchMatchData();
    }
  }, [id]);
  
  const fetchMatchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/golf/team-matches/${id}`);
      if (response.ok) {
        const data = await response.json();
        setMatch(data);
        
        // 폼 데이터 초기화
        setFormData({
          handicap_team: data.handicap_team || 1,
          handicap_amount: data.handicap_amount || 0
        });
        
        // 홀별 결과 초기화
        if (data.hole_results && data.hole_results.length > 0) {
          // 홀 번호 순으로 정렬
          const sortedResults = [...data.hole_results].sort((a, b) => a.hole_number - b.hole_number);
          setHoleResults(sortedResults);
        } else {
          // 기본 18홀 데이터 생성
          setHoleResults(Array(18).fill(null).map((_, index) => ({
            hole_number: index + 1,
            winner_team: 0 // 0: A.S(All Square)
          })));
        }
      } else {
        console.error('팀 매치 정보를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('팀 매치 정보 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleHoleResultChange = (holeNumber, winnerTeam) => {
    setHoleResults(prev => {
      return prev.map(hole => {
        if (hole.hole_number === holeNumber) {
          return { ...hole, winner_team: parseInt(winnerTeam) };
        }
        return hole;
      });
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!match) return;
    
    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/golf/team-matches/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          hole_results: holeResults
        }),
      });
      
      if (response.ok) {
        alert('팀 매치가 성공적으로 업데이트되었습니다.');
        router.push(`/golf/team-matches/${id}`);
      } else {
        const error = await response.json();
        alert(`업데이트 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
      }
    } catch (error) {
      console.error('팀 매치 업데이트 오류:', error);
      alert('팀 매치 업데이트 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Edit Team Match | Quad</title>
      </Head>
      
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-green-400">Edit Team Match</h1>
          <div className="flex space-x-2">
            <Link href={`/golf/team-matches/${id}`} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm">
              Cancel
            </Link>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-400">로딩 중...</p>
          </div>
        ) : match ? (
          <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6 shadow-lg">
            {/* 기본 정보 (수정 불가) */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">기본 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 날짜 (수정 불가) */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">날짜</label>
                  <input
                    type="date"
                    value={formatDate(match.match_date)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 cursor-not-allowed opacity-70"
                    disabled
                  />
                </div>
                
                {/* 코스 (수정 불가) */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">코스</label>
                  <input
                    type="text"
                    value={match.course?.name || '코스 정보 없음'}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 cursor-not-allowed opacity-70"
                    disabled
                  />
                </div>
              </div>
            </div>
            
            {/* 팀 구성 (수정 불가) */}
            <div className="mb-6 pt-3 border-t border-gray-700">
              <h2 className="text-lg font-semibold mb-3">팀 구성</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1팀 (수정 불가) */}
                <div className="bg-gray-800 p-3 rounded-md border border-gray-700">
                  <h3 className="text-base font-medium mb-2">1팀: {match.teams[0].team?.name || '팀 정보 없음'}</h3>
                  
                  <div className="p-2 bg-gray-700 rounded-md text-xs">
                    <div className="flex flex-wrap gap-1">
                      {match.team1_members?.map((member, idx) => {
                        const displayName = member.display_name || member.username || '이름 없음';
                        return (
                          <span key={idx} className="text-white">{displayName}{idx < match.team1_members.length - 1 ? ', ' : ''}</span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* 2팀 (수정 불가) */}
                <div className="bg-gray-800 p-3 rounded-md border border-gray-700">
                  <h3 className="text-base font-medium mb-2">2팀: {match.teams[1].team?.name || '팀 정보 없음'}</h3>
                  
                  <div className="p-2 bg-gray-700 rounded-md text-xs">
                    <div className="flex flex-wrap gap-1">
                      {match.team2_members?.map((member, idx) => {
                        const displayName = member.display_name || member.username || '이름 없음';
                        return (
                          <span key={idx} className="text-white">{displayName}{idx < match.team2_members.length - 1 ? ', ' : ''}</span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 핸디캡 설정 */}
            <div className="mb-6 pt-3 border-t border-gray-700">
              <h2 className="text-lg font-semibold mb-3">핸디캡 설정</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 핸디캡 팀 */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">핸디캡 팀</label>
                  <select
                    name="handicap_team"
                    value={formData.handicap_team}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value={1}>1팀: {match.teams[0].team?.name || '팀 1'}</option>
                    <option value={2}>2팀: {match.teams[1].team?.name || '팀 2'}</option>
                  </select>
                </div>
                
                {/* 핸디캡 수량 */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">핸디캡 수량</label>
                  <input
                    type="number"
                    name="handicap_amount"
                    value={formData.handicap_amount}
                    onChange={handleInputChange}
                    min="0"
                    max="18"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
            
            {/* 홀별 결과 */}
            <div className="mb-6 pt-3 border-t border-gray-700">
              <h2 className="text-lg font-semibold mb-3">홀별 결과</h2>
              <p className="text-xs text-gray-400 mb-3">각 홀에서 업(UP)을 차지한 팀을 선택하세요. 기본값은 A.S(All Square)입니다.</p>
              
              <div className="bg-gray-800 p-3 rounded-md border border-gray-700 mb-4">
                <div className="grid grid-cols-12 gap-1 text-center text-sm font-medium mb-3 text-gray-300">
                  <div className="col-span-2">홀</div>
                  <div className="col-span-4">
                    {match.teams[0].team?.name || '1팀'}
                  </div>
                  <div className="col-span-2">A.S</div>
                  <div className="col-span-4">
                    {match.teams[1].team?.name || '2팀'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {holeResults.map((hole, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center text-center text-sm">
                      <div className="col-span-2 bg-gray-700 py-2 rounded font-medium">#{hole.hole_number}</div>
                      <div className="col-span-4">
                        <button 
                          type="button"
                          onClick={() => handleHoleResultChange(hole.hole_number, match.teams[0].id)}
                          className={`w-full py-2 rounded ${hole.winner_team === match.teams[0].id ? 'bg-green-600 font-medium' : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'}`}
                        >
                          {hole.winner_team === match.teams[0].id ? 'UP' : ' '}
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
                          onClick={() => handleHoleResultChange(hole.hole_number, match.teams[1].id)}
                          className={`w-full py-2 rounded ${hole.winner_team === match.teams[1].id ? 'bg-green-600 font-medium' : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'}`}
                        >
                          {hole.winner_team === match.teams[1].id ? 'UP' : ' '}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 제출 버튼 */}
            <div className="flex justify-end pt-4 border-t border-gray-700">
              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-2 ${submitting ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-500'} rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-green-500`}
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <p className="text-center text-gray-400">Team match information not found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
