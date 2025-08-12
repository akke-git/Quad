// components/FileManager/UploadZone.js
import { useState, useRef } from 'react';

export default function UploadZone({ currentPath, onUploadComplete, onClose }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileCount, setUploadFileCount] = useState(0);
  const fileInputRef = useRef(null);

  // 파일 크기 검증
  const validateFiles = (files) => {
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    const maxFiles = 50;
    
    if (files.length > maxFiles) {
      throw new Error(`최대 ${maxFiles}개 파일까지 업로드 가능합니다.`);
    }
    
    for (let file of files) {
      if (file.size > maxSize) {
        throw new Error(`${file.name}의 크기가 5GB를 초과합니다.`);
      }
    }
    
    const totalSize = Array.from(files).reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 50 * 1024 * 1024 * 1024) { // 50GB 총합
      throw new Error('전체 파일 크기가 50GB를 초과합니다.');
    }
  };

  // 파일 업로드 처리
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    try {
      validateFiles(files);
    } catch (error) {
      alert(error.message);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadFileCount(files.length);

    try {
      const formData = new FormData();
      
      // 여러 파일을 FormData에 추가
      Array.from(files).forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      const response = await fetch(`/api/files/upload?path=${encodeURIComponent(currentPath)}`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      if (data.success) {
        setUploadProgress(100);
        setTimeout(() => {
          onUploadComplete();
          onClose();
        }, 1000);
      } else {
        throw new Error(data.message || 'Upload failed');
      }

    } catch (error) {
      console.error('업로드 오류:', error);
      
      // 대용량 파일 관련 에러 메시지 개선
      let errorMessage = error.message;
      if (error.message.includes('maxFileSize')) {
        errorMessage = '파일 크기가 5GB를 초과합니다.';
      } else if (error.message.includes('Request Entity Too Large')) {
        errorMessage = '파일이 너무 큽니다. 5GB 이하 파일을 업로드해 주세요.';
      }
      
      alert(`업로드 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setUploading(false);
      setUploadFileCount(0);
    }
  };

  // 드래그 앤 드롭 이벤트 핸들러
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  // 파일 선택 핸들러
  const handleFileSelect = (e) => {
    const files = e.target.files;
    handleFileUpload(files);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-96 max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-green-400">파일 업로드</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            disabled={uploading}
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-400">
            업로드 위치: <span className="text-green-400">{currentPath || '/'}</span>
          </p>
        </div>

        {uploading ? (
          <div className="space-y-4">
            <div className="text-center text-gray-300">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                <span>
                  {uploadFileCount > 1 
                    ? `${uploadFileCount}개 파일 업로드 중...` 
                    : '파일 업로드 중...'
                  }
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="text-center text-sm text-gray-400">
              {uploadProgress}%
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="text-xs text-gray-500 mt-1">
                  네트워크 상태에 따라 시간이 오래 걸릴 수 있습니다
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* 드래그 앤 드롭 영역 */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver
                  ? 'border-green-400 bg-green-400 bg-opacity-10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-4xl mb-2">📁</div>
              <p className="text-gray-300 mb-2">
                파일을 여기에 드래그하거나
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
              >
                파일 선택
              </button>
            </div>

            {/* 숨겨진 파일 입력 */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="mt-4 text-xs text-gray-500">
              • 최대 50개 파일, 각 파일당 5GB 이하<br/>
              • 전체 파일 크기 50GB 이하<br/>
              • 대용량 파일은 업로드에 시간이 소요됩니다<br/>
              • 여러 파일을 동시에 선택 가능
            </div>
          </div>
        )}

        {!uploading && (
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              취소
            </button>
          </div>
        )}
      </div>
    </div>
  );
}