// components/FilePasswordModal.js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

export default function FilePasswordModal({ isOpen, onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef(null);

  // 비밀번호 (환경변수로 설정 가능, 기본값: 'admin123')
  const correctPassword = process.env.NEXT_PUBLIC_FILES_PASSWORD || 'admin123';

  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때 포커스 및 초기화
      setPassword('');
      setError('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 간단한 지연 시뮬레이션 (보안 인증 느낌)
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password === correctPassword) {
      // 인증 성공 - 세션 스토리지에 토큰 저장
      sessionStorage.setItem('files_auth_token', 'authenticated_' + Date.now());
      
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
        router.push('/files');
      }
    } else {
      // 인증 실패
      setError('잘못된 비밀번호입니다.');
      setPassword('');
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">파일 시스템 접근 인증</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-300 text-sm mb-2">
            서버 호스트 파일에 접근하려면 비밀번호를 입력하세요.
          </p>
          <div className="bg-gray-900 border border-gray-600 rounded p-3 mb-2">
            <div className="flex items-center text-yellow-400 text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.318 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>민감한 시스템 파일에 접근할 수 있습니다</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm text-gray-300 mb-2">
              비밀번호
            </label>
            <input
              ref={inputRef}
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
              placeholder="비밀번호를 입력하세요"
              required
              disabled={isLoading}
            />
            {error && (
              <p className="text-red-400 text-sm mt-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded font-medium transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  인증 중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  접근 허가
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
            >
              취소
            </button>
          </div>
        </form>

        <div className="mt-4 text-xs text-gray-500 border-t border-gray-700 pt-3">
          <p>💡 기본 비밀번호: admin123</p>
          <p>환경변수 NEXT_PUBLIC_FILES_PASSWORD로 변경 가능</p>
        </div>
      </div>
    </div>
  );
}