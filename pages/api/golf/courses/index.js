// pages/api/golf/courses/index.js

import { golfQuery } from '../../../../lib/db';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        // 쿼리 파라미터 가져오기
        const { location, sort, order = 'asc', limit = 50 } = req.query;
        
        console.log('코스 목록 조회 요청 받음:', req.query);

        // 기본 쿼리 - golf_courses 테이블 시도
        let sql = '';
        const queryParams = [];
        
        try {
          // 먼저 golf_courses 테이블 시도
          sql = 'SELECT * FROM golf_courses';
          
          // 지역 필터 적용
          if (location) {
            sql += ' WHERE location = ?';
            queryParams.push(location);
          }
        } catch (err) {
          console.log('golf_courses 테이블 없음, courses 테이블 시도');
          // golf_courses 테이블이 없으면 courses 테이블 시도
          sql = 'SELECT * FROM courses';
          
          // 지역 필터 적용
          if (location) {
            sql += ' WHERE location = ?';
            queryParams.push(location);
          }
        }
        
        // 정렬 적용
        if (sort) {
          sql += ` ORDER BY ${sort} ${order.toUpperCase()}`;
        } else {
          sql += ' ORDER BY name ASC'; // 기본 정렬: 코스명 오름차순
        }
        
        // 결과 제한 없이 모든 코스 가져오기
        // 기본값을 1200으로 늘리고 사용자가 요청한 경우 그 값 사용
        const limitValue = parseInt(limit) || 1200;
        console.log('코스 목록 조회 제한 값:', limitValue);
        sql += ' LIMIT ?';
        queryParams.push(limitValue);
        
        // 쿼리 실행 (golfQuery 함수 사용)
        const courses = await golfQuery(sql, queryParams);
        
        // 결과 반환
        res.status(200).json({ success: true, data: courses });
      } catch (error) {
        console.error('golf course list error! :', error);
        res.status(500).json({ success: false, message: 'server error occurred!.' });
      }
      break;
      
    case 'POST':
      // 새 골프 코스 추가 (관리자 기능)
      try {
        const { name, location, address, holes, par, difficulty, image_url } = req.body;
        
        // 필수 필드 확인
        if (!name || !location) {
          return res.status(400).json({ success: false, message: 'name and location are required.' });
        }
        
        // 코스 추가 (golfQuery 함수 사용)
        const result = await golfQuery(
          `INSERT INTO golf_courses (name, location, address, holes, par, difficulty, image_url) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [name, location, address, holes || 18, par || 72, difficulty, image_url]
        );
        
        res.status(201).json({ 
          success: true, 
          message: 'golf course added.',
          data: { id: result.insertId, name, location }
        });
      } catch (error) {
        console.error('golf course add error occurred! :', error);
        res.status(500).json({ success: false, message: 'server error occurred!.' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }
}