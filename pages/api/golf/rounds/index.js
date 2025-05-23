// pages/api/golf/rounds/index.js

import { golfQuery } from '../../../../lib/db';

export default async function handler(req, res) {
  // GET 요청 처리 (라운드 목록 조회)
  if (req.method === 'GET') {
    try {
      const userId = req.query.user_id;
      const limit = req.query.limit || 100; // 기본 제한 설정
      
      console.log('Fetching rounds for user:', userId);
      
      // 라운드 데이터와 코스 정보를 함께 가져오기 (LEFT JOIN 사용)
      let roundsQuery = `
        SELECT r.*, gc.name as course_name, gc.region as course_location 
        FROM rounds r
        LEFT JOIN golf_courses gc ON r.course_id = gc.id
      `;
      
      const params = [];
      
      // 사용자 ID로 필터링
      if (userId) {
        roundsQuery += ' WHERE user_id = ?';
        params.push(userId);
      }
      
      roundsQuery += ' ORDER BY play_date DESC';
      roundsQuery += ' LIMIT ?';
      params.push(parseInt(limit));
      
      console.log('Rounds query:', roundsQuery, 'Params:', params);
      const rounds = await golfQuery(roundsQuery, params);
      console.log('Found rounds:', rounds.length);
      
      // 각 라운드의 홀 스코어 데이터 가져오기
      const roundsWithScores = [];
      
      for (const round of rounds) {
        console.log('Processing round:', round.id, 'with course_id:', round.course_id);
        
        // 코스 정보 가져오기
        let courseInfo = null;
        let courseName = '[미확인]';
        let courseLocation = '지역 정보 없음';
        
        if (round.course_id) {
          try {
            console.log('Fetching course info for course_id:', round.course_id);
            
            // golf_courses 테이블에서 조회
            const golfCoursesQuery = `
              SELECT * FROM golf_courses 
              WHERE id = ?
            `;
            let golfCourseResults = await golfQuery(golfCoursesQuery, [round.course_id]);
            console.log('Golf courses query results count:', golfCourseResults.length);
            
            if (golfCourseResults && golfCourseResults.length > 0) {
              courseInfo = golfCourseResults[0];
              console.log('Found course in golf_courses:', courseInfo.name);
            } else {
              // courses 테이블에서 조회
              console.log('No results in golf_courses, trying courses table');
              const coursesQuery = `
                SELECT * FROM courses 
                WHERE id = ?
              `;
              let coursesResults = await golfQuery(coursesQuery, [round.course_id]);
              console.log('Courses query results count:', coursesResults.length);
              
              if (coursesResults && coursesResults.length > 0) {
                courseInfo = coursesResults[0];
                console.log('Found course in courses:', courseInfo.name);
              } else {
                console.log('No course found with id:', round.course_id);
              }
            }
            
            // 코스 정보가 있으면 이름과 지역 정보 설정
            if (courseInfo) {
              courseName = courseInfo.name || '알 수 없는 코스';
              courseLocation = courseInfo.region || courseInfo.location || '지역 정보 없음';
              console.log('Setting course name:', courseName, 'and location:', courseLocation);
            }
          } catch (courseError) {
            console.error('Error fetching course info:', courseError);
          }
        } else {
          console.log('Round has no course_id');
        }
        
        // 홀 스코어 가져오기
        let scores = [];
        try {
          const scoresQuery = `
            SELECT * FROM hole_scores 
            WHERE round_id = ? 
            ORDER BY hole_number
          `;
          
          scores = await golfQuery(scoresQuery, [round.id]);
        } catch (scoreError) {
          console.error('Error fetching hole scores:', scoreError);
        }
        
        // 이미 JOIN으로 가져온 코스 정보가 있으면 그대로 사용하고, 없으면 추가 조회한 정보 사용
        let finalCourseName = round.course_name || courseName;
        const finalCourseLocation = round.course_location || courseLocation;
        
        // 코스명이 비어있거나 공백만 있는 경우 처리
        if (!finalCourseName || finalCourseName.trim() === '') {
          finalCourseName = '[미확인]';
          console.log(`비어있는 코스명을 '[미확인]'으로 설정`);
        }
        
        roundsWithScores.push({
          ...round,
          course_name: finalCourseName,
          course_location: finalCourseLocation,
          scores: scores
        });
        
        console.log('Added round with course_name:', finalCourseName);
      }
      
      return res.status(200).json({
        status: 'success',
        data: roundsWithScores
      });
    } catch (error) {
      console.error('Error fetching rounds:', error);
      return res.status(500).json({
        status: 'error',
        message: `라운드 목록을 가져오는데 실패했습니다: ${error.message}`
      });
    }
  }
  
  // POST 요청 처리 (새 라운드 생성)
  if (req.method === 'POST') {
    try {
      const { user_id, course_id, play_date, weather, notes, scores } = req.body;
      
      // 필수 필드 검증
      if (!user_id || !course_id || !play_date || !scores || !Array.isArray(scores)) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing required fields'
        });
      }
      
      // 유효한 스코어가 있는지 확인
      if (scores.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'At least one hole score is required'
        });
      }
      
      // 총 스코어 계산 (입력된 홀만)
      const total_score = scores.reduce((sum, hole) => sum + (hole.score || 0), 0);
      
      // 트랜잭션 시작
      await golfQuery('START TRANSACTION');
      
      // 라운드 정보 삽입
      const roundResult = await golfQuery(
        `INSERT INTO rounds (user_id, course_id, play_date, weather, total_score, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, course_id, play_date, weather, total_score, notes]
      );
      
      const round_id = roundResult.insertId;
      
      // 각 홀 스코어 삽입
      for (const holeScore of scores) {
        await golfQuery(
          `INSERT INTO hole_scores (
            round_id, 
            hole_number, 
            score, 
            putts, 
            fairway_hit, 
            green_in_regulation, 
            sand_save, 
            penalty_strokes,
            course_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            round_id,
            holeScore.hole_number,
            holeScore.score,
            holeScore.putts || null,
            holeScore.fairway_hit || null,
            holeScore.green_in_regulation || null,
            holeScore.sand_save || null,
            holeScore.penalty_strokes || 0,
            holeScore.course_name || null
          ]
        );
      }
      
      // 트랜잭션 커밋
      await golfQuery('COMMIT');
      
      return res.status(201).json({
        status: 'success',
        message: 'Round created successfully',
        data: {
          round_id,
          total_score
        }
      });
    } catch (error) {
      // 오류 발생 시 롤백
      await golfQuery('ROLLBACK');
      
      console.error('Error creating round:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create round'
      });
    }
  }
  
  // 지원하지 않는 HTTP 메서드
  return res.status(405).json({
    status: 'error',
    message: 'Method not allowed'
  });
}
