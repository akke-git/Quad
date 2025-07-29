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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white">
      <Head>
        <title>Music Downloader - Sveltt</title>
        <meta name="description" content="YouTube Music Downloader" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      
      {/* Banner 섹션 */}
      <div className="w-full mb-4 md:mb-8 -mt-4 md:mt-0">
        <img 
          src="/images/juux_banner.jpg" 
          alt="YouTube music extraction banner" 
          className="w-full h-48 md:h-auto object-contain"
        />
      </div>
      
      <main className="container mx-auto px-2 sm:px-4 py-4 md:py-8">

        {/* 검색 섹션 */}
        <div className="group relative bg-gradient-to-br from-slate-800/90 via-slate-800/50 to-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 border border-slate-700/50 mb-8">
          {/* 배경 그라디언트 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-50" />
          
          {/* 글로우 효과 */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur opacity-30" />
          
          <div className="relative px-4 sm:px-8 pt-8 pb-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎵</span>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent font-ubuntu-mono">Music Search</h2>
            </div>
            
            <form onSubmit={handleSearch} className="space-y-4 mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="곡명, 아티스트 또는 YouTube URL을 입력하세요..."
                  className="w-full bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-xl px-6 py-4 text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400/50 focus:bg-slate-700/50 transition-all duration-300 font-apple-gothic text-lg placeholder:font-apple-gothic"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-blue-500/0 rounded-xl pointer-events-none" />
              </div>
              
              <button
                type="submit"
                disabled={isSearching}
                className="w-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 hover:from-emerald-500/30 hover:to-blue-500/30 disabled:from-slate-600/20 disabled:to-slate-700/20 text-white font-medium py-4 rounded-xl border border-emerald-500/30 hover:border-emerald-400/50 disabled:border-slate-600/30 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20 font-ubuntu-mono text-lg"
              >
                {isSearching ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                    <span className="font-apple-gothic">검색 중...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>🔍</span>
                    <span className="font-apple-gothic">검색</span>
                  </div>
                )}
              </button>
            </form>
            
            <div className="bg-slate-700/20 backdrop-blur-sm rounded-xl p-4 border border-slate-600/30">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-lg">💡</span>
                <p className="text-slate-300 font-semibold font-apple-gothic">지원하는 YouTube URL 형식:</p>
              </div>
              <div className="space-y-2 ml-6">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                  <p className="text-slate-400 text-sm font-ubuntu-mono">https://www.youtube.com/watch?v=VIDEO_ID</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <p className="text-slate-400 text-sm font-ubuntu-mono">https://youtu.be/VIDEO_ID</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-violet-400 rounded-full"></span>
                  <p className="text-slate-400 text-sm font-ubuntu-mono">https://www.youtube.com/embed/VIDEO_ID</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <div className="group relative bg-gradient-to-br from-slate-800/90 via-slate-800/50 to-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 border border-slate-700/50 mb-8">
            {/* 배경 그라디언트 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-50" />
            
            <div className="relative px-4 sm:px-8 pt-8 pb-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent font-apple-gothic">검색 결과</h2>
              </div>
              
              <div className="space-y-4">
                {searchResults.map((video, index) => (
                  <div key={index} className="group/card relative bg-slate-700/30 backdrop-blur-sm rounded-2xl border border-slate-600/50 hover:border-emerald-400/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10 overflow-hidden">
                    {/* 카드 배경 그라디언트 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-blue-500/0 group-hover/card:from-emerald-500/5 group-hover/card:to-blue-500/5 transition-all duration-300" />
                    
                    <div className="relative p-3 sm:p-6">
                      <div className="flex flex-col gap-4">
                        {/* 썸네일과 텍스트 정보 */}
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          {/* 썸네일 */}
                          <div className="relative flex-shrink-0 group/thumb">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-blue-500/20 rounded-lg blur-md group-hover/thumb:blur-lg transition-all duration-300" />
                            <img 
                              src={video.thumbnail} 
                              alt={video.title}
                              className="relative w-20 h-15 sm:w-32 sm:h-24 object-cover rounded-lg border border-slate-500/30 group-hover/thumb:border-emerald-400/50 transition-all duration-300"
                              onError={(e) => {
                                e.target.src = `https://i.ytimg.com/vi/${video.id}/default.jpg`;
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-lg" />
                          </div>
                          
                          {/* 텍스트 정보 */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <h3 className="text-sm sm:text-xl font-bold text-white group-hover/card:bg-gradient-to-r group-hover/card:from-white group-hover/card:to-slate-200 group-hover/card:bg-clip-text group-hover/card:text-transparent transition-all duration-300 font-apple-gothic leading-tight">
                              {video.title}
                            </h3>
                            <p className="text-slate-300 font-apple-gothic text-xs sm:text-sm opacity-80 group-hover/card:opacity-100 transition-opacity duration-300 truncate">
                              📺 {video.channel}
                            </p>
                          </div>
                        </div>
                        
                        {/* 태그들과 버튼 */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          {/* 태그들 */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* 품질 태그 */}
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border transition-all duration-300 font-ubuntu-mono ${getQualityColorClass(video.audioQuality).replace('bg-', 'bg-').replace('text-', 'text-').replace('border-', 'border-')} shadow-lg`}>
                              <div className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-60 animate-pulse" />
                              🎵 {getSimpleQuality(video.audioQuality)}
                            </span>
                            
                            {/* 재생시간 태그 */}
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border transition-all duration-300 font-ubuntu-mono bg-slate-500/20 text-slate-300 border-slate-500/30 shadow-lg">
                              <div className="w-1.5 h-1.5 rounded-full mr-1.5 bg-slate-400 animate-pulse" />
                              ⏱️ {video.duration}
                            </span>
                            
                            {/* YouTube 링크 */}
                            <a 
                              href={video.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border transition-all duration-300 font-ubuntu-mono bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30 hover:scale-105 shadow-lg hover:shadow-blue-500/20"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="w-1.5 h-1.5 rounded-full mr-1.5 bg-blue-400 animate-pulse" />
                              🔗 YouTube
                            </a>
                          </div>
                          
                          {/* 다운로드 버튼 */}
                          <div className="flex gap-2 justify-start sm:justify-end flex-shrink-0">
                            <button
                              onClick={() => handleDownload(video.id, 'mp3')}
                              className="group/btn relative px-3 py-1.5 sm:px-6 sm:py-3 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 hover:from-emerald-500/30 hover:to-blue-500/30 text-emerald-300 hover:text-white font-medium rounded-lg sm:rounded-xl border border-emerald-500/30 hover:border-emerald-400/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20 font-ubuntu-mono"
                            >
                              {/* 버튼 배경 효과 */}
                              <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover/btn:from-white/5 group-hover/btn:to-white/0 rounded-lg sm:rounded-xl transition-all duration-300" />
                              
                              <div className="relative flex items-center space-x-1 sm:space-x-1.5">
                                <span className="text-xs sm:text-lg">🎵</span>
                                <span className="font-apple-gothic text-xs sm:text-base">MP3 다운로드</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 다운로드 히스토리 */}
        {downloadHistory.length > 0 && (
          <div className="group relative bg-gradient-to-br from-slate-800/90 via-slate-800/50 to-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 border border-slate-700/50 mb-8">
            {/* 배경 그라디언트 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-50" />
            
            {/* 글로우 효과 */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur opacity-30" />
            
            <div className="relative px-4 sm:px-8 pt-8 pb-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📥</span>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent font-apple-gothic">다운로드 히스토리</h2>
              </div>
              
              <div className="space-y-4">
                {downloadHistory.map((download) => (
                  <div key={download.id} className="group/item relative bg-slate-700/30 backdrop-blur-sm rounded-2xl border border-slate-600/50 hover:border-emerald-400/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10 overflow-hidden">
                    {/* 아이템 배경 그라디언트 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-blue-500/0 group-hover/item:from-emerald-500/5 group-hover/item:to-blue-500/5 transition-all duration-300" />
                    
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-white group-hover/item:bg-gradient-to-r group-hover/item:from-white group-hover/item:to-slate-200 group-hover/item:bg-clip-text group-hover/item:text-transparent transition-all duration-300 font-apple-gothic line-clamp-2">
                            {download.title || `Job ID: ${download.id.slice(0, 8)}...`}
                          </h3>
                          {download.channel && (
                            <p className="text-slate-300 text-sm mb-2 font-apple-gothic opacity-80 group-hover/item:opacity-100 transition-opacity duration-300">
                              📺 {download.channel}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border transition-all duration-300 font-ubuntu-mono bg-slate-500/20 text-slate-300 border-slate-500/30 shadow-lg">
                              <div className="w-2 h-2 rounded-full mr-2 bg-slate-400 animate-pulse" />
                              🎵 {download.format.toUpperCase()}
                            </span>
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border transition-all duration-300 font-ubuntu-mono shadow-lg ${
                              download.status === 'completed' 
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                : download.status === 'failed'
                                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                download.status === 'completed' ? 'bg-emerald-400' :
                                download.status === 'failed' ? 'bg-red-400' : 'bg-amber-400'
                              } animate-pulse`} />
                              {download.status === 'completed' ? '✅ 완료' :
                               download.status === 'failed' ? '❌ 실패' : 
                               `⏳ 처리중... ${download.progress || 0}%`}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="text-slate-400 text-xs font-ubuntu-mono bg-slate-700/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-600/30">
                            {new Date(download.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      {download.status === 'processing' && (
                        <div className="w-full bg-slate-600/30 backdrop-blur-sm rounded-full h-3 border border-slate-500/30 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-blue-500 h-full rounded-full transition-all duration-500 relative overflow-hidden" 
                            style={{ width: `${download.progress || 0}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 사용법 안내 */}
        <div className="group relative bg-gradient-to-br from-slate-800/90 via-slate-800/50 to-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 border border-slate-700/50">
          {/* 배경 그라디언트 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-50" />
          
          {/* 글로우 효과 */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur opacity-30" />
          
          <div className="relative px-4 sm:px-8 pt-8 pb-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent font-apple-gothic">사용법</h2>
            </div>
            
            <div className="bg-slate-700/20 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30">
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-emerald-300 font-ubuntu-mono">1</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-xl flex-shrink-0">🔍</span>
                    <p className="text-slate-300 text-base leading-relaxed font-apple-gothic">
                      곡명, 아티스트 또는 YouTube URL을 검색창에 입력하고 검색버튼을 클릭합니다.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-emerald-300 font-ubuntu-mono">2</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-xl flex-shrink-0">🎵</span>
                    <p className="text-slate-300 text-base leading-relaxed font-apple-gothic">
                      검색 결과에서 원하는 음원을 찾아 'MP3 다운로드' 버튼을 클릭합니다.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-emerald-300 font-ubuntu-mono">3</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-xl flex-shrink-0">✏️</span>
                    <p className="text-slate-300 text-base leading-relaxed font-apple-gothic">
                      다운로드 팝업에서 메타데이터를 편집할 수 있습니다.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-emerald-300 font-ubuntu-mono">4</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-xl flex-shrink-0">💾</span>
                    <p className="text-slate-300 text-base leading-relaxed font-apple-gothic">
                      '서버 저장' 버튼으로 서버에 파일을 저장한 후, '로컬 다운로드'로 파일을 받습니다.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-emerald-300 font-ubuntu-mono">5</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-xl flex-shrink-0">🎶</span>
                    <p className="text-slate-300 text-base leading-relaxed font-apple-gothic">
                      실제 품질은 원본 영상에 따라 다르며, 대부분 128k~160k AAC 수준입니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 추가 팁 섹션 */}
            <div className="mt-8 bg-slate-700/20 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">💡</span>
                <h3 className="text-xl font-bold text-emerald-300 font-apple-gothic">추가 팁</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></span>
                  <p className="text-slate-300 text-sm font-apple-gothic">품질 표시는 추출 가능한 최대 품질을 나타내며, 실제 결과는 원본에 따라 다를 수 있습니다.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                  <p className="text-slate-300 text-sm font-apple-gothic">YouTube URL을 직접 입력하면 해당 영상의 정보를 즉시 확인할 수 있습니다.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="w-2 h-2 bg-violet-400 rounded-full mt-2 flex-shrink-0"></span>
                  <p className="text-slate-300 text-sm font-apple-gothic">다운로드가 완료되면 파일은 서버의 public/downloads 폴더에 저장됩니다.</p>
                </div>
              </div>
            </div>
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