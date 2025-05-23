// pages/golf/teams/new.js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../../../components/Navbar';

export default function NewTeam() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // 폼 상태
  const [formData, setFormData] = useState({
    team_name: '',
    user1_id: '',
    user2_id: '',
    team_image: ''
  });
  
  // 폼 유효성 검사 상태
  const [formErrors, setFormErrors] = useState({});
  
  // 사용자 목록 가져오기
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/golf/users?limit=1000');
        
        if (!response.ok) {
          throw new Error('사용자 목록을 가져오는데 실패했습니다');
        }
        
        const data = await response.json();
        setUsers(data.data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('사용자 목록을 가져오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // 입력 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // 에러 메시지 초기화
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  // 이미지 URL 변경 핸들러
  const handleImageUrlChange = (e) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      team_image: value
    });
  };
  
  // 폼 유효성 검사
  const validateForm = () => {
    const errors = {};
    
    if (!formData.team_name.trim()) {
      errors.team_name = '팀 이름을 입력해주세요';
    }
    
    if (!formData.user1_id) {
      errors.user1_id = '첫 번째 팀원을 선택해주세요';
    }
    
    if (!formData.user2_id) {
      errors.user2_id = '두 번째 팀원을 선택해주세요';
    }
    
    if (formData.user1_id === formData.user2_id && formData.user1_id) {
      errors.user2_id = '같은 사용자를 두 번 선택할 수 없습니다';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 폼 유효성 검사
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/golf/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '팀 생성에 실패했습니다');
      }
      
      // 성공 메시지 표시
      setSuccessMessage('팀이 성공적으로 생성되었습니다');
      
      // 3초 후 팀 목록 페이지로 이동
      setTimeout(() => {
        router.push('/golf/teams');
      }, 3000);
    } catch (err) {
      console.error('Error creating team:', err);
      setError(err.message || '팀 생성에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>새 팀 등록 | Sveltt Golf</title>
        <meta name="description" content="골프 앱 새 팀 등록" />
      </Head>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/golf/teams" className="text-green-400 hover:text-green-300 mb-4 inline-block">
            &larr; 팀 목록으로 돌아가기
          </Link>
          
          <h1 className="text-3xl font-bold text-green-400 mt-4 mb-6">
            새 팀 등록
          </h1>
        </div>
        
        {/* 성공 메시지 */}
        {successMessage && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6">
            <p className="text-green-400">{successMessage}</p>
            <p className="text-gray-400 text-sm mt-2">잠시 후 팀 목록 페이지로 이동합니다...</p>
          </div>
        )}
        
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        
        {/* 폼 */}
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          {/* 팀 이름 */}
          <div className="mb-6">
            <label htmlFor="team_name" className="block text-sm font-medium text-gray-300 mb-2">
              팀 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="team_name"
              name="team_name"
              value={formData.team_name}
              onChange={handleInputChange}
              className={`w-full bg-gray-700 text-white border ${formErrors.team_name ? 'border-red-500' : 'border-gray-600'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500`}
              placeholder="팀 이름을 입력하세요"
            />
            {formErrors.team_name && (
              <p className="text-red-500 text-sm mt-1">{formErrors.team_name}</p>
            )}
          </div>
          
          {/* 팀원 선택 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* 첫 번째 팀원 */}
            <div>
              <label htmlFor="user1_id" className="block text-sm font-medium text-gray-300 mb-2">
                첫 번째 팀원 <span className="text-red-500">*</span>
              </label>
              <select
                id="user1_id"
                name="user1_id"
                value={formData.user1_id}
                onChange={handleInputChange}
                className={`w-full bg-gray-700 text-white border ${formErrors.user1_id ? 'border-red-500' : 'border-gray-600'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500`}
              >
                <option value="">팀원을 선택하세요</option>
                {users.map((user) => (
                  <option key={`user1-${user.id}`} value={user.id}>
                    {user.display_name || user.username}
                  </option>
                ))}
              </select>
              {formErrors.user1_id && (
                <p className="text-red-500 text-sm mt-1">{formErrors.user1_id}</p>
              )}
            </div>
            
            {/* 두 번째 팀원 */}
            <div>
              <label htmlFor="user2_id" className="block text-sm font-medium text-gray-300 mb-2">
                두 번째 팀원 <span className="text-red-500">*</span>
              </label>
              <select
                id="user2_id"
                name="user2_id"
                value={formData.user2_id}
                onChange={handleInputChange}
                className={`w-full bg-gray-700 text-white border ${formErrors.user2_id ? 'border-red-500' : 'border-gray-600'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500`}
              >
                <option value="">팀원을 선택하세요</option>
                {users.map((user) => (
                  <option key={`user2-${user.id}`} value={user.id}>
                    {user.display_name || user.username}
                  </option>
                ))}
              </select>
              {formErrors.user2_id && (
                <p className="text-red-500 text-sm mt-1">{formErrors.user2_id}</p>
              )}
            </div>
          </div>
          
          {/* 팀 이미지 URL */}
          <div className="mb-6">
            <label htmlFor="team_image" className="block text-sm font-medium text-gray-300 mb-2">
              팀 이미지 URL (선택사항)
            </label>
            <input
              type="text"
              id="team_image"
              name="team_image"
              value={formData.team_image}
              onChange={handleImageUrlChange}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="이미지 URL을 입력하세요 (선택사항)"
            />
            
            {/* 이미지 미리보기 */}
            {formData.team_image && (
              <div className="mt-3">
                <p className="text-sm text-gray-400 mb-2">이미지 미리보기:</p>
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700">
                  <img
                    src={formData.team_image}
                    alt="Team preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = ''; // 에러 시 이미지 제거
                      e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-sm">이미지 로드 실패</div>';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* 제출 버튼 */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !!successMessage}
              className={`${
                isLoading || successMessage
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white font-medium py-2 px-6 rounded-md transition-colors duration-300`}
            >
              {isLoading ? '처리 중...' : '팀 등록하기'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
