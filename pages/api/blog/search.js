// pages/api/blog/search.js
import { query } from '../../../lib/db';

export default async function handler(req, res) {
  const { method } = req;
  
  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
  
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ message: '검색어를 입력해주세요.' });
    }
    
    // FULLTEXT 인덱스를 사용한 검색
    const searchResults = await query(`
      SELECT id, title, slug, excerpt, created_at, updated_at, view_count, status, thumbnail,
             MATCH(title, content, excerpt) AGAINST(? IN NATURAL LANGUAGE MODE) AS relevance
      FROM blog_posts
      WHERE MATCH(title, content, excerpt) AGAINST(? IN NATURAL LANGUAGE MODE)
        AND status = 'published'
      ORDER BY relevance DESC
      LIMIT 20
    `, [q, q]);
    
    // 각 포스트에 태그 정보 추가
    for (const post of searchResults) {
      const tags = await query(`
        SELECT t.id, t.name, t.slug, t.color
        FROM blog_tags t
        JOIN blog_post_tags pt ON t.id = pt.tag_id
        WHERE pt.post_id = ?
      `, [post.id]);
      
      post.tags = tags;
    }
    
    return res.status(200).json(searchResults);
  } catch (error) {
    console.error('검색 중 오류 발생:', error);
    return res.status(500).json({ message: '검색 중 오류가 발생했습니다.' });
  }
}
