// pages/api/files/copy.js
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

// 파일/디렉토리 재귀 복사
async function copyRecursive(sourcePath, targetPath) {
  const stats = fs.statSync(sourcePath);
  
  if (stats.isDirectory()) {
    // 디렉토리 생성
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    
    // 디렉토리 내용 복사
    const files = fs.readdirSync(sourcePath);
    for (const file of files) {
      const sourceFile = path.join(sourcePath, file);
      const targetFile = path.join(targetPath, file);
      await copyRecursive(sourceFile, targetFile);
    }
  } else {
    // 파일 복사
    fs.copyFileSync(sourcePath, targetPath);
  }
}

// 중복 파일명 처리
function getUniqueFileName(targetDir, originalName) {
  let fileName = originalName;
  let counter = 1;
  
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  
  while (fs.existsSync(path.join(targetDir, fileName))) {
    fileName = `${baseName}_copy_${counter}${ext}`;
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
        
        // 자기 자신에게 복사하는 경우 방지
        if (sourceFullPath === targetFullPath) {
          results.push({
            source: sourcePath,
            success: false,
            error: '같은 위치로는 복사할 수 없습니다'
          });
          continue;
        }
        
        // 복사 실행
        await copyRecursive(sourceFullPath, targetFullPath);
        
        results.push({
          source: sourcePath,
          target: path.posix.join('/', path.relative(path.join(process.cwd(), 'public'), targetFullPath)),
          success: true,
          fileName: targetFileName,
          renamed: targetFileName !== fileName
        });
        
      } catch (error) {
        console.error(`Failed to copy ${sourcePath}:`, error);
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
      ? `${successCount}개 파일이 성공적으로 복사되었습니다`
      : `${successCount}개 파일 복사 성공, ${failureCount}개 파일 복사 실패`;
      
    return res.status(200).json({
      success: failureCount === 0,
      message,
      results
    });
    
  } catch (error) {
    console.error('File copy error:', error);
    
    if (error.message.includes('Access denied')) {
      return res.status(403).json({ 
        message: 'Access denied',
        error: error.message 
      });
    }
    
    return res.status(500).json({ 
      message: 'Failed to copy files',
      error: error.message 
    });
  }
}