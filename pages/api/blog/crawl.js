// pages/api/blog/crawl.js
import { chromium } from 'playwright';
import { load } from 'cheerio';
import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { url, title, category, selector } = req.body;
  
  if (!url || !title || !category) {
    return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
  }

  let browser;
  try {
    // Playwright로 Chromium 실행
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    await page.goto(url, { waitUntil: 'networkidle' });

    // 페이지 HTML 가져오기
    const html = await page.content();
    if (!html) {
      return res.status(500).json({ message: '페이지 내용 로드 실패' });
    }

    // Cheerio로 파싱
    const $ = load(html);
    let contentHtml = '';

    // Brunch 전용 셀렉터 시도
    if (url.includes('brunch.co.kr')) {
      const selectors = [
        '.wrap_article-body',
        '.article_body',
        '.wrap_body',
        '.wrap_article',
        '#contentArticle',
        '.article_view',
        '.content_wrap'
      ];
      for (const sel of selectors) {
        const found = $(sel).html();
        if (found) {
          contentHtml = found;
          break;
        }
      }
      if (!contentHtml) contentHtml = $('article').html() || '';
    } else {
      // 사용자 지정 셀렉터 또는 기본 article
      contentHtml = selector ? $(selector).html() : $('article').html() || '';
    }

    if (!contentHtml) {
      return res.status(400).json({ message: '콘텐츠를 찾을 수 없습니다. 다른 셀렉터를 시도해보세요.' });
    }

    // HTML -> Markdown 변환
    const markdown = convertHtmlToMarkdown(contentHtml);
    
    // 이미지 URL 추출
    const images = [];
    
    // Playwright를 사용하여 이미지 URL 추출
    const imgUrls = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map(img => {
        return img.src || img.getAttribute('data-src') || img.getAttribute('content') || img.getAttribute('data-url');
      }).filter(src => src);
    });
    
    // 이미지 URL 처리
    for (let imgSrc of imgUrls) {
      // 상대 경로인 경우 절대 경로로 변환
      if (imgSrc.startsWith('/')) {
        imgSrc = new URL(imgSrc, url).href;
      }
      // 프로토콜이 없는 경우 https 추가
      if (imgSrc.startsWith('//')) {
        imgSrc = 'https:' + imgSrc;
      }
      images.push(imgSrc);
    }
    
    // 현재 날짜 생성
    const today = new Date().toISOString().split('T')[0];
    
    // 데이터베이스에 저장
    const result = await query(`
      INSERT INTO posts (title, excerpt, content, date, category, source, thumbnail)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      extractExcerpt(markdown, 150),
      markdown,
      today,
      category,
      url,
      images.length > 0 ? images[0] : null
    ]);
    
    const postId = result.insertId;
    
    // 이미지 정보 저장
    for (const imageUrl of images) {
      await query(`
        INSERT INTO images (post_id, url, local_path)
        VALUES (?, ?, ?)
      `, [
        postId,
        imageUrl,
        `/images/blog/${postId}/${imageUrl.split('/').pop()}`
      ]);
    }
    
    return res.status(200).json({ 
      id: postId,
      message: '포스트가 성공적으로 저장되었습니다.' 
    });

  } catch (error) {
    console.error('크롤링 오류:', error);
    return res.status(500).json({ 
      message: '포스트 저장 중 오류가 발생했습니다: ' + error.message,
      error: error.toString(),
      stack: error.stack
    });
  } finally {
    if (browser) await browser.close();
  }
}

// 간단 HTML -> Markdown 변환
function convertHtmlToMarkdown(html) {
  if (!html) return '';
  let md = html;
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  md = md.replace(/<a[^>]*href="(.*?)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  md = md.replace(/<img[^>]*src="(.*?)"[^>]*alt="(.*?)"[^>]*>/gi, '![$2]($1)');
  md = md.replace(/<img[^>]*src="(.*?)"[^>]*>/gi, '![]($1)');
  md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, '$1\n');
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\n\n');
  md = md.replace(/<[^>]+>/g, '');
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&quot;/g, '"');
  return md.trim();
}

// 발췌문 추출 함수
function extractExcerpt(text, maxLength) {
  // 마크다운 문법 제거
  const plainText = text
    .replace(/#+\s+/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/```[^`]*```/g, '')
    .replace(/`[^`]*`/g, '');
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  return plainText.substring(0, maxLength) + '...';
}
