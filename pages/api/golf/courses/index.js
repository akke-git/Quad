// pages/api/golf/courses/index.js

import { golfQuery } from '../../../../lib/db';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        // 쿼리 파라미터 가져오기
        const { location, sort, order = 'asc', limit = 50 } = req.query;
        
        // 기본 쿼리
        let sql = 'SELECT * FROM golf_courses';
        const queryParams = [];
        
        // 지역 필터 적용
        if (location) {
          sql += ' WHERE location = ?';
          queryParams.push(location);
        }
        
        // 정렬 적용
        if (sort) {
          sql += ` ORDER BY ${sort} ${order.toUpperCase()}`;
        } else {
          sql += ' ORDER BY name ASC'; // 기본 정렬: 코스명 오름차순
        }
        
        // 결과 제한 (최대 1000개까지 허용)
        const limitValue = Math.min(parseInt(limit) || 50, 1000);
        sql += ' LIMIT ?';
        queryParams.push(limitValue);
        
        // 쿼리 실행 (golfQuery 함수 사용)
        const courses = await golfQuery(sql, queryParams);
        
        // 결과 반환
        res.status(200).json({ success: true, data: courses });
      } catch (error) {
        console.error('골프 코스 목록 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
      }
      break;
      
    case 'POST':
      // 새 골프 코스 추가 (관리자 기능)
      try {
        const { name, location, address, holes, par, difficulty, image_url } = req.body;
        
        // 필수 필드 확인
        if (!name || !location) {
          return res.status(400).json({ success: false, message: '코스명과 지역은 필수 입력 항목입니다.' });
        }
        
        // 코스 추가 (golfQuery 함수 사용)
        const result = await golfQuery(
          `INSERT INTO golf_courses (name, location, address, holes, par, difficulty, image_url) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [name, location, address, holes || 18, par || 72, difficulty, image_url]
        );
        
        res.status(201).json({ 
          success: true, 
          message: '골프 코스가 추가되었습니다.',
          data: { id: result.insertId, name, location }
        });
      } catch (error) {
        console.error('골프 코스 추가 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }
}