// pages/golf/rounds/new.js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../../../components/Navbar';

export default function NewRound() {
  const router = useRouter();
  const { user: userId } = router.query;
  
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseHolesData, setCourseHolesData] = useState(null); // 코스 홀 정보 저장
  const [dataLoaded, setDataLoaded] = useState(false); // 홀 데이터 로드 상태
  const [courseNames, setCourseNames] = useState([]); // 코스 이름 목록 저장
  const [selectedCourseNames, setSelectedCourseNames] = useState([]); // 선택된 코스 이름 목록
  const [currentHole, setCurrentHole] = useState(1); // 현재 선택된 홀
  const [quickInputMode, setQuickInputMode] = useState(true); // 퀵입력 모드 활성화 여부
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    user_id: userId || '', // 라우터에서 가져온 사용자 ID
    course_id: '',
    course_names: [], // 코스 이름 배열로 변경
    play_date: new Date().toISOString().split('T')[0], // 오늘 날짜를 기본값으로
    weather: '', // 날씨 정보 추가
    notes: '', // 메모 추가
    scores: Array(18).fill().map((_, index) => ({
      hole_number: index + 1,
      par: 4, // 기본값 파4
      score: 0,
      putts: null,
      penalty_strokes: 0 // 페널티 스트로크
    }))
  })



  // 코스 목록 가져오기
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // 코스 목록 가져오기 - 최대 1000개까지 가져오도록 limit 파라미터 추가
        console.log('코스 목록 요청 시작');
        const response = await fetch('/api/golf/courses?limit=1200');
        console.log('코스 목록 응답 받음');
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        
        const data = await response.json();
        setCourses(data.data || []);
        
        // 코스가 있으면 첫 번째 코스를 기본값으로 설정
        if (data.data && data.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            course_id: data.data[0].id
          }));
          
          // 홀 번호 설정
          setFormData(prev => ({
            ...prev,
            scores: prev.scores.map((score, index) => ({
              ...score,
              hole_number: index + 1
            }))
          }));
        }
        
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to fetch courses');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourses();
  }, []);

  // 코스 ID와 코스 이름을 받아 홀 정보를 로드하는 함수
  const loadHoleInfo = async (courseId, courseName) => {
    try {
      console.log('홀 정보 로드 시작:', courseId, courseName);
      
      // 홀 정보 API 호출
      const response = await fetch(`/api/golf/course-holes?course_id=${courseId}&course_name=${courseName}`);
      
      if (!response.ok) {
        throw new Error(`코스 홀 정보를 가져오는데 실패했습니다: ${courseName}`);
      }
      
      const data = await response.json();
      const responseData = data.data || {};
      console.log('홀 정보 로드 완료:', responseData);
      
      // 홀 정보가 있으면 처리
      if (responseData.holes && responseData.holes.length > 0) {
        // 홀 정보와 데이터 로드 상태 업데이트
        setCourseHolesData(responseData);
        setDataLoaded(true);
        
        // 홀 정보 오름차순 정렬
        const sortedHoles = [...responseData.holes].sort((a, b) => a.hole_number - b.hole_number);
        console.log('정렬된 홀 정보:', sortedHoles);
        
        // 파 정보 업데이트
        setFormData(prev => {
          // 기존 스코어 배열 복사
          const updatedScores = [...prev.scores];
          
          // 각 홀에 대해 파 정보 업데이트
          for (let i = 0; i < updatedScores.length; i++) {
            // 해당 홀 번호에 대한 홀 정보 찾기
            const holeNumber = i + 1; // 홀 번호는 1부터 시작
            
            // 홀 번호가 10 이상인 경우 1-9 홀 정보 사용
            const matchHoleNumber = holeNumber > 9 ? holeNumber - 9 : holeNumber;
            const holeInfo = sortedHoles.find(hole => hole.hole_number === matchHoleNumber);
            
            console.log(`홀 ${holeNumber} 정보 찾기 (매칭 홀: ${matchHoleNumber}):`, holeInfo);
            
            if (holeInfo) {
              // 홀 정보가 있는 경우 파 정보 업데이트
              console.log(`홀 ${holeNumber} 파 정보 업데이트: ${holeInfo.par}`);
              updatedScores[i] = {
                ...updatedScores[i],
                hole_number: holeNumber,
                par: holeInfo.par,
                original_hole_number: holeInfo.hole_number,
                course_name: holeInfo.course_name || responseData.selectedCourseName || courseName || ''
              };
            }
          }
          
          console.log('업데이트된 스코어 배열:', updatedScores);
          
          return {
            ...prev,
            scores: updatedScores
          };
        });
        
        console.log('파 정보가 업데이트되었습니다');
      }
    } catch (error) {
      console.error('홀 정보 로드 오류:', error);
    }
  };

  // 폼 입력 핸들러
  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 코스 선택 시 해당 코스의 코스 이름 목록 가져오기
    if (name === 'course_id' && value) {
      try {
        console.log('코스 선택됨:', value);
        // 데이터 로드 상태 초기화
        setDataLoaded(false);
        setCourseHolesData(null);
        setCourseNames([]);
        setSelectedCourseNames([]);
        setFormData(prev => ({ ...prev, course_names: [] })); // 코스 이름 초기화
        
        console.log('코스 선택 시 API 호출:', value);
        const response = await fetch(`/api/golf/course-holes?course_id=${value}`);
        
        if (!response.ok) {
          throw new Error('코스 정보를 가져오는데 실패했습니다');
        }
        
        const data = await response.json();
        const responseData = data.data || {};
        console.log('코스 정보 받음:', responseData);
        
        // API 응답 구조 확인
        if (responseData) {
          console.log('코스 이름:', responseData.courseName);
          console.log('코스 이름 목록:', responseData.courseNames);
          console.log('홀 정보:', responseData.holes);
        }
        
        // 코스 이름 목록이 있으면 저장
        if (responseData.courseNames && responseData.courseNames.length > 0) {
          setCourseNames(responseData.courseNames);
          console.log('코스 이름 목록 업데이트됨:', responseData.courseNames);
          
          // 코스 이름 자동 선택 처리
          let autoSelectedNames = [];
          if (responseData.courseNames.length === 1) {
            // 1개일 경우 자동 선택
            autoSelectedNames = [responseData.courseNames[0]];
          } else if (responseData.courseNames.length === 2) {
            // 2개일 경우 모두 자동 선택
            autoSelectedNames = [...responseData.courseNames];
          } else if (responseData.courseNames.length > 2) {
            // 3개 이상일 경우 앞의 2개 자동 선택
            autoSelectedNames = [responseData.courseNames[0], responseData.courseNames[1]];
          }
          
          setSelectedCourseNames(autoSelectedNames);
          setFormData(prev => ({ ...prev, course_names: autoSelectedNames }));
          
          // 코스 이름이 선택되면 바로 홀 정보 로드
          if (autoSelectedNames.length > 0) {
            console.log('선택된 코스 이름으로 홀 정보 로드 시도:', autoSelectedNames[0]);
            loadHoleInfo(value, autoSelectedNames[0]);
          }
        } else if (responseData.holes && responseData.holes.length > 0) {
          // 코스 이름 목록이 없고 홀 정보가 있는 경우 (이전 버전 호환성)
          console.log('홀 정보 발견:', responseData.holes);
          
          // 홀 정보와 데이터 로드 상태 업데이트
          setCourseHolesData(responseData);
          setDataLoaded(true);
          
          // 홀 정보 오름차순 정렬
          const sortedHoles = [...responseData.holes].sort((a, b) => a.hole_number - b.hole_number);
          console.log('정렬된 홀 정보:', sortedHoles);
          
          // 파 정보 업데이트
          setFormData(prev => {
            // 기존 스코어 배열 복사
            const updatedScores = [...prev.scores];
            
            // 각 홀에 대해 파 정보 업데이트
            for (let i = 0; i < updatedScores.length; i++) {
              // 해당 홀 번호에 대한 홀 정보 찾기
              const holeNumber = i + 1; // 홀 번호는 1부터 시작
              
              // 홀 번호가 10 이상인 경우 1-9 홀 정보 사용
              const matchHoleNumber = holeNumber > 9 ? holeNumber - 9 : holeNumber;
              const holeInfo = sortedHoles.find(hole => hole.hole_number === matchHoleNumber);
              
              console.log(`홀 ${holeNumber} 정보 찾기 (매칭 홀: ${matchHoleNumber}):`, holeInfo);
              
              if (holeInfo) {
                // 홀 정보가 있는 경우 파 정보 업데이트
                console.log(`홀 ${holeNumber} 파 정보 업데이트: ${holeInfo.par}`);
                updatedScores[i] = {
                  ...updatedScores[i],
                  hole_number: holeNumber,
                  par: holeInfo.par,
                  original_hole_number: holeInfo.hole_number,
                  course_name: holeInfo.course_name || responseData.selectedCourseName || ''
                };
              }
            }
            
            console.log('업데이트된 스코어 배열:', updatedScores);
            
            return {
              ...prev,
              scores: updatedScores
            };
          });
          
          console.log('파 정보가 업데이트되었습니다');
        }
      } catch (error) {
        console.error('코스 정보 가져오기 오류:', error);
      }
    }
    
    // 코스 이름 체크박스 변경 처리
    if (name === 'course_name_checkbox') {
      const courseName = e.target.value;
      const isChecked = e.target.checked;
      
      // 선택된 코스 이름 목록 업데이트
      let newSelectedCourseNames = [...selectedCourseNames];
      
      if (isChecked && !newSelectedCourseNames.includes(courseName)) {
        newSelectedCourseNames.push(courseName);
      } else if (!isChecked && newSelectedCourseNames.includes(courseName)) {
        newSelectedCourseNames = newSelectedCourseNames.filter(name => name !== courseName);
      }
      
      setSelectedCourseNames(newSelectedCourseNames);
      setFormData(prev => ({
        ...prev,
        course_names: newSelectedCourseNames
      }));
      
      // 선택된 코스 이름이 있을 경우 홀 정보 가져오기
      if (newSelectedCourseNames.length > 0 && formData.course_id) {
        try {
          const courseId = formData.course_id;
          console.log('코스 홀 정보 가져오기:', courseId, newSelectedCourseNames);
          // 데이터 로드 상태 초기화
          setDataLoaded(false);
          setCourseHolesData(null);
          
          // 모든 선택된 코스 이름에 대한 홀 정보 가져오기
          const holesDataPromises = newSelectedCourseNames.map(courseName => 
            fetch(`/api/golf/course-holes?course_id=${courseId}&course_name=${courseName}`)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`코스 홀 정보를 가져오는데 실패했습니다: ${courseName}`);
                }
                return response.json();
              })
              .then(data => ({
                courseName,
                data: data.data || {}
              }))
          );
          
          // 모든 코스 이름에 대한 홀 정보 가져오기 완료 대기
          const allCoursesData = await Promise.all(holesDataPromises);
          console.log('모든 코스 홀 정보 받음:', allCoursesData);
          
          // 첫 번째 코스 이름의 홀 정보를 기본으로 저장
          if (allCoursesData.length > 0 && allCoursesData[0].data.holes && allCoursesData[0].data.holes.length > 0) {
            setCourseHolesData(allCoursesData[0].data);
            setDataLoaded(true); // 데이터 로드 완료 표시
            
            setFormData(prev => {
              // 기존 스코어 배열 복사
              const updatedScores = [...prev.scores];
              
              // 각 코스의 홀 정보를 순서대로 배정
              allCoursesData.forEach((courseData, courseIndex) => {
                if (courseData.data.holes && courseData.data.holes.length > 0) {
                  const courseHoles = courseData.data.holes;
                  const startHoleIndex = courseIndex * 9; // 첫 번째 코스는 0-8, 두 번째 코스는 9-17
                  
                  // 해당 코스의 홀 정보 배정
                  courseHoles.forEach((holeInfo, holeIndex) => {
                    const targetIndex = startHoleIndex + holeIndex;
                    
                    // 18홀을 초과하지 않도록 확인
                    if (targetIndex < 18) {
                      updatedScores[targetIndex] = {
                        ...updatedScores[targetIndex],
                        hole_number: targetIndex + 1, // 1부터 시작하는 홀 번호
                        par: holeInfo.par,
                        original_hole_number: holeInfo.hole_number, // 원래 홀 번호 저장
                        course_name: courseData.courseName // 해당 홀의 코스 이름 저장
                      };
                    }
                  });
                }
              });
              
              console.log('업데이트된 스코어:', updatedScores);
              return {
                ...prev,
                scores: updatedScores
              };
            });
            
            console.log('파 정보가 업데이트되었습니다');
          }
        } catch (error) {
          console.error('코스 홀 정보 가져오기 오류:', error);
        }
      }
    }
  };

  const handleScoreChange = (index, field, value) => {
    setFormData(prev => {
      const newScores = [...prev.scores];
      newScores[index] = {
        ...newScores[index],
        [field]: field === 'par' || field === 'score' ? parseInt(value, 10) : value === '' ? null : parseInt(value, 10)
      };
      return {
        ...prev,
        scores: newScores
      };
    });
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 폼 데이터 유효성 검사
    if (!formData.user_id) {
      alert('사용자 ID가 필요합니다.');
      return;
    }
    
    if (!formData.course_id) {
      alert('골프 코스를 선택해주세요.');
      return;
    }
    
    // 모든 홀 스코어를 처리하되, 사용자가 입력하지 않은 홀은 par 값을 score로 사용
    const processedScores = formData.scores.map(score => {
      // 사용자가 스코어를 입력하지 않았다면 par 값을 score로 사용
      if (!score.score || score.score <= 0) {
        return {
          ...score,
          score: score.par // par 값을 score로 설정
        };
      }
      return score; // 이미 스코어가 입력된 홀은 그대로 사용
    });
    
    // 최소 하나 이상의 홀이 있는지 확인 (항상 true이지만 안전을 위해 유지)
    if (processedScores.length === 0) {
      alert('최소 한 홀 이상의 스코어를 입력해주세요.');
      return;
    }
    
    // 제출할 데이터 준비 - 모든 홀 스코어 포함
    const submissionData = {
      ...formData,
      course_name: formData.course_names.length > 0 ? formData.course_names[0] : '', // 첫 번째 코스 이름을 기본으로 사용
      scores: processedScores
    };
    
    try {
      // 로딩 상태 설정
      setIsLoading(true);
      
      // 항상 새로운 라운드 생성 (POST 요청)
      const response = await fetch('/api/golf/rounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '라운드 저장에 실패했습니다.');
      }
      
      // 성공 메시지
      alert('새 라운드가 성공적으로 저장되었습니다!');
      
      // 저장 후 라운드 목록 페이지로 이동
      router.push('/golf/rounds');

    } catch (error) {
      console.error('Error saving round:', error);
      alert(`라운드 저장 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 홀 선택 핸들러
  const handleHoleSelect = (holeNumber) => {
    setCurrentHole(holeNumber);
  };

  
  // 퀴입력 모드에서 점수 조절 핸들러 - 더블파까지만 입력 가능
  const handleScoreAdjust = (adjustment) => {
    const currentPar = formData.scores[currentHole - 1].par;
    const currentScore = formData.scores[currentHole - 1].score || currentPar;
    
    // 더블파(par * 2) 까지만 입력 가능
    const maxScore = currentPar * 2;
    
    // 새 점수 계산 - 최소 1, 최대 더블파
    const newScore = Math.min(maxScore, Math.max(1, currentScore + adjustment));
    
    // 점수가 더블파에 도달하면 알림 표시
    if (newScore === maxScore && currentScore < maxScore && adjustment > 0) {
      alert('더블파까지만 입력 가능합니다.');
    }
    
    handleScoreChange(currentHole - 1, 'score', newScore);
  };
  
  // 다음 홀로 이동
  const handleNextHole = () => {
    if (currentHole < 18) {
      setCurrentHole(currentHole + 1);
    }
  };
  
  // 이전 홀로 이동
  const handlePrevHole = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
    }
  };

  // 파 대비 스코어 계산 (색상 표시용)
  const getScoreClass = (par, score) => {
    if (!par || !score) return 'text-white';
    
    const diff = score - par;
    if (diff < -1) return 'text-blue-400'; // 이글 이상
    if (diff === -1) return 'text-green-400'; // 버디
    if (diff === 0) return 'text-white'; // 파
    if (diff === 1) return 'text-yellow-400'; // 보기
    if (diff === 2) return 'text-orange-400'; // 더블 보기
    return 'text-red-400'; // 트리플 보기 이상
  };

  // 파 대비 스코어 텍스트 표시
  const getScoreText = (par, score) => {
    if (!par || !score) return '';
    
    const diff = score - par;
    if (diff < -1) return `${Math.abs(diff)}`;
    if (diff === -1) return '1';
    if (diff === 0) return 'Par';
    if (diff >= 1) return `+${diff}`;
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>New Round | Sveltt Golf</title>
        <meta name="description" content="Record a new golf round" />
      </Head>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/golf/rounds" className="text-green-400 hover:text-green-300 mb-4 inline-block font-ubuntu-mono">
            &larr; Back to Rounds
          </Link>
          
          <h1 className="text-3xl font-bold text-green-400 mt-4 mb-6 font-ubuntu-mono">
            New Round Record
          </h1>
        </div>

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-300 font-ubuntu-mono">Loading courses...</p>
          </div>
        )}
        
        {/* 에러 메시지 */}
        {error && !isLoading && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        
        {/* 폼 */}
        {!isLoading && !error && (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-green-400 mb-4 font-ubuntu-mono">Round Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 코스 선택 */}
                <div>
                  <label htmlFor="course_id" className="block text-sm font-medium text-gray-300 mb-2 font-ubuntu-mono">
                    Golf Course
                  </label>
                  <select
                    id="course_id"
                    name="course_id"
                    value={formData.course_id}
                    onChange={handleInputChange}
                    className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    {courses.length === 0 ? (
                      <option value="">No courses available</option>
                    ) : (
                      courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.name}{course.location ? ` (${course.location})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                
                {/* 코스 이름 체크박스 선택 (C코스, D코스, E코스 등) */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2 font-ubuntu-mono">
                    Course Name
                  </label>
                  {courseNames.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      {courseNames.map(name => (
                        <div key={name} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`course_name_${name}`}
                            name="course_name_checkbox"
                            value={name}
                            checked={selectedCourseNames.includes(name)}
                            onChange={handleInputChange}
                            className="mr-2 h-4 w-4 text-green-500 focus:ring-green-500 border-gray-600 rounded bg-gray-700"
                          />
                          <label htmlFor={`course_name_${name}`} className="text-white">
                            {name}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 italic">
                      {formData.course_id ? '코스 이름 정보가 없습니다.' : '코스를 먼저 선택해주세요.'}
                    </div>
                  )}
                </div>
                
                {/* 날짜 선택 */}
                <div>
                  <label htmlFor="play_date" className="block text-sm font-medium text-gray-300 mb-2 font-ubuntu-mono">
                    Play Date
                  </label>
                  <input
                    type="date"
                    id="play_date"
                    name="play_date"
                    value={formData.play_date}
                    onChange={handleInputChange}
                    className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                
                {/* 날씨 선택 */}
                <div>
                  <label htmlFor="weather" className="block text-sm font-medium text-gray-300 mb-2 font-ubuntu-mono">
                    Weather
                  </label>
                  <select
                    id="weather"
                    name="weather"
                    value={formData.weather}
                    onChange={handleInputChange}
                    className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Weather</option>
                    <option value="Sunny">Sunny</option>
                    <option value="Cloudy">Cloudy</option>
                    <option value="Rainy">Rainy</option>
                    <option value="Windy">Windy</option>
                    <option value="Foggy">Foggy</option>
                  </select>
                </div>
                
                {/* 메모 입력 */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2 font-ubuntu-mono">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleInputChange}
                    rows="3"
                    className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Add notes about your round..."
                  ></textarea>
                </div>
              </div>
            </div>
            
            {/* 모바일용 퀵 입력 인터페이스 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-green-400 font-ubuntu-mono">Quick Score Input</h2>
                <button
                  type="button"
                  onClick={() => setQuickInputMode(!quickInputMode)}
                  className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-md font-ubuntu-mono"
                >
                  {quickInputMode ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {quickInputMode && (
                <div className="space-y-4">
                  {/* 홀 선택 그리드 */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium text-white font-ubuntu-mono">Select Hole</h3>
                      {dataLoaded && (
                        <div className="flex items-center">
                          <span className="inline-block px-2 py-1 bg-green-600 text-white text-xs rounded-md mr-2">
                            Data On
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* 홀 정보 표시 - 코스명, 홀명, 핸디캡 */}
                    {dataLoaded && courseHolesData && (
                      <div className="mb-2 text-sm">
                        {(() => {
                          const currentHoleInfo = courseHolesData.holes.find(h => h.hole_number === currentHole);
                          return currentHoleInfo ? (
                            <div className="flex items-center justify-between text-gray-300">
                              <span><span className="text-green-400">{courseHolesData.courseName}</span></span>
                              <span>{currentHoleInfo.hole_name || `Hole ${currentHole}`}</span>
                              <span>Hdcp: <span className="text-yellow-400">{currentHoleInfo.handicap || 'N/A'}</span></span>
                            </div>
                          ) : (
                            <div className="text-gray-400 text-center">No data for Hole {currentHole}</div>
                          );
                        })()} 
                      </div>
                    )}
                    
                    <div className="grid grid-cols-6 gap-2">
                      {Array.from({ length: 18 }, (_, i) => i + 1).map(hole => (
                        <button
                          key={hole}
                          type="button"
                          onClick={() => handleHoleSelect(hole)}
                          className={`py-2 px-3 rounded-md text-lg font-medium transition-colors duration-200 ${currentHole === hole
                            ? 'bg-green-600 text-white'
                            : formData.scores[hole-1].score
                              ? 'bg-gray-600 text-white'
                              : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {hole}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 홀 선택 및 점수 입력 - 통합 인터페이스 */}
                  <div className="mb-6">
                    {/* 홀 선택 영역 */}
                    <div className="flex justify-between items-center bg-gray-700 p-4 rounded-t-lg border-b border-gray-600">
                      <button
                        type="button"
                        onClick={handlePrevHole}
                        disabled={currentHole === 1}
                        className="text-2xl font-bold px-4 py-2 rounded-md bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        &lt;
                      </button>
                      
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-white font-ubuntu-mono">Hole {currentHole}</h3>
                        <div className="mt-2">
                          <span className="text-gray-300 mr-2 font-ubuntu-mono text-lg">Par:</span>
                          <select
                            value={formData.scores[currentHole-1].par}
                            onChange={(e) => handleScoreChange(currentHole-1, 'par', e.target.value)}
                            className="bg-gray-800 text-white border border-gray-600 rounded-md px-3 py-2 text-lg"
                          >
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                          </select>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleNextHole}
                        disabled={currentHole === 18}
                        className="text-2xl font-bold px-4 py-2 rounded-md bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        &gt;
                      </button>
                    </div>
                    
                    {/* 점수 입력 영역 */}
                    <div className="bg-gray-700 p-6 rounded-b-lg">
                      <div className="flex flex-col items-center">
                        <h4 className="text-xl font-medium text-gray-300 mb-4 font-ubuntu-mono">Score</h4>
                        
                        <div className="flex items-center justify-center w-full mb-4">
                          <button
                            type="button"
                            onClick={() => handleScoreAdjust(-1)}
                            className="text-3xl font-bold px-6 py-3 rounded-l-lg bg-gray-600 text-white hover:bg-gray-500 w-1/3"
                          >
                            -
                          </button>
                          
                          <div className="text-center bg-gray-800 px-6 py-3 w-1/3">
                            <span className={`text-3xl font-bold ${getScoreClass(
                              formData.scores[currentHole-1].par,
                              formData.scores[currentHole-1].score
                            )}`}>
                              {formData.scores[currentHole-1].score || formData.scores[currentHole-1].par}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleScoreAdjust(1)}
                            className="text-3xl font-bold px-6 py-3 rounded-r-lg bg-gray-600 text-white hover:bg-gray-500 w-1/3"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="text-center mt-2">
                          <span className={`text-lg font-medium ${getScoreClass(
                            formData.scores[currentHole-1].par,
                            formData.scores[currentHole-1].score
                          )}`}>
                            {getScoreText(formData.scores[currentHole-1].par, formData.scores[currentHole-1].score)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 퀴 입력 추가 정보 */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-1 block font-ubuntu-mono">Putts</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.scores[currentHole-1].putts !== null ? formData.scores[currentHole-1].putts : ''}
                        onChange={(e) => handleScoreChange(currentHole-1, 'putts', e.target.value)}
                        className="bg-gray-800 text-white border border-gray-600 rounded-md px-3 py-2 w-full"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-1 block font-ubuntu-mono">Penalty Strokes</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.scores[currentHole-1].penalty_strokes || 0}
                        onChange={(e) => handleScoreChange(currentHole-1, 'penalty_strokes', e.target.value)}
                        className="bg-gray-800 text-white border border-gray-600 rounded-md px-3 py-2 w-full"
                      />
                    </div>
                  </div>
                  
                </div>
              )}
            </div>
            
            {/* 제출 버튼 */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-md transition-colors duration-300 font-ubuntu-mono text-lg"
              >
                Save Round
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
