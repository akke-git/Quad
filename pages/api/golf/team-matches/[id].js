// pages/api/golf/team-matches/[id].js
import { query } from '../../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  const { method } = req;

  if (!id) {
    return res.status(400).json({ message: '팀 매치 ID가 필요합니다.' });
  }

  switch (method) {
    case 'GET':
      try {
        // 팀 매치 상세 정보 조회
        const teamMatch = await query(`
          SELECT 
            tm.team_match_id as id,
            tm.team1_id,
            tm.team2_id,
            tm.course_id,
            tm.match_date,
            tm.handicap_team,
            tm.handicap_amount,
            tm.match_status as status,
            tm.winner,
            gc.name as course_name,
            gc.region as course_region,
            t1.team_name as team1_name,
            t2.team_name as team2_name
          FROM team_match tm
          LEFT JOIN golf_courses gc ON tm.course_id = gc.id
          LEFT JOIN team t1 ON tm.team1_id = t1.team_id
          LEFT JOIN team t2 ON tm.team2_id = t2.team_id
          WHERE tm.team_match_id = ?
        `, [id]);

        if (teamMatch.length === 0) {
          return res.status(404).json({ message: '팀 매치를 찾을 수 없습니다.' });
        }

        // 팀 멤버 정보 가져오기
        const getTeamMembers = async (teamId) => {
          if (!teamId) return [];
          try {
            const teamData = await query(`
              SELECT t.*, 
                u1.id as user1_id, 
                u1.display_name as user1_display_name, 
                u1.username as user1_username,
                u1.profile_image as user1_profile_image,
                u1.handicap as user1_handicap,
                u2.id as user2_id, 
                u2.display_name as user2_display_name, 
                u2.username as user2_username,
                u2.profile_image as user2_profile_image,
                u2.handicap as user2_handicap
              FROM team t
              LEFT JOIN users u1 ON t.user1_id = u1.id
              LEFT JOIN users u2 ON t.user2_id = u2.id
              WHERE t.team_id = ?
            `, [teamId]);
            
            if (teamData.length === 0) return [];
            
            const team = teamData[0];
            const members = [];
            
            if (team.user1_id) {
              members.push({
                id: team.user1_id,
                username: team.user1_username,
                display_name: team.user1_display_name,
                profile_image: team.user1_profile_image,
                handicap: team.user1_handicap
              });
            }
            
            if (team.user2_id) {
              members.push({
                id: team.user2_id,
                username: team.user2_username,
                display_name: team.user2_display_name,
                profile_image: team.user2_profile_image,
                handicap: team.user2_handicap
              });
            }
            
            return members;
          } catch (error) {
            console.error('팀 멤버 조회 오류:', error);
            return [];
          }
        };

        // 홀별 기록 가져오기
        const getHoleResults = async (matchId) => {
          try {
            const holeResults = await query(`
              SELECT hole_number, winner_team
              FROM team_match_hole
              WHERE team_match_id = ?
              ORDER BY hole_number ASC
            `, [matchId]);
            
            return holeResults;
          } catch (error) {
            console.error('홀 결과 조회 오류:', error);
            return [];
          }
        };

        // 팀 핵디캡 정보 가져오기
        const getTeamHandicaps = async (teamId) => {
          try {
            const handicapData = await query(`
              SELECT t.*, 
                u1.handicap as user1_handicap, 
                u2.handicap as user2_handicap
              FROM team t
              LEFT JOIN users u1 ON t.user1_id = u1.id
              LEFT JOIN users u2 ON t.user2_id = u2.id
              WHERE t.team_id = ?
            `, [teamId]);
            
            if (handicapData.length === 0) return { team_handicap: 0 };
            
            const team = handicapData[0];
            // 팀 핵디캡 계산 (두 유저의 핵디캡 평균)
            const user1Handicap = team.user1_handicap || 0;
            const user2Handicap = team.user2_handicap || 0;
            const teamHandicap = (user1Handicap + user2Handicap) / 2;
            
            return { 
              team_handicap: Math.round(teamHandicap * 10) / 10,
              user1_handicap: user1Handicap,
              user2_handicap: user2Handicap
            };
          } catch (error) {
            console.error('팀 핵디캡 조회 오류:', error);
            return { team_handicap: 0 };
          }
        };

        const match = teamMatch[0];
        
        // 팀 멤버 정보 가져오기
        const team1Members = await getTeamMembers(match.team1_id);
        const team2Members = await getTeamMembers(match.team2_id);
        
        // 홀별 기록 가져오기
        const holeResults = await getHoleResults(match.id);
        
        // 팀 핵디캡 정보 가져오기
        const team1Handicap = await getTeamHandicaps(match.team1_id);
        const team2Handicap = await getTeamHandicaps(match.team2_id);
        
        // 홀별 승리 현황 계산
        let team1Wins = 0;
        let team2Wins = 0;
        let allSquare = 0;
        
        holeResults.forEach(hole => {
          if (hole.winner_team === match.team1_id) {
            team1Wins++;
          } else if (hole.winner_team === match.team2_id) {
            team2Wins++;
          } else {
            allSquare++;
          }
        });

        // 응답 데이터 구성
        const formattedMatch = {
          id: match.id,
          match_date: match.match_date,
          status: match.status || 'in_progress',
          // 팀 멤버 정보 추가
          team1_members: team1Members,
          team2_members: team2Members,
          // 홀별 기록 추가
          hole_results: holeResults,
          // 팀 핵디캡 정보 추가
          team1_handicap: team1Handicap,
          team2_handicap: team2Handicap,
          // 홀별 승리 현황
          team1_wins: team1Wins,
          team2_wins: team2Wins,
          all_square: allSquare,
          course: {
            id: match.course_id,
            name: match.course_name || '코스 정보 없음',
            region: match.course_region || ''
          },
          teams: [
            { 
              id: match.team1_id,
              team_number: 1,
              team: {
                id: match.team1_id,
                name: match.team1_name || '1팀'
              },
              members: team1Members
            },
            { 
              id: match.team2_id,
              team_number: 2,
              team: {
                id: match.team2_id,
                name: match.team2_name || '2팀'
              },
              members: team2Members
            }
          ],
          handicap_team: match.handicap_team,
          handicap_amount: match.handicap_amount,
          winner: match.winner
        };
        
        res.status(200).json(formattedMatch);
      } catch (error) {
        console.error('팀 매치 상세 조회 오류:', error);
        res.status(500).json({ message: '팀 매치 상세 조회 중 오류가 발생했습니다.' });
      }
      break;

    case 'PUT':
      try {
        const { handicap_team, handicap_amount, hole_results } = req.body;
        
        // 필수 필드 검증
        if (handicap_team === undefined || handicap_amount === undefined) {
          return res.status(400).json({ message: '핸디캡 정보가 누락되었습니다.' });
        }
        
        // 트랜잭션 시작
        await query('START TRANSACTION');
        
        // 팀 매치 정보 업데이트
        await query(`
          UPDATE team_match 
          SET handicap_team = ?, handicap_amount = ?
          WHERE team_match_id = ?
        `, [parseInt(handicap_team), parseInt(handicap_amount), id]);
        
        // 홀별 결과 업데이트
        if (hole_results && hole_results.length > 0) {
          // 기존 홀 결과 삭제
          await query(`
            DELETE FROM team_match_hole
            WHERE team_match_id = ?
          `, [id]);
          
          // 새로운 홀 결과 삽입
          const holeInsertPromises = hole_results.map(hole => {
            return query(`
              INSERT INTO team_match_hole (team_match_id, hole_number, winner_team)
              VALUES (?, ?, ?)
            `, [id, parseInt(hole.hole_number), parseInt(hole.winner_team)]);
          });
          
          await Promise.all(holeInsertPromises);
          
          // 홀별 결과에 따라 승리팀 계산
          const holeResults = await query(`
            SELECT hole_number, winner_team
            FROM team_match_hole
            WHERE team_match_id = ?
          `, [id]);
          
          // 팀 매치 정보 가져오기
          const teamMatch = await query(`
            SELECT team1_id, team2_id
            FROM team_match
            WHERE team_match_id = ?
          `, [id]);
          
          if (teamMatch.length > 0) {
            const { team1_id, team2_id } = teamMatch[0];
            
            let team1Wins = 0;
            let team2Wins = 0;
            let allSquare = 0;
            
            holeResults.forEach(hole => {
              if (hole.winner_team === parseInt(team1_id)) {
                team1Wins++;
              } else if (hole.winner_team === parseInt(team2_id)) {
                team2Wins++;
              } else {
                allSquare++;
              }
            });
            
            // 승리팀 결정
            let winnerTeam = null;
            if (team1Wins > team2Wins) {
              winnerTeam = parseInt(team1_id);
            } else if (team2Wins > team1Wins) {
              winnerTeam = parseInt(team2_id);
            }
            
            // winner 업데이트
            await query(`
              UPDATE team_match SET winner = ? WHERE team_match_id = ?
            `, [winnerTeam, id]);
          }
        }
        
        // 트랜잭션 커밋
        await query('COMMIT');
        
        res.status(200).json({ 
          id: id,
          message: '팀 매치가 성공적으로 업데이트되었습니다.' 
        });
      } catch (error) {
        // 트랜잭션 롤백
        try {
          await query('ROLLBACK');
        } catch (rollbackError) {
          console.error('롤백 오류:', rollbackError);
        }
        
        console.error('팀 매치 업데이트 오류:', error);
        res.status(500).json({ message: `팀 매치 업데이트 중 오류가 발생했습니다: ${error.message}` });
      }
      break;

    case 'DELETE':
      try {
        // 트랜잭션 시작
        await query('START TRANSACTION');
        
        // 홀 결과 삭제
        await query(`
          DELETE FROM team_match_hole
          WHERE team_match_id = ?
        `, [id]);
        
        // 팀 매치 삭제
        await query(`
          DELETE FROM team_match
          WHERE team_match_id = ?
        `, [id]);
        
        // 트랜잭션 커밋
        await query('COMMIT');
        
        res.status(200).json({ message: '팀 매치가 성공적으로 삭제되었습니다.' });
      } catch (error) {
        // 트랜잭션 롤백
        try {
          await query('ROLLBACK');
        } catch (rollbackError) {
          console.error('롤백 오류:', rollbackError);
        }
        
        console.error('팀 매치 삭제 오류:', error);
        res.status(500).json({ message: `팀 매치 삭제 중 오류가 발생했습니다: ${error.message}` });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}