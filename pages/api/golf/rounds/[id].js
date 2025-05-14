// pages/api/golf/rounds/[id].js

import { golfQuery } from '../../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  
  // PUT 요청 처리 (라운드 업데이트)
  if (req.method === 'PUT') {
    try {
      const { user_id, course_id, play_date, weather, notes, scores } = req.body;
      
      // 필수 필드 검증
      if (!user_id || !course_id || !play_date || !scores || !Array.isArray(scores) || !id) {
        return res.status(400).json({
          status: 'error',
          message: '필수 필드가 누락되었습니다'
        });
      }
      
      // 유효한 스코어가 있는지 확인
      if (scores.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: '최소 한 홀 이상의 스코어가 필요합니다'
        });
      }
      
      // 총 스코어 계산 (입력된 홀만)
      const total_score = scores.reduce((sum, hole) => sum + (hole.score || 0), 0);
      
      // 트랜잭션 시작
      await golfQuery('START TRANSACTION');
      
      // 날짜 형식 변환 (ISO 형식을 MySQL 형식으로)
      let formattedDate = play_date;
      if (play_date && play_date.includes('T')) {
        // ISO 형식의 날짜인 경우 'YYYY-MM-DD' 형식으로 변환
        formattedDate = play_date.split('T')[0];
      }
      
      // 라운드 정보 업데이트
      await golfQuery(
        `UPDATE rounds 
         SET course_id = ?, play_date = ?, weather = ?, total_score = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [course_id, formattedDate, weather, total_score, notes, id, user_id]
      );
      
      // 기존 홀 스코어 삭제 (새로운 데이터로 대체)
      await golfQuery('DELETE FROM hole_scores WHERE round_id = ?', [id]);
      
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
            id,
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
      
      return res.status(200).json({
        status: 'success',
        message: '라운드가 성공적으로 업데이트되었습니다',
        data: {
          round_id: id,
          total_score
        }
      });
    } catch (error) {
      // 오류 발생 시 롤백
      await golfQuery('ROLLBACK');
      
      console.error('Error updating round:', error);
      return res.status(500).json({
        status: 'error',
        message: '라운드 업데이트에 실패했습니다'
      });
    }
  }
  
  // GET 요청 처리 (단일 라운드 조회)
  if (req.method === 'GET') {
    try {
      // 라운드 기본 정보 조회
      const roundQuery = `
        SELECT r.*, c.name as course_name, c.location as course_location 
        FROM rounds r
        JOIN golf_courses c ON r.course_id = c.id
        WHERE r.id = ?
      `;
      
      const rounds = await golfQuery(roundQuery, [id]);
      
      if (rounds.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: '라운드를 찾을 수 없습니다'
        });
      }
      
      // 홀 스코어 조회
      const scoresQuery = `
        SELECT * FROM hole_scores
        WHERE round_id = ?
        ORDER BY hole_number
      `;
      
      const scores = await golfQuery(scoresQuery, [id]);
      
      // 응답 데이터 구성
      const roundData = {
        ...rounds[0],
        scores
      };
      
      return res.status(200).json({
        status: 'success',
        data: roundData
      });
    } catch (error) {
      console.error('Error fetching round:', error);
      return res.status(500).json({
        status: 'error',
        message: '라운드 조회에 실패했습니다'
      });
    }
  }
  
  // DELETE 요청 처리 (라운드 삭제)
  if (req.method === 'DELETE') {
    try {
      // 트랜잭션 시작
      await golfQuery('START TRANSACTION');
      
      // 홀 스코어 삭제
      await golfQuery('DELETE FROM hole_scores WHERE round_id = ?', [id]);
      
      // 라운드 삭제
      await golfQuery('DELETE FROM rounds WHERE id = ?', [id]);
      
      // 트랜잭션 커밋
      await golfQuery('COMMIT');
      
      return res.status(200).json({
        status: 'success',
        message: '라운드가 성공적으로 삭제되었습니다'
      });
    } catch (error) {
      // 오류 발생 시 롤백
      await golfQuery('ROLLBACK');
      
      console.error('Error deleting round:', error);
      return res.status(500).json({
        status: 'error',
        message: '라운드 삭제에 실패했습니다'
      });
    }
  }
  
  // 지원하지 않는 HTTP 메서드
  return res.status(405).json({
    status: 'error',
    message: '지원하지 않는 메서드입니다'
  });
}
