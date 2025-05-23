// pages/api/golf/teams/[id].js

import { query } from '../../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ message: '유효한 팀 ID가 필요합니다' });
  }
  
  switch (req.method) {
    case 'GET':
      return getTeam(req, res, id);
    case 'DELETE':
      return deleteTeam(req, res, id);
    default:
      return res.status(405).json({ message: '허용되지 않는 메서드입니다' });
  }
}

// 팀 상세 정보 조회
async function getTeam(req, res, id) {
  try {
    // 팀 정보 조회
    const teams = await query(`
      SELECT 
        t.team_id, 
        t.team_name, 
        t.user1_id, 
        t.user2_id, 
        t.team_image, 
        t.team_created_at, 
        t.team_updated_at,
        u1.username AS user1_username,
        u1.display_name AS user1_display_name,
        u1.profile_image AS user1_profile_image,
        u1.handicap AS user1_handicap,
        u2.username AS user2_username,
        u2.display_name AS user2_display_name,
        u2.profile_image AS user2_profile_image,
        u2.handicap AS user2_handicap
      FROM team t
      LEFT JOIN users u1 ON t.user1_id = u1.id
      LEFT JOIN users u2 ON t.user2_id = u2.id
      WHERE t.team_id = ?
    `, [id]);
    
    if (teams.length === 0) {
      return res.status(404).json({ message: '팀을 찾을 수 없습니다' });
    }
    
    // 팀 매치 이력 조회
    const teamMatches = await query(`
      SELECT 
        tm.team_match_id,
        tm.match_date,
        tm.handicap_team,
        tm.handicap_amount,
        tm.winner,
        c.name AS course_name,
        t1.team_name AS team1_name,
        t2.team_name AS team2_name
      FROM team_match tm
      LEFT JOIN golf_courses c ON tm.course_id = c.id
      LEFT JOIN team t1 ON tm.team1_id = t1.team_id
      LEFT JOIN team t2 ON tm.team2_id = t2.team_id
      WHERE tm.team1_id = ? OR tm.team2_id = ?
      ORDER BY tm.match_date DESC
    `, [id, id]);
    
    return res.status(200).json({
      data: {
        ...teams[0],
        matches: teamMatches
      }
    });
  } catch (error) {
    console.error('팀 상세 정보 조회 오류:', error);
    return res.status(500).json({ message: '팀 정보를 조회하는 중 오류가 발생했습니다' });
  }
}

// 팀 삭제
async function deleteTeam(req, res, id) {
  try {
    // 팀이 존재하는지 확인
    const team = await query('SELECT team_id FROM team WHERE team_id = ?', [id]);
    
    if (team.length === 0) {
      return res.status(404).json({ message: '팀을 찾을 수 없습니다' });
    }
    
    // 팀 매치에서 사용 중인지 확인
    const teamMatches = await query(`
      SELECT team_match_id FROM team_match 
      WHERE team1_id = ? OR team2_id = ?
      LIMIT 1
    `, [id, id]);
    
    if (teamMatches.length > 0) {
      return res.status(400).json({ 
        message: '이 팀은 하나 이상의 매치에서 사용 중이므로 삭제할 수 없습니다. 먼저 관련 매치를 삭제해주세요.' 
      });
    }
    
    // 팀 삭제
    await query('DELETE FROM team WHERE team_id = ?', [id]);
    
    return res.status(200).json({
      message: '팀이 성공적으로 삭제되었습니다'
    });
  } catch (error) {
    console.error('팀 삭제 오류:', error);
    return res.status(500).json({ message: '팀을 삭제하는 중 오류가 발생했습니다' });
  }
}
