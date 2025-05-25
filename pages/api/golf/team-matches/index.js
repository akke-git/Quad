// pages/api/golf/team-matches/index.js
import { query } from '../../../../lib/db';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        // 모든 팀 매치 조회
        const teamMatches = await query(`
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
          ORDER BY tm.match_date DESC
        `);
        
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
                u2.id as user2_id, 
                u2.display_name as user2_display_name, 
                u2.username as user2_username,
                u2.profile_image as user2_profile_image
              FROM team t
              LEFT JOIN users u1 ON t.user1_id = u1.id
              LEFT JOIN users u2 ON t.user2_id = u2.id
              WHERE t.team_id = ?
            `, [teamId]);
            
            if (teamData.length === 0) return [];
            
            const team = teamData[0];
            return [
              { 
                user_id: team.user1_id, 
                display_name: team.user1_display_name,
                username: team.user1_username,
                profile_image: team.user1_profile_image
              },
              { 
                user_id: team.user2_id, 
                display_name: team.user2_display_name,
                username: team.user2_username,
                profile_image: team.user2_profile_image
              }
            ];
          } catch (error) {
            console.error('팀 멤버 조회 오류:', error);
            return [];
          }
        };
        
        // 홀별 기록 가져오기 함수
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
            console.error('홀별 기록 조회 오류:', error);
            return [];
          }
        };
        
        // 팀 핵디캡 정보 가져오기 함수
        const getTeamHandicaps = async (teamId) => {
          try {
            const handicapData = await query(`
              SELECT u1.handicap as user1_handicap, u2.handicap as user2_handicap
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
        
        // 클라이언트에서 사용하는 형식으로 데이터 변환
        const formattedMatches = await Promise.all(teamMatches.map(async match => {
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
            if (hole.winner_team === 1) {
              team1Wins++;
            } else if (hole.winner_team === 2) {
              team2Wins++;
            } else {
              allSquare++;
            }
          });
          
          return {
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
        }));
        
        res.status(200).json(formattedMatches);
      } catch (error) {
        console.error('팀 매치 조회 오류:', error);
        res.status(500).json({ message: '팀 매치 조회 중 오류가 발생했습니다.' });
      }
      break;
      
    case 'POST':
      try {
        const { match_date, course_id, initial_handicap = 0, team1_id, team2_id, handicap_team = 1, hole_results = [] } = req.body;
        
        console.log('받은 데이터:', req.body);
        
        // 필수 필드 검증
        if (!match_date || !course_id) {
          return res.status(400).json({ message: '날짜와 코스 정보가 누락되었습니다.' });
        }
        
        // 팀 ID 검증
        if (!team1_id || !team2_id) {
          return res.status(400).json({ message: '팀 정보가 누락되었습니다.' });
        }
        
        try {
          // 트랜잭션 시작
          await query('START TRANSACTION');
          
          // 팀 매치 생성
          const result = await query(`
            INSERT INTO team_match (team1_id, team2_id, match_date, course_id, handicap_team, handicap_amount)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [parseInt(team1_id), parseInt(team2_id), match_date, parseInt(course_id), parseInt(handicap_team), parseInt(initial_handicap)]);
          
          // 삽입된 ID 가져오기
          const insertId = result.insertId || 0;
          
          // 홀별 업다운 정보 저장 (모든 홀 데이터 저장, A.S도 포함)
          if (hole_results && hole_results.length > 0) {
            console.log('홀 결과 저장:', hole_results);
            
            // 홀별 업다운 정보 삽입
            const holeInsertPromises = hole_results.map(hole => {
              return query(`
                INSERT INTO team_match_hole (team_match_id, hole_number, winner_team)
                VALUES (?, ?, ?)
              `, [insertId, parseInt(hole.hole_number), parseInt(hole.winner_team)]);
            });
            
            await Promise.all(holeInsertPromises);
          } else {
            // 홀 결과가 없는 경우 기본적으로 18홀 모두 A.S(0)로 생성
            const defaultHoleInsertPromises = Array.from({ length: 18 }, (_, i) => {
              return query(`
                INSERT INTO team_match_hole (team_match_id, hole_number, winner_team)
                VALUES (?, ?, ?)
              `, [insertId, i + 1, 0]); // 0은 A.S를 나타냄
            });
            
            await Promise.all(defaultHoleInsertPromises);
          }
          
          // 홀별 결과에 따라 승리팀 계산
          const holeResults = await query(`
            SELECT hole_number, winner_team
            FROM team_match_hole
            WHERE team_match_id = ?
          `, [insertId]);
          
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
          `, [winnerTeam, insertId]);
          
          // 트랜잭션 커밋
          await query('COMMIT');
          
          res.status(201).json({ 
            id: insertId, 
            team_match_id: insertId,
            winner: winnerTeam,
            message: '팀 매치가 성공적으로 생성되었습니다.' 
          });
        } catch (dbError) {
          // 트랜잭션 롤백
          try {
            await query('ROLLBACK');
          } catch (rollbackError) {
            console.error('롤백 오류:', rollbackError);
          }
          throw dbError; // 상위 catch 블록으로 오류 전달
        }
      } catch (error) {
        console.error('팀 매치 생성 오류:', error);
        res.status(500).json({ message: `팀 매치 생성 중 오류가 발생했습니다: ${error.message}` });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
