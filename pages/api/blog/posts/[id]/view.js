// pages/api/blog/posts/[id]/view.js
import { query } from '../../../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  const { method } = req;
  
  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
  
  try {
    // 포스트 존재 여부 확인
    const postExists = await query(`
      SELECT id FROM blog_posts WHERE id = ?
    `, [id]);
    
    if (postExists.length === 0) {
      return res.status(404).json({ message: '포스트를 찾을 수 없습니다.' });
    }
    
    // 조회수 증가
    await query(`
      UPDATE blog_posts
      SET view_count = view_count + 1
      WHERE id = ?
    `, [id]);
    
    return res.status(200).json({ message: '조회수가 증가되었습니다.' });
  } catch (error) {
    console.error('조회수 증가 중 오류 발생:', error);
    return res.status(500).json({ message: '조회수를 증가하는 중 오류가 발생했습니다.' });
  }
}
