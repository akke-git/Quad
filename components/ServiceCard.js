// components/ServiceCard.js

import Link from 'next/link';

export default function ServiceCard({ service, onConfigClick }) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:transform hover:scale-105 border border-gray-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          {/* <div className="text-3xl">{service.icon}</div> */}
          <div className='w-16 h-16'>
          <Link 
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
          >
          <img
              src={service.icon}
              alt={`${service.name} icon`}
              className="w-full h-full object-contain"
            />
          </Link>
          </div>
          <button
            onClick={() => onConfigClick()}
            className="p-2 text-gray-400 hover:text-green-400 transition-colors"
            title="Docker-compose"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <h3 className="text-xl font-bold text-white mb-2 font-ubuntu-mono">{service.name}</h3>
        <p className="text-gray-300 mb-4 font-ubuntu-mono">{service.description}</p>
        {/* <Link 
          href={service.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors duration-300 font-ubuntu-mono"
        >
          Open
        </Link> */}
      </div>
    </div>
  );
}