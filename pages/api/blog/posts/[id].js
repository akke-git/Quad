// pages/api/blog/posts/[id].js
import { query } from '../../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  const { method } = req;
  
  switch (method) {
    case 'GET':
      try {
        // 포스트 정보 가져오기
        const results = await query(`
          SELECT id, title, slug, content, excerpt, created_at, updated_at, view_count, status, thumbnail
          FROM blog_posts
          WHERE id = ?
        `, [id]);
        
        if (results.length === 0) {
          return res.status(404).json({ message: '포스트를 찾을 수 없습니다.' });
        }
        
        const post = results[0];
        
        // 포스트에 연결된 태그 정보 가져오기
        const tags = await query(`
          SELECT t.id, t.name, t.slug, t.color
          FROM blog_tags t
          JOIN blog_post_tags pt ON t.id = pt.tag_id
          WHERE pt.post_id = ?
        `, [id]);
        
        post.tags = tags;
        
        return res.status(200).json(post);
      } catch (error) {
        console.error('포스트를 가져오는 중 오류 발생:', error);
        return res.status(500).json({ message: '포스트를 가져오는 중 오류가 발생했습니다.' });
      }
      
    case 'PUT':
      try {
        const { title, content, excerpt, status, tags } = req.body;
        
        if (!title || !content) {
          return res.status(400).json({ message: '제목과 내용은 필수입니다.' });
        }
        
        // 포스트 업데이트
        await query(`
          UPDATE blog_posts
          SET title = ?, content = ?, excerpt = ?, status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [title, content, excerpt, status || 'published', id]);
        
        // 태그 관계 업데이트 (기존 관계 삭제 후 새로 추가)
        if (tags && Array.isArray(tags)) {
          // 기존 태그 관계 삭제
          await query(`
            DELETE FROM blog_post_tags
            WHERE post_id = ?
          `, [id]);
          
          // 새 태그 관계 추가
          if (tags.length > 0) {
            const tagValues = tags.map(tagId => [id, tagId]);
            await query(`
              INSERT INTO blog_post_tags (post_id, tag_id)
              VALUES ?
            `, [tagValues]);
          }
        }
        
        // 업데이트된 포스트 정보 가져오기
        const updatedPost = await query(`
          SELECT id, title, slug, excerpt, created_at, updated_at, status
          FROM blog_posts
          WHERE id = ?
        `, [id]);
        
        if (updatedPost.length === 0) {
          return res.status(404).json({ message: '포스트를 찾을 수 없습니다.' });
        }
        
        // 업데이트된 태그 정보 가져오기
        const updatedTags = await query(`
          SELECT t.id, t.name, t.slug, t.color
          FROM blog_tags t
          JOIN blog_post_tags pt ON t.id = pt.tag_id
          WHERE pt.post_id = ?
        `, [id]);
        
        updatedPost[0].tags = updatedTags;
        
        return res.status(200).json(updatedPost[0]);
      } catch (error) {
        console.error('포스트 업데이트 중 오류 발생:', error);
        return res.status(500).json({ message: '포스트를 업데이트하는 중 오류가 발생했습니다.' });
      }
      
    case 'DELETE':
      try {
        // 포스트 삭제 전 존재 여부 확인
        const postExists = await query(`
          SELECT id FROM blog_posts WHERE id = ?
        `, [id]);
        
        if (postExists.length === 0) {
          return res.status(404).json({ message: '포스트를 찾을 수 없습니다.' });
        }
        
        // 포스트에 연결된 태그 관계 삭제
        await query(`
          DELETE FROM blog_post_tags
          WHERE post_id = ?
        `, [id]);
        
        // 포스트에 연결된 이미지 관계 삭제
        await query(`
          DELETE FROM blog_post_images
          WHERE post_id = ?
        `, [id]);
        
        // 포스트 삭제
        await query(`
          DELETE FROM blog_posts
          WHERE id = ?
        `, [id]);
        
        return res.status(200).json({ message: '포스트가 성공적으로 삭제되었습니다.' });
      } catch (error) {
        console.error('포스트 삭제 중 오류 발생:', error);
        return res.status(500).json({ message: '포스트를 삭제하는 중 오류가 발생했습니다.' });
      }
      
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
}