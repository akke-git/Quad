// components/ServiceCard.js

import Link from 'next/link';
import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * 서비스 카드 컴포넌트
 * 각 서비스의 아이콘, 이름, 설명을 표시하고 Docker 설정을 볼 수 있는 버튼을 제공
 */
export default function ServiceCard({ service, onConfigClick }) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 서비스 데이터 유효성 검사
  if (!service || !service.name || !service.url) {
    console.warn('ServiceCard: Invalid service data provided', service);
    return null;
  }

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
    console.warn(`Failed to load image for service: ${service.name}`);
  };

  const handleConfigClick = () => {
    if (typeof onConfigClick === 'function') {
      onConfigClick(service);
    } else {
      console.warn('ServiceCard: onConfigClick is not a function');
    }
  };

  const handleServiceClick = () => {
    // 링크 클릭 이벤트 추적
    console.log(`Navigating to service: ${service.name} (${service.url})`);
  };

  return (
    <Link 
      href={service.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleServiceClick}
      className="block group relative bg-gradient-to-br from-slate-800/90 via-slate-800/50 to-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ease-out hover:shadow-emerald-500/20 hover:shadow-3xl hover:-translate-y-2 border border-slate-700/50 hover:border-emerald-500/30 cursor-pointer"
    >
      {/* 배경 그라디언트 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* 글로우 효과 */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
      
      <div className="relative px-8 pt-8 pb-6">
        <header className="flex items-start justify-between mb-6">
          {/* 서비스 아이콘 섹션 */}
          <div className="flex items-center space-x-4">
            <div className="relative w-20 h-20 group/icon">
              {/* 아이콘 배경 그라디언트 */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-blue-500/20 rounded-2xl blur-md group-hover/icon:blur-lg transition-all duration-300" />
              
              <div className="relative w-full h-full bg-slate-700/30 backdrop-blur-sm rounded-2xl border border-slate-600/50 group-hover/icon:border-emerald-400/50 transition-all duration-300 group-hover/icon:scale-110 group-hover/icon:rotate-3">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
                
                {!imageError ? (
                  <>
                    {isLoading && (
                      <div className="w-full h-full bg-gradient-to-br from-slate-600/50 to-slate-700/50 animate-pulse rounded-2xl flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                      </div>
                    )}
                    <img
                      src={service.icon}
                      alt={`${service.name} 아이콘`}
                      className={`w-full h-full object-contain p-3 transition-all duration-300 ${
                        isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                      }`}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      loading="lazy"
                    />
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-600/50 to-slate-700/50 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl filter grayscale">📁</span>
                  </div>
                )}
                
                {/* 아이콘 호버 효과 */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/0 to-blue-500/0 group-hover/icon:from-emerald-400/10 group-hover/icon:to-blue-500/10 rounded-2xl transition-all duration-300" />
              </div>
            </div>
            
            {/* 서비스 정보 */}
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent mb-2 leading-tight font-ubuntu-mono">
                {service.name}
              </h3>
              {service.description && (
                <p className="text-slate-300 text-sm leading-relaxed line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300 font-ubuntu-mono">
                  {service.description}
                </p>
              )}
            </div>
          </div>
          
          {/* Docker 설정 버튼 */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleConfigClick();
            }}
            className="relative p-3 text-slate-400 hover:text-emerald-400 transition-all duration-300 focus:outline-none group/btn z-10"
            title="Docker Compose 설정 보기"
            aria-label={`${service.name} Docker 설정 보기`}
            type="button"
          >
            {/* 버튼 배경 */}
            <div className="absolute inset-0 bg-slate-700/30 backdrop-blur-sm rounded-xl border border-slate-600/50 group-hover/btn:border-emerald-400/50 group-hover/btn:bg-emerald-500/10 transition-all duration-300" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
            
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="relative h-5 w-5 group-hover/btn:scale-110 group-hover/btn:rotate-90 transition-all duration-300" 
              viewBox="0 0 20 20" 
              fill="currentColor"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>
        </header>
        
        {/* 서비스 상태 영역 */}
        {service.status && (
          <div className="flex justify-center pt-6 border-t border-slate-700/50">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border transition-all duration-300 font-ubuntu-mono ${
              service.status === 'active' 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-emerald-500/20' 
                : service.status === 'inactive'
                ? 'bg-red-500/20 text-red-300 border-red-500/30 shadow-red-500/20'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-amber-500/20'
            } shadow-lg`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                service.status === 'active' ? 'bg-emerald-400 shadow-emerald-400/50' :
                service.status === 'inactive' ? 'bg-red-400 shadow-red-400/50' : 'bg-amber-400 shadow-amber-400/50'
              } shadow-sm animate-pulse`} />
              {service.status === 'active' ? '활성' : 
               service.status === 'inactive' ? '비활성' : '알 수 없음'}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

// PropTypes 정의
ServiceCard.propTypes = {
  service: PropTypes.shape({
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    icon: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.oneOf(['active', 'inactive', 'unknown'])
  }).isRequired,
  onConfigClick: PropTypes.func.isRequired
};

// 기본값 설정
ServiceCard.defaultProps = {
  service: {
    icon: '/default-service-icon.png',
    description: '',
    status: 'unknown'
  }
};