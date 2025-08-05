// pages/api/system/status.js

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 시스템 상태 정보를 반환하는 API
 * CPU, 메모리, 디스크 사용량, 시스템 가동시간 등을 제공
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [cpuInfo, memoryInfo, diskInfo, uptimeInfo] = await Promise.all([
      getCpuUsage(),
      getMemoryUsage(),
      getDiskUsage(),
      getUptime()
    ]);

    const systemStatus = {
      timestamp: new Date().toISOString(),
      cpu: cpuInfo,
      memory: memoryInfo,
      disk: diskInfo,
      uptime: uptimeInfo,
      status: 'online'
    };

    res.status(200).json(systemStatus);
  } catch (error) {
    console.error('System status API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system status',
      details: error.message 
    });
  }
}

/**
 * CPU 사용률 정보 조회
 */
async function getCpuUsage() {
  try {
    // Linux에서 CPU 사용률 계산 (1초 간격으로 측정)
    const { stdout } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
    const usage = parseFloat(stdout.trim()) || 0;
    
    // CPU 정보 조회
    const { stdout: cpuInfo } = await execAsync("lscpu | grep 'Model name' | cut -d':' -f2 | xargs");
    const model = cpuInfo.trim() || 'Unknown';
    
    // CPU 코어 수 조회
    const { stdout: coreCount } = await execAsync("nproc");
    const cores = parseInt(coreCount.trim()) || 1;

    return {
      usage: Math.round(usage * 100) / 100,
      model: model,
      cores: cores,
      status: usage > 80 ? 'high' : usage > 50 ? 'medium' : 'low'
    };
  } catch (error) {
    console.error('CPU usage error:', error);
    return {
      usage: 0,
      model: 'Unknown',
      cores: 1,
      status: 'unknown',
      error: error.message
    };
  }
}

/**
 * 메모리 사용량 정보 조회
 */
async function getMemoryUsage() {
  try {
    const { stdout } = await execAsync("free -m | awk 'NR==2{printf \"%.2f %.2f %.2f\", $3*100/$2, $2, $3}'");
    const [usagePercent, total, used] = stdout.trim().split(' ').map(parseFloat);

    return {
      usage: Math.round(usagePercent * 100) / 100,
      total: Math.round(total),
      used: Math.round(used),
      free: Math.round(total - used),
      unit: 'MB',
      status: usagePercent > 80 ? 'high' : usagePercent > 60 ? 'medium' : 'low'
    };
  } catch (error) {
    console.error('Memory usage error:', error);
    return {
      usage: 0,
      total: 0,
      used: 0,
      free: 0,
      unit: 'MB',
      status: 'unknown',
      error: error.message
    };
  }
}

/**
 * 디스크 사용량 정보 조회
 */
async function getDiskUsage() {
  try {
    const { stdout } = await execAsync("df -h / | awk 'NR==2{printf \"%.2f %s %s %s\", $5+0, $2, $3, $4}'");
    const [usagePercent, total, used, available] = stdout.trim().split(' ');

    return {
      usage: parseFloat(usagePercent),
      total: total,
      used: used,
      available: available,
      status: parseFloat(usagePercent) > 80 ? 'high' : parseFloat(usagePercent) > 60 ? 'medium' : 'low'
    };
  } catch (error) {
    console.error('Disk usage error:', error);
    return {
      usage: 0,
      total: '0G',
      used: '0G',
      available: '0G',
      status: 'unknown',
      error: error.message
    };
  }
}

/**
 * 시스템 가동시간 조회
 */
async function getUptime() {
  try {
    const { stdout } = await execAsync("uptime -p");
    const uptimeText = stdout.trim().replace('up ', '');
    
    // 부팅 시간 조회
    const { stdout: bootTime } = await execAsync("uptime -s");
    const bootTimestamp = bootTime.trim();

    return {
      formatted: uptimeText,
      bootTime: bootTimestamp,
      status: 'running'
    };
  } catch (error) {
    console.error('Uptime error:', error);
    return {
      formatted: 'Unknown',
      bootTime: 'Unknown',
      status: 'unknown',
      error: error.message
    };
  }
}