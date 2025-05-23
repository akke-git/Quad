// pages/api/golf/teams/index.js

import { query } from '../../../../lib/db';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return getTeams(req, res);
    case 'POST':
      return createTeam(req, res);
    default:
      return res.status(405).json({ message: '허용되지 않는 메서드입니다' });
  }
}

// 팀 목록 조회
async function getTeams(req, res) {
  try {
    const { sort = 'team_name', order = 'asc', limit = 100, offset = 0 } = req.query;
    
    // 정렬 필드 검증
    const allowedSortFields = ['team_name', 'team_created_at'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'team_name';
    
    // 정렬 순서 검증
    const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    
    // 팀 목록 쿼리
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
      ORDER BY ${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);
    
    // 총 팀 수 쿼리
    const countResult = await query('SELECT COUNT(*) as count FROM team');
    const totalCount = countResult[0].count;
    
    return res.status(200).json({
      data: teams,
      meta: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('팀 목록 조회 오류:', error);
    return res.status(500).json({ message: '팀 목록을 조회하는 중 오류가 발생했습니다' });
  }
}

// 팀 생성
async function createTeam(req, res) {
  try {
    const { team_name, user1_id, user2_id, team_image } = req.body;
    
    // 필수 필드 검증
    if (!team_name || !user1_id || !user2_id) {
      return res.status(400).json({ message: '팀 이름과 두 명의 팀원 ID가 필요합니다' });
    }
    
    // 같은 사용자 선택 방지
    if (user1_id === user2_id) {
      return res.status(400).json({ message: '같은 사용자를 두 번 선택할 수 없습니다' });
    }
    
    // 사용자 존재 여부 확인
    const user1 = await query('SELECT id FROM users WHERE id = ?', [user1_id]);
    if (user1.length === 0) {
      return res.status(404).json({ message: '첫 번째 팀원을 찾을 수 없습니다' });
    }
    
    const user2 = await query('SELECT id FROM users WHERE id = ?', [user2_id]);
    if (user2.length === 0) {
      return res.status(404).json({ message: '두 번째 팀원을 찾을 수 없습니다' });
    }
    
    // 팀 생성
    const result = await query(`
      INSERT INTO team (team_name, user1_id, user2_id, team_image)
      VALUES (?, ?, ?, ?)
    `, [team_name, user1_id, user2_id, team_image || null]);
    
    // 생성된 팀 정보 조회
    const newTeam = await query(`
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
    `, [result.insertId]);
    
    return res.status(201).json({
      message: '팀이 성공적으로 생성되었습니다',
      data: newTeam[0]
    });
  } catch (error) {
    console.error('팀 생성 오류:', error);
    return res.status(500).json({ message: '팀을 생성하는 중 오류가 발생했습니다' });
  }
}
