// pages/golf/index.js

import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import Navbar from '../../components/Navbar';

export default function GolfHome() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Golf Score | Sveltt</title>
        <meta name="description" content="Sveltt" />
      </Head>

      <Navbar />

      <main className="container mx-auto px-4 py-8">


        {/* 골프 이미지 섹션 */}
        <div className="relative h-80 w-full mb-12 rounded-xl overflow-hidden shadow-lg border border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/50 to-blue-500/50 z-10"></div>
          <div className="relative z-20 h-full flex flex-col justify-center items-center text-white p-6">
            <h2 className="text-3xl font-bold mb-4 font-ubuntu-mono">golf scores & Team scores</h2>
            <p className="text-xl max-w-2xl text-center">
              Personal golf scores & Team Up and Down Score
            </p>
          </div>
          {/* 배경 이미지 - 실제 이미지 경로로 변경 필요 */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/golf_logo.webp"
              alt="골프 코스"
              layout="fill"
              objectFit="cover"
              priority
            />
          </div>
        </div>

        {/* 최근 라운드 기록 섹션 */}
        <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-green-400 mb-6 font-ubuntu-mono">최근 라운드 기록</h2>
          <div className="text-gray-300 text-center py-8">
            <p>No Records</p>
            <Link href="/golf/rounds/new">
              <button className="mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300">
                Write New Round
              </button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-gray-300 py-3 border-t border-gray-700">
        <div className="container mx-auto px-4 text-center">
          <p> 2025-05-01</p>
        </div>
      </footer>
    </div>
  );
}