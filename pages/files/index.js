// pages/files/index.js
import { useState } from 'react';
import Head from 'next/head';
import Navbar from '../../components/Navbar';
import FileManager from '../../components/FileManager/FileManager';
import FileAuthGuard from '../../components/FileAuthGuard';

export default function FilesPage() {
  return (
    <>
      <Head>
        <title>Files - File Manager</title>
        <meta name="description" content="Web-based file manager for server files" />
      </Head>
      
      <FileAuthGuard>
        <div className="min-h-screen bg-gray-900 text-white">
          <Navbar />
          <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-green-400 font-ubuntu-mono">
                🔒 Secured File Manager
              </h1>
              <p className="text-gray-300 mt-2">
                Manage your server files with a web-based interface
              </p>
              <div className="mt-2 text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-600 rounded px-3 py-2 inline-flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM11 5V3a2 2 0 014 0v2M7 7h10" />
                </svg>
                보안 인증된 접근 - 민감한 시스템 파일에 접근할 수 있습니다
              </div>
            </div>
            
            <FileManager />
          </div>
        </div>
      </FileAuthGuard>
    </>
  );
}