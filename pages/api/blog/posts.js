// pages/api/blog/posts.js
import { query } from '../../../lib/db';
import { formidable } from 'formidable';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

// formidable을 사용하기 위한 설정
export const config = {
  api: {
    bodyParser: false,
  },
};

// 폼 데이터 파싱 함수
const parseForm = async (req) => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'public/uploads/blog'),
      keepExtensions: true,
      maxFiles: 2, // 마크다운 파일과 썸네일 이미지를 위해 2로 변경
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });
    
    // 업로드 디렉토리가 없으면 생성
    const uploadDir = path.join(process.cwd(), 'public/uploads/blog');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

// 슬러그 생성 함수
const createSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
};

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        // 태그 필터링 지원
        const { tag } = req.query;
        
        let posts;
        if (tag) {
          // 특정 태그로 필터링된 포스트 가져오기
          posts = await query(`
            SELECT p.id, p.title, p.slug, p.excerpt, p.created_at, p.updated_at, p.view_count, p.status, p.thumbnail
            FROM blog_posts p
            JOIN blog_post_tags pt ON p.id = pt.post_id
            WHERE pt.tag_id = ? AND p.status = 'published'
            ORDER BY p.created_at DESC
          `, [tag]);
        } else {
          // 모든 포스트 가져오기
          posts = await query(`
            SELECT id, title, slug, excerpt, created_at, updated_at, view_count, status, thumbnail
            FROM blog_posts
            WHERE status = 'published'
            ORDER BY created_at DESC
          `);
        }
        
        // 각 포스트에 태그 정보 추가
        for (const post of posts) {
          const tags = await query(`
            SELECT t.id, t.name, t.slug, t.color
            FROM blog_tags t
            JOIN blog_post_tags pt ON t.id = pt.tag_id
            WHERE pt.post_id = ?
          `, [post.id]);
          
          post.tags = tags;
        }
        
        return res.status(200).json(posts);
      } catch (error) {
        console.error('포스트를 가져오는 중 오류 발생:', error);
        return res.status(500).json({ message: '포스트를 가져오는 중 오류가 발생했습니다.' });
      }
      
    case 'POST':
      try {
        // 폼 데이터 파싱
        const { fields, files } = await parseForm(req);
        
        // formidable의 최신 버전에서는 필드가 배열로 반환됨
        const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
        const content = Array.isArray(fields.content) ? fields.content[0] : fields.content;
        const excerpt = Array.isArray(fields.excerpt) ? fields.excerpt[0] : fields.excerpt;
        const tagsJson = Array.isArray(fields.tags) ? fields.tags[0] : fields.tags;
        
        if (!title || !content) {
          return res.status(400).json({ message: '제목과 내용은 필수입니다.' });
        }
        
        // 태그 파싱
        let tags = [];
        try {
          if (tagsJson) {
            tags = JSON.parse(tagsJson);
          }
        } catch (e) {
          console.error('태그 파싱 오류:', e);
        }
        
        // 슬러그 생성
        const slug = createSlug(title);
        
        // 마크다운을 HTML로 변환
        const contentHtml = marked(content);
        
        // 썸네일 처리
        let thumbnailPath = null;
        if (files.thumbnail) {
          // formidable의 최신 버전에서는 파일도 배열로 반환될 수 있음
          const file = Array.isArray(files.thumbnail) ? files.thumbnail[0] : files.thumbnail;
          const fileName = path.basename(file.filepath || file.newFilename);
          thumbnailPath = `/uploads/blog/${fileName}`;
        }
        
        // 포스트 저장
        const result = await query(`
          INSERT INTO blog_posts (title, slug, content, content_html, excerpt, status, thumbnail)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          title,
          slug,
          content,
          contentHtml,
          excerpt || content.substring(0, 150) + (content.length > 150 ? '...' : ''),
          'published',
          thumbnailPath
        ]);
        
        const postId = result.insertId;
        
        // 태그 연결
        if (tags.length > 0) {
          const tagValues = tags.map(tagId => [postId, tagId]);
          await query(`
            INSERT INTO blog_post_tags (post_id, tag_id)
            VALUES ?
          `, [tagValues]);
        }
        
        // 생성된 포스트 정보 가져오기
        const newPost = await query(`
          SELECT id, title, slug, excerpt, created_at, status, thumbnail
          FROM blog_posts
          WHERE id = ?
        `, [postId]);
        
        // 태그 정보 추가
        const postTags = await query(`
          SELECT t.id, t.name, t.slug, t.color
          FROM blog_tags t
          JOIN blog_post_tags pt ON t.id = pt.tag_id
          WHERE pt.post_id = ?
        `, [postId]);
        
        newPost[0].tags = postTags;
        
        return res.status(201).json(newPost[0]);
      } catch (error) {
        console.error('포스트 저장 중 오류 발생:', error);
        return res.status(500).json({ message: '포스트를 저장하는 중 오류가 발생했습니다.' });
      }
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
}