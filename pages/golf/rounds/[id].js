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
  
  // Only execute on client-side
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Fetch round data
  useEffect(() => {
    if (!id || !isClient) return;
    
    const fetchRoundData = async () => {
      setIsLoading(true);
      try {
        // Get user information from local storage
        const savedUserData = localStorage.getItem('selectedGolfUser');
        if (!savedUserData) {
          // If no saved user information, redirect to rounds list page
          router.push('/golf/rounds');
          return;
        }
        
        const savedUser = JSON.parse(savedUserData);
        
        // Include user ID as a query parameter in API call
        const response = await fetch(`/api/golf/rounds/${id}?user_id=${savedUser.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch round data');
        }
        
        const data = await response.json();
        
        // Process round data
        const roundData = data.data;
        
        // Set default par values for hole scores if missing
        if (roundData && roundData.scores) {
          roundData.scores = roundData.scores.map(score => ({
            ...score,
            par: score.par || (score.hole_number % 3 === 0 ? 3 : (score.hole_number % 3 === 1 ? 4 : 5)) // Default par values (3, 4, 5 pattern)
          }));
        }
        
        setRound(roundData);
        
        // Initialize score data for editing
        if (roundData && roundData.scores) {
          setEditedScores(roundData.scores.map(score => ({ ...score })));
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching round data:', err);
        setError(err.message || 'Failed to fetch round data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoundData();
  }, [id, isClient, router]);
  
  // Hole score edit handler
  const handleScoreChange = (holeNumber, field, value) => {
    setEditedScores(prev => 
      prev.map(score => {
        if (score.hole_number === holeNumber) {
          const updatedScore = { ...score };
          
          // Set fairway hit, green in regulation, and sand save values to null
          updatedScore.fairway_hit = null;
          updatedScore.green_in_regulation = null;
          updatedScore.sand_save = null;
          
          // If par value changes, automatically update the default score value
          if (field === 'par') {
            const parValue = parseInt(value, 10);
            updatedScore.par = parValue;
            
            // If score is not set or being edited, initialize with par value
            if (!updatedScore.score) {
              updatedScore.score = parValue;
            }
          } else {
            // Process other fields
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
  
  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // When exiting edit mode, restore original data
      setEditedScores(round.scores.map(score => ({ ...score })));
    } else {
      // When starting edit mode, create data for all holes
      const existingScores = round.scores || [];
      const newScores = [];
      
      // Prepare data for holes 1-18
      for (let i = 1; i <= 18; i++) {
        const existingScore = existingScores.find(s => s.hole_number === i);
        
        if (existingScore) {
          // If existing data is available
          newScores.push({ ...existingScore });
        } else {
          // Create new hole data
          const defaultPar = i % 3 === 0 ? 3 : (i % 3 === 1 ? 4 : 5); // Default par values (3, 4, 5 pattern)
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
  
  // Save edits
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
        throw new Error('Failed to save round data');
      }
      
      const data = await response.json();
      
      // Process response data
      if (data.data) {
        // Process round data
        const roundData = data.data;
        
        // Set default par values for hole scores if missing
        if (roundData && roundData.scores) {
          roundData.scores = roundData.scores.map(score => ({
            ...score,
            par: score.par || getDefaultPar(score.hole_number)
          }));
        }
        
        // Update round data
        setRound(roundData);
        
        // Initialize score data for editing
        if (roundData.scores) {
          setEditedScores(roundData.scores.map(score => ({ ...score })));
        }
      }
      
      setIsEditing(false);
      alert('Round data has been successfully saved!');
    } catch (err) {
      console.error('Error saving round data:', err);
      alert(`Error saving round data: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Delete round
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this round record? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/golf/rounds/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete round');
      }
      
      alert('Round has been successfully deleted!');
      router.push('/golf/rounds');
    } catch (err) {
      console.error('Error deleting round:', err);
      alert(`Error deleting round: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Return default par value based on hole number
  const getDefaultPar = (holeNumber) => {
    // Repeat 3, 4, 5 based on hole number
    return holeNumber % 3 === 0 ? 3 : (holeNumber % 3 === 1 ? 4 : 5);
  };
  
  // Calculate score relative to par (for color display)
  const getScoreClass = (par, score) => {
    // Set default value if par is missing
    const parValue = par || getDefaultPar(score?.hole_number || 1);
    if (!score) return 'text-white';
    
    const diff = score - parValue;
    if (diff < 0) return 'text-blue-400'; // Under par (birdie or better)
    if (diff === 0) return 'text-white'; // Par
    return 'text-red-400'; // Over par (bogey or worse)
  };
  
  // Display score relative to par as text
  const getScoreText = (par, score) => {
    // Set default value to 4 if par is missing
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
    
    // 더블파 이상은 'Double Par'로 표시
    if (score >= parValue * 2) return 'Double Par';
    
    // 트리플 보기와 더블파 사이의 점수
    if (diff > 3) return `+${diff}`;
    
    return '';
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Round Details | Sveltt Golf</title>
        <meta name="description" content="Golf round details" />
      </Head>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/golf/rounds" className="text-green-400 hover:text-green-300 mb-4 inline-block ">
            &larr; Back to Round List
          </Link>
          
          <h1 className="text-3xl font-bold text-green-400 mt-4 mb-6 ">
            Round Details
          </h1>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-300 ">Loading round information...</p>
          </div>
        )}
        
        {/* Error message */}
        {error && !isLoading && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        
        {/* Round information */}
        {round && !isLoading && !error && (
          <div className="space-y-8">
            {/* Round summary information */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <h4 className="text-sm text-gray-400 ">Date</h4>
                  <p className="text-white font-medium">
                    {new Date(round.play_date).toLocaleDateString('en-US')}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400 ">Course</h4>
                  <p className="text-white font-medium">{round.course_name}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400 ">Location</h4>
                  <p className="text-white font-medium">{round.course_location}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400 ">Total Score</h4>
                  <p className="text-green-400 font-medium text-xl">{round.total_score}</p>
                </div>
              </div>
              
              {/* Additional information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <h4 className="text-sm text-gray-400 ">Weather</h4>
                  <p className="text-white">{round.weather || 'No information'}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400 ">Notes</h4>
                  <p className="text-white">{round.notes || 'No notes'}</p>
                </div>
              </div>
              
              {/* Data 버튼 추가 - 홀별 정보가 있는 코스의 경우 */}
              <div className="mt-4 flex justify-end">
                {round.scores && round.scores.some(score => score.course_name) && (
                  <button
                    type="button"
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md"
                    onClick={() => alert('코스 홀 정보가 있습니다!')}
                  >
                    Data
                  </button>
                )}
              </div>
            </div>
            
            {/* 홀별 스코어 테이블 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-green-400 ">Hole Scores</h2>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={toggleEditMode}
                    disabled={isSaving || isDeleting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                  
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isEditing || isSaving || isDeleting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-900 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-800 text-gray-300 text-sm">
                      <th className="py-3 px-4 text-left">Hole</th>
                      <th className="py-3 px-4 text-center">Course Name</th>
                      <th className="py-3 px-4 text-center">Par</th>
                      <th className="py-3 px-4 text-center">Score</th>
                      <th className="py-3 px-4 text-center">Putts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 18 }, (_, i) => i + 1).map(holeNumber => {
                      // 해당 홀의 스코어 찾기
                      const holeScore = round.scores?.find(score => score.hole_number === holeNumber);
                      const editedScore = editedScores?.find(score => score.hole_number === holeNumber);
                      
                      // 수정 모드에서는 모든 홀에 대한 입력 필드 표시
                      const score = isEditing ? editedScore : holeScore;
                      
                      // 홀 스코어가 없으면 빈 행 표시 (수정 모드에서는 모든 홀 표시)
                      if (!holeScore && !isEditing) {
                        return (
                          <tr key={holeNumber} className="border-t border-gray-800 text-gray-500">
                            <td className="py-3 px-4 text-left font-medium">{holeNumber}</td>
                            <td className="py-3 px-4 text-center">-</td>
                            <td className="py-3 px-4 text-center">-</td>
                            <td className="py-3 px-4 text-center">-</td>
                            <td className="py-3 px-4 text-center">-</td>
                          </tr>
                        );
                      }
                      
                      return (
                        <tr key={holeNumber} className="border-t border-gray-800">
                          <td className="py-3 px-4 text-left font-medium">{holeNumber}</td>
                          <td className="py-3 px-4 text-center">
                            {score?.course_name || `홀 ${holeNumber}`}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing ? (
                              <select
                                value={score?.par || getDefaultPar(holeNumber)}
                                onChange={(e) => handleScoreChange(holeNumber, 'par', e.target.value)}
                                className="bg-gray-700 text-white border border-gray-600 rounded-md px-2 py-1 w-16 text-center"
                              >
                                <option value={3}>3</option>
                                <option value={4}>4</option>
                                <option value={5}>5</option>
                              </select>
                            ) : (
                              score?.par || getDefaultPar(holeNumber)
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentScore = score?.score || score?.par || 4;
                                    if (currentScore > 1) {
                                      handleScoreChange(holeNumber, 'score', currentScore - 1);
                                    }
                                  }}
                                  className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-sm font-bold"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center text-white font-medium">
                                  {score?.score || score?.par || 4}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentScore = score?.score || score?.par || 4;
                                    if (currentScore < 15) {
                                      handleScoreChange(holeNumber, 'score', currentScore + 1);
                                    }
                                  }}
                                  className="w-8 h-8 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center text-sm font-bold"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <span className={getScoreClass(score?.par, score?.score)}>
                                {getScoreText(score?.par, score?.score)}
                              </span>
                            )}                          
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentPutts = score?.putts || 0;
                                    if (currentPutts > 0) {
                                      handleScoreChange(holeNumber, 'putts', currentPutts - 1);
                                    }
                                  }}
                                  className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-sm font-bold"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center text-white font-medium">
                                  {score?.putts !== null ? score?.putts : 0}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentPutts = score?.putts || 0;
                                    if (currentPutts < 10) {
                                      handleScoreChange(holeNumber, 'putts', currentPutts + 1);
                                    }
                                  }}
                                  className="w-8 h-8 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center text-sm font-bold"
                                >
                                  +
                                </button>
                              </div>
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
