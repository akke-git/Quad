// pages/api/blog/posts/[id].js
import { query } from '../../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  
  try {
    const results = await query(`
      SELECT *
      FROM posts
      WHERE id = ?
    `, [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}