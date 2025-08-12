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
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

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

  // 위험 수준 판단 함수
  const getRiskLevel = (value, type) => {
    const riskLevels = {
      failed_login: {
        high: { 
          threshold: 50, 
          color: 'text-red-400', 
          bgColor: 'bg-red-500/20', 
          icon: '🚨', 
          message: '무차별 공격 의심',
          tooltip: '🚨 높은 위험 - SSH 무차별 대입 공격\n24시간 내 50회 이상 로그인 실패\n즉시 조치가 필요합니다'
        },
        medium: { 
          threshold: 20, 
          color: 'text-yellow-400', 
          bgColor: 'bg-yellow-500/20', 
          icon: '⚠️', 
          message: '주의 필요',
          tooltip: '⚠️ 중간 위험 - 로그인 시도 증가\n24시간 내 20-49회 로그인 실패\n모니터링을 강화하세요'
        },
        low: { 
          threshold: 0, 
          color: 'text-green-400', 
          bgColor: 'bg-green-500/20', 
          icon: '✅', 
          message: '정상',
          tooltip: '✅ 정상 상태 - 로그인 보안 양호\n24시간 내 20회 미만 실패\n안전한 수준입니다'
        }
      },
      alert: {
        high: { 
          threshold: 10, 
          color: 'text-red-400', 
          bgColor: 'bg-red-500/20', 
          icon: '🚨', 
          message: '취약점 스캐닝 의심',
          tooltip: '🚨 높은 위험 - 웹 취약점 스캐닝\n1시간 내 10회 이상 보안 경고\n/wp-admin, SQL injection 등 의심'
        },
        medium: { 
          threshold: 5, 
          color: 'text-yellow-400', 
          bgColor: 'bg-yellow-500/20', 
          icon: '⚠️', 
          message: '모니터링 강화',
          tooltip: '⚠️ 중간 위험 - 보안 이벤트 증가\n1시간 내 5-9회 보안 경고\n의심스러운 패턴이 감지됨'
        },
        low: { 
          threshold: 0, 
          color: 'text-green-400', 
          bgColor: 'bg-green-500/20', 
          icon: '✅', 
          message: '정상',
          tooltip: '✅ 정상 상태 - 보안 상태 양호\n1시간 내 5회 미만 경고\n정상적인 접근 패턴'
        }
      },
      connection: {
        high: { 
          threshold: 20, 
          color: 'text-red-400', 
          bgColor: 'bg-red-500/20', 
          icon: '🚨', 
          message: 'DDoS 의심',
          tooltip: '🚨 높은 위험 - DDoS 공격 의심\n20개 이상 동시 연결\n비정상적인 트래픽 급증'
        },
        medium: { 
          threshold: 10, 
          color: 'text-yellow-400', 
          bgColor: 'bg-yellow-500/20', 
          icon: '⚠️', 
          message: '연결 급증',
          tooltip: '⚠️ 중간 위험 - 연결 수 증가\n10-19개 동시 연결\n평소보다 높은 접속량'
        },
        low: { 
          threshold: 0, 
          color: 'text-green-400', 
          bgColor: 'bg-green-500/20', 
          icon: '✅', 
          message: '정상',
          tooltip: '✅ 정상 상태 - 연결 상태 안정\n10개 미만 동시 연결\n정상적인 트래픽 수준'
        }
      },
      suspicious: {
        high: { 
          threshold: 20, 
          color: 'text-red-400', 
          bgColor: 'bg-red-500/20', 
          icon: '🚨', 
          message: '악성 요청 급증',
          tooltip: '🚨 높은 위험 - 악성 요청 대량 발생\n1시간 내 20회 이상 의심 요청\n자동화된 공격 도구 사용 의심'
        },
        medium: { 
          threshold: 5, 
          color: 'text-yellow-400', 
          bgColor: 'bg-yellow-500/20', 
          icon: '⚠️', 
          message: '의심 요청 증가',
          tooltip: '⚠️ 중간 위험 - 의심스러운 활동\n1시간 내 5-19회 의심 요청\n취약점 탐지 시도 가능성'
        },
        low: { 
          threshold: 0, 
          color: 'text-green-400', 
          bgColor: 'bg-green-500/20', 
          icon: '✅', 
          message: '정상',
          tooltip: '✅ 정상 상태 - 웹 요청 안전\n1시간 내 5회 미만 의심 요청\n정상적인 웹 트래픽'
        }
      }
    };

    const levels = riskLevels[type] || riskLevels.failed_login;
    
    if (value >= levels.high.threshold) return { level: 'HIGH', ...levels.high };
    if (value >= levels.medium.threshold) return { level: 'MEDIUM', ...levels.medium };
    return { level: 'LOW', ...levels.low };
  };

  // 확장 섹션 토글
  const toggleExpandSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // 정보 모달 표시
  const showInfoPopup = (infoType) => {
    setSelectedInfo(infoType);
    setShowInfoModal(true);
  };

  // 정보 모달 데이터
  const getInfoModalContent = (type) => {
    const infoData = {
      activeConnections: {
        title: 'Active Connections (실시간 연결 수)',
        definition: '현재 웹서버(포트 80, 443, 8080, 3000)에 활성화된 TCP 연결 수',
        dataSource: 'netstat -tn | grep ESTABLISHED 명령어 결과',
        collection: 'netstat -tn | grep \':80\\|:443\\|:8080\\|:3000\' | grep ESTABLISHED | wc -l',
        details: '현재는 숫자만 표시하지만, 실제로는 연결된 IP 주소와 포트 정보도 수집 가능합니다.'
      },
      securityAlerts: {
        title: 'Security Alerts (보안 경고)',
        definition: '지난 1시간 동안 감지된 보안 관련 경고 수',
        dataSource: '시스템 로그 (journalctl) 및 접근 로그 분석',
        collection: 'SSH 로그인 실패, 의심스러운 웹 요청 패턴 (/wp-admin, /phpmyadmin, sql, script 등), 방화벽 차단 이벤트',
        details: 'securityData.security.events 배열에 각 이벤트의 타입, 메시지, 시간, 심각도가 저장됩니다.'
      },
      failedLogins: {
        title: 'Failed Logins (로그인 실패)',
        definition: '지난 24시간 동안의 실패한 로그인 시도 총 수',
        dataSource: 'SSH: journalctl -u ssh | grep "Failed password", 웹: Nginx/Apache 접근 로그의 401, 403 상태 코드',
        collection: 'SSH 로그인 실패 수 + 웹 인증 실패 수',
        details: 'SSH와 웹 인증 실패를 분리하여 추적하며, 24시간 기준으로 집계됩니다.'
      },
      firewall: {
        title: 'Firewall (방화벽 상태)',
        definition: '시스템 방화벽 상태와 활성 규칙 수',
        dataSource: 'UFW: ufw status 명령어, iptables: iptables -L INPUT 명령어',
        collection: '방화벽 타입 (ufw, iptables, wsl), 활성 규칙 수, 상태 (active/inactive)',
        details: '시스템에 설정된 방화벽 규칙의 개수와 활성 상태를 모니터링합니다.'
      }
    };
    return infoData[type] || {};
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 h-full">
        <h3 className="text-xl font-bold text-red-400 mb-4 font-ubuntu-mono flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Security Monitor
        </h3>
        <div className="space-y-4">
          {['Active Connections', 'Security Alerts', 'Failed Logins'].map((item, index) => (
            <div key={index} className="bg-gradient-to-r from-slate-700/40 to-slate-600/40 rounded-lg p-4">
              <div className="animate-pulse bg-gray-600 h-8 w-12 mb-2 rounded"></div>
              <div className="text-sm text-gray-400 font-ubuntu-mono">{item}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-red-500/50 p-6 h-full">
        <h3 className="text-xl font-bold text-red-400 mb-4 font-ubuntu-mono flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Security Monitor - Error
        </h3>
        <div className="text-red-300 font-ubuntu-mono text-sm mb-4">
          Failed to load security data: {error}
        </div>
        <button 
          onClick={fetchSecurityStatus}
          className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 font-ubuntu-mono text-sm hover:bg-red-500/30 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // 보안 모니터링이 비활성화된 경우
  if (securityData?.status === 'disabled') {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-yellow-500/50 p-6 h-full">
        <h3 className="text-xl font-bold text-yellow-400 mb-4 font-ubuntu-mono flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Security Monitor - Disabled
        </h3>
        <div className="text-yellow-300 font-ubuntu-mono text-sm mb-4">
          Security monitoring is currently disabled for privacy and security reasons.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h3 className="text-xl font-bold text-red-400 font-ubuntu-mono flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Security Monitor
            <div className={`w-2 h-2 rounded-full ml-2 ${securityData?.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
          </h3>
          {/* 전체 위험 수준 표시 */}
          {securityData && (() => {
            const failedLogins = securityData?.auth?.total || 0;
            const alerts = securityData?.security?.alertCount || 0;
            const connections = securityData?.access?.activeConnections || 0;
            const suspicious = securityData?.access?.recentAccess?.suspicious || 0;
            
            // 가장 높은 위험 수준 계산
            const risks = [
              getRiskLevel(failedLogins, 'failed_login'),
              getRiskLevel(alerts, 'alert'), 
              getRiskLevel(connections, 'connection'),
              getRiskLevel(suspicious, 'suspicious')
            ];
            
            const highestRisk = risks.find(r => r.level === 'HIGH') || 
                              risks.find(r => r.level === 'MEDIUM') || 
                              risks[0];
            
            return (
              <div 
                className={`ml-4 px-3 py-1 rounded-full ${highestRisk.bgColor} ${highestRisk.color} text-xs font-mono cursor-help`}
                title={`전체 위험 수준: ${highestRisk.level}\n\n${highestRisk.tooltip}`}
              >
                {highestRisk.icon} {highestRisk.level} RISK
              </div>
            );
          })()}
        </div>
        <div className="text-right">
          {lastUpdated && (
            <span className="text-xs text-gray-400 font-ubuntu-mono">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* 보안 메트릭 카드들 - 세로 레이아웃 */}
      <div className="flex-1 space-y-4">
        {/* Active Connections */}
        <div className="bg-gradient-to-r from-slate-700/40 to-slate-600/40 rounded-lg p-4 border border-slate-600/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 717.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-gray-200 font-semibold font-ubuntu-mono">Active Connections</h4>
                  <button 
                    onClick={() => showInfoPopup('activeConnections')}
                    className="w-4 h-4 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => toggleExpandSection('activeConnections')}
                    className="w-4 h-4 text-gray-400 hover:text-green-400 transition-colors"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={`transform transition-transform ${expandedSections.activeConnections ? 'rotate-180' : ''}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-400">실시간 연결 수</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold font-ubuntu-mono ${getSecurityColor(securityData?.access?.activeConnections || 0)}`}>
                {securityData?.access?.activeConnections || 0}
              </div>
              {(() => {
                const risk = getRiskLevel(securityData?.access?.activeConnections || 0, 'connection');
                return (
                  <div 
                    className={`text-xs px-2 py-1 rounded-full ${risk.bgColor} ${risk.color} font-mono mt-1 cursor-help`}
                    title={risk.tooltip}
                  >
                    {risk.icon} {risk.message}
                  </div>
                );
              })()}
            </div>
          </div>
          
          {/* 확장 섹션 */}
          {expandedSections.activeConnections && (
            <div className="mt-4 pt-4 border-t border-slate-600/30">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">최근 접속:</span>
                  <span className="text-gray-300 font-ubuntu-mono">{securityData?.access?.recentAccess?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">고유 IP:</span>
                  <span className="text-gray-300 font-ubuntu-mono">{securityData?.access?.recentAccess?.unique || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">의심스러운 요청:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-400 font-ubuntu-mono">{securityData?.access?.recentAccess?.suspicious || 0}</span>
                    {(() => {
                      const risk = getRiskLevel(securityData?.access?.recentAccess?.suspicious || 0, 'suspicious');
                      return (
                        <div 
                          className={`text-xs px-2 py-1 rounded-full ${risk.bgColor} ${risk.color} cursor-help`}
                          title={risk.tooltip}
                        >
                          {risk.icon}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                {securityData?.access?.recentAccess?.topIPs && securityData.access.recentAccess.topIPs.length > 0 && (
                  <div className="mt-3">
                    <div className="text-gray-400 text-xs mb-1">상위 접근 IP:</div>
                    <div className="space-y-1">
                      {securityData.access.recentAccess.topIPs.slice(0, 3).map((ip, index) => (
                        <div key={index} className="text-xs text-gray-300 font-ubuntu-mono bg-slate-800/50 px-2 py-1 rounded">
                          {ip}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Security Alerts */}
        <div className="bg-gradient-to-r from-slate-700/40 to-slate-600/40 rounded-lg p-4 border border-slate-600/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-gray-200 font-semibold font-ubuntu-mono">Security Alerts</h4>
                  <button 
                    onClick={() => showInfoPopup('securityAlerts')}
                    className="w-4 h-4 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => toggleExpandSection('securityAlerts')}
                    className="w-4 h-4 text-gray-400 hover:text-green-400 transition-colors"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={`transform transition-transform ${expandedSections.securityAlerts ? 'rotate-180' : ''}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-400 ">보안 경고 (1시간)</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold font-ubuntu-mono ${getSecurityColor(securityData?.security?.alertCount || 0, 'alert')}`}>
                {securityData?.security?.alertCount || 0}
              </div>
              {(() => {
                const risk = getRiskLevel(securityData?.security?.alertCount || 0, 'alert');
                return (
                  <div 
                    className={`text-xs px-2 py-1 rounded-full ${risk.bgColor} ${risk.color} font-mono mt-1 cursor-help`}
                    title={risk.tooltip}
                  >
                    {risk.icon} {risk.message}
                  </div>
                );
              })()}
            </div>
          </div>
          
          {/* 확장 섹션 */}
          {expandedSections.securityAlerts && (
            <div className="mt-4 pt-4 border-t border-slate-600/30">
              <div className="space-y-2 text-sm">
                <div className="text-gray-400 text-xs mb-2">최근 보안 이벤트:</div>
                {securityData?.security?.events && securityData.security.events.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {securityData.security.events.slice(0, 5).map((event, index) => (
                      <div key={index} className="bg-slate-800/50 px-3 py-2 rounded text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-ubuntu-mono ${
                            event.severity === 'warning' ? 'text-yellow-400' : 
                            event.severity === 'error' ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {event.type.toUpperCase()}
                          </span>
                          <span className="text-gray-500 font-ubuntu-mono">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-gray-300">
                          {event.message}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500  text-xs">이벤트가 없습니다</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Failed Logins */}
        <div className="bg-gradient-to-r from-slate-700/40 to-slate-600/40 rounded-lg p-4 border border-slate-600/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-gray-200 font-semibold font-ubuntu-mono">Failed Logins</h4>
                  <button 
                    onClick={() => showInfoPopup('failedLogins')}
                    className="w-4 h-4 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => toggleExpandSection('failedLogins')}
                    className="w-4 h-4 text-gray-400 hover:text-green-400 transition-colors"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={`transform transition-transform ${expandedSections.failedLogins ? 'rotate-180' : ''}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-400 ">로그인 실패 (24시간)</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold font-ubuntu-mono ${getSecurityColor(securityData?.auth?.total || 0, 'failed_login')}`}>
                {securityData?.auth?.total || 0}
              </div>
              {(() => {
                const risk = getRiskLevel(securityData?.auth?.total || 0, 'failed_login');
                return (
                  <div 
                    className={`text-xs px-2 py-1 rounded-full ${risk.bgColor} ${risk.color} font-mono mt-1 cursor-help`}
                    title={risk.tooltip}
                  >
                    {risk.icon} {risk.message}
                  </div>
                );
              })()}
            </div>
          </div>
          
          {/* 확장 섹션 */}
          {expandedSections.failedLogins && (
            <div className="mt-4 pt-4 border-t border-slate-600/30">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">SSH 실패:</span>
                  <span className="text-yellow-400 font-ubuntu-mono">{securityData?.auth?.ssh || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">웹 실패:</span>
                  <span className="text-yellow-400 font-ubuntu-mono">{securityData?.auth?.web || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">집계 기간:</span>
                  <span className="text-gray-300">{securityData?.auth?.period || '24시간'}</span>
                </div>
                <div className="mt-3 text-xs text-gray-500 bg-slate-800/50 p-2 rounded">
                  <div className="font-semibold text-gray-400 mb-1">📌 보안 알림:</div>
                  <div>• SSH 실패 횟수가 많으면 무차별 대입 공격일 수 있습니다</div>
                  <div>• 웹 실패는 401, 403 상태 코드를 기반으로 집계됩니다</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 방화벽 상태 */}
        {securityData?.firewall && (
          <div className="bg-gradient-to-r from-slate-700/40 to-slate-600/40 rounded-lg p-4 border border-slate-600/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-gray-200 font-semibold font-ubuntu-mono">Firewall</h4>
                    <button 
                      onClick={() => showInfoPopup('firewall')}
                      className="w-4 h-4 text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => toggleExpandSection('firewall')}
                      className="w-4 h-4 text-gray-400 hover:text-green-400 transition-colors"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={`transform transition-transform ${expandedSections.firewall ? 'rotate-180' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 font-ubuntu-mono">{securityData.firewall.system?.type || 'unknown'}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-orange-400 font-ubuntu-mono">
                  {securityData.firewall.system?.rules || 0}
                </div>
                <div className="text-xs text-gray-400 font-ubuntu-mono">rules</div>
              </div>
            </div>
            
            {/* 확장 섹션 */}
            {expandedSections.firewall && (
              <div className="mt-4 pt-4 border-t border-slate-600/30">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">방화벽 타입:</span>
                    <span className="text-orange-400 font-ubuntu-mono">{securityData.firewall.system?.type || 'unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">상태:</span>
                    <span className={`font-ubuntu-mono ${
                      securityData.firewall.system?.status === 'active' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {securityData.firewall.system?.status || 'unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">활성 규칙:</span>
                    <span className="text-orange-400">{securityData.firewall.system?.rules || 0}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">마지막 확인:</span>
                    <span className="text-gray-300 font-ubuntu-mono">
                      {securityData.firewall.lastChecked ? 
                        new Date(securityData.firewall.lastChecked).toLocaleTimeString() : 
                        'Unknown'
                      }
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-gray-500 bg-slate-800/50 p-2 rounded">
                    <div className="font-semibold text-gray-400 mb-1">🔒 방화벽 정보:</div>
                    <div>• UFW: Ubuntu 방화벽 관리 도구</div>
                    <div>• iptables: 리눅스 패킷 필터링 시스템</div>
                    <div>• WSL: Windows Subsystem for Linux 환경</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 정보 모달 */}
      {showInfoModal && selectedInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-blue-400 font-ubuntu-mono">
                📊 {getInfoModalContent(selectedInfo).title}
              </h3>
              <button 
                onClick={() => setShowInfoModal(false)}
                className="w-8 h-8 text-gray-400 hover:text-white rounded-lg hover:bg-slate-700 flex items-center justify-center transition-colors"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 정의 */}
              <div>
                <h4 className="text-lg font-semibold text-green-400 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  정의
                </h4>
                <p className="text-gray-300  text-sm leading-relaxed bg-slate-900/50 p-4 rounded-lg">
                  {getInfoModalContent(selectedInfo).definition}
                </p>
              </div>

              {/* 데이터 소스 */}
              <div>
                <h4 className="text-lg font-semibold text-purple-400 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  데이터 소스
                </h4>
                <p className="text-gray-300  text-sm leading-relaxed bg-slate-900/50 p-4 rounded-lg">
                  {getInfoModalContent(selectedInfo).dataSource}
                </p>
              </div>

              {/* 수집 방법 */}
              <div>
                <h4 className="text-lg font-semibold text-yellow-400 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  수집 방법
                </h4>
                <div className="text-gray-300  text-sm leading-relaxed bg-slate-900/50 p-4 rounded-lg">
                  <code className="text-green-300 bg-black/50 px-2 py-1 rounded text-xs block whitespace-pre-wrap">
                    {getInfoModalContent(selectedInfo).collection}
                  </code>
                </div>
              </div>

              {/* 상세 설명 */}
              <div>
                <h4 className="text-lg font-semibold text-orange-400 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  상세 내역
                </h4>
                <p className="text-gray-300  text-sm leading-relaxed bg-slate-900/50 p-4 rounded-lg">
                  {getInfoModalContent(selectedInfo).details}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}