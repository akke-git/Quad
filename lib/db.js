// lib/db.js

import mysql from 'serverless-mysql';

// 블로그 데이터베이스 연결
const blogDb = mysql({
  config: {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD
  }
});

// 골프 데이터베이스 연결
const golfDb = mysql({
  config: {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    database: process.env.MYSQL_DATABASE, // 골프 데이터베이스 이름을 직접 지정
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD
  }
});

// 블로그 데이터베이스 쿼리 함수
export async function query(q, values) {
  try {
    const results = await blogDb.query(q, values);
    await blogDb.end();
    return results;
  } catch (error) {
    throw Error(error.message);
  }
}

// 골프 데이터베이스 쿼리 함수
export async function golfQuery(q, values) {
  try {
    const results = await golfDb.query(q, values);
    await golfDb.end();
    return results;
  } catch (error) {
    throw Error(error.message);
  }
}
