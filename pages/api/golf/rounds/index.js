// pages/api/golf/rounds/index.js

import { golfQuery } from '../../../../lib/db';

export default async function handler(req, res) {
  // GET 요청 처리 (라운드 목록 조회)
  if (req.method === 'GET') {
    try {
      const userId = req.query.user_id;
      
      let query = `
        SELECT r.*, c.name as course_name, c.location as course_location 
        FROM rounds r
        JOIN golf_courses c ON r.course_id = c.id
      `;
      
      const params = [];
      
      // 사용자 ID로 필터링
      if (userId) {
        query += ' WHERE r.user_id = ?';
        params.push(userId);
      }
      
      query += ' ORDER BY r.play_date DESC';
      
      const rounds = await golfQuery(query, params);
      
      // 각 라운드의 홀 스코어 데이터 가져오기
      const roundsWithScores = [];
      
      for (const round of rounds) {
        const scoresQuery = `
          SELECT * FROM hole_scores 
          WHERE round_id = ? 
          ORDER BY hole_number
        `;
        
        const scores = await golfQuery(scoresQuery, [round.id]);
        
        roundsWithScores.push({
          ...round,
          scores: scores
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: roundsWithScores
      });
    } catch (error) {
      console.error('Error fetching rounds:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch rounds'
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
            par,
            score, 
            putts, 
            fairway_hit, 
            green_in_regulation, 
            sand_save, 
            penalty_strokes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            round_id,
            holeScore.hole_number,
            holeScore.par || 4,
            holeScore.score,
            holeScore.putts || null,
            holeScore.fairway_hit || null,
            holeScore.green_in_regulation || null,
            holeScore.sand_save || null,
            holeScore.penalty_strokes || 0
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
