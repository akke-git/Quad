// pages/api/golf/team-matches/[id]/holes.js
import { query } from '../../../../../lib/db';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ message: '유효하지 않은 팀 매치 ID입니다.' });
  }
  
  const teamMatchId = parseInt(id);

  switch (method) {
    case 'GET':
      try {
        // 팀 매치 존재 여부 확인
        const [teamMatch] = await query(`
          SELECT * FROM team_matches WHERE id = ?
        `, [teamMatchId]);
        
        if (!teamMatch) {
          return res.status(404).json({ message: '팀 매치를 찾을 수 없습니다.' });
        }
        
        // 홀 결과 가져오기
        const holes = await query(`
          SELECT * FROM team_match_holes
          WHERE team_match_id = ?
          ORDER BY hole_number
        `, [teamMatchId]);
        
        res.status(200).json(holes);
      } catch (error) {
        console.error('홀 결과 조회 오류:', error);
        res.status(500).json({ message: '홀 결과 조회 중 오류가 발생했습니다.' });
      }
      break;
      
    case 'POST':
      try {
        const { hole_number, winner_team } = req.body;
        
        // 필수 필드 검증
        if (!hole_number || winner_team === undefined) {
          return res.status(400).json({ message: '홀 번호와 승자 팀은 필수 항목입니다.' });
        }
        
        // 팀 매치 존재 여부 확인
        const [teamMatch] = await query(`
          SELECT * FROM team_matches WHERE id = ?
        `, [teamMatchId]);
        
        if (!teamMatch) {
          return res.status(404).json({ message: '팀 매치를 찾을 수 없습니다.' });
        }
        
        // 이미 해당 홀의 결과가 있는지 확인
        const [existingHole] = await query(`
          SELECT * FROM team_match_holes
          WHERE team_match_id = ? AND hole_number = ?
        `, [teamMatchId, hole_number]);
        
        if (existingHole) {
          // 기존 홀 결과 업데이트
          await query(`
            UPDATE team_match_holes
            SET winner_team = ?
            WHERE id = ?
          `, [winner_team, existingHole.id]);
          
          res.status(200).json({ message: '홀 결과가 성공적으로 업데이트되었습니다.' });
        } else {
          // 새 홀 결과 추가
          await query(`
            INSERT INTO team_match_holes (team_match_id, hole_number, winner_team)
            VALUES (?, ?, ?)
          `, [teamMatchId, hole_number, winner_team]);
          
          res.status(201).json({ message: '홀 결과가 성공적으로 추가되었습니다.' });
        }
        
        // 모든 홀의 결과가 입력되었는지 확인
        const [course] = await query(`
          SELECT holes FROM golf_courses WHERE id = ?
        `, [teamMatch.course_id]);
        
        const [holeCount] = await query(`
          SELECT COUNT(*) as count FROM team_match_holes WHERE team_match_id = ?
        `, [teamMatchId]);
        
        // 모든 홀의 결과가 입력되었으면 매치 상태를 completed로 변경
        if (holeCount.count >= course.holes) {
          await query(`
            UPDATE team_matches SET status = 'completed' WHERE id = ?
          `, [teamMatchId]);
        }
      } catch (error) {
        console.error('홀 결과 추가/업데이트 오류:', error);
        res.status(500).json({ message: '홀 결과 추가/업데이트 중 오류가 발생했습니다.' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
