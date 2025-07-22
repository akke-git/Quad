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

  const downloadDir = path.join(process.cwd(), 'public', 'downloads');
  
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
    
    // yt-dlp 인수 설정
    const args = [
      '-f', 'bestaudio/best',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '--embed-metadata',
      '--add-metadata',
      '--output', outputFile,
      '--no-warnings',
      `https://www.youtube.com/watch?v=${videoId}`
    ];
    
    // 커스텀 메타데이터 추가
    if (metadata.title) {
      args.push('--replace-in-metadata', 'title', '.*', metadata.title);
    }
    if (metadata.artist) {
      args.push('--replace-in-metadata', 'artist', '.*', metadata.artist);
      args.push('--replace-in-metadata', 'uploader', '.*', metadata.artist);
    }
    if (metadata.album) {
      args.push('--replace-in-metadata', 'album', '.*', metadata.album);
    }
    
    console.log(`[Simple Download] Command: yt-dlp ${args.join(' ')}`);
    
    // Promise로 yt-dlp 실행
    const downloadResult = await new Promise((resolve, reject) => {
      const ytdlp = spawn('yt-dlp', args);
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
    
    // 파일 삭제 스케줄링
    const deleteTimeoutHours = parseInt(process.env.FILE_DELETE_TIMEOUT_HOURS) || 1;
    const deleteTimeoutMs = deleteTimeoutHours * 60 * 60 * 1000;
    
    setTimeout(() => {
      try {
        const filePath = path.join(downloadDir, downloadedFile);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[Simple Download] File deleted: ${downloadedFile}`);
        }
      } catch (err) {
        console.error(`[Simple Download] Failed to delete file:`, err);
      }
    }, deleteTimeoutMs);
    
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