// pages/api/music/video-info.js

import { spawn } from 'child_process';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ message: 'URL parameter is required' });
  }

  try {
    // YouTube URL에서 videoId 추출
    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ message: 'Invalid YouTube URL' });
    }

    const videoInfo = await getVideoInfo(videoId);
    
    res.status(200).json({ 
      videoInfo,
      videoId 
    });

  } catch (error) {
    console.error('Video info error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

function extractVideoId(url) {
  // YouTube URL 패턴 매칭
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function getVideoInfo(videoId) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      '--dump-json',
      '--no-warnings',
      `https://www.youtube.com/watch?v=${videoId}`
    ]);

    let output = '';
    let errorOutput = '';

    ytdlp.stdout.on('data', (data) => {
      output += data.toString();
    });

    ytdlp.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`yt-dlp exited with code ${code}: ${errorOutput}`));
        return;
      }

      try {
        const data = JSON.parse(output.trim());
        
        const videoInfo = {
          id: data.id,
          title: data.title || 'Unknown Title',
          channel: data.uploader || data.channel || 'Unknown Channel',
          duration: formatDuration(data.duration),
          thumbnail: data.thumbnail || `https://i.ytimg.com/vi/${data.id}/default.jpg`,
          url: `https://www.youtube.com/watch?v=${data.id}`,
          audioQuality: estimateAudioQuality(data),
          qualityScore: getQualityScore(estimateAudioQuality(data))
        };

        resolve(videoInfo);
      } catch (parseError) {
        reject(new Error(`Failed to parse video info: ${parseError.message}`));
      }
    });

    ytdlp.on('error', (error) => {
      reject(new Error(`Failed to spawn yt-dlp: ${error.message}`));
    });
  });
}

function formatDuration(seconds) {
  if (!seconds) return 'Unknown';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

function estimateAudioQuality(item) {
  const channel = (item.uploader || item.channel || '').toLowerCase();
  const title = (item.title || '').toLowerCase();
  
  // 공식 음악 채널들 - 높은 품질
  const officialMusicChannels = [
    'vevo', 'official', 'records', 'entertainment', 'music',
    'stone music', 'genie music', 'hybe labels', 'sm town',
    'jyp entertainment', 'yg entertainment', 'starship', 
    'cube entertainment', 'fnc entertainment'
  ];
  
  // 고품질 키워드
  const highQualityKeywords = [
    'official mv', 'official music video', 'audio', 'remastered',
    'hd', '4k', 'high quality', 'studio version'
  ];
  
  // 낮은 품질 키워드  
  const lowQualityKeywords = [
    'live', 'concert', 'fancam', 'cover', 'acoustic',
    'radio rip', 'tv rip', 'old', 'rare'
  ];
  
  // 채널 기반 판단
  const isOfficialChannel = officialMusicChannels.some(keyword => 
    channel.includes(keyword)
  );
  
  // 제목 기반 판단
  const hasHighQualityKeyword = highQualityKeywords.some(keyword =>
    title.includes(keyword)
  );
  
  const hasLowQualityKeyword = lowQualityKeywords.some(keyword =>
    title.includes(keyword)
  );
  
  // 품질 추정
  if (isOfficialChannel && hasHighQualityKeyword) {
    return '높은 품질 (~256k AAC)';
  } else if (isOfficialChannel) {
    return '좋은 품질 (~160k AAC)';
  } else if (hasHighQualityKeyword) {
    return '좋은 품질 (~160k AAC)';
  } else if (hasLowQualityKeyword) {
    return '낮은 품질 (~96k AAC)';
  } else {
    return '일반 품질 (~128k AAC)';
  }
}

function getQualityScore(qualityText) {
  // 품질별 점수 (높을수록 좋은 품질)
  const qualityScores = {
    '높은 품질 (~256k AAC)': 4,
    '좋은 품질 (~160k AAC)': 3,
    '일반 품질 (~128k AAC)': 2,
    '낮은 품질 (~96k AAC)': 1
  };
  
  return qualityScores[qualityText] || 2; // 기본값은 일반 품질
}