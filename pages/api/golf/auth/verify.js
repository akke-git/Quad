// pages/api/golf/auth/verify.js

import { golfQuery } from '../../../../lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // 메소드 확인
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    const { username, password } = req.body;
    console.log('Auth request for username:', username);
    
    // 필수 필드 확인
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    
    // 사용자 조회
    const users = await golfQuery(
      'SELECT id, username, password, display_name, handicap, profile_image FROM users WHERE username = ?',
      [username]
    );
    
    // 사용자가 존재하지 않는 경우
    if (users.length === 0) {
      console.log('User not found:', username);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const user = users[0];
    console.log('User found:', user.username, 'Password stored type:', typeof user.password);
    
    // 임시 조치: 개발 환경에서는 평문 비밀번호 비교 허용
    // 실제 환경에서는 반드시 해시된 비밀번호를 사용해야 함
    let isMatch = false;
    
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      // bcrypt 해시된 비밀번호
      isMatch = await bcrypt.compare(password, user.password);
      console.log('Using bcrypt compare, result:', isMatch);
    } else {
      // 임시: 평문 비밀번호 비교 (개발 환경용)
      isMatch = password === user.password;
      console.log('Using plain text compare, result:', isMatch);
    }
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // 인증 성공 - 비밀번호 제외하고 사용자 정보 반환
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      data: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
}
