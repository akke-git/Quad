// pages/api/music/download.js

import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// 임시 작업 저장소 (실제 구현에서는 Redis나 DB 사용)
const jobs = new Map();
console.log(`[Download API] Jobs Map initialized at ${new Date().toISOString()}`);

// 파일 시스템을 사용한 job 상태 저장 (서버리스 환경 대응)
const jobsDir = path.join(process.cwd(), 'temp', 'jobs');

// jobs 디렉토리 생성
if (!fs.existsSync(jobsDir)) {
  fs.mkdirSync(jobsDir, { recursive: true });
}

// job 상태를 파일에 저장
function saveJobToFile(jobId, jobData) {
  try {
    const jobFile = path.join(jobsDir, `${jobId}.json`);
    fs.writeFileSync(jobFile, JSON.stringify(jobData, null, 2));
    console.log(`[Job File] Saved job ${jobId} to file`);
  } catch (error) {
    console.error(`[Job File] Failed to save job ${jobId}:`, error);
  }
}

// 파일에서 job 상태 읽기
function loadJobFromFile(jobId) {
  try {
    const jobFile = path.join(jobsDir, `${jobId}.json`);
    if (fs.existsSync(jobFile)) {
      const jobData = JSON.parse(fs.readFileSync(jobFile, 'utf8'));
      console.log(`[Job File] Loaded job ${jobId} from file`);
      return jobData;
    }
  } catch (error) {
    console.error(`[Job File] Failed to load job ${jobId}:`, error);
  }
  return null;
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

  try {
    const jobId = uuidv4();
    
    console.log(`[Download API] Creating job: ${jobId}`);
    
    // 작업 정보 저장
    const jobData = {
      videoId,
      format,
      title,
      channel,
      metadata,
      status: 'queued',
      createdAt: new Date().toISOString(),
      progress: 0
    };
    
    jobs.set(jobId, jobData);
    saveJobToFile(jobId, jobData);

    console.log(`[Download API] Job ${jobId} saved to memory and file`);
    console.log(`[Download API] Current jobs in memory:`, Array.from(jobs.keys()));

    // 실제 다운로드 작업 시작 (비동기)
    processDownload(jobId, videoId, format, title, channel, metadata);

    console.log(`[Download API] Sending response for job: ${jobId}`);
    res.status(200).json({ 
      jobId,
      message: 'Download job created successfully'
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

// 파일명에서 사용할 수 없는 문자 제거
function sanitizeFileName(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // 파일명에 사용할 수 없는 문자 제거
    .replace(/\s+/g, ' ') // 여러 공백을 하나로
    .trim()
    .substring(0, 100); // 최대 100자로 제한
}

// 다운로드 처리 함수
async function processDownload(jobId, videoId, format, title = '', channel = '', metadata = {}) {
  const downloadDir = '/ubuntu/Music/Music_youtube';
  
  // 파일명 생성: "아티스트 - 곡명.확장자" 형식
  let baseFileName = '';
  let sanitizedTitle = '';
  let sanitizedChannel = '';
  
  if (title && channel) {
    sanitizedChannel = sanitizeFileName(channel);
    sanitizedTitle = sanitizeFileName(title);
    baseFileName = `${sanitizedChannel} - ${sanitizedTitle}`;
  } else if (title) {
    sanitizedTitle = sanitizeFileName(title);
    baseFileName = sanitizedTitle;
  } else {
    baseFileName = jobId; // 백업: UUID 사용
  }
  
  const outputFile = path.join(downloadDir, `${baseFileName}.%(ext)s`);
  
  try {
    // yt-dlp 설치 확인
    console.log(`[${jobId}] Checking yt-dlp installation...`);
    try {
      const { execSync } = require('child_process');
      const version = execSync('yt-dlp --version', { encoding: 'utf8', timeout: 5000 });
      console.log(`[${jobId}] yt-dlp version: ${version.trim()}`);
    } catch (checkError) {
      console.error(`[${jobId}] yt-dlp not found or error:`, checkError.message);
      throw new Error(`yt-dlp is not installed or not accessible: ${checkError.message}`);
    }

    // 다운로드 디렉토리 생성
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
      console.log(`[${jobId}] Created download directory: ${downloadDir}`);
    }

    // 작업 상태 업데이트
    const updatedJob = {
      ...jobs.get(jobId),
      status: 'processing',
      progress: 5
    };
    jobs.set(jobId, updatedJob);
    saveJobToFile(jobId, updatedJob);

    // yt-dlp 인수 설정 (최고 품질 오디오 다운로드)
    const args = [
      '-f', 'bestaudio/best',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '0', // 최고 품질
      '--embed-metadata', // 메타데이터 포함
      '--add-metadata', // 추가 메타데이터
      '--output', outputFile,
      '--no-warnings',
      `https://www.youtube.com/watch?v=${videoId}`
    ];
    
    // 커스텀 메타데이터가 있으면 추가
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
    
    console.log(`[${jobId}] Starting download with args:`, args);
    console.log(`[${jobId}] Command: yt-dlp ${args.join(' ')}`);

    // yt-dlp 실행
    console.log(`[${jobId}] Spawning yt-dlp process...`);
    const ytdlp = spawn('yt-dlp', args);
    console.log(`[${jobId}] yt-dlp process spawned, PID: ${ytdlp.pid}`);
    
    let output = '';
    let errorOutput = '';
    let lastProgressUpdate = Date.now();
    
    // 진행률 업데이트 모니터링 (30초 동안 업데이트가 없으면 강제로 진행률 증가)
    const progressMonitor = setInterval(() => {
      const currentJob = jobs.get(jobId);
      if (currentJob && currentJob.status === 'processing') {
        const timeSinceLastUpdate = Date.now() - lastProgressUpdate;
        if (timeSinceLastUpdate > 30000 && currentJob.progress < 80) { // 30초 동안 업데이트 없음
          const newProgress = Math.min(80, currentJob.progress + 10);
          const updatedJob = {
            ...currentJob,
            progress: newProgress
          };
          jobs.set(jobId, updatedJob);
          saveJobToFile(jobId, updatedJob);
          console.log(`[${jobId}] Progress timeout - artificially increased to ${newProgress}%`);
          lastProgressUpdate = Date.now();
        }
      }
    }, 10000); // 10초마다 체크

    ytdlp.stdout.on('data', (data) => {
      output += data.toString();
      const dataStr = data.toString();
      console.log(`[${jobId}] yt-dlp stdout:`, dataStr);
      
      // yt-dlp 진행률 파싱
      const currentJob = jobs.get(jobId);
      if (currentJob) {
        let newProgress = currentJob.progress;
        
        // [download] 진행률 파싱 (예: "[download]  24.2% of    4.13MiB")
        const downloadMatch = dataStr.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
        if (downloadMatch) {
          const downloadProgress = parseFloat(downloadMatch[1]);
          newProgress = Math.min(85, downloadProgress); // 다운로드 85%까지
          console.log(`[${jobId}] Download progress: ${downloadProgress}%`);
        }
        
        // [ExtractAudio] 단계 감지
        if (dataStr.includes('[ExtractAudio]')) {
          newProgress = 90;
          console.log(`[${jobId}] Audio extraction started: 90%`);
        }
        
        // [Metadata] 단계 감지
        if (dataStr.includes('[Metadata]')) {
          newProgress = 95;
          console.log(`[${jobId}] Adding metadata: 95%`);
        }
        
        // 진행률이 변경되었을 때만 업데이트
        if (newProgress !== currentJob.progress) {
          const updatedProgress = {
            ...currentJob,
            progress: Math.round(newProgress)
          };
          jobs.set(jobId, updatedProgress);
          saveJobToFile(jobId, updatedProgress);
          lastProgressUpdate = Date.now();
          console.log(`[${jobId}] Progress updated to ${Math.round(newProgress)}%`);
        }
      }
    });

    ytdlp.stderr.on('data', (data) => {
      errorOutput += data.toString();
      const dataStr = data.toString();
      console.log(`[${jobId}] yt-dlp stderr:`, dataStr);
      
      // stderr에서도 진행률 정보가 올 수 있음
      const currentJob = jobs.get(jobId);
      if (currentJob) {
        let newProgress = currentJob.progress;
        
        // stderr에서 download 진행률 파싱
        const downloadMatch = dataStr.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
        if (downloadMatch) {
          const downloadProgress = parseFloat(downloadMatch[1]);
          newProgress = Math.min(85, downloadProgress);
          console.log(`[${jobId}] Download progress from stderr: ${downloadProgress}%`);
          
          // 진행률 업데이트
          if (newProgress !== currentJob.progress) {
            const updatedProgress = {
              ...currentJob,
              progress: Math.round(newProgress)
            };
            jobs.set(jobId, updatedProgress);
            saveJobToFile(jobId, updatedProgress);
            lastProgressUpdate = Date.now();
            console.log(`[${jobId}] Progress updated from stderr to ${Math.round(newProgress)}%`);
          }
        }
      }
    });

    ytdlp.on('close', (code) => {
      console.log(`[${jobId}] yt-dlp process closed with code: ${code}`);
      clearInterval(progressMonitor); // 진행률 모니터 정리
      
      if (code === 0) {
        // 성공 - 생성된 파일 찾기
        const files = fs.readdirSync(downloadDir);
        
        // 다운로드된 파일 찾기 (우선순위에 따라 시도)
        let downloadedFile = null;
        
        if (baseFileName) {
          // 1순위: baseFileName과 부분 매치
          downloadedFile = files.find(file => file.includes(baseFileName));
        }
        
        if (!downloadedFile && sanitizedTitle) {
          // 2순위: 제목으로 매치
          downloadedFile = files.find(file => file.includes(sanitizedTitle));
        }
        
        if (!downloadedFile && sanitizedChannel) {
          // 3순위: 채널명으로 매치
          downloadedFile = files.find(file => file.includes(sanitizedChannel));
        }
        
        if (!downloadedFile) {
          // 4순위: jobId로 시작하는 파일 (백업용)
          downloadedFile = files.find(file => file.startsWith(jobId));
        }
        
        if (!downloadedFile) {
          // 최후 수단: 최근 생성된 파일 찾기
          const recentFiles = files
            .map(file => ({
              name: file,
              stat: fs.statSync(path.join(downloadDir, file))
            }))
            .filter(fileInfo => 
              Date.now() - fileInfo.stat.mtime.getTime() < 60000 // 1분 이내
            )
            .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());
          
          if (recentFiles.length > 0) {
            downloadedFile = recentFiles[0].name;
            console.log(`[${jobId}] Using most recent file as fallback: ${downloadedFile}`);
          }
        }
        
        console.log(`[${jobId}] Available files:`, files);
        console.log(`[${jobId}] Looking for files with baseFileName: "${baseFileName}"`);
        console.log(`[${jobId}] Found downloaded file:`, downloadedFile);
        
        if (downloadedFile) {
          // 원본 파일명을 그대로 사용 (이미 baseFileName으로 설정됨)
          const finalFileName = downloadedFile;
          const finalFilePath = path.join(downloadDir, finalFileName);

          const completedJob = {
            ...jobs.get(jobId),
            status: 'completed',
            progress: 100,
            downloadUrl: `/downloads/${finalFileName}`,
            fileName: finalFileName,
            completedAt: new Date().toISOString()
          };
          jobs.set(jobId, completedJob);
          saveJobToFile(jobId, completedJob);
          
          console.log(`[${jobId}] Job marked as completed:`, jobs.get(jobId));

          // 파일 삭제 스케줄링 (0이면 삭제 안함)
          const deleteTimeoutHours = parseInt(process.env.FILE_DELETE_TIMEOUT_HOURS) || 0;
          
          if (deleteTimeoutHours > 0) {
            const deleteTimeoutMs = Math.min(deleteTimeoutHours * 60 * 60 * 1000, 2147483647);
            console.log(`[${jobId}] File will be deleted after ${deleteTimeoutHours} hours`);
            
            setTimeout(() => {
              try {
                if (fs.existsSync(finalFilePath)) {
                  fs.unlinkSync(finalFilePath);
                  console.log(`[${jobId}] File deleted after ${deleteTimeoutHours} hours: ${finalFileName}`);
                }
                // 파일 삭제와 함께 job 정보도 삭제
                jobs.delete(jobId);
                console.log(`[${jobId}] Job removed from memory`);
              } catch (err) {
                console.error(`[${jobId}] Failed to delete file:`, err);
              }
            }, deleteTimeoutMs);
          } else {
            console.log(`[${jobId}] File deletion disabled (FILE_DELETE_TIMEOUT_HOURS=${deleteTimeoutHours})`);
          }

        } else {
          console.error(`[${jobId}] Downloaded file not found in directory`);
          const failedJob = {
            ...jobs.get(jobId),
            status: 'failed',
            error: 'Downloaded file not found'
          };
          jobs.set(jobId, failedJob);
          saveJobToFile(jobId, failedJob);
        }
      } else {
        console.error(`[${jobId}] yt-dlp failed with code ${code}: ${errorOutput}`);
        const failedJob = {
          ...jobs.get(jobId),
          status: 'failed',
          error: `yt-dlp exited with code ${code}: ${errorOutput}`
        };
        jobs.set(jobId, failedJob);
        saveJobToFile(jobId, failedJob);
      }
    });

    ytdlp.on('error', (error) => {
      console.error(`[${jobId}] yt-dlp process error:`, error);
      throw new Error(`Failed to spawn yt-dlp: ${error.message}`);
    });
    
    // 추가 프로세스 이벤트 로깅
    ytdlp.on('spawn', () => {
      console.log(`[${jobId}] yt-dlp process successfully spawned`);
    });
    
    ytdlp.on('disconnect', () => {
      console.log(`[${jobId}] yt-dlp process disconnected`);
    });
    
    ytdlp.on('exit', (code, signal) => {
      console.log(`[${jobId}] yt-dlp process exited with code ${code}, signal ${signal}`);
    });

  } catch (error) {
    console.error(`[${jobId}] Download failed:`, error);
    const failedJob = {
      ...jobs.get(jobId),
      status: 'failed',
      error: error.message
    };
    jobs.set(jobId, failedJob);
    saveJobToFile(jobId, failedJob);
  }
}

// 작업 상태 조회를 위한 exports
export { jobs };