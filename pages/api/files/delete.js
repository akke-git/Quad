// pages/api/files/delete.js
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

// 디렉토리 재귀 삭제
function removeDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      removeDirectory(filePath);
    } else {
      fs.unlinkSync(filePath);
    }
  }
  
  fs.rmdirSync(dirPath);
}

export default async function handler(req, res) {
  const { method } = req;
  
  if (method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
  
  try {
    const { paths } = req.body;
    
    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({ message: 'File paths are required' });
    }
    
    const results = [];
    
    for (const filePath of paths) {
      try {
        const fullPath = validatePath(filePath);
        
        // 파일/디렉토리가 존재하는지 확인
        if (!fs.existsSync(fullPath)) {
          results.push({
            path: filePath,
            success: false,
            error: '파일을 찾을 수 없습니다'
          });
          continue;
        }
        
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          // 디렉토리 삭제
          removeDirectory(fullPath);
        } else {
          // 파일 삭제
          fs.unlinkSync(fullPath);
        }
        
        results.push({
          path: filePath,
          success: true,
          type: stats.isDirectory() ? 'directory' : 'file'
        });
        
      } catch (error) {
        console.error(`Failed to delete ${filePath}:`, error);
        results.push({
          path: filePath,
          success: false,
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    const message = failureCount === 0 
      ? `${successCount}개 파일이 성공적으로 삭제되었습니다`
      : `${successCount}개 파일 삭제 성공, ${failureCount}개 파일 삭제 실패`;
      
    return res.status(200).json({
      success: failureCount === 0,
      message,
      results
    });
    
  } catch (error) {
    console.error('File deletion error:', error);
    
    if (error.message.includes('Access denied')) {
      return res.status(403).json({ 
        message: 'Access denied',
        error: error.message 
      });
    }
    
    return res.status(500).json({ 
      message: 'Failed to delete files',
      error: error.message 
    });
  }
}