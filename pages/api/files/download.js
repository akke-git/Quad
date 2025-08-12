// pages/api/files/download.js
import fs from 'fs';
import path from 'path';

// 경로 보안 검증
function validatePath(requestedPath) {
  // 경로 정리: 앞의 '/' 제거 및 '..' 등 정리
  const cleanPath = (requestedPath || '').replace(/^\/+/, '').replace(/\.\.+/g, '');
  
  // public 폴더 기준으로 안전한 경로 생성
  const fullPath = path.join(process.cwd(), 'public', cleanPath);
  
  // Path traversal 공격 방지: public 폴더 하위인지 확인
  const allowedBasePath = path.join(process.cwd(), 'public');
  const resolvedPath = path.resolve(fullPath);
  const resolvedBasePath = path.resolve(allowedBasePath);
  
  if (!resolvedPath.startsWith(resolvedBasePath)) {
    throw new Error('Access denied: Invalid path');
  }
  
  return resolvedPath;
}

// MIME 타입 결정
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

export default async function handler(req, res) {
  const { method, query } = req;
  
  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
  
  try {
    const filePath = query.path;
    
    if (!filePath) {
      return res.status(400).json({ message: 'File path is required' });
    }
    
    const fullPath = validatePath(filePath);
    
    // 파일이 존재하는지 확인
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ 
        message: 'File not found',
        path: filePath 
      });
    }
    
    // 파일인지 확인 (디렉토리 다운로드 방지)
    const stats = fs.statSync(fullPath);
    if (!stats.isFile()) {
      return res.status(400).json({ 
        message: 'Path is not a file',
        path: filePath 
      });
    }
    
    // 파일 정보
    const fileName = path.basename(fullPath);
    const fileSize = stats.size;
    const mimeType = getMimeType(fullPath);
    
    // 다운로드 헤더 설정
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // 파일 스트림 생성 및 전송
    const fileStream = fs.createReadStream(fullPath);
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'Failed to read file',
          error: error.message 
        });
      }
    });
    
    // 스트림을 response에 파이프
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('File download error:', error);
    
    if (error.message.includes('Access denied')) {
      return res.status(403).json({ 
        message: 'Access denied',
        error: error.message 
      });
    }
    
    return res.status(500).json({ 
      message: 'Failed to download file',
      error: error.message 
    });
  }
}