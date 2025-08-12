// pages/api/files/move.js
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

// 중복 파일명 처리
function getUniqueFileName(targetDir, originalName) {
  let fileName = originalName;
  let counter = 1;
  
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  
  while (fs.existsSync(path.join(targetDir, fileName))) {
    fileName = `${baseName}_${counter}${ext}`;
    counter++;
  }
  
  return fileName;
}

export default async function handler(req, res) {
  const { method } = req;
  
  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
  
  try {
    const { sourcePaths, targetPath, overwrite = false } = req.body;
    
    if (!sourcePaths || !Array.isArray(sourcePaths) || sourcePaths.length === 0) {
      return res.status(400).json({ message: 'Source paths are required' });
    }
    
    if (!targetPath) {
      return res.status(400).json({ message: 'Target path is required' });
    }
    
    const targetDir = validatePath(targetPath);
    
    // 대상 디렉토리가 존재하는지 확인
    if (!fs.existsSync(targetDir)) {
      return res.status(404).json({ message: 'Target directory not found' });
    }
    
    if (!fs.statSync(targetDir).isDirectory()) {
      return res.status(400).json({ message: 'Target path is not a directory' });
    }
    
    const results = [];
    
    for (const sourcePath of sourcePaths) {
      try {
        const sourceFullPath = validatePath(sourcePath);
        
        // 원본 파일/디렉토리가 존재하는지 확인
        if (!fs.existsSync(sourceFullPath)) {
          results.push({
            source: sourcePath,
            success: false,
            error: '원본 파일을 찾을 수 없습니다'
          });
          continue;
        }
        
        const fileName = path.basename(sourceFullPath);
        let targetFileName = fileName;
        
        // 중복 처리
        if (!overwrite) {
          targetFileName = getUniqueFileName(targetDir, fileName);
        }
        
        const targetFullPath = path.join(targetDir, targetFileName);
        
        // 자기 자신에게 이동하는 경우 방지
        if (sourceFullPath === targetFullPath) {
          results.push({
            source: sourcePath,
            success: false,
            error: '같은 위치로는 이동할 수 없습니다'
          });
          continue;
        }
        
        // 하위 디렉토리로 이동하는 경우 방지 (무한 루프)
        const stats = fs.statSync(sourceFullPath);
        if (stats.isDirectory() && targetFullPath.startsWith(sourceFullPath + path.sep)) {
          results.push({
            source: sourcePath,
            success: false,
            error: '폴더를 자기 자신의 하위로는 이동할 수 없습니다'
          });
          continue;
        }
        
        // 이동 실행 (rename 사용)
        fs.renameSync(sourceFullPath, targetFullPath);
        
        results.push({
          source: sourcePath,
          target: path.posix.join('/', path.relative(path.join(process.cwd(), 'public'), targetFullPath)),
          success: true,
          fileName: targetFileName,
          renamed: targetFileName !== fileName
        });
        
      } catch (error) {
        console.error(`Failed to move ${sourcePath}:`, error);
        results.push({
          source: sourcePath,
          success: false,
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    const message = failureCount === 0 
      ? `${successCount}개 파일이 성공적으로 이동되었습니다`
      : `${successCount}개 파일 이동 성공, ${failureCount}개 파일 이동 실패`;
      
    return res.status(200).json({
      success: failureCount === 0,
      message,
      results
    });
    
  } catch (error) {
    console.error('File move error:', error);
    
    if (error.message.includes('Access denied')) {
      return res.status(403).json({ 
        message: 'Access denied',
        error: error.message 
      });
    }
    
    return res.status(500).json({ 
      message: 'Failed to move files',
      error: error.message 
    });
  }
}