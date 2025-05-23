// pages/golf/courses.js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';

export default function GolfCourses() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 필터 상태
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // 지역 목록 (실제로는 API에서 가져오는 것이 좋음)
  const locations = ['전체', '부산','대전','울산','경기','강원','전남','경남','경북','충남','광주','충북','대구','제주','서울','세종','인천','전북'];
  
  // 정렬 옵션
  const sortOptions = [
    { value: 'name', label: '코스명' },
    { value: 'location', label: '지역' },
    { value: 'holes', label: '홀 수' },
    { value: 'par', label: '파' },
    { value: 'created_at', label: '등록일' }
  ];

  // 코스 데이터 가져오기
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        // 쿼리 파라미터 구성
        const params = new URLSearchParams();
        if (locationFilter && locationFilter !== '전체') {
          params.append('location', locationFilter);
        }
        if (sortBy) {
          params.append('sort', sortBy);
          params.append('order', sortOrder);
        }
        // 결과 제한 수 증가 (최대 1000개까지)
        params.append('limit', '1000');
        
        // API 호출
        const response = await fetch(`/api/golf/courses?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('코스 목록을 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setCourses(data.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('코스 목록을 불러오는데 문제가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourses();
  }, [locationFilter, sortBy, sortOrder]);
  
  // 필터 변경 핸들러
  const handleLocationChange = (e) => {
    setLocationFilter(e.target.value);
  };
  
  // 정렬 변경 핸들러
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };
  
  // 정렬 순서 토글
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>골프 코스 목록 | Sveltt</title>
        <meta name="description" content="다양한 골프 코스 정보를 확인하세요" />
      </Head>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/golf" className="text-green-400 hover:text-green-300 mb-4 inline-block">
            &larr; golf home
          </Link>
          
          <h1 className="text-3xl font-bold text-green-400 mt-4 mb-6">
            golf courses
          </h1>
        </div>
        
        {/* 필터 및 정렬 */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 지역 필터 */}
            <div className="flex-1">
              <label htmlFor="location-filter" className="block text-sm font-medium text-gray-300 mb-2">
                location filter
              </label>
              <select
                id="location-filter"
                value={locationFilter}
                onChange={handleLocationChange}
                className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {locations.map((location) => (
                  <option key={location} value={location === '전체' ? '' : location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 정렬 */}
            <div className="flex-1">
              <label htmlFor="sort-by" className="block text-sm font-medium text-gray-300 mb-2">
                sort by
              </label>
              <div className="flex">
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={handleSortChange}
                  className="bg-gray-700 text-white border border-gray-600 rounded-l-md px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={toggleSortOrder}
                  className="bg-gray-700 border border-gray-600 border-l-0 rounded-r-md px-3 py-2 hover:bg-gray-600"
                  title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 로딩 상태 */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-300">courses loading...</p>
          </div>
        )}
        
        {/* 에러 메시지 */}
        {error && !isLoading && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        
        {/* 코스 목록 */}
        {!isLoading && !error && (
          <>
            {courses.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-gray-300">courses not found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <div key={course.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-md hover:bg-gray-700 transition-colors duration-300 border border-gray-700">
                    {/* 코스 정보 */}
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-1">
                        <h2 className="text-lg font-semibold text-green-400">{course.name}</h2>
                      </div>
                      
                      <p className="text-gray-300 text-sm">
                        <span className="inline-block mr-1">📍</span>
                        {course.location}
                      </p>
                      
                      <p className="text-gray-300 text-sm mt-1">
                        <span className="inline-block mr-1">🏠</span>
                        {course.address || 'adress not found'}
                      </p>
                      
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>{course.holes || 18}홀</span>
                        <span>파 {course.par || 72}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* 결과 수 표시 */}
            <div className="mt-6 text-right text-gray-400 text-sm">
              total {courses.length} courses
            </div>
          </>
        )}
      </main>

      <footer className="bg-gray-800 text-gray-300 py-3 border-t border-gray-700 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p> 2025 Sveltt Golf Score</p>
        </div>
      </footer>
    </div>
  );
}