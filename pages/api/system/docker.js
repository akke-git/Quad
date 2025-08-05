// pages/api/system/docker.js

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Docker 컨테이너 상태 정보를 반환하는 API
 * 실행 중인 컨테이너, 이미지, 볼륨 정보 등을 제공
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [containerInfo, imageInfo, volumeInfo, networkInfo] = await Promise.all([
      getContainerStatus(),
      getImageInfo(),
      getVolumeInfo(),
      getNetworkInfo()
    ]);

    const dockerStatus = {
      timestamp: new Date().toISOString(),
      containers: containerInfo,
      images: imageInfo,
      volumes: volumeInfo,
      networks: networkInfo,
      status: 'connected'
    };

    res.status(200).json(dockerStatus);
  } catch (error) {
    console.error('Docker status API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Docker status',
      details: error.message,
      status: 'disconnected'
    });
  }
}

/**
 * Docker 컨테이너 상태 정보 조회
 */
async function getContainerStatus() {
  try {
    // 실행 중인 컨테이너 수
    const { stdout: runningCount } = await execAsync("docker ps --format 'table {{.Names}}' | wc -l");
    const running = Math.max(0, parseInt(runningCount.trim()) - 1); // 헤더 라인 제외

    // 전체 컨테이너 수 (중지된 것 포함)
    const { stdout: totalCount } = await execAsync("docker ps -a --format 'table {{.Names}}' | wc -l");
    const total = Math.max(0, parseInt(totalCount.trim()) - 1); // 헤더 라인 제외

    // 컨테이너 상세 정보
    const { stdout: containerList } = await execAsync("docker ps --format 'json' 2>/dev/null || echo ''");
    let containers = [];
    
    if (containerList.trim()) {
      const lines = containerList.trim().split('\n');
      containers = lines.map(line => {
        try {
          const container = JSON.parse(line);
          return {
            name: container.Names,
            image: container.Image,
            status: container.Status,
            ports: container.Ports || '',
            created: container.CreatedAt
          };
        } catch (e) {
          return null;
        }
      }).filter(Boolean);
    }

    return {
      running: running,
      total: total,
      stopped: total - running,
      containers: containers,
      status: running > 0 ? 'active' : 'inactive'
    };
  } catch (error) {
    console.error('Container status error:', error);
    return {
      running: 0,
      total: 0,
      stopped: 0,
      containers: [],
      status: 'unknown',
      error: error.message
    };
  }
}

/**
 * Docker 이미지 정보 조회
 */
async function getImageInfo() {
  try {
    const { stdout: imageCount } = await execAsync("docker images --format 'table {{.Repository}}' | wc -l");
    const total = Math.max(0, parseInt(imageCount.trim()) - 1); // 헤더 라인 제외

    // 이미지 크기 정보
    const { stdout: sizeInfo } = await execAsync("docker system df --format 'table {{.Type}}\t{{.TotalCount}}\t{{.Size}}' | grep Images | awk '{print $3}' || echo '0B'");
    const totalSize = sizeInfo.trim() || '0B';

    // 댕글링 이미지 (사용되지 않는 이미지) 수
    const { stdout: danglingCount } = await execAsync("docker images -f 'dangling=true' --format 'table {{.Repository}}' | wc -l");
    const dangling = Math.max(0, parseInt(danglingCount.trim()) - 1);

    return {
      total: total,
      dangling: dangling,
      totalSize: totalSize,
      status: total > 0 ? 'available' : 'empty'
    };
  } catch (error) {
    console.error('Image info error:', error);
    return {
      total: 0,
      dangling: 0,
      totalSize: '0B',
      status: 'unknown',
      error: error.message
    };
  }
}

/**
 * Docker 볼륨 정보 조회
 */
async function getVolumeInfo() {
  try {
    const { stdout: volumeCount } = await execAsync("docker volume ls --format 'table {{.Name}}' | wc -l");
    const total = Math.max(0, parseInt(volumeCount.trim()) - 1); // 헤더 라인 제외

    // 볼륨 크기 정보
    const { stdout: sizeInfo } = await execAsync("docker system df --format 'table {{.Type}}\t{{.TotalCount}}\t{{.Size}}' | grep Volumes | awk '{print $3}' || echo '0B'");
    const totalSize = sizeInfo.trim() || '0B';

    return {
      total: total,
      totalSize: totalSize,
      status: total > 0 ? 'available' : 'empty'
    };
  } catch (error) {
    console.error('Volume info error:', error);
    return {
      total: 0,
      totalSize: '0B',
      status: 'unknown',
      error: error.message
    };
  }
}

/**
 * Docker 네트워크 정보 조회
 */
async function getNetworkInfo() {
  try {
    const { stdout: networkCount } = await execAsync("docker network ls --format 'table {{.Name}}' | wc -l");
    const total = Math.max(0, parseInt(networkCount.trim()) - 1); // 헤더 라인 제외

    // 네트워크 목록 (기본 네트워크 제외한 사용자 정의 네트워크)
    const { stdout: customNetworks } = await execAsync("docker network ls --filter type=custom --format '{{.Name}}' || echo ''");
    const custom = customNetworks.trim() ? customNetworks.trim().split('\n').length : 0;

    return {
      total: total,
      custom: custom,
      default: total - custom,
      status: total > 0 ? 'available' : 'empty'
    };
  } catch (error) {
    console.error('Network info error:', error);
    return {
      total: 0,
      custom: 0,
      default: 0,
      status: 'unknown',
      error: error.message
    };
  }
}