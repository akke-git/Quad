import { useState, useEffect } from 'react';

export default function DownloadModal({ isOpen, onClose, video, format = 'mp3' }) {
  const [metadata, setMetadata] = useState({
    title: '',
    artist: '',
    album: '',
    track: '',
    year: '',
    genre: '',
    comment: ''
  });
  
  const [downloadStatus, setDownloadStatus] = useState('idle'); // idle, downloading, completed, failed
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [cleanupFunction, setCleanupFunction] = useState(null);

  // 비디오 정보가 변경될 때 메타데이터 초기화
  useEffect(() => {
    if (video) {
      setMetadata({
        title: video.title || '',
        artist: video.channel || '',
        album: video.channel || '',
        track: '1',
        year: new Date().getFullYear().toString(),
        genre: 'Music',
        comment: `Downloaded from YouTube: ${video.url}`
      });
      setFileName(generateFileName(video, format));
    }
  }, [video, format]);

  const generateFileName = (video, format) => {
    if (!video) return '';
    const sanitizedChannel = sanitizeForFilename(video.channel || '');
    const sanitizedTitle = sanitizeForFilename(video.title || '');
    return `${sanitizedChannel} - ${sanitizedTitle}.${format}`;
  };

  const sanitizeForFilename = (str) => {
    return str
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 50);
  };

  const handleMetadataChange = (field, value) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 제목이나 아티스트가 변경되면 파일명도 업데이트
    if (field === 'title' || field === 'artist') {
      const newTitle = field === 'title' ? value : metadata.title;
      const newArtist = field === 'artist' ? value : metadata.artist;
      setFileName(`${sanitizeForFilename(newArtist)} - ${sanitizeForFilename(newTitle)}.${format}`);
    }
  };

  const handleServerDownload = async () => {
    if (!video) return;
    
    console.log('[Modal] Starting download for video:', video.id);
    setDownloadStatus('downloading');
    setProgress(0);
    
    try {
      const requestBody = {
        videoId: video.id,
        format,
        title: metadata.title,
        channel: metadata.artist,
        metadata: metadata // 전체 메타데이터 전송
      };
      
      console.log('[Modal] Sending download request:', requestBody);
      
      const response = await fetch('/api/music/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      console.log('[Modal] Download API response:', data);
      
      if (data.jobId) {
        console.log('[Modal] Got jobId:', data.jobId);
        setJobId(data.jobId);
        // 서버에서 job을 설정할 시간을 주기 위해 약간 지연
        setTimeout(async () => {
          const cleanup = await monitorProgress(data.jobId);
          setCleanupFunction(() => cleanup);
        }, 1000);
      } else {
        throw new Error('No jobId received from server');
      }
    } catch (error) {
      console.error('[Modal] Server download error:', error);
      setDownloadStatus('failed');
      setErrorMessage(`다운로드 요청 실패: ${error.message}`);
    }
  };

  const monitorProgress = async (jobId) => {
    console.log(`[Modal] Starting progress monitoring for job: ${jobId}`);
    
    let isCompleted = false;
    
    const pollInterval = setInterval(async () => {
      try {
        console.log(`[Modal] Polling job status for: ${jobId}`);
        console.log(`[Modal] Polling URL: /api/music/job/${jobId}`);
        const response = await fetch(`/api/music/job/${jobId}`);
        
        if (!response.ok) {
          console.error(`[Modal] HTTP Error ${response.status}: ${response.statusText}`);
          if (response.status === 404) {
            console.error(`[Modal] Job ${jobId} not found on server`);
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const jobData = await response.json();
        console.log(`[Modal] Job ${jobId} status response:`, jobData);
        
        // 진행률 업데이트
        const newProgress = jobData.progress || 0;
        console.log(`[Modal] Updating progress to ${newProgress}`);
        setProgress(newProgress);
        
        if (jobData.status === 'completed') {
          console.log(`[Modal] Job completed!`, jobData);
          isCompleted = true;
          clearInterval(pollInterval);
          setDownloadStatus('completed');
          if (jobData.downloadUrl) {
            setDownloadUrl(jobData.downloadUrl);
            setFileName(jobData.fileName || '');
            console.log(`[Modal] Download completed. URL: ${jobData.downloadUrl}, FileName: ${jobData.fileName}`);
          } else {
            console.error(`[Modal] Job completed but no download URL provided`);
            setDownloadStatus('failed');
            setErrorMessage('다운로드 URL을 받지 못했습니다');
          }
        } else if (jobData.status === 'failed') {
          console.log(`[Modal] Job failed:`, jobData.error);
          isCompleted = true;
          clearInterval(pollInterval);
          setDownloadStatus('failed');
          setErrorMessage(jobData.error || '다운로드 처리 중 오류가 발생했습니다');
        } else {
          console.log(`[Modal] Job still in progress. Status: ${jobData.status}, Progress: ${jobData.progress}%`);
        }
      } catch (error) {
        console.error(`[Modal] Progress monitoring error for job ${jobId}:`, error);
        isCompleted = true;
        clearInterval(pollInterval);
        setDownloadStatus('failed');
        setErrorMessage(`상태 확인 오류: ${error.message}`);
      }
    }, 3000);
    
    // 2분으로 타임아웃 연장
    const timeoutId = setTimeout(() => {
      console.log(`[Modal] Progress monitoring timeout for job: ${jobId}`);
      clearInterval(pollInterval);
      if (!isCompleted) {
        console.error(`[Modal] Download timed out after 2 minutes`);
        setDownloadStatus('failed');
        setErrorMessage('다운로드 시간 초과 (2분)');
      }
    }, 120000);
    
    // 정리 함수 반환
    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  };

  const handleLocalDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetModal = () => {
    // 진행 중인 polling 정리
    if (cleanupFunction) {
      cleanupFunction();
      setCleanupFunction(null);
    }
    
    setDownloadStatus('idle');
    setProgress(0);
    setJobId(null);
    setDownloadUrl(null);
    setFileName('');
    setErrorMessage('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen || !video) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-green-400 font-apple-gothic">
            MP3 다운로드
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* File Info */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <img 
              src={video.thumbnail} 
              alt={video.title}
              className="w-20 h-15 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-white font-apple-gothic mb-1">
                {video.title}
              </h3>
              <p className="text-gray-300 text-sm font-apple-gothic mb-2">
                {video.channel}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded font-ubuntu-mono">
                  {video.duration}
                </span>
                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded font-ubuntu-mono">
                  MP3
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metadata Form */}
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-green-400 mb-4 font-apple-gothic">
            메타데이터 편집
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 font-apple-gothic">
                제목
              </label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => handleMetadataChange('title', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white font-apple-gothic"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 font-apple-gothic">
                아티스트
              </label>
              <input
                type="text"
                value={metadata.artist}
                onChange={(e) => handleMetadataChange('artist', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white font-apple-gothic"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 font-apple-gothic">
                앨범
              </label>
              <input
                type="text"
                value={metadata.album}
                onChange={(e) => handleMetadataChange('album', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white font-apple-gothic"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 font-apple-gothic">
                트랙 번호
              </label>
              <input
                type="text"
                value={metadata.track}
                onChange={(e) => handleMetadataChange('track', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white font-apple-gothic"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 font-apple-gothic">
                년도
              </label>
              <input
                type="text"
                value={metadata.year}
                onChange={(e) => handleMetadataChange('year', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white font-apple-gothic"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 font-apple-gothic">
                장르
              </label>
              <input
                type="text"
                value={metadata.genre}
                onChange={(e) => handleMetadataChange('genre', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white font-apple-gothic"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1 font-apple-gothic">
              코멘트
            </label>
            <textarea
              value={metadata.comment}
              onChange={(e) => handleMetadataChange('comment', e.target.value)}
              rows="3"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white font-apple-gothic"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1 font-apple-gothic">
              파일명
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white font-ubuntu-mono"
            />
          </div>
        </div>

        {/* Download Controls */}
        <div className="p-6">
          {/* Progress Bar */}
          {downloadStatus === 'downloading' && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>다운로드 진행률</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {downloadStatus === 'completed' && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded text-green-300 text-sm">
              ✅ 서버 다운로드 완료
            </div>
          )}
          
          {downloadStatus === 'failed' && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-300 text-sm">
              ❌ 다운로드 실패
              {errorMessage && (
                <div className="mt-2 text-xs text-red-200">
                  {errorMessage}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleServerDownload}
              disabled={downloadStatus === 'downloading'}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white px-4 py-2 rounded font-apple-gothic transition-colors"
            >
              {downloadStatus === 'downloading' ? '서버 저장 중...' : '서버 저장'}
            </button>
            
            <button
              onClick={handleLocalDownload}
              disabled={downloadStatus !== 'completed'}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white px-4 py-2 rounded font-apple-gothic transition-colors"
            >
              로컬 다운로드
            </button>
            
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-apple-gothic transition-colors"
            >
              닫기
            </button>
          </div>
          
          {/* 여백 추가 - 스크롤 시 중앙 배치를 위한 공간 */}
          <div className="h-32"></div>
        </div>
      </div>
    </div>
  );
}