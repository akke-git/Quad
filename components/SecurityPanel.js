// components/SecurityPanel.js

import { useState, useEffect } from 'react';

/**
 * 보안 모니터링 정보를 표시하는 패널 컴포넌트
 * 접근 로그, 보안 이벤트, 방화벽 상태 등을 실시간으로 표시
 */
export default function SecurityPanel() {
  const [securityData, setSecurityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showEvents, setShowEvents] = useState(false);

  // 보안 상태 데이터를 가져오는 함수
  const fetchSecurityStatus = async () => {
    try {
      const response = await fetch('/api/system/security');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSecurityData(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch security status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 가져오기 및 주기적 업데이트 설정
  useEffect(() => {
    fetchSecurityStatus();
    
    // 60초마다 업데이트 (보안 로그 분석은 상대적으로 무거운 작업)
    const interval = setInterval(fetchSecurityStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // 보안 레벨에 따른 색상 결정
  const getSecurityColor = (value, type = 'normal') => {
    if (type === 'alert') {
      if (value > 10) return 'text-red-400';
      if (value > 5) return 'text-yellow-400';
      return 'text-green-400';
    }
    
    if (type === 'failed_login') {
      if (value > 50) return 'text-red-400';
      if (value > 20) return 'text-yellow-400';
      return 'text-green-400';
    }

    return 'text-blue-400';
  };

  // 이벤트 심각도에 따른 아이콘
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'warning':
        return '⚠️';
      case 'error':
        return '🚨';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-xl font-bold text-red-400 mb-4 font-apple-gothic flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Security Monitor
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Active Connections', 'Security Alerts', 'Failed Logins'].map((item, index) => (
            <div key={index} className="text-center">
              <div className="animate-pulse bg-gray-600 h-8 w-12 mx-auto mb-2 rounded"></div>
              <div className="text-sm text-gray-400 font-apple-gothic">{item}</div>
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
        <h3 className="text-xl font-bold text-red-400 mb-4 font-apple-gothic flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Security Monitor - Error
        </h3>
        <div className="text-red-300 font-apple-gothic text-sm mb-3">
          {securityData?.status === 'disabled' ? 
            'Security monitoring is disabled. Set ENABLE_SECURITY_MONITORING=true to enable.' :
            `Failed to load security data: ${error}`
          }
        </div>
        {securityData?.status !== 'disabled' && (
          <button 
            onClick={fetchSecurityStatus}
            className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 font-apple-gothic text-sm hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // 보안 모니터링이 비활성화된 경우
  if (securityData?.status === 'disabled') {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-yellow-500/50 p-6">
        <h3 className="text-xl font-bold text-yellow-400 mb-4 font-apple-gothic flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Security Monitor - Disabled
        </h3>
        <div className="text-yellow-300 font-apple-gothic text-sm mb-4">
          Security monitoring is currently disabled for privacy and security reasons.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400 font-apple-gothic">-</div>
            <div className="text-sm text-gray-400 font-apple-gothic">Active Connections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400 font-apple-gothic">-</div>
            <div className="text-sm text-gray-400 font-apple-gothic">Security Alerts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400 font-apple-gothic">-</div>
            <div className="text-sm text-gray-400 font-apple-gothic">Failed Logins</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-red-400 font-apple-gothic flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Security Monitor
          <div className={`w-2 h-2 rounded-full ml-2 ${securityData?.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
        </h3>
        {lastUpdated && (
          <span className="text-xs text-gray-400 font-apple-gothic">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* 주요 보안 메트릭 - 상단 패널과 일관된 스타일 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Active Connections */}
        <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30 hover:border-green-400/50 transition-colors">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              <span className="text-sm text-gray-300 font-apple-gothic">활성 연결</span>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold font-apple-gothic ${getSecurityColor(securityData?.access?.activeConnections || 0)}`}>
                {securityData?.access?.activeConnections || 0}
              </div>
              <div className="text-xs text-gray-500 font-apple-gothic">실시간</div>
            </div>
          </div>
        </div>

        {/* Security Alerts */}
        <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30 hover:border-red-400/50 transition-colors">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <span className="text-sm text-gray-300 font-apple-gothic">보안 경고</span>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold font-apple-gothic ${getSecurityColor(securityData?.security?.alertCount || 0, 'alert')}`}>
                {securityData?.security?.alertCount || 0}
              </div>
              <div className="text-xs text-gray-500 font-apple-gothic">1시간</div>
            </div>
          </div>
        </div>

        {/* Failed Logins */}
        <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30 hover:border-yellow-400/50 transition-colors">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-sm text-gray-300 font-apple-gothic">로그인 실패</span>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold font-apple-gothic ${getSecurityColor(securityData?.auth?.total || 0, 'failed_login')}`}>
                {securityData?.auth?.total || 0}
              </div>
              <div className="text-xs text-gray-500 font-apple-gothic">24시간</div>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="space-y-3">
        {/* 접근 통계 - 조밀한 레이아웃 */}
        {securityData?.access && (
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-200 font-apple-gothic">접근 통계</h3>
              </div>
              <div className="text-xs text-gray-500 font-apple-gothic">최근 1시간</div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-blue-400 font-apple-gothic">
                    {securityData.access.recentAccess?.total || 0}
                  </div>
                  <div className="text-xs text-gray-400 font-apple-gothic">총 요청</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-green-400 font-apple-gothic">
                    {securityData.access.recentAccess?.unique || 0}
                  </div>
                  <div className="text-xs text-gray-400 font-apple-gothic">고유 IP</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <div className={`text-sm font-bold font-apple-gothic ${getSecurityColor(securityData.access.recentAccess?.suspicious || 0, 'alert')}`}>
                    {securityData.access.recentAccess?.suspicious || 0}
                  </div>
                  <div className="text-xs text-gray-400 font-apple-gothic">의심 요청</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-semibold text-purple-400 font-apple-gothic">
                    {securityData.access.recentAccess?.source?.replace('docker-', '').replace('/var/log/', '').substring(0, 6) || 'dev'}
                  </div>
                  <div className="text-xs text-gray-400 font-apple-gothic">로그 소스</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 인증 실패 상세 - 조밀한 레이아웃 */}
        {securityData?.auth && securityData.auth.total > 0 && (
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-200 font-apple-gothic">인증 실패</h3>
              </div>
              <div className="text-xs text-gray-500 font-apple-gothic">{securityData.auth.period || '24시간'}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className={`text-lg font-bold font-apple-gothic ${getSecurityColor(securityData.auth.ssh || 0, 'failed_login')}`}>
                    {securityData.auth.ssh || 0}
                  </div>
                  <div className="text-xs text-gray-400 font-apple-gothic">SSH 실패</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                </div>
                <div>
                  <div className={`text-lg font-bold font-apple-gothic ${getSecurityColor(securityData.auth.web || 0, 'failed_login')}`}>
                    {securityData.auth.web || 0}
                  </div>
                  <div className="text-xs text-gray-400 font-apple-gothic">웹 실패</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 방화벽 상태 - 조밀한 레이아웃 */}
        {securityData?.firewall && (
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
            <div className="flex items-center space-x-2 mb-3">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-sm font-semibold text-gray-200 font-apple-gothic">방화벽 상태</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-blue-400 font-apple-gothic">
                    {securityData.firewall.system?.type || 'unknown'}
                  </div>
                  <div className="text-xs text-gray-400 font-apple-gothic">시스템</div>
                  <div className={`text-xs font-apple-gothic ${securityData.firewall.system?.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {securityData.firewall.system?.status || 'unknown'} 
                    {securityData.firewall.system?.rules && ` (${securityData.firewall.system.rules}규칙)`}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-cyan-400 font-apple-gothic">
                    {securityData.firewall.docker ? securityData.firewall.docker.rules : 0}
                  </div>
                  <div className="text-xs text-gray-400 font-apple-gothic">Docker</div>
                  <div className={`text-xs font-apple-gothic ${securityData.firewall.docker ? 'text-green-400' : 'text-gray-400'}`}>
                    {securityData.firewall.docker ? '활성' : '비활성'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 보안 이벤트 - 조밀한 레이아웃 */}
        {securityData?.security?.events && securityData.security.events.length > 0 && (
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-200 font-apple-gothic">보안 이벤트</h3>
                <div className="bg-red-500/20 px-2 py-0.5 rounded-full">
                  <span className="text-xs text-red-300 font-apple-gothic">{securityData.security.events.length}</span>
                </div>
              </div>
              <button
                onClick={() => setShowEvents(!showEvents)}
                className="flex items-center space-x-1 px-2 py-1 bg-slate-600/30 hover:bg-slate-600/50 border border-slate-500/30 rounded text-xs text-gray-300 font-apple-gothic transition-colors"
              >
                <svg className={`w-3 h-3 transition-transform ${showEvents ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span>{showEvents ? '숨기기' : '보기'}</span>
              </button>
            </div>

            {showEvents && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {securityData.security.events.slice(0, 8).map((event, index) => (
                  <div key={index} className="bg-slate-800/40 rounded-lg p-3 border border-slate-600/20 hover:border-slate-500/40 transition-colors">
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0">
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${
                          event.severity === 'error' ? 'bg-red-500/20' : 
                          event.severity === 'warning' ? 'bg-yellow-500/20' : 'bg-blue-500/20'
                        }`}>
                          <span className="text-sm">{getSeverityIcon(event.severity)}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-200 font-apple-gothic mb-1 leading-relaxed">
                          {event.message}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-apple-gothic ${
                            event.type === 'auth' ? 'bg-red-500/20 text-red-300' :
                            event.type === 'access' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {event.type === 'auth' ? '인증' : event.type === 'access' ? '접근' : event.type}
                          </span>
                          <span className="text-xs text-gray-400 font-apple-gothic">
                            {new Date(event.timestamp).toLocaleString('ko-KR', { 
                              month: 'short', day: 'numeric', 
                              hour: '2-digit', minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 모니터링이 활성화되어 있지만 데이터가 없는 경우 - 조밀한 레이아웃 */}
        {securityData?.status === 'active' && 
         (!securityData.security?.events || securityData.security.events.length === 0) && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-green-400 font-apple-gothic mb-1">
              보안 상태 양호
            </div>
            <div className="text-xs text-gray-300 font-apple-gothic mb-2">
              보안 위협이 감지되지 않았습니다
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400 font-apple-gothic">실시간 모니터링 활성</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}