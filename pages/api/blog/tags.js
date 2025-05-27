// pages/api/blog/tags.js
import { query } from '../../../lib/db';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'GET':
      try {
        // 모든 태그 가져오기
        const tags = await query(`
          SELECT id, name, slug, color
          FROM blog_tags
          ORDER BY name ASC
        `);
        
        return res.status(200).json(tags);
      } catch (error) {
        console.error('태그를 가져오는 중 오류 발생:', error);
        return res.status(500).json({ message: '태그를 가져오는 중 오류가 발생했습니다.' });
      }
      
    case 'POST':
      try {
        const { name, color } = req.body;
        
        if (!name) {
          return res.status(400).json({ message: '태그 이름은 필수입니다.' });
        }
        
        // 태그 이름에서 slug 생성
        const slug = name
          .toLowerCase()
          .replace(/[^\w\s가-힣]/g, '')
          .replace(/\s+/g, '-');
        
        // 태그 추가
        const result = await query(`
          INSERT INTO blog_tags (name, slug, color)
          VALUES (?, ?, ?)
        `, [name, slug, color || '#007bff']);
        
        const newTag = await query(`
          SELECT id, name, slug, color
          FROM blog_tags
          WHERE id = ?
        `, [result.insertId]);
        
        return res.status(201).json(newTag[0]);
      } catch (error) {
        console.error('태그를 추가하는 중 오류 발생:', error);
        return res.status(500).json({ message: '태그를 추가하는 중 오류가 발생했습니다.' });
      }

    case 'PUT':
      try {
        const { name, color } = req.body;
        const tagId = req.body.id;
        
        if (!tagId) {
          return res.status(400).json({ message: '태그 ID는 필수입니다.' });
        }
        
        if (!name) {
          return res.status(400).json({ message: '태그 이름은 필수입니다.' });
        }
        
        // 태그 이름에서 slug 생성
        const slug = name
          .toLowerCase()
          .replace(/[^\w\s가-힣]/g, '')
          .replace(/\s+/g, '-');
        
        // 태그 수정
        await query(`
          UPDATE blog_tags
          SET name = ?, slug = ?, color = ?
          WHERE id = ?
        `, [name, slug, color || '#007bff', tagId]);
        
        const updatedTag = await query(`
          SELECT id, name, slug, color
          FROM blog_tags
          WHERE id = ?
        `, [tagId]);
        
        if (updatedTag.length === 0) {
          return res.status(404).json({ message: '태그를 찾을 수 없습니다.' });
        }
        
        return res.status(200).json(updatedTag[0]);
      } catch (error) {
        console.error('태그를 수정하는 중 오류 발생:', error);
        return res.status(500).json({ message: '태그를 수정하는 중 오류가 발생했습니다.' });
      }
      
    case 'DELETE':
      try {
        const tagId = req.body.id;
        
        if (!tagId) {
          return res.status(400).json({ message: '태그 ID는 필수입니다.' });
        }
        
        // 태그가 사용 중인지 확인
        const usageCheck = await query(`
          SELECT COUNT(*) as count
          FROM blog_post_tags
          WHERE tag_id = ?
        `, [tagId]);
        
        if (usageCheck[0].count > 0) {
          return res.status(400).json({ 
            message: '이 태그는 포스트에서 사용 중입니다. 삭제하기 전에 포스트에서 태그를 제거해주세요.',
            count: usageCheck[0].count
          });
        }
        
        // 태그 삭제
        await query(`
          DELETE FROM blog_tags
          WHERE id = ?
        `, [tagId]);
        
        return res.status(200).json({ message: '태그가 성공적으로 삭제되었습니다.' });
      } catch (error) {
        console.error('태그를 삭제하는 중 오류 발생:', error);
        return res.status(500).json({ message: '태그를 삭제하는 중 오류가 발생했습니다.' });
      }
      
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
}
