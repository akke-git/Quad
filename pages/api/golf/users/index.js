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
    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public/uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Created upload directory:', uploadDir);
    }
    
    // formidable 설정
    const form = new IncomingForm({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      multiples: false // 단일 파일만 처리
    });
    
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
        console.log('Parsing form data...');
        const { fields, files } = await parseForm(req);
        
        console.log('Form fields:', Object.keys(fields));
        console.log('Form files:', Object.keys(files));
        
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
        console.log('Files object:', files);
        
        try {
          // 프로필 이미지 처리
          if (files && files.profile_image) {
            const fileList = files.profile_image;
            const file = Array.isArray(fileList) ? fileList[0] : fileList;
            
            console.log('File object:', file);
            console.log('File properties:', Object.keys(file));
            
            // 파일이 존재하고 경로가 있는 경우
            if (file.filepath) {
              // 파일명 추출
              const filename = path.basename(file.filepath);
              
              // 웹 URL 형식으로 경로 설정 (백슬래시를 슬래시로 변환)
              profileImagePath = `/uploads/profiles/${filename}`.replace(/\\/g, '/');
              
              console.log('Profile image path for DB:', profileImagePath);
              
              // 경로가 정상적으로 생성되었는지 확인
              if (!profileImagePath || profileImagePath === '/uploads/profiles/') {
                console.error('Invalid profile image path generated');
                
                // 직접 경로 설정 (테스트용)
                profileImagePath = '/uploads/profiles/' + filename;
                console.log('Fallback profile image path:', profileImagePath);
              }
            } else {
              console.log('No filepath in the file object');
            }
          } else {
            console.log('No profile image uploaded');
          }
        } catch (err) {
          console.error('Error processing profile image:', err);
          profileImagePath = null;
        }
        
        console.log('Final profile image path:', profileImagePath);
        
        // 값 확인 및 디버깅
        console.log('username type:', typeof username, 'value:', username);
        console.log('email type:', typeof email, 'value:', email);
        console.log('password type:', typeof password, 'value:', password);
        console.log('display_name type:', typeof display_name, 'value:', display_name);
        console.log('handicap type:', typeof handicap, 'value:', handicap);
        console.log('profileImagePath type:', typeof profileImagePath, 'value:', profileImagePath);
        
        // 쿼리 파라미터 준비 (배열이 아닌 값을 확인)
        const usernameValue = Array.isArray(username) ? username[0] : username;
        const emailValue = Array.isArray(email) ? email[0] : email;
        const passwordValue = Array.isArray(password) ? password[0] : password;
        const displayNameValue = Array.isArray(display_name) ? display_name[0] : (display_name || usernameValue);
        const handicapValue = Array.isArray(handicap) ? handicap[0] : (handicap || null);
        
        const queryParams = [
          usernameValue,
          emailValue,
          passwordValue,
          displayNameValue,
          handicapValue,
          profileImagePath
        ];
        
        console.log('Final query parameters for insert:', queryParams);
        
        // Insert new user
        const result = await golfQuery(
          `INSERT INTO users (username, email, password, display_name, handicap, profile_image) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          queryParams
        );
        
        // 삽입 결과 확인
        console.log('Insert result:', result);
        
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