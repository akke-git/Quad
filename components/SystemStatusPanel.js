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

  // 원형 차트용 색상 결정
  const getCircleColor = (usage, thresholds = { high: 80, medium: 60 }) => {
    if (usage >= thresholds.high) return '#EF4444'; // red-500
    if (usage >= thresholds.medium) return '#EAB308'; // yellow-500
    return '#22C55E'; // green-500
  };

  // 원형 차트 SVG 생성
  const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* 배경 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#374151"
            strokeWidth={strokeWidth}
            fill="none"
            opacity="0.3"
          />
          {/* 진행률 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${color}40)`
            }}
          />
        </svg>
        {/* 중앙 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white font-ubuntu-mono">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
    );
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

      {/* 원형 차트 그리드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* CPU 사용률 */}
        <div className="text-center">
          <CircularProgress 
            percentage={systemData?.cpu?.usage || 0}
            color={getCircleColor(systemData?.cpu?.usage || 0)}
            size={100}
            strokeWidth={6}
          />
          <div className="mt-3">
            <h4 className="text-sm font-semibold text-gray-300 font-ubuntu-mono">CPU</h4>
            {systemData?.cpu?.cores && (
              <p className="text-xs text-gray-400 font-ubuntu-mono">{systemData.cpu.cores} cores</p>
            )}
          </div>
        </div>

        {/* 메모리 사용량 */}
        <div className="text-center">
          <CircularProgress 
            percentage={systemData?.memory?.usage || 0}
            color={getCircleColor(systemData?.memory?.usage || 0)}
            size={100}
            strokeWidth={6}
          />
          <div className="mt-3">
            <h4 className="text-sm font-semibold text-gray-300 font-ubuntu-mono">Memory</h4>
            <p className="text-xs text-gray-400 font-ubuntu-mono">
              {systemData?.memory?.used || 0} / {systemData?.memory?.total || 0} MB
            </p>
          </div>
        </div>

        {/* 디스크 사용량 */}
        <div className="text-center">
          <CircularProgress 
            percentage={systemData?.disk?.usage || 0}
            color={getCircleColor(systemData?.disk?.usage || 0)}
            size={100}
            strokeWidth={6}
          />
          <div className="mt-3">
            <h4 className="text-sm font-semibold text-gray-300 font-ubuntu-mono">Disk</h4>
            <p className="text-xs text-gray-400 font-ubuntu-mono">
              {systemData?.disk?.used || '0G'} / {systemData?.disk?.total || '0G'}
            </p>
          </div>
        </div>
      </div>

      {/* 시스템 정보 */}
      <div className="border-t border-slate-700/50 pt-4 space-y-3">
        {/* 가동시간 */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300 font-ubuntu-mono flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Uptime
          </span>
          <span className="text-blue-400 font-ubuntu-mono font-semibold">
            {systemData?.uptime?.formatted || 'Unknown'}
          </span>
        </div>

        {/* CPU 모델 정보 */}
        {systemData?.cpu?.model && (
          <div className="text-xs text-gray-400 font-ubuntu-mono bg-slate-900/50 p-2 rounded">
            <span className="text-gray-300">CPU:</span> {systemData.cpu.model}
          </div>
        )}
      </div>
    </div>
  );
}