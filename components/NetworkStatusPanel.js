// components/NetworkStatusPanel.js

import { useState, useEffect } from 'react';

/**
 * 네트워크 상태 정보를 표시하는 패널 컴포넌트
 * 도메인 상태, Nginx 프록시, Cloudflare 연결 등을 실시간으로 표시
 */
export default function NetworkStatusPanel() {
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showDomains, setShowDomains] = useState(false);

  // 네트워크 상태 데이터를 가져오는 함수
  const fetchNetworkStatus = async () => {
    try {
      const response = await fetch('/api/system/network');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNetworkData(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch network status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 가져오기 및 주기적 업데이트 설정
  useEffect(() => {
    fetchNetworkStatus();
    
    // 60초마다 업데이트 (네트워크 체크는 상대적으로 느림)
    const interval = setInterval(fetchNetworkStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // 상태에 따른 색상 및 아이콘 결정
  const getStatusInfo = (status) => {
    switch (status) {
      case 'online':
      case 'running':
      case 'connected':
      case 'working':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-400',
          icon: '🟢',
          text: 'Online'
        };
      case 'offline':
      case 'stopped':
      case 'disconnected':
      case 'failed':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-400',
          icon: '🔴',
          text: 'Offline'
        };
      case 'checking':
      case 'unknown':
      default:
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400',
          icon: '🟡',
          text: 'Checking...'
        };
    }
  };

  // 응답 시간에 따른 성능 표시
  const getResponseTimeColor = (responseTime) => {
    if (!responseTime) return 'text-gray-400';
    if (responseTime < 200) return 'text-green-400';
    if (responseTime < 500) return 'text-yellow-400';
    return 'text-red-400';
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-xl font-bold text-purple-400 mb-4 font-ubuntu-mono flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
          </svg>
          Network Status
        </h3>
        <div className="space-y-4">
          {['juux.net Services', 'Network Stats'].map((item, index) => (
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
          Network Status - Error
        </h3>
        <div className="text-red-300 font-ubuntu-mono text-sm">
          Failed to load network data: {error}
        </div>
        <button 
          onClick={fetchNetworkStatus}
          className="mt-3 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 font-ubuntu-mono text-sm hover:bg-red-500/30 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // 주요 도메인들 (main, admin 제외한 서비스 도메인들)
  const serviceDomains = networkData?.domains?.filter(domain => domain.type === 'service') || [];
  const mainDomain = networkData?.domains?.find(domain => domain.type === 'main');
  const adminDomains = networkData?.domains?.filter(domain => domain.type === 'admin') || [];

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-purple-400 font-ubuntu-mono flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
          </svg>
          Network Status
          <div className={`w-2 h-2 rounded-full ml-2 ${networkData?.status === 'online' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
        </h3>
        {lastUpdated && (
          <span className="text-xs text-gray-400 font-ubuntu-mono">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* 메인 도메인 */}
        {mainDomain && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-ubuntu-mono font-semibold">{mainDomain.name}</span>
              <div className="flex items-center space-x-2">
                {mainDomain.responseTime && (
                  <span className={`text-xs font-ubuntu-mono ${getResponseTimeColor(mainDomain.responseTime)}`}>
                    {mainDomain.responseTime}ms
                  </span>
                )}
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${getStatusInfo(mainDomain.status).bgColor} ${mainDomain.status === 'online' ? 'animate-pulse' : ''}`}></div>
                  <span className={`text-sm font-ubuntu-mono ${getStatusInfo(mainDomain.status).color}`}>
                    {getStatusInfo(mainDomain.status).text}
                  </span>
                </div>
              </div>
            </div>
            {mainDomain.ssl && (
              <div className="text-xs text-green-300 font-ubuntu-mono pl-4">🔒 SSL Active</div>
            )}
          </div>
        )}

        {/* 서비스 도메인 요약 */}
        {serviceDomains.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-ubuntu-mono">Services</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400 font-ubuntu-mono">
                  {serviceDomains.filter(d => d.status === 'online').length}/{serviceDomains.length}
                </span>
                <button
                  onClick={() => setShowDomains(!showDomains)}
                  className="text-xs text-purple-400 hover:text-purple-300 font-ubuntu-mono transition-colors"
                >
                  {showDomains ? 'Hide' : 'Show'} Details
                </button>
              </div>
            </div>

            {/* 서비스 도메인 상세 */}
            {showDomains && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {serviceDomains.map((domain, index) => (
                  <div key={index} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-white font-ubuntu-mono">
                        {domain.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        {domain.responseTime && (
                          <span className={`text-xs font-ubuntu-mono ${getResponseTimeColor(domain.responseTime)}`}>
                            {domain.responseTime}ms
                          </span>
                        )}
                        <div className={`w-2 h-2 rounded-full ${getStatusInfo(domain.status).bgColor} ${domain.status === 'online' ? 'animate-pulse' : ''}`}></div>
                      </div>
                    </div>
                    {domain.error && (
                      <div className="text-xs text-red-300 font-ubuntu-mono mt-1">
                        {domain.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 네트워크 통계 */}
        {networkData?.network && (
          <div className="border-t border-slate-700/50 pt-4">
            <div className="bg-slate-700/20 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-200 font-ubuntu-mono mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Network Stats
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 font-ubuntu-mono text-xs">Active Connections</div>
                  <div className="text-blue-400 font-ubuntu-mono font-bold text-lg">
                    {networkData.network.activeConnections || 0}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 font-ubuntu-mono text-xs">Network Interfaces</div>
                  <div className="text-blue-400 font-ubuntu-mono font-bold text-lg">
                    {networkData.network.interfaces?.length || 0}
                  </div>
                </div>
              </div>
              {networkData.network.traffic && (
                <div className="mt-3 pt-3 border-t border-slate-600/50">
                  <div className="text-gray-400 font-ubuntu-mono text-xs mb-2">Session Traffic</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <span className="text-green-400 mr-2">↓</span>
                      <span className="text-gray-300 font-ubuntu-mono">{networkData.network.traffic.received}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-red-400 mr-2">↑</span>
                      <span className="text-gray-300 font-ubuntu-mono">{networkData.network.traffic.transmitted}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}