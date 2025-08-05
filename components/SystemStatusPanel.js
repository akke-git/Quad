// components/SystemStatusPanel.js

import { useState, useEffect } from 'react';

/**
 * 시스템 상태 정보를 표시하는 패널 컴포넌트
 * CPU, 메모리, 디스크 사용량, 가동시간 등을 실시간으로 표시
 */
export default function SystemStatusPanel() {
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // 시스템 상태 데이터를 가져오는 함수
  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/system/status');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSystemData(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch system status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 가져오기 및 주기적 업데이트 설정
  useEffect(() => {
    fetchSystemStatus();
    
    // 10초마다 업데이트 (더 빠른 실시간 모니터링)
    const interval = setInterval(fetchSystemStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // 사용률에 따른 색상 결정
  const getStatusColor = (usage, thresholds = { high: 80, medium: 60 }) => {
    if (usage >= thresholds.high) return 'text-red-400';
    if (usage >= thresholds.medium) return 'text-yellow-400';
    return 'text-green-400';
  };

  // 진행률 바 색상 결정 (그라디언트 적용)
  const getProgressColor = (usage, thresholds = { high: 80, medium: 60 }) => {
    if (usage >= thresholds.high) return 'bg-gradient-to-r from-red-500 to-red-400';
    if (usage >= thresholds.medium) return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
    return 'bg-gradient-to-r from-green-500 to-green-400';
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-xl font-bold text-green-400 mb-4 font-ubuntu-mono flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          System Status
        </h3>
        <div className="space-y-4">
          {['CPU Usage', 'Memory', 'Disk Usage', 'Uptime'].map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-gray-300 font-ubuntu-mono">{item}</span>
              <div className="animate-pulse bg-gray-600 h-4 w-20 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-red-500/50 p-6">
        <h3 className="text-xl font-bold text-red-400 mb-4 font-ubuntu-mono flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          System Status - Error
        </h3>
        <div className="text-red-300 font-ubuntu-mono text-sm">
          Failed to load system data: {error}
        </div>
        <button 
          onClick={fetchSystemStatus}
          className="mt-3 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 font-ubuntu-mono text-sm hover:bg-red-500/30 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-green-400 font-ubuntu-mono flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          System Status
          <div className="w-2 h-2 bg-green-400 rounded-full ml-2 animate-pulse"></div>
        </h3>
        {lastUpdated && (
          <span className="text-xs text-gray-400 font-ubuntu-mono">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* CPU 사용률 */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-ubuntu-mono">CPU Usage</span>
            <span className={`font-ubuntu-mono font-semibold ${getStatusColor(systemData?.cpu?.usage || 0)}`}>
              {systemData?.cpu?.usage?.toFixed(1) || 0}%
            </span>
          </div>
          <div className="relative">
            <div className="w-full bg-gradient-to-r from-gray-800 to-gray-700 rounded-full h-4 shadow-inner border border-gray-600/50">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${getProgressColor(systemData?.cpu?.usage || 0)}`}
                style={{ width: `${Math.min(systemData?.cpu?.usage || 0, 100)}%` }}
              >
                {/* 그라디언트 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"></div>
                {/* 애니메이션 글로우 효과 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full animate-pulse"></div>
              </div>
            </div>
            {/* 진행률 텍스트 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-white/90 drop-shadow-lg font-ubuntu-mono">
                {systemData?.cpu?.usage?.toFixed(0) || 0}%
              </span>
            </div>
          </div>
          {systemData?.cpu?.model && (
            <div className="text-xs text-gray-400 font-ubuntu-mono truncate">
              {systemData.cpu.cores} cores - {systemData.cpu.model}
            </div>
          )}
        </div>

        {/* 메모리 사용량 */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-ubuntu-mono">Memory</span>
            <span className={`font-ubuntu-mono font-semibold ${getStatusColor(systemData?.memory?.usage || 0)}`}>
              {systemData?.memory?.usage?.toFixed(1) || 0}%
            </span>
          </div>
          <div className="relative">
            <div className="w-full bg-gradient-to-r from-gray-800 to-gray-700 rounded-full h-4 shadow-inner border border-gray-600/50">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${getProgressColor(systemData?.memory?.usage || 0)}`}
                style={{ width: `${Math.min(systemData?.memory?.usage || 0, 100)}%` }}
              >
                {/* 그라디언트 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"></div>
                {/* 애니메이션 글로우 효과 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full animate-pulse"></div>
              </div>
            </div>
            {/* 진행률 텍스트 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-white/90 drop-shadow-lg font-ubuntu-mono">
                {systemData?.memory?.usage?.toFixed(0) || 0}%
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400 font-ubuntu-mono">
            {systemData?.memory?.used || 0} / {systemData?.memory?.total || 0} MB
          </div>
        </div>

        {/* 디스크 사용량 */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-ubuntu-mono">Disk Usage</span>
            <span className={`font-ubuntu-mono font-semibold ${getStatusColor(systemData?.disk?.usage || 0)}`}>
              {systemData?.disk?.usage?.toFixed(1) || 0}%
            </span>
          </div>
          <div className="relative">
            <div className="w-full bg-gradient-to-r from-gray-800 to-gray-700 rounded-full h-4 shadow-inner border border-gray-600/50">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${getProgressColor(systemData?.disk?.usage || 0)}`}
                style={{ width: `${Math.min(systemData?.disk?.usage || 0, 100)}%` }}
              >
                {/* 그라디언트 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"></div>
                {/* 애니메이션 글로우 효과 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full animate-pulse"></div>
              </div>
            </div>
            {/* 진행률 텍스트 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-white/90 drop-shadow-lg font-ubuntu-mono">
                {systemData?.disk?.usage?.toFixed(0) || 0}%
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400 font-ubuntu-mono">
            {systemData?.disk?.used || '0G'} / {systemData?.disk?.total || '0G'} used
          </div>
        </div>

        {/* 시스템 가동시간 */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
          <span className="text-gray-300 font-ubuntu-mono">Uptime</span>
          <span className="text-blue-400 font-ubuntu-mono font-semibold">
            {systemData?.uptime?.formatted || 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  );
}