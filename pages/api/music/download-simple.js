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

  const { videoId, format = 'mp3', title = '', channel = '', metadata = {}, embedThumbnail = true } = req.body;

  if (!videoId) {
    return res.status(400).json({ message: 'Video ID is required' });
  }

  if (format !== 'mp3') {
    return res.status(400).json({ message: 'Invalid format. Only mp3 is supported' });
  }

  const downloadDir = path.resolve(process.env.DOWNLOAD_DIR || './public/downloads');
  
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
      '--output', outputFile,
      '--no-warnings',
      '--ignore-errors',
      '--no-check-certificate',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      '--sleep-interval', '1',
      '--max-sleep-interval', '3',
      `https://www.youtube.com/watch?v=${videoId}`
    ];
    
    // 썸네일은 별도로 다운로드하여 ffmpeg로 처리
    if (embedThumbnail) {
      args.push('--write-thumbnail');
      args.push('--convert-thumbnails', 'jpg');
    }
    
    // 기본 자동 메타데이터 추가 비활성화하고 오디오만 추출
    // 메타데이터는 별도로 후처리
    
    console.log(`[Simple Download] Command: yt-dlp ${args.join(' ')}`);
    
    // Promise로 yt-dlp 실행 (절대 경로 사용)
    await new Promise((resolve, reject) => {
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
    
    // 다운로드된 파일 찾기 (mp3 파일만)
    const files = fs.readdirSync(downloadDir);
    console.log(`[Simple Download] Available files:`, files);
    
    let downloadedFile = null;
    
    // MP3 파일만 필터링
    const mp3Files = files.filter(file => file.endsWith('.mp3'));
    
    // 1순위: baseFileName으로 매치
    if (baseFileName) {
      downloadedFile = mp3Files.find(file => file.includes(baseFileName));
    }
    
    // 2순위: 최근 생성된 MP3 파일 (1분 이내)
    if (!downloadedFile) {
      const recentFiles = mp3Files
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
    
    // ffmpeg로 메타데이터 후처리 (중복 제거 및 썸네일 임베딩)
    const needsMetadataProcessing = Object.keys(metadata).some(key => metadata[key] && metadata[key].trim()) || embedThumbnail;
    
    if (needsMetadataProcessing) {
      try {
        const originalFile = path.join(downloadDir, downloadedFile);
        const tempFile = path.join(downloadDir, `temp_${downloadedFile}`);
        
        console.log(`[Simple Download] Applying custom metadata to: ${downloadedFile}`);
        console.log(`[Simple Download] Metadata:`, metadata);
        console.log(`[Simple Download] Embed thumbnail:`, embedThumbnail);
        
        // 현재 디렉토리의 모든 파일 다시 조회 (썸네일 파일 포함)
        const allFiles = fs.readdirSync(downloadDir);
        console.log(`[Simple Download] All files in directory:`, allFiles);
        
        // 썸네일 파일 찾기
        let thumbnailFile = null;
        if (embedThumbnail) {
          const possibleThumbnails = allFiles.filter(file => {
            const hasMatchingName = file.includes(baseFileName) || file.includes(videoId);
            const isImage = file.toLowerCase().endsWith('.jpg') || 
                           file.toLowerCase().endsWith('.jpeg') || 
                           file.toLowerCase().endsWith('.webp');
            return hasMatchingName && isImage;
          });
          
          if (possibleThumbnails.length > 0) {
            thumbnailFile = path.join(downloadDir, possibleThumbnails[0]);
            console.log(`[Simple Download] Found thumbnail: ${possibleThumbnails[0]}`);
          } else {
            console.log(`[Simple Download] No thumbnail found for baseFileName: ${baseFileName}, videoId: ${videoId}`);
          }
        }
        
        // ffmpeg 명령어를 배열로 구성 (쉘 이스케이프 문제 방지)
        const ffmpegArgs = [
          '-i', originalFile,
          '-loglevel', 'error'  // 에러만 출력
        ];
        
        // 썸네일이 있으면 추가 입력으로 지정
        if (thumbnailFile && fs.existsSync(thumbnailFile)) {
          ffmpegArgs.push('-i', thumbnailFile);
        }
        
        // 오디오 스트림 매핑 및 코덱 설정
        ffmpegArgs.push(
          '-map', '0:a',  // 오디오 스트림 매핑
          '-c:a', 'copy',  // 오디오 재인코딩 없이 복사
          '-map_metadata', '-1'  // 기존 메타데이터 모두 제거
        );
        
        // 썸네일이 있으면 앨범 아트로 추가
        if (thumbnailFile && fs.existsSync(thumbnailFile)) {
          ffmpegArgs.push(
            '-map', '1:0',  // 썸네일 이미지 매핑
            '-c:v', 'copy',  // 이미지 재인코딩 없이 복사
            '-disposition:v:0', 'attached_pic'  // 앨범 아트로 설정
          );
        }
        
        // 커스텀 메타데이터 추가 (값에 특수문자가 있을 수 있으므로 따옴표 처리)
        if (metadata.title && metadata.title.trim()) {
          ffmpegArgs.push('-metadata', `title=${metadata.title.trim()}`);
        }
        if (metadata.artist && metadata.artist.trim()) {
          ffmpegArgs.push('-metadata', `artist=${metadata.artist.trim()}`);
        }
        if (metadata.album && metadata.album.trim()) {
          ffmpegArgs.push('-metadata', `album=${metadata.album.trim()}`);
        }
        if (metadata.track && metadata.track.trim()) {
          ffmpegArgs.push('-metadata', `track=${metadata.track.trim()}`);
        }
        if (metadata.year && metadata.year.trim()) {
          ffmpegArgs.push('-metadata', `date=${metadata.year.trim()}`);
        }
        if (metadata.genre && metadata.genre.trim()) {
          ffmpegArgs.push('-metadata', `genre=${metadata.genre.trim()}`);
        }
        if (metadata.comment && metadata.comment.trim()) {
          ffmpegArgs.push('-metadata', `comment=${metadata.comment.trim()}`);
        }
        
        ffmpegArgs.push('-y', tempFile);  // 출력 파일, 덮어쓰기 허용
        
        console.log(`[Simple Download] FFmpeg command: ffmpeg ${ffmpegArgs.join(' ')}`);
        
        // ffmpeg 실행 (spawn 사용으로 더 나은 에러 처리)
        const { spawn } = require('child_process');
        
        await new Promise((resolve, reject) => {
          const ffmpeg = spawn('ffmpeg', ffmpegArgs);
          let stderr = '';
          
          ffmpeg.stderr.on('data', (data) => {
            stderr += data.toString();
          });
          
          ffmpeg.on('close', (code) => {
            if (code === 0) {
              console.log(`[Simple Download] FFmpeg completed successfully`);
              resolve();
            } else {
              console.error(`[Simple Download] FFmpeg failed with code ${code}`);
              console.error(`[Simple Download] FFmpeg stderr:`, stderr);
              reject(new Error(`FFmpeg failed: ${stderr}`));
            }
          });
          
          ffmpeg.on('error', (error) => {
            console.error(`[Simple Download] FFmpeg spawn error:`, error);
            reject(error);
          });
        });
        
        // 원본 파일을 임시 파일로 교체
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(originalFile);
          fs.renameSync(tempFile, originalFile);
          console.log(`[Simple Download] File replaced successfully`);
        } else {
          throw new Error('Temporary file was not created');
        }
        
        // 모든 썸네일 파일 정리 (jpg, jpeg, webp, png 등)
        const thumbnailExtensions = ['.jpg', '.jpeg', '.webp', '.png'];
        const currentFiles = fs.readdirSync(downloadDir);
        
        currentFiles.forEach(file => {
          const hasMatchingName = file.includes(baseFileName) || file.includes(videoId);
          const isThumbnail = thumbnailExtensions.some(ext => file.toLowerCase().endsWith(ext));
          
          if (hasMatchingName && isThumbnail) {
            try {
              const thumbnailPath = path.join(downloadDir, file);
              fs.unlinkSync(thumbnailPath);
              console.log(`[Simple Download] Cleaned up thumbnail file: ${file}`);
            } catch (cleanupError) {
              console.warn(`[Simple Download] Could not clean up thumbnail file ${file}:`, cleanupError.message);
            }
          }
        });
        
        console.log(`[Simple Download] Metadata and thumbnail applied successfully`);
        
      } catch (ffmpegError) {
        console.error(`[Simple Download] FFmpeg processing failed:`, ffmpegError);
        
        // ffmpeg 실패해도 썸네일 파일은 정리
        if (embedThumbnail) {
          const thumbnailExtensions = ['.jpg', '.jpeg', '.webp', '.png'];
          const currentFiles = fs.readdirSync(downloadDir);
          
          currentFiles.forEach(file => {
            const hasMatchingName = file.includes(baseFileName) || file.includes(videoId);
            const isThumbnail = thumbnailExtensions.some(ext => file.toLowerCase().endsWith(ext));
            
            if (hasMatchingName && isThumbnail) {
              try {
                const thumbnailPath = path.join(downloadDir, file);
                fs.unlinkSync(thumbnailPath);
                console.log(`[Simple Download] Cleaned up thumbnail file after ffmpeg failure: ${file}`);
              } catch (cleanupError) {
                console.warn(`[Simple Download] Could not clean up thumbnail file ${file}:`, cleanupError.message);
              }
            }
          });
        }
      }
    }
    
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