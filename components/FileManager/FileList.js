// components/FileManager/FileList.js
import { useState } from 'react';

function FileList({ 
  files, 
  selectedFiles, 
  loading, 
  viewMode, 
  onFileSelect, 
  onFileDoubleClick 
}) {
  
  // 전체 선택 토글
  const handleSelectAll = (event) => {
    event.stopPropagation();
    
    if (selectedFiles.length === files.length && files.length > 0) {
      // 모두 선택 해제: 빈 배열로 설정
      onFileSelect(null, false); // 특별한 경우로 처리
    } else {
      // 모두 선택: 각 파일을 멀티선택으로 추가
      files.forEach(file => {
        if (!isSelected(file)) {
          onFileSelect(file, true);
        }
      });
    }
  };
  
  // 파일 다운로드 핸들러
  const handleDownload = (file) => {
    if (file.type !== 'file') return;
    
    const downloadUrl = `/api/files/download?path=${encodeURIComponent(file.path)}`;
    
    // 새 창에서 다운로드 링크 열기
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.name;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // 파일 아이콘 결정
  const getFileIcon = (file) => {
    if (file.type === 'directory') {
      return <span className="text-yellow-400 text-xl">📁</span>;
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    // 이미지 파일
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
      return <span className="text-green-400 text-xl">🖼️</span>;
    }
    
    // 텍스트 파일
    if (['txt', 'md', 'json', 'xml', 'csv'].includes(extension)) {
      return <span className="text-blue-400 text-xl">📄</span>;
    }
    
    // 코드 파일
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c'].includes(extension)) {
      return <span className="text-purple-400 text-xl">📝</span>;
    }
    
    // 음악 파일
    if (['mp3', 'wav', 'flac', 'ogg'].includes(extension)) {
      return <span className="text-red-400 text-xl">🎵</span>;
    }
    
    // 비디오 파일
    if (['mp4', 'avi', 'mkv', 'mov'].includes(extension)) {
      return <span className="text-orange-400 text-xl">🎬</span>;
    }
    
    // 압축 파일
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return <span className="text-yellow-600 text-xl">🗜️</span>;
    }
    
    return <span className="text-gray-400 text-xl">📄</span>;
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // 권한 표시 포맷팅
  const formatPermissions = (permissions, fileType) => {
    if (!permissions) return '---------';
    
    // 디렉토리인 경우 앞에 d를 붙여서 표시
    const prefix = fileType === 'directory' ? 'd' : '-';
    return prefix + permissions;
  };


  // 파일 선택 상태 확인
  const isSelected = (file) => {
    return selectedFiles.some(f => f.path === file.path);
  };

  // 파일 클릭 핸들러 (파일명 클릭시)
  const handleFileClick = (file, event) => {
    // 체크박스 클릭인 경우는 무시
    if (event.target.type === 'checkbox') {
      return;
    }
    
    const isMultiSelect = event.ctrlKey || event.metaKey;
    onFileSelect(file, isMultiSelect);
  };

  // 체크박스 전용 핸들러
  const handleCheckboxClick = (file, event) => {
    event.stopPropagation(); // 이벤트 전파 완전 차단
    onFileSelect(file, true); // 항상 멀티 선택 모드
  };

  // 파일 더블클릭 핸들러
  const handleFileDoubleClick = (file) => {
    onFileDoubleClick(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">No files found</div>
      </div>
    );
  }

  // 리스트 뷰
  if (viewMode === 'list') {
    return (
      <div className="h-full overflow-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-4 py-2">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-400">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={files.length > 0 && selectedFiles.length === files.length}
                onChange={handleSelectAll}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
              />
            </div>
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-3">Permissions</div>
            <div className="col-span-1">Actions</div>
          </div>
        </div>
        
        {/* 파일 목록 */}
        <div className="p-2">
          {files.map((file, index) => (
            <div
              key={file.path}
              className={`grid grid-cols-12 gap-4 items-center p-2 rounded cursor-pointer hover:bg-gray-700 transition-colors ${
                isSelected(file) ? 'bg-gray-600 text-green-400' : 'text-gray-300'
              }`}
              onClick={(e) => handleFileClick(file, e)}
              onDoubleClick={() => handleFileDoubleClick(file)}
            >
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={isSelected(file)}
                  onChange={(e) => handleCheckboxClick(file, e)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                />
              </div>
              <div className="col-span-5 flex items-center space-x-3">
                {getFileIcon(file)}
                <span className="truncate">{file.name}</span>
              </div>
              <div className="col-span-2 text-sm">
                {formatFileSize(file.size)}
              </div>
              <div className="col-span-3 text-sm font-mono text-green-400">
                {formatPermissions(file.permissions, file.type)}
              </div>
              <div className="col-span-1">
                {file.type === 'file' && (
                  <button
                    className="p-1 text-gray-400 hover:text-green-400 hover:bg-gray-600 rounded transition-colors"
                    title="Download"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(file);
                    }}
                  >
                    ⬇️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 그리드 뷰
  return (
    <div className="h-full overflow-auto p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {files.map((file, index) => (
          <div
            key={file.path}
            className={`p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors text-center ${
              isSelected(file) ? 'bg-gray-600 ring-2 ring-green-400' : 'bg-gray-800'
            }`}
            onClick={(e) => handleFileClick(file, e)}
            onDoubleClick={() => handleFileDoubleClick(file)}
          >
            <div className="flex justify-center mb-2">
              {getFileIcon(file)}
            </div>
            <div className="text-sm text-gray-300 truncate mb-1">
              {file.name}
            </div>
            {file.type === 'file' && (
              <div className="text-xs text-gray-500">
                {formatFileSize(file.size)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FileList;