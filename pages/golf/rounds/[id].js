// pages/golf/rounds/[id].js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../../../components/Navbar';

export default function RoundDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [round, setRound] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedScores, setEditedScores] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 라운드 데이터 가져오기
  useEffect(() => {
    if (!id) return;
    
    const fetchRoundData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/golf/rounds/${id}`);
        
        if (!response.ok) {
          throw new Error('라운드 데이터를 가져오는데 실패했습니다');
        }
        
        const data = await response.json();
        setRound(data.data);
        
        // 수정을 위한 스코어 데이터 초기화
        if (data.data && data.data.scores) {
          setEditedScores(data.data.scores.map(score => ({ ...score })));
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching round data:', err);
        setError(err.message || '라운드 데이터를 가져오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoundData();
  }, [id]);
  
  // 홀 스코어 수정 핸들러
  const handleScoreChange = (holeNumber, field, value) => {
    setEditedScores(prev => 
      prev.map(score => {
        if (score.hole_number === holeNumber) {
          const updatedScore = { ...score };
          
          // 파 값이 변경되면 타수 기본값도 자동으로 업데이트
          if (field === 'par') {
            const parValue = parseInt(value, 10);
            updatedScore.par = parValue;
            
            // 타수가 설정되지 않았거나 수정 중이면 파 값으로 초기화
            if (!updatedScore.score) {
              updatedScore.score = parValue;
            }
          } else {
            // 다른 필드 처리
            if (field === 'score') {
              updatedScore[field] = parseInt(value, 10);
            } else {
              updatedScore[field] = value === '' ? null : parseInt(value, 10);
            }
          }
          
          return updatedScore;
        }
        return score;
      })
    );
  };
  
  // 수정 모드 토글
  const toggleEditMode = () => {
    if (isEditing) {
      // 수정 모드 종료 시 원래 데이터로 복원
      setEditedScores(round.scores.map(score => ({ ...score })));
    } else {
      // 수정 모드 시작 시 모든 홀에 대한 데이터 생성
      const existingScores = round.scores || [];
      const newScores = [];
      
      // 1~18홀까지 데이터 준비
      for (let i = 1; i <= 18; i++) {
        const existingScore = existingScores.find(s => s.hole_number === i);
        
        if (existingScore) {
          // 기존 데이터가 있는 경우
          newScores.push({ ...existingScore });
        } else {
          // 새로운 홀 데이터 생성
          const defaultPar = i % 3 === 0 ? 3 : (i % 3 === 1 ? 4 : 5); // 기본 파값 배정 (3, 4, 5 반복)
          newScores.push({
            hole_number: i,
            round_id: round.id,
            par: defaultPar,
            score: defaultPar,
            putts: 2,
            penalty_strokes: 0,
            fairway_hit: null,
            green_in_regulation: null,
            sand_save: null
          });
        }
      }
      
      setEditedScores(newScores);
    }
    setIsEditing(!isEditing);
  };
  
  // 수정사항 저장
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/golf/rounds/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...round,
          scores: editedScores
        }),
      });
      
      if (!response.ok) {
        throw new Error('라운드 데이터 저장에 실패했습니다');
      }
      
      const data = await response.json();
      setRound(data.data);
      setIsEditing(false);
      alert('라운드 데이터가 성공적으로 저장되었습니다!');
    } catch (err) {
      console.error('Error saving round data:', err);
      alert(`라운드 데이터 저장 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // 라운드 삭제
  const handleDelete = async () => {
    if (!window.confirm('정말로 이 라운드 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/golf/rounds/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('라운드 삭제에 실패했습니다');
      }
      
      alert('라운드가 성공적으로 삭제되었습니다!');
      router.push('/golf/rounds');
    } catch (err) {
      console.error('Error deleting round:', err);
      alert(`라운드 삭제 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // 파 대비 스코어 계산 (색상 표시용)
  const getScoreClass = (par, score) => {
    // 파 값이 없으면 기본값 4로 설정
    const parValue = par || 4;
    if (!score) return 'text-white';
    
    const diff = score - parValue;
    if (diff < 0) return 'text-red-400'; // 언더파
    if (diff === 0) return 'text-white'; // 파
    return 'text-blue-400'; // 오버파
  };
  
  // 파 대비 스코어 텍스트 표시
  const getScoreText = (par, score) => {
    // 파 값이 없으면 기본값 4로 설정
    const parValue = par || 4;
    if (!score) return '';
    
    const diff = score - parValue;
    if (diff <= -3) return 'Albatross';
    if (diff === -2) return 'Eagle';
    if (diff === -1) return 'Birdie';
    if (diff === 0) return 'Par';
    if (diff === 1) return 'Bogey';
    if (diff === 2) return 'Double Bogey';
    if (diff === 3) return 'Triple Bogey';
    if (diff > 3) return `+${diff}`;
    return '';
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>라운드 상세 | Sveltt Golf</title>
        <meta name="description" content="Golf round details" />
      </Head>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/golf/rounds" className="text-green-400 hover:text-green-300 mb-4 inline-block font-ubuntu-mono">
            &larr; 라운드 목록으로
          </Link>
          
          <h1 className="text-3xl font-bold text-green-400 mt-4 mb-6 font-ubuntu-mono">
            라운드 상세 정보
          </h1>
        </div>

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-300 font-ubuntu-mono">라운드 정보를 불러오는 중...</p>
          </div>
        )}
        
        {/* 에러 메시지 */}
        {error && !isLoading && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        
        {/* 라운드 정보 */}
        {round && !isLoading && !error && (
          <div className="space-y-8">
            {/* 라운드 요약 정보 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <h4 className="text-sm text-gray-400 font-ubuntu-mono">날짜</h4>
                  <p className="text-white font-medium">
                    {new Date(round.play_date).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400 font-ubuntu-mono">코스명</h4>
                  <p className="text-white font-medium">{round.course_name}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400 font-ubuntu-mono">지역</h4>
                  <p className="text-white font-medium">{round.course_location}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400 font-ubuntu-mono">합산 타수</h4>
                  <p className="text-green-400 font-medium text-xl">{round.total_score}</p>
                </div>
              </div>
              
              {/* 추가 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <h4 className="text-sm text-gray-400 font-ubuntu-mono">날씨</h4>
                  <p className="text-white">{round.weather || '정보 없음'}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400 font-ubuntu-mono">메모</h4>
                  <p className="text-white">{round.notes || '메모 없음'}</p>
                </div>
              </div>
            </div>
            
            {/* 홀별 스코어 테이블 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-green-400 font-ubuntu-mono">홀별 스코어</h2>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={toggleEditMode}
                    disabled={isSaving || isDeleting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-ubuntu-mono"
                  >
                    {isEditing ? '취소' : '수정'}
                  </button>
                  
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-ubuntu-mono"
                    >
                      {isSaving ? '저장 중...' : '저장'}
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isEditing || isSaving || isDeleting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-ubuntu-mono"
                  >
                    {isDeleting ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-900 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-800 text-gray-300 text-sm">
                      <th className="py-3 px-4 text-left">홀</th>
                      <th className="py-3 px-4 text-center">파</th>
                      <th className="py-3 px-4 text-center">타수</th>
                      <th className="py-3 px-4 text-center">결과</th>
                      <th className="py-3 px-4 text-center">퍼팅</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 18 }, (_, i) => i + 1).map(holeNumber => {
                      // 해당 홀의 스코어 찾기
                      const holeScore = round.scores?.find(score => score.hole_number === holeNumber);
                      const editedScore = editedScores?.find(score => score.hole_number === holeNumber);
                      
                      // 홀 스코어가 없으면 빈 행 표시 (수정 모드에서는 모든 홀 표시)
                      if (!holeScore && !isEditing) {
                        return (
                          <tr key={holeNumber} className="border-t border-gray-800 text-gray-500">
                            <td className="py-3 px-4 text-left font-medium">{holeNumber}</td>
                            <td className="py-3 px-4 text-center" colSpan="4">기록 없음</td>
                          </tr>
                        );
                      }
                      
                      // 수정 모드에서는 모든 홀에 대한 입력 필드 표시
                      const score = isEditing ? editedScore : holeScore;
                      
                      return (
                        <tr key={holeNumber} className="border-t border-gray-800">
                          <td className="py-3 px-4 text-left font-medium">{holeNumber}</td>
                          <td className="py-3 px-4 text-center">
                            {isEditing ? (
                              <select
                                value={score?.par || 4}
                                onChange={(e) => handleScoreChange(holeNumber, 'par', e.target.value)}
                                className="bg-gray-700 text-white border border-gray-600 rounded-md px-2 py-1 w-16 text-center"
                              >
                                <option value={3}>3</option>
                                <option value={4}>4</option>
                                <option value={5}>5</option>
                              </select>
                            ) : (
                              score?.par || '-'
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing ? (
                              <input
                                type="number"
                                min="1"
                                value={score?.score || score?.par || 4}
                                onChange={(e) => handleScoreChange(holeNumber, 'score', e.target.value)}
                                className="bg-gray-700 text-white border border-gray-600 rounded-md px-2 py-1 w-16 text-center"
                              />
                            ) : (
                              <span className={getScoreClass(score?.par, score?.score)}>
                                {score?.score || '-'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={getScoreClass(score?.par, score?.score)}>
                              {getScoreText(score?.par, score?.score)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing ? (
                              <input
                                type="number"
                                min="0"
                                value={score?.putts !== null ? score?.putts : ''}
                                onChange={(e) => handleScoreChange(holeNumber, 'putts', e.target.value)}
                                className="bg-gray-700 text-white border border-gray-600 rounded-md px-2 py-1 w-16 text-center"
                              />
                            ) : (
                              score?.putts !== null ? score?.putts : '-'
                            )}
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
