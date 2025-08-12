// components/FileManager/DestinationModal.js
import { useState, useEffect } from 'react';

export default function DestinationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  operation, // 'copy' or 'move'
  selectedFiles,
  currentPath 
}) {
  const [directoryTree, setDirectoryTree] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState('/');
  const [expandedFolders, setExpandedFolders] = useState(new Set(['/']));
  const [loading, setLoading] = useState(false);

  // 디렉토리 트리 로드
  const loadDirectoryTree = async (path = '') => {
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      
      if (data.success) {
        return data.files.filter(file => file.type === 'directory');
      }
      return [];
    } catch (error) {
      console.error('디렉토리 로드 실패:', error);
      return [];
    }
  };

  // 초기 디렉토리 로드
  useEffect(() => {
    if (isOpen) {
      loadDirectoryTree().then(directories => {
        setDirectoryTree(directories);
      });
    }
  }, [isOpen]);

  // 폴더 확장/축소
  const toggleFolder = async (folderPath) => {
    const newExpanded = new Set(expandedFolders);
    
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
      
      // 하위 디렉토리가 로드되지 않은 경우 로드
      const subDirectories = await loadDirectoryTree(folderPath);
      
      // 트리에 하위 디렉토리 추가 (간단한 구현)
      setDirectoryTree(prev => {
        const newTree = [...prev];
        // 실제로는 더 복잡한 트리 구조 관리가 필요하지만 
        // 현재는 기본 기능만 구현
        return newTree;
      });
    }
    
    setExpandedFolders(newExpanded);
  };

  // 목적지 선택
  const handleDestinationSelect = (path) => {
    setSelectedDestination(path);
  };

  // 확인 버튼 클릭
  const handleConfirm = () => {
    if (selectedDestination === currentPath) {
      const operationType = operation === 'copy' ? '복사' : '이동';
      alert(`현재 폴더와 같은 위치로는 ${operationType}할 수 없습니다.`);
      return;
    }
    
    onConfirm(selectedDestination);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-96 max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-medium text-green-400">
            {operation === 'copy' ? '📋 복사' : '📦 이동'} 위치 선택
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="p-4 border-b border-gray-700">
          <div className="text-sm text-gray-400 mb-2">
            선택된 파일: {selectedFiles.length}개
          </div>
          <div className="text-xs text-gray-500 max-h-20 overflow-y-auto">
            {selectedFiles.slice(0, 5).map(file => (
              <div key={file.path}>{file.name}</div>
            ))}
            {selectedFiles.length > 5 && (
              <div>... 외 {selectedFiles.length - 5}개</div>
            )}
          </div>
        </div>

        {/* 디렉토리 트리 */}
        <div className="flex-1 overflow-auto p-4">
          <div className="mb-2">
            <div
              className={`flex items-center py-2 px-2 cursor-pointer rounded hover:bg-gray-700 transition-colors ${
                selectedDestination === '/' ? 'bg-gray-600 text-green-400' : 'text-gray-300'
              }`}
              onClick={() => handleDestinationSelect('/')}
            >
              <span className="text-yellow-400 mr-2">📂</span>
              <span className="text-sm font-ubuntu-mono">Root</span>
            </div>
          </div>

          {/* 하위 디렉토리들 */}
          {directoryTree.map(directory => (
            <div key={directory.path} className="ml-4">
              <div
                className={`flex items-center py-1 px-2 cursor-pointer rounded hover:bg-gray-700 transition-colors ${
                  selectedDestination === directory.path ? 'bg-gray-600 text-green-400' : 'text-gray-300'
                }`}
                onClick={() => handleDestinationSelect(directory.path)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFolder(directory.path);
                  }}
                  className="mr-1 p-0.5 hover:bg-gray-600 rounded"
                >
                  {expandedFolders.has(directory.path) ? '▼' : '▶'}
                </button>
                <span className="text-yellow-400 mr-2">
                  {expandedFolders.has(directory.path) ? '📂' : '📁'}
                </span>
                <span className="text-sm font-ubuntu-mono">{directory.name}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 선택된 목적지 표시 */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-sm text-gray-400 mb-3">
            목적지: <span className="text-green-400">{selectedDestination}</span>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              disabled={loading}
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
              disabled={loading || !selectedDestination}
            >
              {loading ? '처리중...' : (operation === 'copy' ? '복사' : '이동')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}