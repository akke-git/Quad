// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        {/* Ubuntu Mono 폰트 */}
        <link
          href="https://fonts.googleapis.com/css2?family=Ubuntu+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        {/* Noto Sans KR 폰트 (Apple SD Gothic Neo 대체) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        {/* GitHub Markdown CSS */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
