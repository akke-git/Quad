// pages/golf/index.js

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import Navbar from '../../components/Navbar';

// 날짜 포맷 함수
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function GolfHome() {
  const [rounds, setRounds] = useState([]);
  const [teamMatches, setTeamMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 라운드 기록과 팀 매치 기록 가져오기
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 라운드 데이터 가져오기 (3개)
        const roundsResponse = await fetch('/api/golf/rounds?limit=3');
        if (!roundsResponse.ok) {
          throw new Error('라운드 기록을 가져오는데 실패했습니다');
        }
        const roundsData = await roundsResponse.json();
        const roundsList = roundsData.data || [];
        
        // 라운드 데이터 구조 확인
        console.log('라운드 데이터 전체:', roundsList);
        
        // 사용자 정보 가져오기
        let usersMap = {};
        try {
          const usersResponse = await fetch('/api/golf/users');
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            console.log('사용자 데이터:', usersData);
            
            // 사용자 데이터 구조 확인
            const usersList = Array.isArray(usersData) ? usersData : 
                            (usersData.data ? usersData.data : 
                            (usersData.users ? usersData.users : []));
            
            // 사용자 ID를 키로 하는 맵 생성
            usersList.forEach(user => {
              if (user && user.id) {
                usersMap[user.id] = user;
              }
            });
            
            console.log('사용자 맵:', usersMap);
          }
        } catch (err) {
          console.error('사용자 정보 가져오기 오류:', err);
        }
        
        // 라운드 데이터 가공
        const processedRounds = roundsList.map(round => {
          // 사용자 정보 추출
          let userName = '';
          
          // 사용자 맵에서 사용자 정보 가져오기
          if (round.user_id && usersMap[round.user_id]) {
            const user = usersMap[round.user_id];
            userName = user.display_name || user.name || user.username;
            console.log(`사용자 맵에서 찾음 - ID: ${round.user_id}, 이름: ${userName}`);
          }
          // users 객체에서 display_name 가져오기
          else if (round.users && round.users.display_name) {
            userName = round.users.display_name;
          }
          // user 객체에서 display_name 가져오기
          else if (round.user && round.user.display_name) {
            userName = round.user.display_name;
          }
          // 다른 가능한 필드에서 사용자 이름 가져오기
          else {
            userName = round.user_display_name || 
                     (round.user && (round.user.name || round.user.username)) || 
                     round.display_name || 
                     round.username || 
                     round.user_name || 
                     '';
          }
          
          console.log(`라운드 ${round.id} 사용자 정보:`, { 
            user_id: round.user_id,
            users: round.users, 
            user: round.user, 
            extracted: userName 
          });
          
          return {
            ...round,
            extracted_user_name: userName || '사용자 정보 없음'
          };
        });
        
        setRounds(processedRounds);

        // 팀 매치 기록 가져오기 (3개)
        const teamMatchesResponse = await fetch('/api/golf/team-matches?limit=3');
        if (!teamMatchesResponse.ok) {
          throw new Error('팀 매치 기록을 가져오는데 실패했습니다');
        }
        const teamMatchesData = await teamMatchesResponse.json();
        const teamMatchesList = teamMatchesData || [];
        
        // 팀 매치 데이터 구조 확인
        console.log('팀 매치 데이터:', teamMatchesList);
        
        // 팀 매치 데이터 가공
        const processedTeamMatches = teamMatchesList.map(match => {
          // 코스 정보 추출
          let courseName = '';
          
          // 코스 정보가 course 객체에 있는 경우
          if (match.course) {
            courseName = match.course.name || '';
          }
          
          // 코스 정보가 타 필드에 있는 경우
          if (!courseName) {
            courseName = match.course_name || '';
          }
          
          return {
            ...match,
            extracted_course_name: courseName || '코스 정보 없음'
          };
        });
        
        setTeamMatches(processedTeamMatches);

        setError(null);
      } catch (err) {
        console.error('데이터 가져오기 오류:', err);
        setError(err.message || '데이터를 가져오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Golf Score | Sveltt</title>
        <meta name="description" content="Sveltt" />
      </Head>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* 골프 이미지 섹션 */}
        <div className="relative h-80 w-full mb-12 rounded-xl overflow-hidden shadow-lg border border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/10 z-10"></div>
          <div className="relative z-20 h-full flex items-start justify-start text-white p-6">
            <div className="absolute bottom-6 left-6">
              <h2 className="text-xl font-bold mb-1 font-ubuntu-mono">Personal Score / Team match</h2>
              <p className="text-sm max-w-md">
                gogogo
              </p>
            </div>
          </div>
          {/* 배경 이미지 - 실제 이미지 경로로 변경 필요 */}
          <div className="absolute inset-0 z-0">
            <Image
              // src="/images/golf_logo.webp"
              src="/images/tiger.jpg"
              alt="골프 코스"
              layout="fill"
              objectFit="cover"
              priority
            />
          </div>
        </div>

        {/* 최근 라운드 기록 섹션 */}
        <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8 border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-green-400 font-ubuntu-mono">Rounds</h2>
            <Link href="/golf/rounds">
              <button className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-1 px-3 rounded-md transition-colors duration-300 text-sm border border-gray-700">
                more
              </button>
            </Link>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">
              <p>{error}</p>
            </div>
          ) : rounds.length === 0 ? (
            <div className="text-gray-300 text-center py-8">
              <p>기록이 없습니다</p>
              <Link href="/golf/rounds/new">
                <button className="mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300">
                  새 라운드 기록하기
                </button>
              </Link>
            </div>
          ) : (
            <div>
              {rounds.map((round, index) => (
                <Link key={round.id} href={`/golf/rounds/${round.id}`}>
                  <div className={`bg-gray-800 hover:bg-gray-700 p-4 transition-colors duration-200 cursor-pointer border-t border-b border-gray-700 ${index === 0 ? 'border-t-2' : ''}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {round.course_name || '코스 정보 없음'}
                        </h3>
                        <p className="text-gray-300 text-sm">
                          {round.extracted_user_name} | 
                          {round.play_date ? formatDate(round.play_date) : '날짜 정보 없음'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-400">{round.total_score || '-'}</p>
                        <p className="text-sm text-gray-400">score</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 팀 매치 기록 섹션 */}
        <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8 border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-green-400 font-ubuntu-mono">Team Matches</h2>
            <Link href="/golf/team-matches">
              <button className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-1 px-3 rounded-md transition-colors duration-300 text-sm border border-gray-700">
                more
              </button>
            </Link>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">
              <p>{error}</p>
            </div>
          ) : teamMatches.length === 0 ? (
            <div className="text-gray-300 text-center py-8">
              <p>팀 매치 기록이 없습니다</p>
              <Link href="/golf/team-matches/new">
                <button className="mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300">
                  새 팀 매치 만들기
                </button>
              </Link>
            </div>
          ) : (
            <div>
              {teamMatches.map((match, index) => (
                <Link key={match.id} href={`/golf/team-matches/${match.id}`}>
                  <div className={`bg-gray-800 hover:bg-gray-700 p-4 transition-colors duration-200 cursor-pointer border-t border-b border-gray-700 ${index === 0 ? 'border-t-2' : ''}`}>
                    <div className="flex items-center">
                      {/* 왼쪽: 코스 정보 및 날짜 */}
                      <div className="w-1/3 pr-4 border-r border-gray-600">
                        <h3 className="text-lg font-semibold text-white">
                          {match.extracted_course_name || match.course?.name || match.course_name || '코스 정보 없음'}
                        </h3>
                        <p className="text-gray-300 text-sm">
                          {match.match_date ? formatDate(match.match_date) : '날짜 정보 없음'}
                        </p>
                      </div>
                      
                      {/* 오른쪽: 팀 정보 */}
                      <div className="w-2/3 pl-4 flex items-center justify-between">
                        {match.teams && match.teams.length >= 2 ? (
                          <>
                            {/* 팀 1 */}
                            <div className="flex-1 flex items-center justify-center">
                              {/* 1팀 승리 표시 - 왼쪽에 표시 */}
                              {match.winner && match.teams[0].team && match.winner === match.teams[0].team.id ? (
                                <div className="flex items-center">
                                  <span className="bg-yellow-500 text-black font-bold rounded-full w-5 h-5 inline-flex items-center justify-center shadow-md">
                                    🏆
                                  </span>
                                  <span className="w-3"></span> {/* 고정 간격 */}
                                  <div className="text-white font-medium">{match.teams[0].team?.name || '팀 1'}</div>
                                </div>
                              ) : (
                                <div className="text-white font-medium">{match.teams[0].team?.name || '팀 1'}</div>
                              )}
                            </div>
                            
                            {/* VS */}
                            <div className="mx-2 text-gray-400">VS</div>
                            
                            {/* 팀 2 */}
                            <div className="flex-1 flex items-center justify-center">
                              {/* 2팀 승리 표시 - 오른쪽에 표시 */}
                              {match.winner && match.teams[1].team && match.winner === match.teams[1].team.id ? (
                                <div className="flex items-center">
                                  <div className="text-white font-medium">{match.teams[1].team?.name || '팀 2'}</div>
                                  <span className="w-3"></span> {/* 고정 간격 */}
                                  <span className="bg-yellow-500 text-black font-bold rounded-full w-5 h-5 inline-flex items-center justify-center shadow-md">
                                    🏆
                                  </span>
                                </div>
                              ) : (
                                <div className="text-white font-medium">{match.teams[1].team?.name || '팀 2'}</div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-400 w-full text-center">팀 정보 없음</div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>


    </div>
  );
}