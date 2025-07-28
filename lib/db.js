// lib/db.js

import mysql from 'serverless-mysql';
import bcrypt from 'bcryptjs';

// 데이터베이스 설정
const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  // 연결 풀링 설정
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// 블로그 데이터베이스 연결
const blogDb = mysql({
  config: dbConfig
});

// 골프 데이터베이스 연결
const golfDb = mysql({
  config: dbConfig
});

// 허용된 정렬 필드 정의
export const ALLOWED_SORT_FIELDS = {
  users: ['id', 'username', 'email', 'display_name', 'created_at', 'updated_at'],
  teams: ['team_id', 'team_name', 'team_created_at', 'team_updated_at'],
  courses: ['id', 'name', 'location', 'created_at'],
  rounds: ['id', 'course_id', 'user_id', 'created_at'],
  blog_posts: ['id', 'title', 'created_at', 'updated_at', 'views']
};

// SQL 쿼리 보안 유틸리티
export function validateSortField(field, table) {
  const allowedFields = ALLOWED_SORT_FIELDS[table] || [];
  return allowedFields.includes(field) ? field : allowedFields[0] || 'id';
}

export function validateSortOrder(order) {
  return ['asc', 'desc'].includes(order?.toLowerCase()) ? order.toUpperCase() : 'ASC';
}

export function validateLimit(limit, max = 1000) {
  const parsedLimit = parseInt(limit) || 50;
  return Math.min(Math.max(parsedLimit, 1), max);
}

export function validateOffset(offset) {
  return Math.max(parseInt(offset) || 0, 0);
}

// 비밀번호 해싱 유틸리티
export async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// 입력값 검증 유틸리티
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUsername(username) {
  // 영문, 숫자, 언더스코어만 허용, 3-20자
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().substring(0, 1000); // 최대 1000자로 제한
}

// 향상된 쿼리 함수 (블로그)
export async function query(sql, values = []) {
  try {
    // SQL 인젝션 방지를 위한 기본 검증
    if (!sql || typeof sql !== 'string') {
      throw new Error('Invalid SQL query');
    }
    
    // 매개변수화된 쿼리만 허용
    const results = await blogDb.query(sql, values);
    await blogDb.end();
    return results;
  } catch (error) {
    console.error('Database query error (blog):', {
      sql: sql?.substring(0, 100),
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw new Error(`데이터베이스 쿼리 실행 중 오류가 발생했습니다: ${error.message}`);
  }
}

// 향상된 쿼리 함수 (골프)
export async function golfQuery(sql, values = []) {
  try {
    // SQL 인젝션 방지를 위한 기본 검증
    if (!sql || typeof sql !== 'string') {
      throw new Error('Invalid SQL query');
    }
    
    // 매개변수화된 쿼리만 허용
    const results = await golfDb.query(sql, values);
    await golfDb.end();
    return results;
  } catch (error) {
    console.error('Database query error (golf):', {
      sql: sql?.substring(0, 100),
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw new Error(`데이터베이스 쿼리 실행 중 오류가 발생했습니다: ${error.message}`);
  }
}

// 트랜잭션 지원 함수
export async function executeTransaction(queries) {
  const connection = await golfDb.getConnection();
  try {
    await connection.beginTransaction();
    const results = [];
    
    for (const { sql, values } of queries) {
      const result = await connection.query(sql, values);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
