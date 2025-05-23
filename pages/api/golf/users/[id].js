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
        if (files && files.profile_image) {
          // 파일 객체 처리 (배열 또는 단일 객체)
          const fileObj = files.profile_image;
          const file = Array.isArray(fileObj) ? fileObj[0] : fileObj;
          
          // 디버깅을 위해 파일 객체 속성 출력
          console.log('File object properties:', Object.keys(file));
          console.log('File filepath:', file.filepath);
          
          if (file && file.filepath) {
            // 파일 확장자 추출
            const originalExt = path.extname(file.originalFilename || file.filepath) || '.jpg';
            const fileName = `user_${id}_${Date.now()}${originalExt}`;
            const newPath = path.join(process.cwd(), 'public/uploads/profiles', fileName);
            
            try {
              // 파일 복사
              fs.copyFileSync(file.filepath, newPath);
              profileImagePath = `/uploads/profiles/${fileName}`;
              console.log('File copied successfully to:', newPath);
              console.log('Profile image path set to:', profileImagePath);
              
              // Delete old profile image if it exists and is different
              if (existingUser.profile_image && existingUser.profile_image !== profileImagePath) {
                const oldImagePath = path.join(process.cwd(), 'public', existingUser.profile_image);
                if (fs.existsSync(oldImagePath)) {
                  try {
                    fs.unlinkSync(oldImagePath);
                    console.log('Old profile image deleted:', oldImagePath);
                  } catch (delErr) {
                    console.error('Error deleting old profile image:', delErr);
                  }
                }
              }
            } catch (err) {
              console.error('Error copying file:', err);
            }
          } else {
            console.error('Invalid file object or missing filepath');
          }
        } else {
          console.log('No profile image uploaded, keeping existing:', profileImagePath);
        }
        
        // 필드 값 정규화 (배열 처리)
        const normalizedFields = {
          username: Array.isArray(fields.username) ? fields.username[0] : fields.username,
          email: Array.isArray(fields.email) ? fields.email[0] : fields.email,
          display_name: Array.isArray(fields.display_name) ? fields.display_name[0] : fields.display_name,
          handicap: Array.isArray(fields.handicap) ? fields.handicap[0] : fields.handicap,
          password: fields.password ? (Array.isArray(fields.password) ? fields.password[0] : fields.password) : null
        };
        
        console.log('Updating user with profile_image:', profileImagePath);
        
        // Update user
        const updateResult = await golfQuery(
          `UPDATE users SET 
           username = ?, 
           email = ?, 
           display_name = ?, 
           handicap = ?,
           profile_image = ?,
           ${normalizedFields.password ? 'password = ?,' : ''}
           updated_at = NOW()
           WHERE id = ?`,
          [
            normalizedFields.username || existingUser.username,
            normalizedFields.email || existingUser.email,
            normalizedFields.display_name || existingUser.display_name,
            normalizedFields.handicap || existingUser.handicap,
            profileImagePath,
            ...(normalizedFields.password ? [normalizedFields.password] : []),
            id
          ]
        );
        
        console.log('Update result:', updateResult);
        
        res.status(200).json({ 
          success: true, 
          message: 'User updated successfully',
          data: {
            id: parseInt(id),
            username: normalizedFields.username || existingUser.username,
            email: normalizedFields.email || existingUser.email,
            display_name: normalizedFields.display_name || existingUser.display_name,
            handicap: normalizedFields.handicap || existingUser.handicap,
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