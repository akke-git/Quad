// components/DockerStatusPanel.js

import { useState, useEffect } from 'react';

/**
 * Docker 상태 정보를 표시하는 패널 컴포넌트
 * 컨테이너, 이미지, 볼륨, 네트워크 정보를 실시간으로 표시
 */
export default function DockerStatusPanel() {
  const [dockerData, setDockerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showContainers, setShowContainers] = useState(false);

  // Docker 상태 데이터를 가져오는 함수
  const fetchDockerStatus = async () => {
    try {
      const response = await fetch('/api/system/docker');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDockerData(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch Docker status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 가져오기 및 주기적 업데이트 설정
  useEffect(() => {
    fetchDockerStatus();
    
    // 15초마다 업데이트 (Docker 상태는 자주 변함)
    const interval = setInterval(fetchDockerStatus, 15000);
    
    return () => clearInterval(interval);
  }, []);

  // 상태에 따른 색상 결정
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'connected':
      case 'available':
        return 'text-green-400';
      case 'inactive':
      case 'disconnected':
      case 'empty':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-xl font-bold text-blue-400 mb-4 font-ubuntu-mono flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Docker Status
        </h3>
        <div className="space-y-4">
          {['Running Containers', 'Total Containers', 'Images', 'Volumes'].map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-gray-300 font-ubuntu-mono">{item}</span>
              <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
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
          Docker Status - Error
        </h3>
        <div className="text-red-300 font-ubuntu-mono text-sm">
          Failed to load Docker data: {error}
        </div>
        <button 
          onClick={fetchDockerStatus}
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
        <h3 className="text-xl font-bold text-blue-400 font-ubuntu-mono flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Docker Status
          <div className={`w-2 h-2 rounded-full ml-2 ${dockerData?.status === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
        </h3>
        {lastUpdated && (
          <span className="text-xs text-gray-400 font-ubuntu-mono">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* 컨테이너 정보 */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-ubuntu-mono">Running Containers</span>
            <span className={`font-ubuntu-mono font-semibold ${getStatusColor(dockerData?.containers?.status)}`}>
              {dockerData?.containers?.running || 0}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-ubuntu-mono">Total Containers</span>
            <span className="text-blue-400 font-ubuntu-mono font-semibold">
              {dockerData?.containers?.total || 0}
            </span>
          </div>

          {dockerData?.containers?.stopped > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-ubuntu-mono text-sm">Stopped</span>
              <span className="text-gray-400 font-ubuntu-mono text-sm">
                {dockerData.containers.stopped}
              </span>
            </div>
          )}
        </div>

        {/* 컨테이너 목록 토글 */}
        {dockerData?.containers?.containers?.length > 0 && (
          <div>
            <button
              onClick={() => setShowContainers(!showContainers)}
              className="flex items-center text-sm text-blue-400 hover:text-blue-300 font-ubuntu-mono transition-colors"
            >
              <svg 
                className={`w-4 h-4 mr-1 transition-transform ${showContainers ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Show Containers
            </button>
            
            {showContainers && (
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {dockerData.containers.containers.map((container, index) => (
                  <div key={index} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-white font-ubuntu-mono truncate">
                        {container.name}
                      </span>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-xs text-gray-400 font-ubuntu-mono mt-1 truncate">
                      {container.image}
                    </div>
                    {container.ports && (
                      <div className="text-xs text-blue-300 font-ubuntu-mono mt-1">
                        {container.ports}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="border-t border-slate-700/50 pt-4 space-y-3">
          {/* 이미지 정보 */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-ubuntu-mono">Images</span>
            <div className="text-right">
              <div className="text-blue-400 font-ubuntu-mono font-semibold">
                {dockerData?.images?.total || 0}
              </div>
              <div className="text-xs text-gray-400 font-ubuntu-mono">
                {dockerData?.images?.totalSize || '0B'}
              </div>
            </div>
          </div>

          {/* 볼륨 정보 */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-ubuntu-mono">Volumes</span>
            <div className="text-right">
              <div className="text-blue-400 font-ubuntu-mono font-semibold">
                {dockerData?.volumes?.total || 0}
              </div>
              <div className="text-xs text-gray-400 font-ubuntu-mono">
                {dockerData?.volumes?.totalSize || '0B'}
              </div>
            </div>
          </div>

          {/* 네트워크 정보 */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-ubuntu-mono">Networks</span>
            <div className="text-right">
              <div className="text-blue-400 font-ubuntu-mono font-semibold">
                {dockerData?.networks?.total || 0}
              </div>
              {dockerData?.networks?.custom > 0 && (
                <div className="text-xs text-gray-400 font-ubuntu-mono">
                  {dockerData.networks.custom} custom
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}