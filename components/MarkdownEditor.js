// components/MarkdownEditor.js
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import axios from 'axios';

export default function MarkdownEditor({ value, onChange, height = '400px' }) {
  const [content, setContent] = useState(value || '');
  const [preview, setPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    setContent(value || '');
  }, [value]);
  
  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (onChange) {
      onChange(newContent);
    }
  };
  
  const handleTab = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      
      // 탭 삽입
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);
      if (onChange) {
        onChange(newContent);
      }
      
      // 커서 위치 조정
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };
  
  const insertText = (before, after = '') => {
    const textarea = document.getElementById('markdown-editor');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = 
      content.substring(0, start) + 
      before + 
      selectedText + 
      after + 
      content.substring(end);
    
    setContent(newContent);
    if (onChange) {
      onChange(newContent);
    }
    
    // 커서 위치 조정
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.selectionStart = textarea.selectionEnd = newCursorPos;
    }, 0);
  };
  
  const handleImageUpload = async () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const uploadImage = async (file) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    setIsUploading(true);
    
    try {
      const response = await axios.post('/api/blog/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const imageUrl = response.data.url;
      const imageMarkdown = `![${file.name}](${imageUrl})`;
      
      insertText(imageMarkdown);
    } catch (error) {
      console.error('이미지 업로드 중 오류 발생:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadImage(file);
    }
    // 같은 파일 다시 선택할 수 있도록 초기화
    e.target.value = '';
  };
  
  return (
    <div className="markdown-editor-container">
      <div className="bg-gray-800 border border-gray-700 rounded-t-lg">
        <div className="flex items-center justify-between p-2 border-b border-gray-700">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => insertText('# ')}
              className="p-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded"
              title="제목 1"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => insertText('## ')}
              className="p-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded"
              title="제목 2"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => insertText('### ')}
              className="p-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded"
              title="제목 3"
            >
              H3
            </button>
            <span className="border-r border-gray-600 h-6 mx-1"></span>
            <button
              type="button"
              onClick={() => insertText('**', '**')}
              className="p-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded font-bold"
              title="굵게"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => insertText('*', '*')}
              className="p-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded italic"
              title="기울임"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => insertText('~~', '~~')}
              className="p-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded line-through"
              title="취소선"
            >
              S
            </button>
            <span className="border-r border-gray-600 h-6 mx-1"></span>
            <button
              type="button"
              onClick={() => insertText('[', '](url)')}
              className="p-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded"
              title="링크"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleImageUpload}
              className="p-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded"
              title="이미지"
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => insertText('```\n', '\n```')}
              className="p-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded"
              title="코드 블록"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => insertText('- ')}
              className="p-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded"
              title="목록"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className={`px-3 py-1 rounded text-sm ${preview ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            {preview ? '에디터' : '미리보기'}
          </button>
        </div>
      </div>
      
      {preview ? (
        <div 
          className="prose prose-invert prose-sm max-w-none p-4 bg-gray-800 border border-t-0 border-gray-700 rounded-b-lg overflow-auto"
          style={{ height, minHeight: '200px' }}
        >
          <ReactMarkdown 
            rehypePlugins={[rehypeRaw, rehypeHighlight]} 
            remarkPlugins={[remarkGfm]}
          >
            {content}
          </ReactMarkdown>
        </div>
      ) : (
        <textarea
          id="markdown-editor"
          value={content}
          onChange={handleChange}
          onKeyDown={handleTab}
          className="w-full p-4 bg-gray-800 border border-t-0 border-gray-700 rounded-b-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
          style={{ height, minHeight: '200px', resize: 'vertical' }}
          placeholder="Markdown 형식으로 내용을 입력하세요..."
        />
      )}
    </div>
  );
}
