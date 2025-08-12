// pages/api/files/newfolder.js
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

// 중복 폴더명 처리
function getUniqueFolderName(parentDir, originalName) {
  let folderName = originalName;
  let counter = 1;
  
  while (fs.existsSync(path.join(parentDir, folderName))) {
    folderName = `${originalName}_${counter}`;
    counter++;
  }
  
  return folderName;
}

export default async function handler(req, res) {
  const { method } = req;
  
  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
  
  try {
    const { parentPath, folderName } = req.body;
    
    if (!folderName || typeof folderName !== 'string') {
      return res.status(400).json({ message: '폴더 이름이 필요합니다' });
    }
    
    // 폴더명 검증 (특수문자 제한)
    const sanitizedFolderName = folderName.replace(/[<>:"/\\|?*]/g, '_').trim();
    
    if (!sanitizedFolderName) {
      return res.status(400).json({ message: '유효하지 않은 폴더 이름입니다' });
    }
    
    const parentDir = validatePath(parentPath || '');
    
    // 부모 디렉토리가 존재하는지 확인
    if (!fs.existsSync(parentDir)) {
      return res.status(404).json({ message: '부모 디렉토리를 찾을 수 없습니다' });
    }
    
    if (!fs.statSync(parentDir).isDirectory()) {
      return res.status(400).json({ message: '부모 경로가 디렉토리가 아닙니다' });
    }
    
    // 중복 폴더명 처리
    const finalFolderName = getUniqueFolderName(parentDir, sanitizedFolderName);
    const newFolderPath = path.join(parentDir, finalFolderName);
    
    // 폴더 생성
    fs.mkdirSync(newFolderPath, { recursive: true });
    
    const relativePath = path.posix.join('/', path.relative(path.join(process.cwd(), 'public'), newFolderPath));
    
    return res.status(201).json({
      success: true,
      message: '폴더가 성공적으로 생성되었습니다',
      folder: {
        name: finalFolderName,
        path: relativePath,
        renamed: finalFolderName !== sanitizedFolderName
      }
    });
    
  } catch (error) {
    console.error('Folder creation error:', error);
    
    if (error.message.includes('Access denied')) {
      return res.status(403).json({ 
        message: 'Access denied',
        error: error.message 
      });
    }
    
    return res.status(500).json({ 
      message: '폴더 생성 중 오류가 발생했습니다',
      error: error.message 
    });
  }
}