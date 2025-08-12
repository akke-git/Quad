// pages/api/files/index.js
import fs from 'fs';
import path from 'path';
import { validatePath, isServerHostPath, formatUserPath } from '../../../lib/filePathValidator';

// 권한을 문자열로 변환 (rwxrwxrwx 형식)
function formatPermissions(mode) {
  const permissions = [
    // Owner permissions
    (mode & 0o400) ? 'r' : '-',
    (mode & 0o200) ? 'w' : '-',
    (mode & 0o100) ? 'x' : '-',
    // Group permissions
    (mode & 0o040) ? 'r' : '-',
    (mode & 0o020) ? 'w' : '-',
    (mode & 0o010) ? 'x' : '-',
    // Others permissions
    (mode & 0o004) ? 'r' : '-',
    (mode & 0o002) ? 'w' : '-',
    (mode & 0o001) ? 'x' : '-'
  ];
  
  return permissions.join('');
}

// 파일 정보 포맷팅
function formatFileInfo(filePath, fileName, isServerHost = false) {
  const stats = fs.statSync(filePath);
  const isDirectory = stats.isDirectory();
  
  const formattedPath = formatUserPath(filePath, isServerHost);
  
  console.log(`formatFileInfo: ${fileName}`);
  console.log(`  - filePath: ${filePath}`);
  console.log(`  - formattedPath: ${formattedPath}`);
  console.log(`  - isDirectory: ${isDirectory}`);
  console.log(`  - size: ${stats.size}`);
  console.log(`  - permissions: ${formatPermissions(stats.mode)}`);
  
  return {
    name: fileName,
    type: isDirectory ? 'directory' : 'file',
    size: isDirectory ? null : stats.size,
    modified: stats.mtime.toISOString(),
    permissions: formatPermissions(stats.mode),
    path: formattedPath
  };
}

export default async function handler(req, res) {
  const { method, query } = req;
  
  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
  
  try {
    const requestedPath = query.path || '';
    const fullPath = validatePath(requestedPath);
    
    // 서버 호스트 경로인지 확인
    const isServerHost = isServerHostPath(fullPath);
    
    // 디렉토리가 존재하는지 확인
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ 
        message: 'Directory not found',
        path: requestedPath 
      });
    }
    
    // 파일인지 디렉토리인지 확인
    const stats = fs.statSync(fullPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ 
        message: 'Path is not a directory',
        path: requestedPath 
      });
    }
    
    // 디렉토리 내용 읽기
    const items = fs.readdirSync(fullPath);
    console.log(`Reading directory: ${fullPath}`);
    console.log(`Found items: ${items.length}`, items);
    
    // 파일 정보 수집
    const files = [];
    
    for (const item of items) {
      try {
        const itemPath = path.join(fullPath, item);
        console.log(`Processing item: ${item} at ${itemPath}`);
        const fileInfo = formatFileInfo(itemPath, item, isServerHost);
        console.log(`File info:`, fileInfo);
        files.push(fileInfo);
      } catch (error) {
        // 개별 파일 오류는 스킵 (권한 없는 파일 등)
        console.warn(`Failed to read file info for ${item}:`, error.message);
      }
    }
    
    console.log(`Final files array:`, files);
    
    // 정렬: 디렉토리 먼저, 그 다음 파일명순
    files.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    
    return res.status(200).json({
      success: true,
      path: requestedPath || '/',
      files,
      count: files.length
    });
    
  } catch (error) {
    console.error('File listing error:', error);
    
    if (error.message.includes('Access denied')) {
      return res.status(403).json({ 
        message: 'Access denied',
        error: error.message 
      });
    }
    
    return res.status(500).json({ 
      message: 'Failed to read directory',
      error: error.message 
    });
  }
}