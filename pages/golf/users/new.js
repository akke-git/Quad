// pages/golf/teams/new.js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Navbar from '../../../components/Navbar';

export default function NewUser() {


  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    display_name: '',
    handicap: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);
  
  // 클라이언트에서만 렌더링되도록 설정
  useEffect(() => {
    setIsClient(true);
  }, []);

  
  // 입력 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // 이미지 파일 변경 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      
      // 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    // 필수 필드 확인
    if (!formData.username || !formData.email || !formData.password) {
      setError('사용자명, 이메일, 비밀번호는 필수 입력 항목입니다.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // FormData 객체 생성
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'confirmPassword' && formData[key]) {
          submitData.append(key, formData[key]);
        }
      });
      
      // 프로필 이미지 추가
      if (profileImage) {
        submitData.append('profile_image', profileImage);
      }
      
      // API 호출
      const response = await fetch('/api/golf/users', {
        method: 'POST',
        body: submitData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'User registration failed.');
      }
      
      // 성공 시 사용자 목록 페이지로 이동
      router.push('/golf/users/users');
    } catch (err) {
      console.error('Error registering user:', err);
      setError(err.message || 'User registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>{"User Registration | Sveltt"}</title>
        <meta name="description" content="New user registration" />
      </Head>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          {isClient ? (
            <Link href="/golf/users/users" className="text-green-400 hover:text-green-300 mb-4 inline-block">
              &larr; back user list
            </Link>
          ) : (
            <span className="text-green-400 hover:text-green-300 mb-4 inline-block">
              &larr; back user list
            </span>
          )}
          
          <h1 className="text-3xl font-bold text-green-400 mt-4 mb-6" suppressHydrationWarning>
            User Registration
          </h1>
        </div>
        
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        
        {/* 등록 폼 */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 프로필 이미지 업로드 */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 mb-4">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Profile preview"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                    👤
                  </div>
                )}
              </div>
              
              <label className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300 cursor-pointer">
                Profile Image
                <input
                  type="file"
                  name="profile_image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 사용자명 */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              {/* 이메일 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              {/* 비밀번호 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              {/* 비밀번호 확인 */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              {/* 표시 이름 */}
              <div>
                <label htmlFor="display_name" className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  id="display_name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              {/* 핸디캡 */}
              <div>
                <label htmlFor="handicap" className="block text-sm font-medium text-gray-300 mb-2">
                  Handicap
                </label>
                <input
                  type="number"
                  id="handicap"
                  name="handicap"
                  value={formData.handicap}
                  onChange={handleChange}
                  min="0"
                  max="200"
                  step="0.1"
                  className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            {/* 제출 버튼 */}
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className={`bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md transition-colors duration-300 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                    Processing...
                  </span>
                ) : (
                  'User Registration'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="bg-gray-800 text-gray-300 py-3 border-t border-gray-700 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p> 2025 Sveltt</p>
        </div>
      </footer>
    </div>
  );
}