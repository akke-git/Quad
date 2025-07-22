// pages/api/downloads/[...path].js
import path from 'path';
import fs from 'fs';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 파일 경로 구성
    const filePath = Array.isArray(req.query.path) 
      ? req.query.path.join('/') 
      : req.query.path;
    
    if (!filePath) {
      return res.status(400).json({ message: 'File path is required' });
    }

    const fullPath = path.join('/ubuntu/Music/Music_youtube', filePath);
    
    // 보안: 디렉토리 트래버설 공격 방지
    const downloadsDir = '/ubuntu/Music/Music_youtube';
    if (!fullPath.startsWith(downloadsDir)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // 파일 존재 확인
    if (!fs.existsSync(fullPath)) {
      console.log(`[Download API] File not found: ${fullPath}`);
      return res.status(404).json({ message: 'File not found' });
    }

    // 파일 정보 읽기
    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    const fileName = path.basename(fullPath);

    console.log(`[Download API] Serving file: ${fileName} (${fileSize} bytes)`);

    // Content-Type 설정
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.mp3':
        contentType = 'audio/mpeg';
        break;
      case '.mp4':
        contentType = 'video/mp4';
        break;
      case '.wav':
        contentType = 'audio/wav';
        break;
      default:
        contentType = 'application/octet-stream';
    }

    // 헤더 설정
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // 파일 스트리밍
    const fileStream = fs.createReadStream(fullPath);
    
    fileStream.on('error', (error) => {
      console.error(`[Download API] Stream error:`, error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'File streaming error' });
      }
    });

    fileStream.pipe(res);

  } catch (error) {
    console.error('[Download API] Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}