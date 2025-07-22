import Head from 'next/head';
import Navbar from '../../components/Navbar';
import DownloadModalSimple from '../../components/DownloadModalSimple';
import { useState } from 'react';

export default function Music() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState([]);
  
  // 다운로드 모달 관련 상태
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('mp3');

  // 품질 텍스트를 간단한 형태로 변환
  const getSimpleQuality = (qualityText) => {
    if (qualityText.includes('256k')) return '256 AAC';
    if (qualityText.includes('160k')) return '160 AAC';
    if (qualityText.includes('128k')) return '128 AAC';
    if (qualityText.includes('96k')) return '96 AAC';
    return '128 AAC'; // 기본값
  };

  // 품질에 따른 색상 클래스 결정
  const getQualityColorClass = (qualityText) => {
    const quality = getSimpleQuality(qualityText);
    const bitrate = parseInt(quality);
    
    if (bitrate > 128) {
      // 128k 초과: 녹색
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    } else if (bitrate === 128) {
      // 128k 기준값: 주황색 (현재색)
      return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    } else {
      // 128k 미만: 회색
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // YouTube URL 감지 함수
  const isYouTubeURL = (text) => {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];
    return patterns.some(pattern => pattern.test(text));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // YouTube URL인지 확인
      if (isYouTubeURL(searchQuery.trim())) {
        // URL에서 비디오 정보 가져오기
        const response = await fetch(`/api/music/video-info?url=${encodeURIComponent(searchQuery.trim())}`);
        const data = await response.json();
        
        if (data.videoInfo) {
          setSearchResults([data.videoInfo]);
        } else {
          throw new Error('비디오 정보를 가져올 수 없습니다.');
        }
      } else {
        // 일반 검색
        const response = await fetch(`/api/music/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        const results = data.results || [];
        setSearchResults(results);
      }
      
    } catch (error) {
      console.error('Search error:', error);
      alert(error.message || '검색에 실패했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownload = (videoId, format = 'mp3') => {
    // Find the video info
    const video = searchResults.find(v => v.id === videoId);
    if (video) {
      setSelectedVideo(video);
      setSelectedFormat(format);
      setIsDownloadModalOpen(true);
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Music Downloader - Sveltt</title>
        <meta name="description" content="YouTube Music Downloader" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* YouTube 아이콘 (1.5배 크기) */}
            <div className="w-24 h-24 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-15 h-15 text-white" fill="currentColor" viewBox="0 0 24 24" style={{width: '3.75rem', height: '3.75rem'}}>
                <path d="M23.498 6.186a2.925 2.925 0 0 0-2.057-2.057C19.633 3.706 12 3.706 12 3.706s-7.633 0-9.441.423A2.925 2.925 0 0 0 .502 6.186C.08 7.994.08 12 .08 12s0 4.006.422 5.814a2.925 2.925 0 0 0 2.057 2.057C4.367 20.294 12 20.294 12 20.294s7.633 0 9.441-.423a2.925 2.925 0 0 0 2.057-2.057C23.92 16.006 23.92 12 23.92 12s0-4.006-.422-5.814zM9.606 15.546V8.454L15.822 12l-6.216 3.546z"/>
              </svg>
            </div>
            
            {/* Downloader 텍스트 */}
            <h1 className="text-4xl md:text-6xl font-dancing-script font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 tracking-wider">
              Downloader
            </h1>
          </div>
          
          {/* MP3 배지 */}
          <div className="inline-flex items-center gap-2 bg-gray-800/50 backdrop-blur rounded-full px-6 py-2 border border-gray-600">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-gray-300 font-ubuntu-mono text-sm">High Quality MP3</span>
            <div className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full font-ubuntu-mono">
              Up to 160k AAC
            </div>
          </div>
        </div>

        {/* 검색 섹션 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-green-400 mb-4 font-apple-gothic">검색</h2>
          <form onSubmit={handleSearch} className="flex gap-4 mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="곡명, 아티스트 또는 YouTube URL을 입력하세요..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-400 font-apple-gothic"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-apple-gothic transition-colors"
            >
              {isSearching ? '검색 중...' : '검색'}
            </button>
          </form>
          <div className="text-sm text-gray-400 font-apple-gothic">
            <p className="mb-1">💡 지원하는 YouTube URL 형식:</p>
            <div className="text-xs space-y-1 ml-4">
              <p>• https://www.youtube.com/watch?v=VIDEO_ID</p>
              <p>• https://youtu.be/VIDEO_ID</p>
              <p>• https://www.youtube.com/embed/VIDEO_ID</p>
            </div>
          </div>
        </div>

        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-green-400 mb-4 font-apple-gothic">검색 결과</h2>
            <div className="space-y-4">
              {searchResults.map((video, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4 overflow-hidden">
                  {/* 데스크톱: 가로 배치, 모바일: 세로 배치 */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* 상단: 썸네일과 텍스트 정보 */}
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-24 h-18 object-cover rounded flex-shrink-0"
                        onError={(e) => {
                          e.target.src = `https://i.ytimg.com/vi/${video.id}/default.jpg`;
                        }}
                      />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <h3 className="font-semibold text-white font-apple-gothic truncate w-full">{video.title}</h3>
                        <p className="text-gray-300 text-sm font-apple-gothic truncate w-full mb-2">{video.channel}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 품질 태그 */}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-ubuntu-mono border ${getQualityColorClass(video.audioQuality)}`}>
                            🎵 {getSimpleQuality(video.audioQuality)}
                          </span>
                          
                          {/* 재생시간 태그 */}
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-ubuntu-mono bg-gray-500/20 text-gray-300 border border-gray-500/30">
                            ⏱️ {video.duration}
                          </span>
                          
                          {/* YouTube 링크 */}
                          <a 
                            href={video.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-ubuntu-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                          >
                            🔗 YouTube
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    {/* 하단(모바일) / 우측(데스크톱): 다운로드 버튼 */}
                    <div className="flex gap-2 justify-start md:justify-end flex-shrink-0">
                      <button
                        onClick={() => handleDownload(video.id, 'mp3')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-ubuntu-mono text-sm transition-colors"
                      >
                        MP3
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 다운로드 히스토리 */}
        {downloadHistory.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-green-400 mb-4 font-apple-gothic">다운로드 히스토리</h2>
            <div className="space-y-3">
              {downloadHistory.map((download) => (
                <div key={download.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-white font-apple-gothic text-sm font-semibold">
                        {download.title || `Job ID: ${download.id.slice(0, 8)}...`}
                      </p>
                      {download.channel && (
                        <p className="text-gray-400 text-xs font-apple-gothic mb-1">{download.channel}</p>
                      )}
                      <p className="text-gray-300 text-sm font-apple-gothic">
                        Format: {download.format.toUpperCase()} | Status: {download.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs font-ubuntu-mono">
                        {new Date(download.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  {download.status === 'processing' && (
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${download.progress || 0}%` }}
                      ></div>
                    </div>
                  )}
                  
                  {/* Status indicator */}
                  <div className="flex items-center gap-2 mt-2">
                    {download.status === 'completed' && (
                      <span className="text-green-400 text-sm">✅ 완료</span>
                    )}
                    {download.status === 'failed' && (
                      <span className="text-red-400 text-sm">❌ 실패</span>
                    )}
                    {download.status === 'processing' && (
                      <span className="text-yellow-400 text-sm">⏳ 처리중... {download.progress || 0}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 사용법 안내 */}
        <div className="bg-gray-800 rounded-lg p-6 mt-8">
          <h2 className="text-2xl font-bold text-green-400 mb-4 font-apple-gothic">사용법</h2>
          <div className="space-y-2 text-gray-300 font-apple-gothic">
            <p>1. 곡명, 아티스트 또는 YouTube URL을 검색창에 입력하고 검색버튼을 클릭합니다.</p>
            <p>2. 검색 결과에서 원하는 음원을 찾아 'MP3' 버튼을 클릭합니다.</p>
            <p>3. 다운로드 팝업에서 메타데이터를 편집할 수 있습니다.</p>
            <p>4. '서버 저장' 버튼으로 서버에 파일을 저장한 후, '로컬 다운로드'로 파일을 받습니다.</p>
            <p>5. 실제 품질은 원본 영상에 따라 다르며, 대부분 128k~160k AAC 수준입니다.</p>
          </div>
        </div>
      </main>

      {/* 다운로드 모달 */}
      <DownloadModalSimple
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        video={selectedVideo}
        format={selectedFormat}
      />
    </div>
  );
}