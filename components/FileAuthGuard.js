// components/FileAuthGuard.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import FilePasswordModal from './FilePasswordModal';

export default function FileAuthGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthentication = () => {
      const token = sessionStorage.getItem('files_auth_token');
      
      if (token && token.startsWith('authenticated_')) {
        // 토큰이 있고 유효한 경우
        const tokenTime = parseInt(token.replace('authenticated_', ''));
        const currentTime = Date.now();
        const maxAge = 30 * 60 * 1000; // 30분
        
        if (currentTime - tokenTime < maxAge) {
          // 토큰이 30분 이내에 발급된 경우
          setIsAuthenticated(true);
        } else {
          // 토큰이 만료된 경우
          sessionStorage.removeItem('files_auth_token');
          setShowModal(true);
        }
      } else {
        // 토큰이 없는 경우
        setShowModal(true);
      }
      
      setIsLoading(false);
    };

    // 컴포넌트가 마운트될 때 인증 상태 확인
    checkAuthentication();

    // 페이지 포커스될 때마다 인증 상태 재확인
    const handleFocus = () => {
      checkAuthentication();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowModal(false);
  };

  const handleModalClose = () => {
    setShowModal(false);
    router.push('/'); // 홈으로 리다이렉트
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-300">인증 상태 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 text-yellow-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM11 5V3a2 2 0 014 0v2M7 7h10" />
              </svg>
              <h1 className="text-2xl font-bold text-white mb-2">접근 권한이 필요합니다</h1>
              <p className="text-gray-300">파일 시스템에 접근하려면 인증이 필요합니다.</p>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
        
        <FilePasswordModal 
          isOpen={showModal}
          onClose={handleModalClose}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  return (
    <>
      {children}
      
      {/* 세션 만료 알림 */}
      <div className="fixed top-4 right-4 z-40">
        <div className="bg-green-800 border border-green-600 text-green-100 px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">파일 시스템 접근 허가됨</span>
          </div>
        </div>
      </div>
    </>
  );
}