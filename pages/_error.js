// pages/_error.js
import React from 'react'

function Error({ statusCode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          {statusCode
            ? `${statusCode} - 서버 오류가 발생했습니다`
            : '클라이언트 오류가 발생했습니다'}
        </h1>
        <p className="mb-6">페이지를 불러오는 중 문제가 발생했습니다.</p>
        <a
          href="/"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
