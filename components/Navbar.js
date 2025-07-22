// components/Navbar.js

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

export default function Navbar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGolfSubmenuOpen, setIsGolfSubmenuOpen] = useState(false);
  const golfSubmenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // 골프 하위 메뉴 항목
  const golfSubmenus = [
    { name: 'Courses', path: '/golf/courses', icon: '🏌️‍♂️' },
    { name: 'Round Record', path: '/golf/rounds', icon: '📝' },    
    { name: 'Team-Match', path: '/golf/team-matches', icon: '🏆' },
    { name: 'User', path: '/golf/users/users', icon: '👥' },
    { name: 'Team', path: '/golf/teams', icon: '👫' },
    { name: 'Settings', path: '/golf/settings', icon: '⚙️' },
  ];


  
  // 메뉴 토글
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // 골프 서브메뉴 토글
  const toggleGolfSubmenu = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsGolfSubmenuOpen(prev => !prev);
  };
  
  // 모바일에서 메뉴 닫기
  const handleMobileMenuClose = useCallback(() => {
    setIsMenuOpen(false);
    setIsGolfSubmenuOpen(false);
  }, [setIsMenuOpen, setIsGolfSubmenuOpen]);

  // 외부 클릭 시 서브메뉴와 모바일 메뉴 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      // 데스크톱 골프 서브메뉴: 모바일 메뉴가 닫혀 있을 때만 외부 클릭으로 닫기
      if (!isMenuOpen && golfSubmenuRef.current && !golfSubmenuRef.current.contains(event.target)) {
        setIsGolfSubmenuOpen(false);
      }
      
      // 모바일 메뉴 전체: 모바일 메뉴가 열려 있고, 클릭이 메뉴 외부이면서 토글 버튼이 아니고, 골프 하위 메뉴 링크도 아닐 때 닫기
      if (isMenuOpen && mobileMenuRef.current && 
          !mobileMenuRef.current.contains(event.target) && 
          !event.target.closest('button[aria-label="toggle-menu"]') &&
          !event.target.closest('.golf-submenu-link')) { 
        handleMobileMenuClose(); // 전체 모바일 메뉴 및 골프 서브메뉴 닫기
      }
    }
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen, golfSubmenuRef, mobileMenuRef, handleMobileMenuClose, setIsGolfSubmenuOpen]);

  // 페이지 변경 시 모바일 메뉴 닫기
  useEffect(() => {
    const handleRouteChange = () => {
      handleMobileMenuClose();
    };
    
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, handleMobileMenuClose]);

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
              <Link href="/music" className="text-gray-300 hover:text-green-400 px-3 py-2 rounded-md font-medium font-ubuntu-mono">
                Music
              </Link>
              <div className="relative" ref={golfSubmenuRef}>
                <button 
                  onClick={toggleGolfSubmenu}
                  className="text-gray-300 hover:text-green-400 px-3 py-2 rounded-md font-medium font-ubuntu-mono flex items-center"
                >
                  Golf
                  <svg 
                    className={`ml-1 h-4 w-4 transition-transform ${isGolfSubmenuOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* 골프 하위 메뉴 */}
                {isGolfSubmenuOpen && (
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <Link href="/golf" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-green-400 font-ubuntu-mono">
                        Golf Home
                      </Link>
                      {golfSubmenus.map((submenu, index) => (
                        <Link href={submenu.path} key={index} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-green-400 font-ubuntu-mono">
                          <span className="mr-2">{submenu.icon}</span>
                          {submenu.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              aria-label="toggle-menu"
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
        <div className="md:hidden" ref={mobileMenuRef}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/"
              className="text-white hover:text-green-400 block px-3 py-2 rounded-md font-medium font-ubuntu-mono">
              Home
            </Link>
            
            <Link href="/blog"
              className="text-gray-300 hover:text-green-400 block px-3 py-2 rounded-md font-medium font-ubuntu-mono">
              Blog
            </Link>
            
            <Link href="/music"
              className="text-gray-300 hover:text-green-400 block px-3 py-2 rounded-md font-medium font-ubuntu-mono">
              Music
            </Link>
            
            {/* 모바일 골프 메뉴 */}
            <div>
              <button 
                onClick={toggleGolfSubmenu}
                className="w-full text-left text-gray-300 hover:text-green-400 flex items-center justify-between px-3 py-2 rounded-md font-medium font-ubuntu-mono"
              >
                <span>Golf</span>
                <svg 
                  className={`ml-1 h-4 w-4 transition-transform ${isGolfSubmenuOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* 모바일 골프 하위 메뉴 */}
              {isGolfSubmenuOpen && (
                <div className="pl-4 mt-1 space-y-1 border-l-2 border-gray-700">
                  <Link href="/golf"
                    className="block px-3 py-2 text-sm text-gray-400 hover:text-green-400 rounded-md golf-submenu-link"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}>
                    Golf Home
                  </Link>
                  
                  {golfSubmenus.map((submenu, index) => (
                    <Link key={index} href={submenu.path}
                      className="block px-3 py-2 text-sm text-gray-400 hover:text-green-400 rounded-md golf-submenu-link"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}>
                      <span className="mr-2">{submenu.icon}</span>
                      {submenu.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}