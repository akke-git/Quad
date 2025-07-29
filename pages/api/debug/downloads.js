// pages/api/debug/downloads.js
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const downloadsDir = path.resolve(process.env.DOWNLOAD_DIR || './public/downloads');
    
    const debugInfo = {
      // 환경 정보
      environment: {
        nodeEnv: process.env.NODE_ENV,
        downloadDir: process.env.DOWNLOAD_DIR,
        defaultDir: path.resolve('./public/downloads'),
        resolvedDir: downloadsDir,
        processUser: process.getuid ? process.getuid() : 'unknown',
        processGroup: process.getgid ? process.getgid() : 'unknown'
      },
      
      // 디렉토리 정보
      directory: {
        path: downloadsDir,
        exists: fs.existsSync(downloadsDir),
        permissions: null,
        stats: null
      },
      
      // 파일 목록
      files: [],
      
      // 시스템 정보
      system: {
        platform: process.platform,
        cwd: process.cwd(),
        parentDirs: []
      },
      
      error: null
    };

    // 시스템 명령어로 추가 정보 수집
    try {
      if (process.platform === 'linux') {
        debugInfo.system.whoami = execSync('whoami', { encoding: 'utf8' }).trim();
        debugInfo.system.groups = execSync('groups', { encoding: 'utf8' }).trim();
      }
    } catch (e) {
      debugInfo.system.commandError = e.message;
    }

    // 상위 디렉토리들 확인
    let currentPath = downloadsDir;
    for (let i = 0; i < 5; i++) {
      const parentPath = path.dirname(currentPath);
      if (parentPath === currentPath) break; // 루트에 도달
      
      debugInfo.system.parentDirs.push({
        path: parentPath,
        exists: fs.existsSync(parentPath),
        readable: false
      });
      
      try {
        fs.accessSync(parentPath, fs.constants.R_OK);
        debugInfo.system.parentDirs[debugInfo.system.parentDirs.length - 1].readable = true;
      } catch (e) {
        // 권한 없음
      }
      
      currentPath = parentPath;
    }

    // 디렉토리 정보 수집
    if (debugInfo.directory.exists) {
      try {
        // 디렉토리 통계 정보
        const dirStat = fs.statSync(downloadsDir);
        debugInfo.directory.stats = {
          mode: dirStat.mode.toString(8), // 8진수 권한
          uid: dirStat.uid,
          gid: dirStat.gid,
          size: dirStat.size,
          modified: dirStat.mtime
        };

        // 디렉토리 권한 확인
        fs.accessSync(downloadsDir, fs.constants.R_OK);
        debugInfo.directory.permissions = 'readable';
        
        // 파일 목록 가져오기
        const files = fs.readdirSync(downloadsDir);
        debugInfo.files = files.map(file => {
          const filePath = path.join(downloadsDir, file);
          const stat = fs.statSync(filePath);
          return {
            name: file,
            size: stat.size,
            modified: stat.mtime,
            isFile: stat.isFile(),
            mode: stat.mode.toString(8),
            uid: stat.uid,
            gid: stat.gid,
            readable: true,
            downloadUrl: `/downloads/${file}`
          };
        }).filter(f => f.isFile);
        
        // 각 파일의 권한도 확인
        debugInfo.files.forEach(file => {
          try {
            fs.accessSync(path.join(downloadsDir, file.name), fs.constants.R_OK);
          } catch (e) {
            file.readable = false;
            file.error = e.message;
          }
        });
        
        // 리눅스에서 ls -la 실행
        try {
          if (process.platform === 'linux') {
            debugInfo.directory.lsOutput = execSync(`ls -la "${downloadsDir}"`, { encoding: 'utf8' });
          }
        } catch (e) {
          debugInfo.directory.lsError = e.message;
        }
        
      } catch (accessError) {
        debugInfo.directory.permissions = 'not readable';
        debugInfo.error = accessError.message;
      }
    } else {
      // 디렉토리가 없는 경우 생성 시도
      try {
        fs.mkdirSync(downloadsDir, { recursive: true });
        debugInfo.directory.created = true;
        debugInfo.directory.exists = true;
      } catch (createError) {
        debugInfo.directory.createError = createError.message;
      }
    }

    res.status(200).json(debugInfo);
    
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      downloadsDir: path.resolve(process.env.DOWNLOAD_DIR || './public/downloads')
    });
  }
}