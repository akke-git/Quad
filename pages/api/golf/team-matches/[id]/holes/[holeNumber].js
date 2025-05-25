// pages/api/golf/team-matches/[id]/holes/[holeNumber].js
import { query } from '../../../../../../lib/db';

export default async function handler(req, res) {
  const { method } = req;
  const { id, holeNumber } = req.query;
  
  if (!id || isNaN(parseInt(id)) || !holeNumber || isNaN(parseInt(holeNumber))) {
    return res.status(400).json({ message: '유효하지 않은 팀 매치 ID 또는 홀 번호입니다.' });
  }
  
  const teamMatchId = parseInt(id);
  const holeNum = parseInt(holeNumber);

  switch (method) {
    case 'PUT':
      try {
        const { winner_team } = req.body;
        
        // 필수 필드 검증
        if (winner_team === undefined) {
          return res.status(400).json({ message: '승자 팀은 필수 항목입니다.' });
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
          SELECT * FROM team_match_hole
          WHERE team_match_id = ? AND hole_number = ?
        `, [teamMatchId, holeNum]);
        
        if (existingHole) {
          // 기존 홀 결과 업데이트
          await query(`
            UPDATE team_match_hole
            SET winner_team = ?
            WHERE id = ?
          `, [winner_team, existingHole.id]);
          
          res.status(200).json({ message: '홀 결과가 성공적으로 업데이트되었습니다.' });
        } else {
          // 새 홀 결과 추가
          await query(`
            INSERT INTO team_match_hole (team_match_id, hole_number, winner_team)
            VALUES (?, ?, ?)
          `, [teamMatchId, holeNum, winner_team]);
          
          res.status(201).json({ message: '홀 결과가 성공적으로 추가되었습니다.' });
        }
        
        // 모든 홀의 결과가 입력되었는지 확인
        const [course] = await query(`
          SELECT holes FROM golf_courses WHERE id = ?
        `, [teamMatch.course_id]);
        
        const [holeCount] = await query(`
          SELECT COUNT(*) as count FROM team_match_hole WHERE team_match_id = ?
        `, [teamMatchId]);
        
        // 홀별 승리 현황 계산
        const holeResults = await query(`
          SELECT winner_team FROM team_match_hole WHERE team_match_id = ?
        `, [teamMatchId]);
        
        let team1Wins = 0;
        let team2Wins = 0;
        let allSquare = 0;
        
        // 팀 ID 가져오기
        const [teams] = await query(`
          SELECT team1_id, team2_id FROM team_matches WHERE id = ?
        `, [teamMatchId]);
        
        const team1Id = teams.team1_id;
        const team2Id = teams.team2_id;
        
        // 홀별 승리 현황 계산
        holeResults.forEach(hole => {
          if (hole.winner_team === team1Id) {
            team1Wins++;
          } else if (hole.winner_team === team2Id) {
            team2Wins++;
          } else {
            allSquare++;
          }
        });
        
        // 승리팀 결정
        let winnerTeam = null;
        if (team1Wins > team2Wins) {
          winnerTeam = team1Id;
        } else if (team2Wins > team1Wins) {
          winnerTeam = team2Id;
        }
        
        // 모든 홀의 결과가 입력되었으면 매치 상태를 completed로 변경
        if (holeCount.count >= course.holes) {
          await query(`
            UPDATE team_matches SET status = 'completed', winner_team_id = ? WHERE id = ?
          `, [winnerTeam, teamMatchId]);
        } else {
          // 진행 중이라도 현재까지의 승리팀 정보 업데이트
          await query(`
            UPDATE team_matches SET winner_team_id = ? WHERE id = ?
          `, [winnerTeam, teamMatchId]);
        }
      } catch (error) {
        console.error('홀 결과 업데이트 오류:', error);
        res.status(500).json({ message: '홀 결과 업데이트 중 오류가 발생했습니다.' });
      }
      break;
      
    case 'DELETE':
      try {
        // 홀 결과 삭제
        await query(`
          DELETE FROM team_match_hole
          WHERE team_match_id = ? AND hole_number = ?
        `, [teamMatchId, holeNum]);
        
        res.status(200).json({ message: '홀 결과가 성공적으로 삭제되었습니다.' });
      } catch (error) {
        console.error('홀 결과 삭제 오류:', error);
        res.status(500).json({ message: '홀 결과 삭제 중 오류가 발생했습니다.' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
