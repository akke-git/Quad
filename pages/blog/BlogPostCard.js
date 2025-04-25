// components/BlogPostCard.js

import Link from 'next/link';
import Image from 'next/image';

export default function BlogPostCard({ post }) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:transform hover:scale-105 border border-gray-700 h-full flex flex-col">
      <div className="relative h-48 w-full">
        {post.thumbnail ? (
          <Image
            src={post.thumbnail}
            alt={post.title}
            layout="fill"
            objectFit="cover"
            className="transition-opacity duration-300"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEDQIHq4C7oQAAAABJRU5ErkJggg=="
          />
        ) : (
          <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-green-400 bg-green-900 bg-opacity-30 px-2 py-1 rounded font-nanum-gothic">
              {post.category}
            </span>
            <span className="text-xs text-gray-400 font-ubuntu-mono">
              {post.date}
            </span>
          </div>
          
          <h3 className="text-lg font-bold text-white mb-2 font-ubuntu-mono">
            <Link href={`/blog/${post.id}`} className="hover:text-green-400 transition-colors duration-300">
              {post.title}
            </Link>
          </h3>
          
          <p className="text-gray-300 text-sm mb-4 line-clamp-3 font-nanum-gothic">
            {post.excerpt}
          </p>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <Link 
            href={`/blog/${post.id}`}
            className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors duration-300 font-nanum-gothic"
          >
            자세히 보기 &rarr;
          </Link>
          
          {post.source && (
            <a 
              href={post.source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-300 transition-colors duration-300 font-nanum-gothic"
            >
              출처
            </a>
          )}
        </div>
      </div>
    </div>
  );
}