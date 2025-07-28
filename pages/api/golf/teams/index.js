// pages/api/golf/teams/index.js

import { 
  golfQuery,
  validateSortField,
  validateSortOrder,
  validateLimit,
  validateOffset,
  sanitizeInput
} from '../../../../lib/db';
import { 
  ApiResponse,
  handleApiError,
  validateRequiredFields,
  validateFieldLength,
  validateMethod,
  createPaginationMeta
} from '../../../../lib/apiResponse';

export default async function handler(req, res) {
  // HTTP 메서드 검증
  const methodValidation = validateMethod(req, res, ['GET', 'POST']);
  if (methodValidation) return methodValidation;

  switch (req.method) {
    case 'GET':
      return getTeams(req, res);
    case 'POST':
      return createTeam(req, res);
    default:
      const response = ApiResponse.methodNotAllowed(req.method, ['GET', 'POST']);
      return res.status(405).json(response);
  }
}

// 팀 목록 조회
async function getTeams(req, res) {
  try {
    const { 
      sort = 'team_name', 
      order = 'asc', 
      limit = 50, 
      offset = 0,
      search = ''
    } = req.query;
    
    // 입력값 검증 및 정제
    const validSortField = validateSortField(sort, 'teams');
    const validSortOrder = validateSortOrder(order);
    const validLimit = validateLimit(limit, 100);
    const validOffset = validateOffset(offset);
    const searchTerm = sanitizeInput(search);
    
    // 기본 쿼리
    let sql = `
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
    `;
    
    let countSql = 'SELECT COUNT(*) as total FROM team t';
    const queryParams = [];
    const countParams = [];
    
    // 검색 조건 추가
    if (searchTerm) {
      const searchCondition = ` WHERE (t.team_name LIKE ? OR 
                                      u1.username LIKE ? OR u1.display_name LIKE ? OR
                                      u2.username LIKE ? OR u2.display_name LIKE ?)`;
      sql += searchCondition;
      countSql += ' LEFT JOIN users u1 ON t.user1_id = u1.id LEFT JOIN users u2 ON t.user2_id = u2.id' + searchCondition;
      
      const searchPattern = `%${searchTerm}%`;
      const searchParams = [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern];
      queryParams.push(...searchParams);
      countParams.push(...searchParams);
    }
    
    // 정렬 적용
    sql += ` ORDER BY t.${validSortField} ${validSortOrder}`;
    
    // 페이지네이션 적용
    sql += ' LIMIT ? OFFSET ?';
    queryParams.push(validLimit, validOffset);
    
    // 쿼리 실행
    const [teams, totalResult] = await Promise.all([
      golfQuery(sql, queryParams),
      golfQuery(countSql, countParams)
    ]);
    
    const total = totalResult[0].total;
    const meta = createPaginationMeta(total, validLimit, validOffset);
    
    const response = ApiResponse.success(
      teams,
      '팀 목록을 성공적으로 조회했습니다.',
      meta
    );
    
    return res.status(200).json(response);
  } catch (error) {
    return handleApiError(res, error, 'GET /api/golf/teams');
  }
}

// 팀 생성
async function createTeam(req, res) {
  try {
    const { team_name, user1_id, user2_id, team_image } = req.body;
    
    // 필수 필드 검증
    validateRequiredFields({ team_name, user1_id, user2_id }, ['team_name', 'user1_id', 'user2_id']);
    
    // 입력값 검증
    validateFieldLength(team_name, '팀 이름', 2, 50);
    
    // 사용자 ID 검증
    const userId1 = parseInt(user1_id);
    const userId2 = parseInt(user2_id);
    
    if (isNaN(userId1) || isNaN(userId2) || userId1 <= 0 || userId2 <= 0) {
      const response = ApiResponse.validationError(
        'user_id',
        '올바른 사용자 ID를 입력해주세요.'
      );
      return res.status(400).json(response);
    }
    
    // 같은 사용자 선택 방지
    if (userId1 === userId2) {
      const response = ApiResponse.validationError(
        'user_id',
        '같은 사용자를 두 번 선택할 수 없습니다.'
      );
      return res.status(400).json(response);
    }
    
    // 사용자 존재 여부 확인
    const [user1, user2] = await Promise.all([
      golfQuery('SELECT id, username FROM users WHERE id = ?', [userId1]),
      golfQuery('SELECT id, username FROM users WHERE id = ?', [userId2])
    ]);
    
    if (user1.length === 0) {
      const response = ApiResponse.notFound('첫 번째 팀원');
      return res.status(404).json(response);
    }
    
    if (user2.length === 0) {
      const response = ApiResponse.notFound('두 번째 팀원');
      return res.status(404).json(response);
    }
    
    // 팀명 중복 검사
    const existingTeam = await golfQuery('SELECT team_id FROM team WHERE team_name = ?', [team_name]);
    if (existingTeam.length > 0) {
      const response = ApiResponse.conflict('이미 존재하는 팀 이름입니다.');
      return res.status(409).json(response);
    }
    
    // 팀 이미지 유효성 검사
    let validTeamImage = null;
    if (team_image && typeof team_image === 'string') {
      validTeamImage = sanitizeInput(team_image).substring(0, 255);
    }
    
    // 팀 생성
    const result = await golfQuery(
      'INSERT INTO team (team_name, user1_id, user2_id, team_image) VALUES (?, ?, ?, ?)',
      [team_name, userId1, userId2, validTeamImage]
    );
    
    // 생성된 팀 정보 조회
    const newTeam = await golfQuery(`
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
    
    const response = ApiResponse.success(
      newTeam[0],
      '팀이 성공적으로 생성되었습니다.'
    );
    
    return res.status(201).json(response);
  } catch (error) {
    return handleApiError(res, error, 'POST /api/golf/teams');
  }
}
