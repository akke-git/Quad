// pages/api/blog/posts/related.js
import { query } from '../../../../lib/db';

export default async function handler(req, res) {
  const { method } = req;
  
  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
  
  try {
    const { tags, exclude } = req.query;
    
    if (!tags) {
      return res.status(400).json({ message: '태그 ID가 필요합니다.' });
    }
    
    // 태그 ID 배열로 변환
    const tagIds = tags.split(',').map(id => parseInt(id, 10));
    
    // 제외할 포스트 ID
    const excludeId = exclude ? parseInt(exclude, 10) : 0;
    
    // 관련 포스트 가져오기 (같은 태그를 가진 다른 포스트)
    const relatedPosts = await query(`
      SELECT p.id, p.title, p.slug, p.excerpt, p.created_at, p.thumbnail, COUNT(pt.tag_id) as tag_count
      FROM blog_posts p
      JOIN blog_post_tags pt ON p.id = pt.post_id
      WHERE pt.tag_id IN (?) AND p.id != ? AND p.status = 'published'
      GROUP BY p.id
      ORDER BY tag_count DESC, p.created_at DESC
      LIMIT 5
    `, [tagIds, excludeId]);
    
    // 각 포스트에 태그 정보 추가
    for (const post of relatedPosts) {
      const tags = await query(`
        SELECT t.id, t.name, t.slug, t.color
        FROM blog_tags t
        JOIN blog_post_tags pt ON t.id = pt.tag_id
        WHERE pt.post_id = ?
      `, [post.id]);
      
      post.tags = tags;
    }
    
    return res.status(200).json(relatedPosts);
  } catch (error) {
    console.error('관련 포스트를 가져오는 중 오류 발생:', error);
    return res.status(500).json({ message: '관련 포스트를 가져오는 중 오류가 발생했습니다.' });
  }
}
