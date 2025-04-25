// pages/index.js

import Head from 'next/head';
import Navbar from '../components/Navbar';
import ServiceCard from '../components/ServiceCard';
import { useState } from 'react';
import DockerConfigModal from '../components/DockerConfigModal';

// 서비스 데이터 (실제 환경에 맞게 수정 필요)
const services = [
  {
    id: 1,
    name: 'NginxPM',
    description: 'Nginx Proxy Manager',
    url: 'http://npm.akke.shop',
    icon: '🌐',
    dockerConfig: `version: '3'
services:
  nginx-proxy-manager:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt`
  },
  {
    id: 2,
    name: 'Trilium',
    description: '노트 관리 시스템',
    url: 'http://note.akke.shop',
    icon: '📝',
    dockerConfig: `version: '3'
services:
  trilium:
    image: 'zadam/trilium:latest'
    restart: unless-stopped
    ports:
      - '8080:8080'
    volumes:
      - ./trilium-data:/home/node/trilium-data`
  },
  {
    id: 3,
    name: 'Portainer',
    description: 'Docker 관리 도구',
    url: 'http://port.akke.shop',
    icon: '🐳',
    dockerConfig: `version: '3'
services:
  portainer:
    image: 'portainer/portainer-ce:latest'
    restart: unless-stopped
    ports:
      - '9000:9000'
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./portainer_data:/data`
  },
  {
    id: 4,
    name: 'Komga',
    description: '디지털 도서관 관리',
    url: 'http://toon.akke.shop',
    icon: '📚',
    dockerConfig: `version: '3'
services:
  komga:
    image: 'gotson/komga:latest'
    restart: unless-stopped
    ports:
      - '8080:8080'
    volumes:
      - ./config:/config
      - ./books:/books`
  },
  {
    id: 5,
    name: 'Emby',
    description: '미디어 서버',
    url: 'http://mov.akke.shop',
    icon: '🎬',
    dockerConfig: `version: '3'
services:
  emby:
    image: 'emby/embyserver:latest'
    restart: unless-stopped
    ports:
      - '8096:8096'
    volumes:
      - ./config:/config
      - ./media:/media`
  },
  {
    id: 6,
    name: 'NocoDB',
    description: '데이터베이스 관리',
    url: 'http://db.akke.shop',
    icon: '📊',
    dockerConfig: `version: '3'
services:
  nocodb:
    image: 'nocodb/nocodb:latest'
    restart: unless-stopped
    ports:
      - '8080:8080'
    volumes:
      - ./data:/usr/app/data`
  },
  {
    id: 7,
    name: 'PhotoPrism',
    description: '사진 관리 및 갤러리',
    url: 'http://photo.akke.shop',
    icon: '📷',
    dockerConfig: `version: '3'
services:
  photoprism:
    image: 'photoprism/photoprism:latest'
    restart: unless-stopped
    ports:
      - '2342:2342'
    volumes:
      - ./storage:/photoprism/storage
      - ./photos:/photoprism/originals`
  },
  {
    id: 8,
    name: 'SFTPgo',
    description: 'SFTP 서버',
    url: 'http://file.akke.shop',
    icon: '📁',
    dockerConfig: `version: '3'
services:
  sftpgo:
    image: 'drakkan/sftpgo:latest'
    restart: unless-stopped
    ports:
      - '8080:8080'
      - '2022:2022'
    volumes:
      - ./data:/srv/sftpgo/data`
  }
];

export default function Home() {
  const [selectedConfig, setSelectedConfig] = useState(null);
  
  const openModal = (config) => {
    setSelectedConfig(config);
  };
  
  const closeModal = () => {
    setSelectedConfig(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Sveltt's </title>
        <meta name="description" content="Sveltt Personal WebApp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-green-400 mb-4 font-ubuntu-mono">
            Sveltt's SS
          </h1>
          <p className="text-xl text-gray-300 font-ubuntu-mono"> 
            Linux - Docker service
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map((service) => (
            <ServiceCard 
              key={service.id}
              service={service}
              onConfigClick={() => openModal(service.dockerConfig)}
            />
          ))}
        </div>
      </main>

      {selectedConfig && (
        <DockerConfigModal 
          config={selectedConfig} 
          onClose={closeModal} 
        />
      )}
    </div>
  );
}