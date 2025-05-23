// pages/api/golf/course-holes.js

import { golfQuery } from '../../../lib/db';

export default async function handler(req, res) {
  // GET 요청 처리 (코스 홀 정보 조회)
  if (req.method === 'GET') {
    try {
      const { course_id, course_name } = req.query;
      
      // course_id가 없으면 에러 반환
      if (!course_id) {
        return res.status(400).json({
          status: 'error',
          message: 'course_id is required'
        });
      }
      
      console.log('코스 홀 정보 조회 요청:', course_id, course_name ? `코스 이름: ${course_name}` : '');
      
      // 코스 정보 조회 쿼리
      const courseQuery = `
        SELECT name FROM golf_courses 
        WHERE id = ?
      `;
      
      // 코스 정보 조회
      const courseInfo = await golfQuery(courseQuery, [course_id]);
      const courseName = courseInfo.length > 0 ? courseInfo[0].name : '알 수 없는 코스';
      
      console.log('코스 정보 조회 결과:', { course_id, courseName });
      
      let query;
      let queryParams;
      
      if (course_name) {
        // 특정 코스 이름의 홀 정보 조회 쿼리
        query = `
          SELECT * FROM course_holes 
          WHERE course_id = ? AND course_name = ? 
          ORDER BY hole_number
        `;
        queryParams = [course_id, course_name];
      } else {
        // 코스 이름 목록 조회 쿼리
        query = `
          SELECT DISTINCT course_name FROM course_holes 
          WHERE course_id = ?
          ORDER BY course_name
        `;
        queryParams = [course_id];
        
        const courseNames = await golfQuery(query, queryParams);
        
        if (courseNames.length > 0) {
          // 코스 이름 목록 반환
          return res.status(200).json({
            status: 'success',
            data: {
              courseName: courseName,
              courseNames: courseNames.map(item => item.course_name)
            }
          });
        }
        
        // 코스 이름이 없는 경우 모든 홀 정보 조회
        query = `
          SELECT * FROM course_holes 
          WHERE course_id = ? 
          ORDER BY course_name, hole_number
        `;
        queryParams = [course_id];
        console.log('코스 이름 없이 모든 홀 조회 쿼리 실행:', query, queryParams);
      }
      
      const holes = await golfQuery(query, queryParams);
      console.log(`코스 ID ${course_id}${course_name ? `, 코스 이름 ${course_name}` : ''}의 홀 정보 ${holes.length}개 조회됨`);
      
      return res.status(200).json({
        status: 'success',
        data: {
          courseName: courseName,
          selectedCourseName: course_name,
          holes: holes
        }
      });
    } catch (error) {
      console.error('코스 홀 정보 조회 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: `코스 홀 정보 조회 중 오류가 발생했습니다: ${error.message}`
      });
    }
  }
  
  // 다른 HTTP 메서드는 허용하지 않음
  return res.status(405).json({
    status: 'error',
    message: `Method ${req.method} Not Allowed`
  });
}
