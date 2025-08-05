// pages/api/system/network.js

import { exec } from 'child_process';
import { promisify } from 'util';
import https from 'https';
import http from 'http';

const execAsync = promisify(exec);

/**
 * 네트워크 상태 정보를 반환하는 API
 * 도메인 상태, DNS 해석, 연결성 체크, Nginx 프록시 상태 등을 제공
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [domainStatus, nginxStatus, networkStats, cloudflareStatus] = await Promise.all([
      checkDomainStatus(),
      checkNginxProxyStatus(),
      getNetworkStats(),
      checkCloudflareStatus()
    ]);

    const networkStatus = {
      timestamp: new Date().toISOString(),
      domains: domainStatus,
      nginx: nginxStatus,
      network: networkStats,
      cloudflare: cloudflareStatus,
      status: 'online'
    };

    res.status(200).json(networkStatus);
  } catch (error) {
    console.error('Network status API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch network status',
      details: error.message 
    });
  }
}

/**
 * 도메인 상태 체크
 */
async function checkDomainStatus() {
  const domains = [
    { name: 'juux.net', url: 'https://juux.net', type: 'main' },
    { name: 'note.juux.net', url: 'https://note.juux.net', type: 'service' },
    { name: 'photo.juux.net', url: 'https://photo.juux.net', type: 'service' },
    { name: 'toon.juux.net', url: 'https://toon.juux.net', type: 'service' },
    { name: 'mov.juux.net', url: 'https://mov.juux.net', type: 'service' },
    { name: 'db.juux.net', url: 'https://db.juux.net', type: 'service' },
    { name: 'port.juux.net', url: 'https://port.juux.net', type: 'service' },
    { name: 'file.juux.net', url: 'https://file.juux.net', type: 'service' },
    { name: 'npm.juux.net', url: 'https://npm.juux.net', type: 'admin' }
  ];

  const results = await Promise.allSettled(
    domains.map(async (domain) => {
      try {
        const status = await checkDomainHealth(domain.url);
        return {
          ...domain,
          status: status.online ? 'online' : 'offline',
          responseTime: status.responseTime,
          statusCode: status.statusCode,
          ssl: status.ssl,
          lastChecked: new Date().toISOString()
        };
      } catch (error) {
        return {
          ...domain,
          status: 'error',
          responseTime: null,
          statusCode: null,
          ssl: false,
          error: error.message,
          lastChecked: new Date().toISOString()
        };
      }
    })
  );

  return results.map((result, index) => 
    result.status === 'fulfilled' ? result.value : {
      ...domains[index],
      status: 'error',
      error: result.reason?.message || 'Unknown error'
    }
  );
}

/**
 * 개별 도메인 건강성 체크
 */
function checkDomainHealth(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.get(url, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Juux-Monitor/1.0'
      }
    }, (res) => {
      const responseTime = Date.now() - startTime;
      
      resolve({
        online: res.statusCode < 400,
        responseTime: responseTime,
        statusCode: res.statusCode,
        ssl: isHttps && res.socket.authorized !== false
      });
      
      res.on('data', () => {}); // 데이터 소비
      res.on('end', () => {});
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000);
  });
}

/**
 * Nginx 프록시 매니저 상태 체크
 */
