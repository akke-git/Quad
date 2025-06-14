// pages/api/blog/preview.js
import axios from 'axios';
import { load } from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { url, selector } = req.body;
  if (!url) {
    return res.status(400).json({ message: 'URL을 입력해주세요.' });
  }

  try {
    // axios로 페이지 내용 가져오기
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });
    
    // 페이지 HTML 가져오기
    const html = response.data;
    if (!html) {
      return res.status(500).json({ message: '페이지 내용 로드 실패' });
    }
    
    // Cheerio로 파싱
    const $ = load(html);
    const title = $('title').text() || '제목 없음';
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
    return res.status(200).json({ title, content: markdown });

  } catch (error) {
    console.error('크롤링 오류:', error);
    return res.status(500).json({ message: `크롤링 중 오류 발생: ${error.message}` });
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
