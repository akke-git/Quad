// lib/filePathValidator.js
import path from 'path';

// 허용된 베이스 디렉토리들 (보안을 위해 제한)
export const ALLOWED_BASE_PATHS = [
  path.join(process.cwd(), 'public'),
  path.join(process.cwd(), 'public/uploads'),
  path.join(process.cwd(), 'public/downloads'),
  path.join(process.cwd(), 'temp'),
  '/serverhost/ubuntu',  // 도커 컨테이너 내부에서 서버 호스트 ubuntu 폴더
  '/serverhost/docker'   // 도커 컨테이너 내부에서 서버 호스트 docker 폴더
];

// 경로 보안 검증
export function validatePath(requestedPath) {
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

// 서버 호스트 경로인지 확인
export function isServerHostPath(fullPath) {
  return fullPath.startsWith('/serverhost/ubuntu') || fullPath.startsWith('/serverhost/docker');
}

// 사용자가 이해할 수 있는 경로로 변환 (formatFileInfo에서 사용)
export function formatUserPath(filePath, isServerHost = false) {
  if (isServerHost) {
    // 서버 호스트 경로의 경우 사용자가 이해할 수 있는 경로로 변환
    if (filePath.startsWith('/serverhost/ubuntu/')) {
      return filePath.replace('/serverhost/ubuntu', '/ubuntu');
    } else if (filePath.startsWith('/serverhost/docker/')) {
      return filePath.replace('/serverhost/docker', '/docker');
    } else {
      // 루트 디렉토리인 경우
      if (filePath === '/serverhost/ubuntu') {
        return '/ubuntu';
      } else if (filePath === '/serverhost/docker') {
        return '/docker';
      } else {
        return filePath;
      }
    }
  } else {
    // 기존 public 폴더 처리
    const publicPath = path.join(process.cwd(), 'public');
    const relativePath = path.relative(publicPath, filePath);
    return path.posix.join('/', relativePath);
  }
}