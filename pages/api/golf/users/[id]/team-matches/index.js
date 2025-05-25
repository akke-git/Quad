// pages/api/golf/users/[id]/team-matches/index.js
import { query } from '../../../../../../lib/db';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ message: '유효하지 않은 사용자 ID입니다.' });
  }
  
  const userId = parseInt(id);

  switch (method) {
    case 'GET':
      try {
        // 사용자 존재 여부 확인
        const [user] = await query(`
          SELECT * FROM users WHERE id = ?
        `, [userId]);
        
        if (!user) {
          return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        
        // 사용자가 참여한 팀 매치 조회
        const teamMatches = await query(`
          SELECT DISTINCT tm.* 
          FROM team_matches tm
          JOIN team_match_teams tmt ON tm.id = tmt.team_match_id
          JOIN team_match_members tmm ON tmt.id = tmm.team_id
          WHERE tmm.user_id = ?
          ORDER BY tm.match_date DESC
        `, [userId]);
        
        // 각 팀 매치에 대한 추가 정보 가져오기
        const teamMatchesWithDetails = await Promise.all(
          teamMatches.map(async (match) => {
            // 코스 정보 가져오기
            const [course] = await query(`
              SELECT id, name, region FROM golf_courses WHERE id = ?
            `, [match.course_id]);
            
            // 팀 정보 가져오기
            const teams = await query(`
              SELECT * FROM team_match_teams WHERE team_match_id = ?
            `, [match.id]);
            
            // 각 팀의 멤버 정보 가져오기
            const teamsWithMembers = await Promise.all(
              teams.map(async (team) => {
                const members = await query(`
                  SELECT tmm.id, tmm.user_id, u.name as user_name
                  FROM team_match_members tmm
                  JOIN users u ON tmm.user_id = u.id
                  WHERE tmm.team_id = ?
                `, [team.id]);
                
                return {
                  ...team,
                  members
                };
              })
            );
            
            // 홀 결과 가져오기
            const holes = await query(`
              SELECT * FROM team_match_hole
              WHERE team_match_id = ?
              ORDER BY hole_number
            `, [match.id]);
            
            // 매치 상태 계산
            let team1Up = match.initial_handicap;
            let team2Up = 0;
            
            holes.forEach(hole => {
              if (hole.winner_team === 1) {
                team1Up++;
              } else if (hole.winner_team === 2) {
                team2Up++;
              }
            });
            
            const matchStatus = team1Up > team2Up 
              ? `1팀 ${team1Up - team2Up} UP` 
              : team2Up > team1Up 
                ? `2팀 ${team2Up - team1Up} UP` 
                : '올 스퀘어';
            
            // 사용자가 속한 팀 찾기
            let userTeam = null;
            for (const team of teamsWithMembers) {
              for (const member of team.members) {
                if (member.user_id === userId) {
                  userTeam = team.team_number;
                  break;
                }
              }
              if (userTeam) break;
            }
            
            return {
              ...match,
              course,
              teams: teamsWithMembers,
              holes,
              matchStatus,
              userTeam
            };
          })
        );
        
        res.status(200).json(teamMatchesWithDetails);
      } catch (error) {
        console.error('사용자별 팀 매치 조회 오류:', error);
        res.status(500).json({ message: '사용자별 팀 매치 조회 중 오류가 발생했습니다.' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
