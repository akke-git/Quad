// components/CompactServiceCard.js

import Link from 'next/link';
import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * 컴팩트 서비스 카드 컴포넌트
 * 작은 크기로 서비스 아이콘과 이름만 표시하는 미니멀 카드
 */
export default function CompactServiceCard({ service, onConfigClick, showTooltip = true }) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTooltipState, setShowTooltipState] = useState(false);

  // 서비스 데이터 유효성 검사
  if (!service || !service.name || !service.url) {
    console.warn('CompactServiceCard: Invalid service data provided', service);
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

  const handleConfigClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof onConfigClick === 'function') {
      onConfigClick(service);
    }
  };

  return (
    <div 
      className="relative group"
      onMouseEnter={() => showTooltip && setShowTooltipState(true)}
      onMouseLeave={() => setShowTooltipState(false)}
    >
      <Link
        href={service.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center p-3 bg-slate-800/60 backdrop-blur-sm rounded-lg border border-slate-700/50 hover:border-green-400/50 transition-all duration-300 hover:bg-slate-700/60 hover:scale-105 hover:shadow-lg hover:shadow-green-400/20 min-w-[80px] group"
      >
        {/* 서비스 아이콘 */}
        <div className="relative w-10 h-10 mb-2">
          {/* 로딩 상태 */}
          {isLoading && (
            <div className="w-full h-full bg-slate-600/50 animate-pulse rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
            </div>
          )}
          
          {/* 이미지 또는 폴백 아이콘 */}
          {!imageError ? (
            <img
              src={service.icon}
              alt={`${service.name} 아이콘`}
              className={`w-full h-full object-contain rounded-lg transition-all duration-300 ${
                isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              } group-hover:scale-110`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-slate-600/50 rounded-lg flex items-center justify-center">
              <span className="text-lg filter grayscale">📁</span>
            </div>
          )}
          
          {/* 상태 표시 점 */}
          {service.status && (
            <div className="absolute -top-1 -right-1">
              <div className={`w-3 h-3 rounded-full border-2 border-slate-800 ${
                service.status === 'active' ? 'bg-green-400' :
                service.status === 'inactive' ? 'bg-red-400' : 'bg-yellow-400'
              } ${service.status === 'active' ? 'animate-pulse' : ''}`} />
            </div>
          )}
        </div>

        {/* 서비스 이름 */}
        <span className="text-xs font-medium text-slate-200 group-hover:text-green-400 transition-colors duration-300 text-center leading-tight font-ubuntu-mono max-w-[70px] truncate">
          {service.name}
        </span>
      </Link>

      {/* Docker 설정 버튼 (우클릭 메뉴 대신 작은 버튼) */}
      {onConfigClick && service.dockerConfig && (
        <button
          onClick={handleConfigClick}
          className="absolute -top-1 -left-1 w-5 h-5 bg-slate-700/80 backdrop-blur-sm border border-slate-600/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-green-500/20 hover:border-green-400/50 flex items-center justify-center z-10"
          title="Docker 설정 보기"
          aria-label={`${service.name} Docker 설정 보기`}
        >
          <svg 
            className="w-3 h-3 text-slate-400 hover:text-green-400 transition-colors duration-300" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      {/* 툴팁 */}
      {showTooltip && showTooltipState && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-xl z-20 min-w-max">
          <div className="text-sm font-medium text-white font-ubuntu-mono mb-1">
            {service.name}
          </div>
          {service.description && (
            <div className="text-xs text-slate-300 font-ubuntu-mono max-w-[200px]">
              {service.description}
            </div>
          )}
          {service.status && (
            <div className="flex items-center mt-2">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                service.status === 'active' ? 'bg-green-400' :
                service.status === 'inactive' ? 'bg-red-400' : 'bg-yellow-400'
              }`} />
              <span className="text-xs text-slate-400 font-ubuntu-mono">
                {service.status === 'active' ? '활성' : 
                 service.status === 'inactive' ? '비활성' : '알 수 없음'}
              </span>
            </div>
          )}
          
          {/* 툴팁 화살표 */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900/95" />
        </div>
      )}
    </div>
  );
}

// PropTypes 정의
CompactServiceCard.propTypes = {
  service: PropTypes.shape({
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    icon: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.oneOf(['active', 'inactive', 'unknown']),
    dockerConfig: PropTypes.string
  }).isRequired,
  onConfigClick: PropTypes.func,
  showTooltip: PropTypes.bool
};

// 기본값 설정
CompactServiceCard.defaultProps = {
  showTooltip: true
};