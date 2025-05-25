// pages/golf/team-matches/[id].js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';

// date-fns 대신 사용할 날짜 포맷 함수
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function TeamMatchDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
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
      } else {
        console.error('팀 매치 정보를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('팀 매치 정보 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    
    try {
      const response = await fetch(`/api/golf/team-matches/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        alert('팀 매치가 성공적으로 삭제되었습니다.');
        router.push('/golf/team-matches');
      } else {
        const error = await response.json();
        alert(`삭제 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
      }
    } catch (error) {
      console.error('팀 매치 삭제 오류:', error);
      alert('팀 매치 삭제 중 오류가 발생했습니다.');
    }
  };
  
  // 홀별 결과 렌더링 함수
  const renderHoleResults = () => {
    if (!match || !match.hole_results || match.hole_results.length === 0) {
      return <p className="text-gray-400 text-sm">홀별 결과가 없습니다.</p>;
    }
    
    // 홀 결과를 홀 번호 순으로 정렬
    const sortedResults = [...match.hole_results].sort((a, b) => a.hole_number - b.hole_number);
    
    return (
      <div className="grid grid-cols-1 gap-2 mt-2">
        {sortedResults.map((hole) => {
          let resultClass = "bg-gray-700"; // A.S(All Square)
          let resultText = "A.S";
          
          if (hole.winner_team === 1) {
            resultClass = "bg-blue-600";
            resultText = "1팀";
          } else if (hole.winner_team === 2) {
            resultClass = "bg-red-600";
            resultText = "2팀";
          }
          
          return (
            <div key={hole.hole_number} className="flex items-center justify-between p-2 border-b border-gray-700">
              <div className="text-sm text-gray-400">#{hole.hole_number}번 홀</div>
              <div className={`${resultClass} rounded-md py-1 px-3 text-sm font-medium`}>
                {resultText}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  // 팀 멤버 렌더링 함수
  const renderTeamMembers = (members) => {
    if (!members || members.length === 0) {
      return <p className="text-gray-400 text-sm">멤버 정보가 없습니다.</p>;
    }
    
    return (
      <div className="flex flex-col space-y-2">
        {members.map((member, idx) => {
          const displayName = member.display_name || member.username || '이름 없음';
          
          return (
            <div key={idx} className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 border border-gray-600">
                {member.profile_image ? (
                  <img 
                    src={member.profile_image} 
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400 text-sm">👤</div>`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    👤
                  </div>
                )}
              </div>
              <div>
                <p className="text-white text-sm">{displayName}</p>
                <p className="text-gray-400 text-xs">핸디캡: {member.handicap || 0}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>팀 매치 상세 | 골프 스코어 관리</title>
      </Head>
      
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-green-400">Team Match Details</h1>
          <div className="flex space-x-2">
            <Link href="/golf/team-matches" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm">
              List
            </Link>
            <Link href={`/golf/team-matches/${id}/edit`} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-sm">
              Edit
            </Link>
            <button 
              onClick={handleDelete}
              className={`px-4 py-2 ${deleteConfirm ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-700 hover:bg-gray-600'} rounded-md text-sm`}
            >
              {deleteConfirm ? 'Confirm Delete?' : 'Delete'}
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-400">로딩 중...</p>
          </div>
        ) : match ? (
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            {/* 매치 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-700 p-4 rounded-md">
                <h2 className="text-lg font-semibold mb-2">매치 정보</h2>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-400">날짜:</span> {formatDate(match.match_date)}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-400">코스:</span> {match.course?.name || '코스 정보 없음'}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-400">지역:</span> {match.course?.region || '지역 정보 없음'}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-400">상태:</span> {match.status === 'completed' ? '완료' : '진행 중'}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-400">핸디캡 팀:</span> {match.handicap_team === 1 ? '1팀' : '2팀'}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-400">핸디캡 수량:</span> {match.handicap_amount || 0}
                  </p>
                </div>
              </div>
              
              {/* 팀 1 정보 */}
              <div className={`bg-gray-700 p-4 rounded-md ${match.winner === match.teams[0].id ? 'border-4 border-yellow-500' : ''}`}>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold flex items-center">1팀: {match.teams[0].team?.name || '팀 정보 없음'}{(() => {
  const team1Total = (typeof match.team1_wins === 'number' ? match.team1_wins : 0) + (match.handicap_team === 1 ? (match.handicap_amount || 0) : 0);
  const team2Total = (typeof match.team2_wins === 'number' ? match.team2_wins : 0) + (match.handicap_team === 2 ? (match.handicap_amount || 0) : 0);
  if (team1Total > team2Total) {
    return <span className="ml-2 text-yellow-400 font-bold flex items-center">🏆 WIN</span>;
  }
  return null;
})()}</h2>
                  {match.winner === match.teams[0].id && (
                    <div className="bg-yellow-500 text-black font-bold rounded-full w-10 h-10 flex items-center justify-center">
                      🏆
                    </div>
                  )}
                </div>
                <p className="text-sm mb-2">
                  <span className="text-gray-400">승리 홀:</span> {match.team1_wins || 0}
                </p>
                <div className="mt-3">
                  <h3 className="text-sm font-medium mb-2 text-gray-400">멤버</h3>
                  {renderTeamMembers(match.team1_members)}
                </div>
              </div>
              
              {/* 팀 2 정보 */}
              <div className={`bg-gray-700 p-4 rounded-md ${match.winner === match.teams[1].id ? 'border-4 border-yellow-500' : ''}`}>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold flex items-center">2팀: {match.teams[1].team?.name || '팀 정보 없음'}{(() => {
  const team1Total = (typeof match.team1_wins === 'number' ? match.team1_wins : 0) + (match.handicap_team === 1 ? (match.handicap_amount || 0) : 0);
  const team2Total = (typeof match.team2_wins === 'number' ? match.team2_wins : 0) + (match.handicap_team === 2 ? (match.handicap_amount || 0) : 0);
  if (team2Total > team1Total) {
    return <span className="ml-2 text-yellow-400 font-bold flex items-center">🏆 WIN</span>;
  }
  return null;
})()}</h2>
                  {match.winner === match.teams[1].id && (
                    <div className="bg-yellow-500 text-black font-bold rounded-full w-10 h-10 flex items-center justify-center">
                      🏆
                    </div>
                  )}
                </div>
                <p className="text-sm mb-2">
                  <span className="text-gray-400">승리 홀:</span> {match.team2_wins || 0}
                </p>
                <div className="mt-3">
                  <h3 className="text-sm font-medium mb-2 text-gray-400">멤버</h3>
                  {renderTeamMembers(match.team2_members)}
                </div>
              </div>
            </div>
            
            {/* 홀별 결과 */}
            <div className="bg-gray-700 p-4 rounded-md mt-6">
              <h2 className="text-lg font-semibold mb-3">홀별 결과</h2>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm">
                  <span className="text-gray-400">A.S(무승부):</span> {match.all_square || 0}홀
                </p>
                <div className="flex space-x-4">
                  <p className="text-sm">
                    <span className="text-blue-400">1팀 승리:</span> {match.team1_wins || 0}홀
                  </p>
                  <p className="text-sm">
                    <span className="text-red-400">2팀 승리:</span> {match.team2_wins || 0}홀
                  </p>
                </div>
              </div>
              {renderHoleResults()}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <p className="text-center text-gray-400">Team match information not found.</p>
          </div>
        )}
      </div>
    </div>
  );
}