// pages/500.js
import Link from 'next/link'
import Head from 'next/head'

export default function Custom500() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <Head>
        <title>500 - 서버 오류</title>
      </Head>
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">500</h1>
        <p className="text-xl mb-8">서버 오류가 발생했습니다</p>
        <Link href="/">
          <span className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors cursor-pointer">
            홈으로 돌아가기
          </span>
        </Link>
      </div>
    </div>
  )
}
