// pages/api/golf/users/index.js

import { 
  golfQuery, 
  hashPassword,
  validateEmail,
  validateUsername,
  sanitizeInput,
  validateSortField,
  validateSortOrder,
  validateLimit,
  validateOffset
} from '../../../../lib/db';
import { 
  ApiResponse, 
  handleApiError, 
  validateRequiredFields,
  validateFieldLength,
  validateMethod,
  createPaginationMeta
} from '../../../../lib/apiResponse';
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
  // HTTP 메서드 검증
  const methodValidation = validateMethod(req, res, ['GET', 'POST']);
  if (methodValidation) return methodValidation;

  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { 
          sort = 'username', 
          order = 'asc', 
          limit = 50, 
          offset = 0,
          search = ''
        } = req.query;
        
        // 입력값 검증 및 정제
        const validSortField = validateSortField(sort, 'users');
        const validSortOrder = validateSortOrder(order);
        const validLimit = validateLimit(limit, 100); // 최대 100개로 제한
        const validOffset = validateOffset(offset);
        const searchTerm = sanitizeInput(search);
        
        // 기본 쿼리
        let sql = `
          SELECT id, username, email, display_name, handicap, profile_image, created_at, updated_at 
          FROM users
        `;
        let countSql = 'SELECT COUNT(*) as total FROM users';
        const queryParams = [];
        const countParams = [];
        
        // 검색 조건 추가
        if (searchTerm) {
          const searchCondition = ' WHERE (username LIKE ? OR display_name LIKE ? OR email LIKE ?)';
          sql += searchCondition;
          countSql += searchCondition;
          
          const searchPattern = `%${searchTerm}%`;
          queryParams.push(searchPattern, searchPattern, searchPattern);
          countParams.push(searchPattern, searchPattern, searchPattern);
        }
        
        // 정렬 적용 (매개변수화된 쿼리 사용)
        sql += ` ORDER BY ${validSortField} ${validSortOrder}`;
        
        // 페이지네이션 적용
        sql += ' LIMIT ? OFFSET ?';
        queryParams.push(validLimit, validOffset);
        
        // 쿼리 실행
        const [users, totalResult] = await Promise.all([
          golfQuery(sql, queryParams),
          golfQuery(countSql, countParams)
        ]);
        
        const total = totalResult[0].total;
        const meta = createPaginationMeta(total, validLimit, validOffset);
        
        const response = ApiResponse.success(
          users,
          '사용자 목록을 성공적으로 조회했습니다.',
          meta
        );
        
        res.status(200).json(response);
      } catch (error) {
        return handleApiError(res, error, 'GET /api/golf/users');
      }
      break;
      
    case 'POST':
      try {
        // Parse form data with file upload
        const { fields, files } = await parseForm(req);
        
        // 필드값 추출 (배열인 경우 첫 번째 값 사용)
        const extractField = (field) => Array.isArray(field) ? field[0] : field;
        
        const username = extractField(fields.username);
        const email = extractField(fields.email);
        const password = extractField(fields.password);
        const display_name = extractField(fields.display_name) || username;
        const handicap = extractField(fields.handicap);
        
        // 필수 필드 검증
        validateRequiredFields({ username, email, password }, ['username', 'email', 'password']);
        
        // 입력값 검증
        if (!validateUsername(username)) {
          const response = ApiResponse.validationError(
            'username',
            '사용자명은 3-20자의 영문, 숫자, 언더스코어만 허용됩니다.'
          );
          return res.status(400).json(response);
        }
        
        if (!validateEmail(email)) {
          const response = ApiResponse.validationError(
            'email',
            '올바른 이메일 형식이 아닙니다.'
          );
          return res.status(400).json(response);
        }
        
        // 비밀번호 길이 검증
        validateFieldLength(password, '비밀번호', 6, 100);
        
        if (display_name) {
          validateFieldLength(display_name, '표시명', 1, 50);
        }
        
        // 핸디캡 검증
        let validHandicap = null;
        if (handicap) {
          const handicapNum = parseFloat(handicap);
          if (isNaN(handicapNum) || handicapNum < -10 || handicapNum > 54) {
            const response = ApiResponse.validationError(
              'handicap',
              '핸디캡은 -10부터 54 사이의 숫자여야 합니다.'
            );
            return res.status(400).json(response);
          }
          validHandicap = handicapNum;
        }
        
        // 중복 확인
        const existingUser = await golfQuery(
          'SELECT id FROM users WHERE username = ? OR email = ?',
          [username, email]
        );
        
        if (existingUser.length > 0) {
          const response = ApiResponse.conflict('이미 존재하는 사용자명 또는 이메일입니다.');
          return res.status(409).json(response);
        }
        
        // 프로필 이미지 처리
        let profileImagePath = null;
        
        if (files && files.profile_image) {
          try {
            const fileList = files.profile_image;
            const file = Array.isArray(fileList) ? fileList[0] : fileList;
            
            if (file && file.filepath) {
              // 파일 확장자 검증
              const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
              const fileExtension = path.extname(file.originalFilename || '').toLowerCase();
              
              if (!allowedExtensions.includes(fileExtension)) {
                const response = ApiResponse.validationError(
                  'profile_image',
                  '프로필 이미지는 JPG, PNG, GIF, WebP 형식만 허용됩니다.'
                );
                return res.status(400).json(response);
              }
              
              // 파일 크기 검증 (5MB)
              if (file.size > 5 * 1024 * 1024) {
                const response = ApiResponse.validationError(
                  'profile_image',
                  '프로필 이미지는 5MB 이하여야 합니다.'
                );
                return res.status(400).json(response);
              }
              
              const filename = path.basename(file.filepath);
              profileImagePath = `/uploads/profiles/${filename}`.replace(/\\/g, '/');
            }
          } catch (imageError) {
            console.error('프로필 이미지 처리 중 오류:', imageError);
            // 이미지 처리 실패는 사용자 생성을 막지 않음
            profileImagePath = null;
          }
        }
        
        // 비밀번호 해싱
        const hashedPassword = await hashPassword(password);
        
        // 사용자 생성
        const result = await golfQuery(
          `INSERT INTO users (username, email, password, display_name, handicap, profile_image) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [username, email, hashedPassword, display_name, validHandicap, profileImagePath]
        );
        
        // 성공 응답 (비밀번호는 제외)
        const responseData = {
          id: result.insertId,
          username,
          email,
          display_name,
          handicap: validHandicap,
          profile_image: profileImagePath
        };
        
        const response = ApiResponse.success(
          responseData,
          '사용자가 성공적으로 등록되었습니다.'
        );
        
        res.status(201).json(response);
      } catch (error) {
        return handleApiError(res, error, 'POST /api/golf/users');
      }
      break;
      
    default:
      const response = ApiResponse.methodNotAllowed(method, ['GET', 'POST']);
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json(response);
  }
}