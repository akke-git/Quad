// components/FileManager/Toolbar.js
import { useState } from 'react';
import UploadZone from './UploadZone';
import DestinationModal from './DestinationModal';

function Toolbar({ 
  currentPath, 
  selectedFiles, 
  onPathChange, 
  onRefresh,
  viewMode,
  onViewModeChange 
}) {
  const [showUpload, setShowUpload] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [currentOperation, setCurrentOperation] = useState(null); // 'copy' or 'move'
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');

  // 파일 삭제 핸들러
  const handleDelete = async () => {
    if (selectedFiles.length === 0) return;
    
    const fileCount = selectedFiles.length;
    const fileNames = selectedFiles.map(f => f.name).join(', ');
    const confirmMessage = fileCount === 1 
      ? `'${selectedFiles[0].name}' 파일을 삭제하시겠습니까?`
      : `선택한 ${fileCount}개 파일을 삭제하시겠습니까?\n\n${fileNames}`;
      
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const filePaths = selectedFiles.map(f => f.path);
      
      const response = await fetch('/api/files/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paths: filePaths })
      });

      const data = await response.json();
      
      if (data.success || data.results?.some(r => r.success)) {
        onRefresh(); // 파일 목록 새로고침
        
        // 성공 메시지
        if (data.success) {
          alert('선택한 파일이 성공적으로 삭제되었습니다.');
        } else {
          alert(`일부 파일이 삭제되었습니다. 자세한 내용: ${data.message}`);
        }
      } else {
        alert(`삭제 실패: ${data.message || '알 수 없는 오류가 발생했습니다.'}`);
      }
      
    } catch (error) {
      console.error('삭제 오류:', error);
      alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 복사 시작
  const handleCopy = () => {
    if (selectedFiles.length === 0) return;
    setCurrentOperation('copy');
    setShowDestinationModal(true);
  };

  // 이동 시작
  const handleMove = () => {
    if (selectedFiles.length === 0) return;
    setCurrentOperation('move');
    setShowDestinationModal(true);
  };

  // 복사/이동 실행
  const handleFileOperation = async (destinationPath) => {
    try {
      const sourcePaths = selectedFiles.map(f => f.path);
      const endpoint = currentOperation === 'copy' ? '/api/files/copy' : '/api/files/move';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourcePaths,
          targetPath: destinationPath,
          overwrite: false
        })
      });

      const data = await response.json();
      
      if (data.success || data.results?.some(r => r.success)) {
        onRefresh(); // 파일 목록 새로고침
        setShowDestinationModal(false);
        setCurrentOperation(null);
        
        // 성공 메시지 표시
        const operationName = currentOperation === 'copy' ? '복사가' : '이동이';
        alert(`${operationName} 완료되었습니다.`);
      }
      
      if (!data.success) {
        const operationType = currentOperation === 'copy' ? '복사' : '이동';
        alert(`${operationType} 중 오류가 발생했습니다: ${data.message || '알 수 없는 오류'}`);
      }
      
    } catch (error) {
      console.error('파일 작업 오류:', error);
      const operationType = currentOperation === 'copy' ? '복사' : '이동';
      alert(`${operationType} 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 모달 닫기
  const handleModalClose = () => {
    setShowDestinationModal(false);
    setCurrentOperation(null);
  };

  // 다운로드 핸들러
  const handleDownload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      if (selectedFiles.length === 1) {
        // 단일 파일 다운로드
        const file = selectedFiles[0];
        const downloadUrl = `/api/files/download?path=${encodeURIComponent(file.path)}`;
        
        // 새 창에서 다운로드 시작
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // 다중 파일 다운로드 (ZIP)
        const paths = selectedFiles.map(f => f.path);
        const pathsParam = paths.map(p => `paths=${encodeURIComponent(p)}`).join('&');
        const downloadUrl = `/api/files/download?${pathsParam}`;
        
        // 새 창에서 다운로드 시작
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = 'files.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('다운로드 오류:', error);
      alert(`다운로드 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 새폴더 생성 핸들러
  const handleNewFolder = () => {
    setNewFolderName('새 폴더');
    setShowNewFolderDialog(true);
  };

  // 새폴더 생성 확인
  const handleNewFolderConfirm = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch('/api/files/newfolder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentPath: currentPath,
          folderName: newFolderName.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        onRefresh(); // 파일 목록 새로고침
        setShowNewFolderDialog(false);
        setNewFolderName('');
        alert(data.message);
      } else {
        alert(`폴더 생성 실패: ${data.message}`);
      }
    } catch (error) {
      console.error('폴더 생성 오류:', error);
      alert(`폴더 생성 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 이름변경 시작
  const handleRename = () => {
    if (selectedFiles.length !== 1) return;
    
    const file = selectedFiles[0];
    setNewFileName(file.name);
    setShowRenameDialog(true);
  };

  // 이름변경 확인
  const handleRenameConfirm = async () => {
    if (!newFileName.trim() || selectedFiles.length !== 1) return;

    const file = selectedFiles[0];
    
    try {
      const response = await fetch('/api/files/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: file.path,
          newName: newFileName.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        onRefresh(); // 파일 목록 새로고침
        setShowRenameDialog(false);
        setNewFileName('');
        alert(data.message);
      } else {
        alert(`이름 변경 실패: ${data.message}`);
      }
    } catch (error) {
      console.error('이름 변경 오류:', error);
      alert(`이름 변경 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 상위 폴더로 이동
  const goUp = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      pathParts.pop();
      const newPath = pathParts.length > 0 ? '/' + pathParts.join('/') : '/';
      onPathChange(newPath);
    }
  };

  // 홈으로 이동
  const goHome = () => {
    onPathChange('/');
  };

  // 경로 표시 컴포넌트
  const PathBreadcrumb = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Root', path: '/' }];
    
    let currentBuildPath = '';
    pathParts.forEach(part => {
      currentBuildPath += '/' + part;
      breadcrumbs.push({ name: part, path: currentBuildPath });
    });

    return (
      <div className="flex items-center space-x-1 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <span className="text-gray-500 mx-1">/</span>}
            <button
              onClick={() => onPathChange(crumb.path)}
              className="text-gray-300 hover:text-green-400 px-2 py-1 rounded transition-colors"
            >
              {crumb.name}
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="border-b border-gray-700 p-4">
      {/* 상단 툴바 */}
      <div className="flex items-center justify-between mb-3">
        {/* 좌측 경로 표시 */}
        <div className="flex items-center">
          <PathBreadcrumb />
        </div>

        {/* 우측 액션 버튼 */}
        <div className="flex items-center space-x-2">
          {/* 뷰 모드 토글 */}
          <div className="flex border border-gray-600 rounded overflow-hidden">
            <button
              onClick={() => onViewModeChange('list')}
              className={`flex items-center space-x-1 px-3 py-2 ${viewMode === 'list' 
                ? 'bg-green-600 text-white' 
                : 'text-gray-400 hover:text-green-400 hover:bg-gray-700'} transition-colors`}
              title="리스트 뷰"
            >
              <span className="text-lg">📋</span>
              <span className="hidden md:block text-xs">리스트</span>
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`flex items-center space-x-1 px-3 py-2 ${viewMode === 'grid' 
                ? 'bg-green-600 text-white' 
                : 'text-gray-400 hover:text-green-400 hover:bg-gray-700'} transition-colors`}
              title="그리드 뷰"
            >
              <span className="text-lg">⊞</span>
              <span className="hidden md:block text-xs">그리드</span>
            </button>
          </div>
          
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center space-x-2 px-3 py-2 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded transition-colors"
            title="파일 업로드"
          >
            <span className="text-xl">📤</span>
            <span className="hidden md:block text-sm">업로드</span>
          </button>
          
          <button
            onClick={handleNewFolder}
            className="flex items-center space-x-2 px-3 py-2 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded transition-colors"
            title="새 폴더"
          >
            <span className="text-xl">📁</span>
            <span className="text-green-400">+</span>
            <span className="hidden md:block text-sm">새폴더</span>
          </button>
        </div>
      </div>

      {/* 하단 선택된 파일 정보 */}
      {selectedFiles.length > 0 && (
        <div className="flex items-center justify-end">
          {/* 선택된 파일 정보 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              {selectedFiles.length} selected
            </span>
            
            {/* 선택된 파일 액션 버튼 */}
            <div className="flex space-x-1">
              <button
                onClick={handleDownload}
                className="flex items-center space-x-1 px-2 py-1 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded transition-colors"
                title="다운로드"
              >
                <span className="text-lg">⬇️</span>
                <span className="hidden lg:block text-xs">다운로드</span>
              </button>
              
              <button
                onClick={handleRename}
                className="flex items-center space-x-1 px-2 py-1 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="이름변경"
                disabled={selectedFiles.length !== 1}
              >
                <span className="text-lg">✏️</span>
                <span className="hidden lg:block text-xs">이름변경</span>
              </button>
              
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-2 py-1 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded transition-colors"
                title="복사"
              >
                <span className="text-lg">📋</span>
                <span className="hidden lg:block text-xs">복사</span>
              </button>
              
              <button
                onClick={handleMove}
                className="flex items-center space-x-1 px-2 py-1 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded transition-colors"
                title="이동"
              >
                <span className="text-lg">📦</span>
                <span className="hidden lg:block text-xs">이동</span>
              </button>
              
              <button
                onClick={handleDelete}
                className="flex items-center space-x-1 px-2 py-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                title="삭제"
              >
                <span className="text-lg">🗑️</span>
                <span className="hidden lg:block text-xs">삭제</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 업로드 모달 */}
      {showUpload && (
        <UploadZone
          currentPath={currentPath}
          onUploadComplete={onRefresh}
          onClose={() => setShowUpload(false)}
        />
      )}

      {/* 복사/이동 모달 */}
      {showDestinationModal && (
        <DestinationModal
          isOpen={showDestinationModal}
          onClose={handleModalClose}
          onConfirm={handleFileOperation}
          operation={currentOperation}
          selectedFiles={selectedFiles}
          currentPath={currentPath}
        />
      )}

      {/* 새폴더 생성 모달 */}
      {showNewFolderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">새 폴더 만들기</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="폴더 이름을 입력하세요"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleNewFolderConfirm();
                }
              }}
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowNewFolderDialog(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleNewFolderConfirm}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                disabled={!newFolderName.trim()}
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이름변경 모달 */}
      {showRenameDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">이름 변경</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="새 이름을 입력하세요"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleRenameConfirm();
                }
              }}
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowRenameDialog(false);
                  setNewFileName('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleRenameConfirm}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                disabled={!newFileName.trim()}
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Toolbar;