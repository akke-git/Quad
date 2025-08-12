// pages/api/files/index.js
import fs from 'fs';
import path from 'path';

// 허용된 베이스 디렉토리들 (보안을 위해 제한)
const ALLOWED_BASE_PATHS = [
  path.join(process.cwd(), 'public'),
  path.join(process.cwd(), 'public/uploads'),
  path.join(process.cwd(), 'public/downloads'),
  path.join(process.cwd(), 'temp'),
  '/serverhost/ubuntu',  // 도커 컨테이너 내부에서 서버 호스트 ubuntu 폴더
  '/serverhost/docker'   // 도커 컨테이너 내부에서 서버 호스트 docker 폴더
];

// 경로 보안 검증
function validatePath(requestedPath) {
  // 경로 정리: '..' 등 정리 (path traversal 방지)
  const cleanPath = (requestedPath || '').replace(/\.\.+/g, '');
  
  console.log('validatePath debug:');
  console.log('  - requestedPath:', requestedPath);
  console.log('  - cleanPath:', cleanPath);
  
  // 서버 호스트 폴더 경로 처리
  if (cleanPath.startsWith('/ubuntu') || cleanPath.startsWith('/docker')) {
    // 사용자가 /ubuntu, /docker로 요청하면 실제 컨테이너 내부 경로로 변환
    let actualPath;
    if (cleanPath.startsWith('/ubuntu')) {
      actualPath = cleanPath.replace('/ubuntu', '/serverhost/ubuntu');
    } else if (cleanPath.startsWith('/docker')) {
      actualPath = cleanPath.replace('/docker', '/serverhost/docker');
    }
    
    const resolvedPath = path.resolve(actualPath);
    console.log('  - resolvedPath (server host):', resolvedPath);
    
    // 허용된 서버 호스트 경로인지 확인
    const isUbuntuPath = resolvedPath === '/serverhost/ubuntu' || resolvedPath.startsWith('/serverhost/ubuntu/');
    const isDockerPath = resolvedPath === '/serverhost/docker' || resolvedPath.startsWith('/serverhost/docker/');
    
    if (!isUbuntuPath && !isDockerPath) {
      throw new Error('Access denied: Invalid server host path');
    }
    
    return resolvedPath;
  }
  
  // 기존 public 폴더 처리
  const normalizedPath = cleanPath.replace(/^\/+/, '');
  const fullPath = path.join(process.cwd(), 'public', normalizedPath);
  
  // Path traversal 공격 방지: public 폴더 하위인지 확인
  const allowedBasePath = path.join(process.cwd(), 'public');
  const resolvedPath = path.resolve(fullPath);
  const resolvedBasePath = path.resolve(allowedBasePath);
  
  console.log('  - fullPath (public):', fullPath);
  console.log('  - resolvedPath (public):', resolvedPath);
  console.log('  - resolvedBasePath:', resolvedBasePath);
  console.log('  - startsWith check:', resolvedPath.startsWith(resolvedBasePath));
  
  if (!resolvedPath.startsWith(resolvedBasePath)) {
    throw new Error('Access denied: Invalid path');
  }
  
  return resolvedPath;
}

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
  
  let formattedPath;
  
  if (isServerHost) {
    // 서버 호스트 경로의 경우 절대 경로 사용
    formattedPath = filePath;
  } else {
    // 기존 public 폴더 처리
    const publicPath = path.join(process.cwd(), 'public');
    const relativePath = path.relative(publicPath, filePath);
    formattedPath = path.posix.join('/', relativePath);
  }
  
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
    const isServerHost = fullPath.startsWith('/serverhost/ubuntu') || fullPath.startsWith('/serverhost/docker');
    
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