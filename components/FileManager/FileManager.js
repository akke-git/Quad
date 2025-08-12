// components/FileManager/FileManager.js
import { useState, useEffect } from 'react';
import FileExplorer from './FileExplorer';
import FileList from './FileList';
import Toolbar from './Toolbar';

export default function FileManager() {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  // 파일 목록 로드
  const loadFiles = async (path = currentPath) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      
      if (data.success) {
        setFiles(data.files || []);
      } else {
        throw new Error(data.message || 'Failed to load files');
      }
      
    } catch (error) {
      console.error('파일 목록 로드 실패:', error);
      setFiles([]);
      // TODO: 사용자에게 오류 메시지 표시
    } finally {
      setLoading(false);
    }
  };

  // 경로 변경 처리
  const handlePathChange = (newPath) => {
    setCurrentPath(newPath);
    setSelectedFiles([]);
    loadFiles(newPath);
  };

  // 파일 선택 처리
  const handleFileSelect = (file, isMultiSelect = false) => {
    // 전체 선택 해제를 위한 특별한 케이스
    if (file === null && isMultiSelect === false) {
      setSelectedFiles([]);
      return;
    }
    
    if (isMultiSelect) {
      setSelectedFiles(prev => {
        const isSelected = prev.some(f => f.path === file.path);
        if (isSelected) {
          return prev.filter(f => f.path !== file.path);
        } else {
          return [...prev, file];
        }
      });
    } else {
      setSelectedFiles([file]);
    }
  };

  // 파일 더블클릭 처리 (폴더 진입)
  const handleFileDoubleClick = (file) => {
    if (file.type === 'directory') {
      handlePathChange(file.path);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadFiles();
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 h-[calc(100vh-200px)] flex flex-col font-apple-gothic">
      {/* 서버 호스트 폴더 빠른 접근 버튼 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex flex-wrap gap-2 mb-2">
          <h3 className="text-green-400 font-ubuntu-mono font-semibold text-sm mb-2 w-full">Server Host Folders</h3>
          <button
            onClick={() => handlePathChange('/ubuntu')}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-ubuntu-mono transition-colors"
          >
            <span>🐧</span>
            Ubuntu
          </button>
          <button
            onClick={() => handlePathChange('/docker')}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-ubuntu-mono transition-colors"
          >
            <span>🐳</span>
            Docker
          </button>
          <button
            onClick={() => handlePathChange('/')}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-ubuntu-mono transition-colors"
          >
            <span>📁</span>
            Public
          </button>
        </div>
      </div>

      {/* 툴바 */}
      <Toolbar 
        currentPath={currentPath}
        selectedFiles={selectedFiles}
        onPathChange={handlePathChange}
        onRefresh={() => loadFiles()}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측 트리 (데스크톱만) */}
        <div className="hidden lg:block w-64 border-r border-gray-700">
          <FileExplorer 
            currentPath={currentPath}
            onPathChange={handlePathChange}
          />
        </div>
        
        {/* 우측 파일 목록 */}
        <div className="flex-1 overflow-hidden">
          <FileList 
            files={files}
            selectedFiles={selectedFiles}
            loading={loading}
            viewMode={viewMode}
            onFileSelect={handleFileSelect}
            onFileDoubleClick={handleFileDoubleClick}
          />
        </div>
      </div>
    </div>
  );
}