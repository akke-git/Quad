// pages/api/files/rename.js
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

export default async function handler(req, res) {
  const { method } = req;
  
  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
  
  try {
    const { filePath, newName } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ message: '파일 경로가 필요합니다' });
    }
    
    if (!newName || typeof newName !== 'string') {
      return res.status(400).json({ message: '새 이름이 필요합니다' });
    }
    
    // 파일명 검증 (특수문자 제한)
    const sanitizedNewName = newName.replace(/[<>:"/\\|?*]/g, '_').trim();
    
    if (!sanitizedNewName) {
      return res.status(400).json({ message: '유효하지 않은 파일 이름입니다' });
    }
    
    const sourceFullPath = validatePath(filePath);
    
    // 원본 파일/디렉토리가 존재하는지 확인
    if (!fs.existsSync(sourceFullPath)) {
      return res.status(404).json({ message: '파일을 찾을 수 없습니다' });
    }
    
    const parentDir = path.dirname(sourceFullPath);
    const newFullPath = path.join(parentDir, sanitizedNewName);
    
    // 동일한 이름으로 변경하려는 경우
    if (sourceFullPath === newFullPath) {
      return res.status(400).json({ message: '동일한 이름입니다' });
    }
    
    // 대상 경로에 이미 파일/폴더가 존재하는지 확인
    if (fs.existsSync(newFullPath)) {
      return res.status(409).json({ message: '같은 이름의 파일 또는 폴더가 이미 존재합니다' });
    }
    
    const stats = fs.statSync(sourceFullPath);
    const originalName = path.basename(sourceFullPath);
    
    // 이름 변경 실행
    fs.renameSync(sourceFullPath, newFullPath);
    
    const newRelativePath = path.posix.join('/', path.relative(path.join(process.cwd(), 'public'), newFullPath));
    
    return res.status(200).json({
      success: true,
      message: `${stats.isDirectory() ? '폴더' : '파일'} 이름이 성공적으로 변경되었습니다`,
      file: {
        originalName,
        newName: sanitizedNewName,
        path: newRelativePath,
        type: stats.isDirectory() ? 'directory' : 'file'
      }
    });
    
  } catch (error) {
    console.error('File rename error:', error);
    
    if (error.message.includes('Access denied')) {
      return res.status(403).json({ 
        message: 'Access denied',
        error: error.message 
      });
    }
    
    if (error.code === 'ENOENT') {
      return res.status(404).json({ 
        message: '파일을 찾을 수 없습니다',
        error: error.message 
      });
    }
    
    if (error.code === 'EACCES') {
      return res.status(403).json({ 
        message: '파일 이름 변경 권한이 없습니다',
        error: error.message 
      });
    }
    
    return res.status(500).json({ 
      message: '파일 이름 변경 중 오류가 발생했습니다',
      error: error.message 
    });
  }
}