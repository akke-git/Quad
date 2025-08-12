// pages/api/files/upload.js
import { formidable } from 'formidable';
import fs from 'fs';
import path from 'path';

// formidable을 사용하기 위한 설정
export const config = {
  api: {
    bodyParser: false,
  },
};

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
  
  console.log('upload validatePath debug:');
  console.log('  - requestedPath:', requestedPath);
  console.log('  - cleanPath:', cleanPath);
  console.log('  - resolvedPath:', resolvedPath);
  console.log('  - resolvedBasePath:', resolvedBasePath);
  
  if (!resolvedPath.startsWith(resolvedBasePath)) {
    throw new Error('Access denied: Invalid path');
  }
  
  return resolvedPath;
}

// 폼 데이터 파싱 함수
const parseForm = async (req, targetPath) => {
  return new Promise((resolve, reject) => {
    // 업로드 디렉토리가 없으면 생성
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    
    const form = formidable({
      uploadDir: targetPath,
      keepExtensions: true,
      maxFiles: 50, // 최대 50개 파일
      maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
      maxTotalFileSize: 50 * 1024 * 1024 * 1024, // 총 50GB (여러 파일 업로드 시)
      filename: (name, ext, part) => {
        // 파일명 중복 방지를 위해 타임스탬프 추가
        const timestamp = Date.now();
        const originalName = part.originalFilename || 'file';
        const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        return `${timestamp}_${cleanName}`;
      }
    });
    
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

export default async function handler(req, res) {
  const { method, query } = req;
  
  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
  
  try {
    const targetPath = validatePath(query.path || '');
    
    // 디렉토리가 존재하는지 확인하고 생성
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    
    // 폼 데이터 파싱
    const { fields, files } = await parseForm(req, targetPath);
    
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ message: '업로드할 파일이 없습니다.' });
    }
    
    const uploadedFiles = [];
    
    // 업로드된 파일들 처리
    for (const [fieldName, fileArray] of Object.entries(files)) {
      const fileList = Array.isArray(fileArray) ? fileArray : [fileArray];
      
      for (const file of fileList) {
        const fileName = path.basename(file.filepath || file.newFilename);
        const originalName = file.originalFilename || file.originalName || file.name || 'unknown';
        const fileSize = file.size;
        const mimeType = file.mimetype || file.mime || 'application/octet-stream';
        
        uploadedFiles.push({
          originalName,
          fileName,
          size: fileSize,
          mimeType,
          path: path.posix.join('/', path.relative(path.join(process.cwd(), 'public'), file.filepath))
        });
      }
    }
    
    const message = uploadedFiles.length === 1 
      ? '파일이 성공적으로 업로드되었습니다'
      : `${uploadedFiles.length}개 파일이 성공적으로 업로드되었습니다`;
      
    return res.status(201).json({
      success: true,
      message,
      files: uploadedFiles
    });
    
  } catch (error) {
    console.error('File upload error:', error);
    
    if (error.message.includes('Access denied')) {
      return res.status(403).json({ 
        message: 'Access denied',
        error: error.message 
      });
    }
    
    return res.status(500).json({ 
      message: '파일 업로드 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
}