async function checkNginxProxyStatus() {
  try {
    // Nginx 프로세스 상태 확인
    const { stdout: nginxProcesses } = await execAsync("ps aux | grep nginx | grep -v grep | wc -l");
    const processCount = parseInt(nginxProcesses.trim()) || 0;

    // Nginx 설정 파일 존재 확인
    let configValid = false;
    try {
      await execAsync("nginx -t 2>/dev/null");
      configValid = true;
    } catch (error) {
      configValid = false;
    }

    // Nginx 포트 80, 443 리스닝 확인
    const { stdout: listeningPorts } = await execAsync("netstat -tlnp 2>/dev/null | grep nginx | awk '{print $4}' | cut -d: -f2 | sort -u || echo ''");
    const ports = listeningPorts.trim().split('\n').filter(Boolean);

    // Docker 컨테이너에서 npm (Nginx Proxy Manager) 확인
    let npmContainer = null;
    try {
      const { stdout: npmInfo } = await execAsync("docker ps --format 'json' | grep npm || echo ''");
      if (npmInfo.trim()) {
        const containerData = JSON.parse(npmInfo.trim());
        npmContainer = {
          name: containerData.Names,
          status: containerData.Status,
          ports: containerData.Ports
        };
      }
    } catch (error) {
      // NPM 컨테이너가 없을 수 있음
    }

    return {
      processCount: processCount,
      configValid: configValid,
      listeningPorts: ports,
      npmContainer: npmContainer,
      status: processCount > 0 && configValid ? 'running' : 'stopped'
    };
  } catch (error) {
    console.error('Nginx status error:', error);
    return {
      processCount: 0,
      configValid: false,
      listeningPorts: [],
      npmContainer: null,
      status: 'unknown',
      error: error.message
    };
  }
}

/**
 * 네트워크 통계 정보
 */
async function getNetworkStats() {
  try {
    // 네트워크 인터페이스 정보
    const { stdout: interfaces } = await execAsync("ip -o link show | awk -F': ' '{print $2}' | grep -v lo");
    const networkInterfaces = interfaces.trim().split('\n').filter(Boolean);

    // 활성 연결 수
    const { stdout: connections } = await execAsync("netstat -tn 2>/dev/null | grep ESTABLISHED | wc -l || echo 0");
    const activeConnections = parseInt(connections.trim()) || 0;

    // 네트워크 트래픽 (RX/TX 바이트)
    let networkTraffic = {};
    try {
      const { stdout: trafficInfo } = await execAsync("cat /proc/net/dev | grep -E '(eth|enp|wlan)' | head -1 | awk '{print $2, $10}'");
      const [rxBytes, txBytes] = trafficInfo.trim().split(' ').map(Number);
      networkTraffic = {
        received: formatBytes(rxBytes || 0),
        transmitted: formatBytes(txBytes || 0)
      };
    } catch (error) {
      networkTraffic = { received: '0 B', transmitted: '0 B' };
    }

    // DNS 해석 테스트
    const dnsTest = await testDNSResolution();

    return {
      interfaces: networkInterfaces,
      activeConnections: activeConnections,
      traffic: networkTraffic,
      dns: dnsTest,
      status: networkInterfaces.length > 0 ? 'connected' : 'disconnected'
    };
  } catch (error) {
    console.error('Network stats error:', error);
    return {
      interfaces: [],
      activeConnections: 0,
      traffic: { received: '0 B', transmitted: '0 B' },
      dns: { status: 'unknown' },
      status: 'unknown',
      error: error.message
    };
  }
}

/**
 * DNS 해석 테스트
 */
async function testDNSResolution() {
  try {
    const { stdout: dnsResult } = await execAsync("nslookup google.com 8.8.8.8 | grep 'Address:' | tail -1 | awk '{print $2}'");
    const resolvedIP = dnsResult.trim();
    
    return {
      status: resolvedIP ? 'working' : 'failed',
      testDomain: 'google.com',
      resolvedIP: resolvedIP || null,
      dnsServer: '8.8.8.8'
    };
  } catch (error) {
    return {
      status: 'failed',
      testDomain: 'google.com',
      resolvedIP: null,
      dnsServer: '8.8.8.8',
      error: error.message
    };
  }
}

/**
 * Cloudflare 상태 체크
 */
async function checkCloudflareStatus() {
  try {
    // Cloudflare API를 통한 상태 체크 (API 키가 있는 경우)
    // 현재는 기본적인 연결성 체크만 수행
    const cloudflareHealth = await checkDomainHealth('https://www.cloudflare.com');
    
    return {
      status: cloudflareHealth.online ? 'connected' : 'disconnected',
      responseTime: cloudflareHealth.responseTime,
      service: 'Cloudflare CDN'
    };
  } catch (error) {
    return {
      status: 'unknown',
      responseTime: null,
      service: 'Cloudflare CDN',
      error: error.message
    };
  }
}

/**
 * 바이트를 읽기 쉬운 형태로 변환
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}