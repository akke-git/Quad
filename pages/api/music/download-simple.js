// pages/api/music/download-simple.js

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// 파일명에서 사용할 수 없는 문자 제거
function sanitizeFileName(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // 파일명에 사용할 수 없는 문자 제거
    .replace(/\s+/g, ' ') // 여러 공백을 하나로
    .trim()
    .substring(0, 100); // 최대 100자로 제한
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { videoId, format = 'mp3', title = '', channel = '', metadata = {} } = req.body;

  if (!videoId) {
    return res.status(400).json({ message: 'Video ID is required' });
  }

  if (format !== 'mp3') {
    return res.status(400).json({ message: 'Invalid format. Only mp3 is supported' });
  }

  const downloadDir = process.env.DOWNLOAD_DIR || '/ubuntu/Music/Music_youtube';
  
  try {
    console.log(`[Simple Download] Starting download for video: ${videoId}`);
    
    // 다운로드 디렉토리 생성
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    // 파일명 생성
    let baseFileName = '';
    if (title && channel) {
      const sanitizedChannel = sanitizeFileName(channel);
      const sanitizedTitle = sanitizeFileName(title);
      baseFileName = `${sanitizedChannel} - ${sanitizedTitle}`;
    } else if (title) {
      baseFileName = sanitizeFileName(title);
    } else {
      baseFileName = `video_${videoId}`;
    }
    
    const outputFile = path.join(downloadDir, `${baseFileName}.%(ext)s`);
    
    // yt-dlp 인수 설정 (웹서버 환경 최적화)
    const args = [
      '-f', 'worst',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '128K',
      '--embed-metadata',
      '--add-metadata',
      '--output', outputFile,
      '--no-warnings',
      '--ignore-errors',
      '--no-check-certificate',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      '--sleep-interval', '1',
      '--max-sleep-interval', '3',
      `https://www.youtube.com/watch?v=${videoId}`
    ];
    
    // 커스텀 메타데이터 추가 (중복 방지)
    if (metadata.title && metadata.title.trim()) {
      args.push('--replace-in-metadata', 'title', '.*', metadata.title.trim());
    }
    if (metadata.artist && metadata.artist.trim()) {
      args.push('--replace-in-metadata', 'artist', '.*', metadata.artist.trim());
      args.push('--replace-in-metadata', 'uploader', '.*', metadata.artist.trim());
    }
    if (metadata.album && metadata.album.trim()) {
      args.push('--replace-in-metadata', 'album', '.*', metadata.album.trim());
    }
    
    console.log(`[Simple Download] Command: yt-dlp ${args.join(' ')}`);
    
    // Promise로 yt-dlp 실행 (절대 경로 사용)
    const downloadResult = await new Promise((resolve, reject) => {
      // yt-dlp 실행 파일 경로 찾기
      const { execSync } = require('child_process');
      let ytdlpPath = 'yt-dlp';
      try {
        ytdlpPath = execSync('which yt-dlp', { encoding: 'utf8' }).trim();
        console.log(`[Simple Download] Using yt-dlp at: ${ytdlpPath}`);
      } catch (e) {
        console.log(`[Simple Download] Using default yt-dlp command`);
      }
      
      const ytdlp = spawn(ytdlpPath, args);
      let output = '';
      let errorOutput = '';
      
      ytdlp.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`[Simple Download] stdout: ${data.toString()}`);
      });
      
      ytdlp.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log(`[Simple Download] stderr: ${data.toString()}`);
      });
      
      ytdlp.on('close', (code) => {
        console.log(`[Simple Download] Process closed with code: ${code}`);
        if (code === 0) {
          resolve({ success: true, output, errorOutput });
        } else {
          reject(new Error(`yt-dlp failed with code ${code}: ${errorOutput}`));
        }
      });
      
      ytdlp.on('error', (error) => {
        console.error(`[Simple Download] Process error:`, error);
        reject(new Error(`Failed to spawn yt-dlp: ${error.message}`));
      });
    });
    
    // 다운로드된 파일 찾기
    const files = fs.readdirSync(downloadDir);
    console.log(`[Simple Download] Available files:`, files);
    
    let downloadedFile = null;
    
    // 1순위: baseFileName으로 매치
    if (baseFileName) {
      downloadedFile = files.find(file => file.includes(baseFileName));
    }
    
    // 2순위: 최근 생성된 파일 (1분 이내)
    if (!downloadedFile) {
      const recentFiles = files
        .map(file => ({
          name: file,
          stat: fs.statSync(path.join(downloadDir, file))
        }))
        .filter(fileInfo => 
          Date.now() - fileInfo.stat.mtime.getTime() < 60000
        )
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());
      
      if (recentFiles.length > 0) {
        downloadedFile = recentFiles[0].name;
      }
    }
    
    if (!downloadedFile) {
      throw new Error('Downloaded file not found');
    }
    
    console.log(`[Simple Download] Found file: ${downloadedFile}`);
    
    // 파일 삭제 스케줄링 (0이면 삭제 안함)
    const deleteTimeoutHours = parseInt(process.env.FILE_DELETE_TIMEOUT_HOURS) || 0;
    
    if (deleteTimeoutHours > 0) {
      const deleteTimeoutMs = Math.min(deleteTimeoutHours * 60 * 60 * 1000, 2147483647);
      console.log(`[Simple Download] File will be deleted after ${deleteTimeoutHours} hours`);
      
      setTimeout(() => {
        try {
          const filePath = path.join(downloadDir, downloadedFile);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[Simple Download] File deleted after ${deleteTimeoutHours} hours: ${downloadedFile}`);
          }
        } catch (err) {
          console.error(`[Simple Download] Failed to delete file:`, err);
        }
      }, deleteTimeoutMs);
    } else {
      console.log(`[Simple Download] File deletion disabled (FILE_DELETE_TIMEOUT_HOURS=${deleteTimeoutHours})`);
    }
    
    // 성공 응답
    res.status(200).json({
      success: true,
      downloadUrl: `/downloads/${downloadedFile}`,
      fileName: downloadedFile,
      message: 'Download completed successfully'
    });
    
  } catch (error) {
    console.error(`[Simple Download] Error:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Download failed',
      error: error.message
    });
  }
}