// pages/golf/index.js

import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import Navbar from '../../components/Navbar';

export default function GolfHome() {
  // 골프 메뉴 리스트
  const golfMenus = [
    { name: 'Courses', path: '/golf/courses', icon: '🏌️‍♂️' },
    { name: 'Round Record', path: '/golf/rounds', icon: '📝' },
    { name: 'Team-User', path: '/golf/teams', icon: '👥' },
    { name: 'Team-Match', path: '/golf/teams/matches', icon: '🏆' },
    { name: 'Settings', path: '/golf/settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Golf Score | Sveltt</title>
        <meta name="description" content="Sveltt" />
      </Head>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* 메뉴 리스트 */}
        <div className="grid grid-cols-5 md:grid-cols-5 lg:grid-cols-5 gap-1 mb-9">
          {golfMenus.map((menu, index) => (
            <Link href={menu.path} key={index}>
            <div className="bg-gray-800 rounded-lg shadow-md p-2 hover:bg-gray-700 transition-colors duration-300 text-center cursor-pointer border border-gray-700">
                <div className="flex items-center">
                    {/* 모바일에서는 아이콘만, PC에서는 아이콘과 텍스트 */}
                    <span className="text-xl md:ml-1 sm:text-2xl mx-auto md:mx-0">{menu.icon}</span>
                    <h2 className="text-lg font-semibold text-gray-800 flex-1 text-center hidden md:block text-green-400">{menu.name}</h2>                
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 헤더 섹션 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-green-400 mb-4 font-ubuntu-mono">Score Management</h1>
          <p className="text-xl text-gray-300">
            Personal golf scores & Team scores
          </p>
        </div>

        {/* 골프 이미지 섹션 */}
        <div className="relative h-80 w-full mb-12 rounded-xl overflow-hidden shadow-lg border border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/50 to-blue-500/50 z-10"></div>
          <div className="relative z-20 h-full flex flex-col justify-center items-center text-white p-6">
            <h2 className="text-3xl font-bold mb-4 font-ubuntu-mono">나만의 골프 여정을 기록하세요</h2>
            <p className="text-xl max-w-2xl text-center">
              코스별 스코어 기록부터 팀 경기 관리까지, 모든 골프 활동을 한 곳에서 관리하세요
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
            <p>아직 기록된 라운드가 없습니다.</p>
            <Link href="/golf/rounds/new">
              <button className="mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300">
                새 라운드 기록하기
              </button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-gray-300 py-3 border-t border-gray-700">
        <div className="container mx-auto px-4 text-center">
          <p> 2025 Sveltt Golf Score</p>
        </div>
      </footer>
    </div>
  );
}