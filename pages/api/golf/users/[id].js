// pages/api/golf/users/[id].js

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
  const { id } = req.query;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, message: 'Invalid user ID' });
  }

  switch (method) {
    case 'GET':
      try {
        // Get user by ID
        const users = await golfQuery(
          'SELECT id, username, email, display_name, handicap, profile_image, created_at, updated_at FROM users WHERE id = ?',
          [id]
        );
        
        if (users.length === 0) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.status(200).json({ success: true, data: users[0] });
      } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: 'Server error occurred.' });
      }
      break;
      
    case 'PUT':
      try {
        // Parse form data with file upload
        const { fields, files } = await parseForm(req);
        
        // Get existing user
        const existingUsers = await golfQuery(
          'SELECT * FROM users WHERE id = ?',
          [id]
        );
        
        if (existingUsers.length === 0) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const existingUser = existingUsers[0];
        
        // Check if username or email is being changed and if it conflicts
        if ((fields.username && fields.username !== existingUser.username) || 
            (fields.email && fields.email !== existingUser.email)) {
          const conflictCheck = await golfQuery(
            'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
            [fields.username || existingUser.username, fields.email || existingUser.email, id]
          );
          
          if (conflictCheck.length > 0) {
            return res.status(409).json({
              success: false,
              message: 'Username or email already exists.'
            });
          }
        }
        
        // Process profile image if uploaded
        let profileImagePath = existingUser.profile_image;
        if (files.profile_image) {
          const file = files.profile_image;
          
          // 디버깅을 위해 파일 객체 속성 출력
          console.log('File object properties:', Object.keys(file));
          console.log('File filepath:', file.filepath);
          
          // 간단한 방법으로 파일 처리
          // 파일 이름에서 확장자를 추출하지 않고 고정 확장자 사용
          const fileName = `user_${Date.now()}.jpg`;
          const newPath = path.join(process.cwd(), 'public/uploads/profiles', fileName);
          
          try {
            // 파일 복사
            fs.copyFileSync(file.filepath, newPath);
            profileImagePath = `/uploads/profiles/${fileName}`;
            console.log('File copied successfully to:', newPath);
          } catch (err) {
            console.error('Error copying file:', err);
          }
          
          // Delete old profile image if it exists
          if (existingUser.profile_image) {
            const oldImagePath = path.join(process.cwd(), 'public', existingUser.profile_image);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }
        }
        
        // Update user
        await golfQuery(
          `UPDATE users SET 
           username = ?, 
           email = ?, 
           display_name = ?, 
           handicap = ?,
           profile_image = ?,
           ${fields.password ? 'password = ?,' : ''}
           updated_at = NOW()
           WHERE id = ?`,
          [
            fields.username || existingUser.username,
            fields.email || existingUser.email,
            fields.display_name || existingUser.display_name,
            fields.handicap || existingUser.handicap,
            profileImagePath,
            ...(fields.password ? [fields.password] : []),
            id
          ]
        );
        
        res.status(200).json({ 
          success: true, 
          message: 'User updated successfully',
          data: {
            id: parseInt(id),
            username: fields.username || existingUser.username,
            email: fields.email || existingUser.email,
            display_name: fields.display_name || existingUser.display_name,
            handicap: fields.handicap || existingUser.handicap,
            profile_image: profileImagePath
          }
        });
      } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Server error occurred.' });
      }
      break;
      
    case 'DELETE':
      try {
        // Get user to delete (to get profile image path)
        const users = await golfQuery(
          'SELECT profile_image FROM users WHERE id = ?',
          [id]
        );
        
        if (users.length === 0) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Delete profile image if it exists
        const user = users[0];
        if (user.profile_image) {
          const imagePath = path.join(process.cwd(), 'public', user.profile_image);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
        
        // Delete user
        await golfQuery('DELETE FROM users WHERE id = ?', [id]);
        
        res.status(200).json({ success: true, message: 'User deleted successfully' });
      } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Server error occurred.' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }
}