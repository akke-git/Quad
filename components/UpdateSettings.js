// components/UpdateSettings.js

import { useState, useEffect, useRef } from 'react';

/**
 * 실시간 업데이트 설정 컴포넌트
 * 사용자가 각 패널의 업데이트 주기를 조정할 수 있음
 */
export default function UpdateSettings({ onSettingsChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    system: 10000,    // 10초
    docker: 15000,    // 15초
    network: 60000,   // 60초
    security: 60000,  // 60초
    autoUpdate: true  // 자동 업데이트 활성화/비활성화
  });
  const isInitialLoad = useRef(true);

  // 로컬 스토리지에서 설정 불러오기
  useEffect(() => {
    const savedSettings = localStorage.getItem('dashboard-update-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      if (isInitialLoad.current) {
        onSettingsChange?.(parsed);
        isInitialLoad.current = false;
      }
    } else {
      // 기본 설정으로 초기화
      if (isInitialLoad.current) {
        const defaultSettings = {
          system: 10000,
          docker: 15000,
          network: 60000,
          security: 60000,
          autoUpdate: true
        };
        onSettingsChange?.(defaultSettings);
        isInitialLoad.current = false;
      }
    }
  }, []);

  // 설정 변경 시 로컬 스토리지에 저장
  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('dashboard-update-settings', JSON.stringify(newSettings));
    onSettingsChange?.(newSettings);
  };

  // 미리 정의된 업데이트 주기 옵션
  const updateOptions = [
    { label: '5초 (매우 빠름)', value: 5000, recommended: ['system'] },
    { label: '10초 (빠름)', value: 10000, recommended: ['system', 'docker'] },
    { label: '15초 (보통)', value: 15000, recommended: ['docker'] },
    { label: '30초 (느림)', value: 30000, recommended: ['system', 'docker'] },
    { label: '60초 (매우 느림)', value: 60000, recommended: ['network', 'security'] },
    { label: '5분 (수동)', value: 300000, recommended: [] }
  ];

  // 현재 설정에 따른 상태 표시
  const getStatusColor = (interval) => {
    if (interval <= 10000) return 'text-green-400';
    if (interval <= 30000) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatInterval = (ms) => {
    if (ms < 60000) return `${ms / 1000}초`;
    return `${ms / 60000}분`;
  };

  return (
    <div className="relative">
      {/* 설정 토글 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 rounded-lg transition-colors text-sm font-apple-gothic"
        title="실시간 업데이트 설정"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
        <span className="text-gray-300">
          업데이트 설정
        </span>
        <div className={`w-2 h-2 rounded-full ${settings.autoUpdate ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
      </button>

      {/* 설정 패널 */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl z-50 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white font-apple-gothic">실시간 업데이트 설정</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 자동 업데이트 토글 */}
          <div className="mb-4 p-3 bg-slate-700/30 rounded-lg">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-200 font-apple-gothic">자동 업데이트</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.autoUpdate}
                  onChange={(e) => updateSetting('autoUpdate', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full transition-colors ${settings.autoUpdate ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${settings.autoUpdate ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`}></div>
                </div>
              </div>
            </label>
          </div>

          {/* 개별 패널 설정 */}
          <div className="space-y-4">
            {[
              { key: 'system', label: '시스템 상태', icon: '📊' },
              { key: 'docker', label: 'Docker 상태', icon: '🐳' },
              { key: 'network', label: '네트워크 상태', icon: '🌐' },
              { key: 'security', label: '보안 모니터링', icon: '🔒' }
            ].map((panel) => (
              <div key={panel.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-200 font-apple-gothic flex items-center">
                    <span className="mr-2">{panel.icon}</span>
                    {panel.label}
                  </span>
                  <span className={`text-xs font-apple-gothic ${getStatusColor(settings[panel.key])}`}>
                    {formatInterval(settings[panel.key])}
                  </span>
                </div>
                <select
                  value={settings[panel.key]}
                  onChange={(e) => updateSetting(panel.key, parseInt(e.target.value))}
                  disabled={!settings.autoUpdate}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white font-apple-gothic focus:outline-none focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                      {option.recommended.includes(panel.key) && ' (권장)'}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* 프리셋 버튼 */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="text-xs text-gray-400 font-apple-gothic mb-2">빠른 설정:</div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const fastSettings = { ...settings, system: 5000, docker: 10000, network: 30000, security: 60000 };
                  setSettings(fastSettings);
                  localStorage.setItem('dashboard-update-settings', JSON.stringify(fastSettings));
                  onSettingsChange?.(fastSettings);
                }}
                className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded text-xs text-green-300 font-apple-gothic hover:bg-green-500/30 transition-colors"
              >
                고성능
              </button>
              <button
                onClick={() => {
                  const balancedSettings = { ...settings, system: 15000, docker: 30000, network: 60000, security: 60000 };
                  setSettings(balancedSettings);
                  localStorage.setItem('dashboard-update-settings', JSON.stringify(balancedSettings));
                  onSettingsChange?.(balancedSettings);
                }}
                className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-xs text-yellow-300 font-apple-gothic hover:bg-yellow-500/30 transition-colors"
              >
                균형
              </button>
              <button
                onClick={() => {
                  const powerSaveSettings = { ...settings, system: 60000, docker: 60000, network: 300000, security: 300000 };
                  setSettings(powerSaveSettings);
                  localStorage.setItem('dashboard-update-settings', JSON.stringify(powerSaveSettings));
                  onSettingsChange?.(powerSaveSettings);
                }}
                className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded text-xs text-blue-300 font-apple-gothic hover:bg-blue-500/30 transition-colors"
              >
                절약
              </button>
            </div>
          </div>

          {/* 현재 상태 요약 */}
          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
            <div className="text-xs text-gray-400 font-apple-gothic mb-1">현재 상태:</div>
            <div className="text-xs text-gray-300 font-apple-gothic">
              자동 업데이트: {settings.autoUpdate ? '활성화' : '비활성화'} • 
              평균 주기: {formatInterval((settings.system + settings.docker + settings.network + settings.security) / 4)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}