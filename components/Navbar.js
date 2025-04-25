// components/Navbar.js

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-green-400 font-bold text-xl font-ubuntu-mono">
              Sveltt
            </Link>
          </div>
          
          {/* 데스크톱 메뉴 */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/" className="text-white hover:text-green-400 px-3 py-2 rounded-md font-medium font-ubuntu-mono">
                Home
              </Link>
              <Link href="/blog" className="text-gray-300 hover:text-green-400 px-3 py-2 rounded-md font-medium font-ubuntu-mono">
                Blog
              </Link>
              <Link href="/golf" className="text-gray-300 hover:text-green-400 px-3 py-2 rounded-md font-medium font-ubuntu-mono">
                Golf Score
              </Link>
            </div>
          </div>
          
          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-400 hover:text-white focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* 모바일 메뉴 */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className="text-white hover:text-green-400 block px-3 py-2 rounded-md font-medium font-nanum-gothic">
              Home
            </Link>
            <Link href="/blog" className="text-gray-300 hover:text-green-400 block px-3 py-2 rounded-md font-medium font-nanum-gothic">
              Blog
            </Link>
            <Link href="/golf" className="text-gray-300 hover:text-green-400 block px-3 py-2 rounded-md font-medium font-nanum-gothic">
              Golf Score
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}