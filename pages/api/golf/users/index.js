// pages/api/golf/users/index.js

import { golfQuery } from '../../../../lib/db';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

// Disable the default body parser to handle form data with files
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to parse form data with files
const parseForm = async (req) => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      uploadDir: path.join(process.cwd(), 'public/uploads/profiles'),
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
    });
    
    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public/uploads/profiles');
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

  switch (method) {
    case 'GET':
      try {
        // Query parameters
        const { sort = 'username', order = 'asc', limit = 50 } = req.query;
        
        // Base query
        let sql = 'SELECT id, username, email, display_name, handicap, profile_image, created_at, updated_at FROM users';
        const queryParams = [];
        
        // Apply sorting
        sql += ` ORDER BY ${sort} ${order.toUpperCase()}`;
        
        // Limit results (max 1000)
        const limitValue = Math.min(parseInt(limit) || 50, 1000);
        sql += ' LIMIT ?';
        queryParams.push(limitValue);
        
        // Execute query
        const users = await golfQuery(sql, queryParams);
        
        // Return results
        res.status(200).json({ success: true, data: users });
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Server error occurred.' });
      }
      break;
      
    case 'POST':
      try {
        // Parse form data with file upload
        const { fields, files } = await parseForm(req);
        
        const { username, email, password, display_name, handicap } = fields;
        
        // Validate required fields
        if (!username || !email || !password) {
          return res.status(400).json({ 
            success: false, 
            message: 'Username, email, and password are required.' 
          });
        }
        
        // Check if username or email already exists
        const existingUser = await golfQuery(
          'SELECT id FROM users WHERE username = ? OR email = ?',
          [username, email]
        );
        
        if (existingUser.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Username or email already exists.'
          });
        }
        
        // Process profile image if uploaded
        let profileImagePath = null;
        if (files.profile_image) {
          const file = files.profile_image;
          
          // 디버깅을 위해 파일 객체 속성 출력
          console.log('File object properties:', Object.keys(file));
          console.log('File filepath:', file.filepath);
          
          // 간단한 방법으로 파일 처리
          // 파일 이름에서 확장자를 추출하지 않고 고정 확장자 사용
          const fileName = `user_${Date.now()}.jpg`;
          const newPath = path.join(process.cwd(), 'public/uploads/profiles', fileName);
          profileImagePath = `/uploads/profiles/${fileName}`;
          
          try {
            // 업로드 디렉토리 확인 및 생성
            const uploadDir = path.join(process.cwd(), 'public/uploads/profiles');
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
              console.log('Created upload directory:', uploadDir);
            }
            
            // 파일 복사
            fs.copyFileSync(file.filepath, newPath);
            console.log('File copied successfully to:', newPath);
            console.log('Profile image path set to:', profileImagePath);
          } catch (err) {
            console.error('Error copying file:', err);
            // 오류 발생 시 기본 이미지 경로 설정
            profileImagePath = null;
          }
        }
        
        console.log('Final profile image path:', profileImagePath);
        
        // Insert new user
        const result = await golfQuery(
          `INSERT INTO users (username, email, password, display_name, handicap, profile_image) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            username, 
            email, 
            password, // In a real app, you should hash this password
            display_name || username, 
            handicap || null, 
            profileImagePath
          ]
        );
        
        res.status(201).json({ 
          success: true, 
          message: 'User registered successfully.',
          data: { 
            id: result.insertId, 
            username, 
            email, 
            display_name: display_name || username,
            profile_image: profileImagePath
          }
        });
      } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ success: false, message: 'Server error occurred.' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }
}