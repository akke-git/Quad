// components/FileManager/FileExplorer.js
import { useState, useEffect } from 'react';

function FileExplorer({ currentPath, onPathChange }) {
  const [treeData, setTreeData] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['/']));

  // 트리 구조 로드
  const loadDirectoryTree = async () => {
    try {
      const response = await fetch('/api/files?path=');
      const data = await response.json();
      
      if (data.success) {
        // 디렉토리만 필터링
        const directories = data.files
          .filter(file => file.type === 'directory')
          .map(dir => ({
            name: dir.name,
            path: dir.path,
            type: 'directory',
            children: [] // 지연 로딩을 위해 비움
          }));
        
        setTreeData(directories);
      }
    } catch (error) {
      console.error('디렉토리 트리 로드 실패:', error);
      setTreeData([]);
    }
  };

  useEffect(() => {
    loadDirectoryTree();
  }, []);

  // 폴더 확장/축소 토글
  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  // 트리 아이템 렌더링
  const renderTreeItem = (item, level = 0) => {
    const isExpanded = expandedFolders.has(item.path);
    const isSelected = currentPath === item.path;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.path}>
        <div
          className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-700 transition-colors ${
            isSelected ? 'bg-gray-600 text-green-400' : 'text-gray-300'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onPathChange(item.path)}
        >
          {/* 확장/축소 아이콘 */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(item.path);
              }}
              className="mr-1 p-0.5 hover:bg-gray-600 rounded"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          
          {/* 폴더 아이콘 */}
          <div className="mr-2">
            <span className="text-yellow-400">
              {isExpanded ? '📂' : '📁'}
            </span>
          </div>
          
          {/* 폴더 이름 */}
          <span className="text-sm truncate">
            {item.name}
          </span>
        </div>
        
        {/* 자식 폴더들 */}
        {hasChildren && isExpanded && (
          <div>
            {item.children.map(child => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto bg-gray-800 p-2">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
          Directory Tree
        </h3>
      </div>
      
      {/* 루트 폴더 */}
      <div
        className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-700 transition-colors mb-2 ${
          currentPath === '/' ? 'bg-gray-600 text-green-400' : 'text-gray-300'
        }`}
        onClick={() => onPathChange('/')}
      >
        <span className="text-yellow-400 mr-2">📂</span>
        <span className="text-sm">Root</span>
      </div>
      
      {/* 트리 아이템들 */}
      {treeData.map(item => renderTreeItem(item))}
    </div>
  );
}

export default FileExplorer;