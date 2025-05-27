// pages/api/blog/upload-image.js
import { formidable } from 'formidable';
import fs from 'fs';
import path from 'path';
import { query } from '../../../lib/db';

// formidable을 사용하기 위한 설정
export const config = {
  api: {
    bodyParser: false,
  },
};

// 폼 데이터 파싱 함수
const parseForm = async (req) => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'public/uploads/blog'),
      keepExtensions: true,
      maxFiles: 1,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });
    
    // 업로드 디렉토리가 없으면 생성
    const uploadDir = path.join(process.cwd(), 'public/uploads/blog');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

export default async function handler(req, res) {
  const { method } = req;
  
  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
  
  try {
    // 폼 데이터 파싱
    const { fields, files } = await parseForm(req);
    
    // formidable의 최신 버전에서는 필드가 배열로 반환됨
    const postId = Array.isArray(fields.postId) ? fields.postId[0] : fields.postId;
    
    if (!files.image) {
      return res.status(400).json({ message: '이미지 파일이 필요합니다.' });
    }
    
    // formidable의 최신 버전에서는 파일도 배열로 반환될 수 있음
    const file = Array.isArray(files.image) ? files.image[0] : files.image;
    
    // 파일 정보 추출
    const fileName = path.basename(file.filepath || file.newFilename);
    const originalName = file.originalFilename || file.originalName || file.name || 'image.jpg';
    const fileSize = file.size;
    const mimeType = file.mimetype || file.mime || 'image/jpeg';
    const filePath = `/uploads/blog/${fileName}`;
    
    // 이미지 정보 데이터베이스에 저장
    const result = await query(`
      INSERT INTO blog_images (filename, original_name, file_path, file_size, mime_type)
      VALUES (?, ?, ?, ?, ?)
    `, [fileName, originalName, filePath, fileSize, mimeType]);
    
    const imageId = result.insertId;
    
    // 포스트 ID가 있으면 포스트-이미지 관계 저장
    if (postId) {
      await query(`
        INSERT INTO blog_post_images (post_id, image_id)
        VALUES (?, ?)
      `, [postId, imageId]);
    }
    
    // 이미지 정보 반환
    return res.status(201).json({
      id: imageId,
      filename: fileName,
      originalName,
      filePath,
      url: filePath,
      size: fileSize,
      mimeType
    });
  } catch (error) {
    console.error('이미지 업로드 중 오류 발생:', error);
    return res.status(500).json({ message: '이미지 업로드 중 오류가 발생했습니다.' });
  }
}
