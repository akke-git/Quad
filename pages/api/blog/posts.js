// pages/api/blog/posts.js
import { query } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    const posts = await query(`
      SELECT id, title, excerpt, date, category, source, thumbnail
      FROM posts
      ORDER BY date DESC
    `);
    
    return res.status(200).json(posts);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}