// pages/api/music/job/[jobId].js

import { jobs } from '../download';
import path from 'path';
import fs from 'fs';

// 파일에서 job 상태 읽기
function loadJobFromFile(jobId) {
  try {
    const jobsDir = path.join(process.cwd(), 'temp', 'jobs');
    const jobFile = path.join(jobsDir, `${jobId}.json`);
    if (fs.existsSync(jobFile)) {
      const jobData = JSON.parse(fs.readFileSync(jobFile, 'utf8'));
      console.log(`[Job API] Loaded job ${jobId} from file`);
      return jobData;
    }
  } catch (error) {
    console.error(`[Job API] Failed to load job ${jobId} from file:`, error);
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { jobId } = req.query;

  if (!jobId) {
    return res.status(400).json({ message: 'Job ID is required' });
  }

  try {
    console.log(`[Job API] Looking for job: ${jobId}`);
    console.log(`[Job API] Available jobs in memory:`, Array.from(jobs.keys()));
    
    // 먼저 메모리에서 찾기
    let job = jobs.get(jobId);
    
    // 메모리에 없으면 파일에서 찾기
    if (!job) {
      console.log(`[Job API] Job ${jobId} not found in memory, checking file...`);
      job = loadJobFromFile(jobId);
      
      // 파일에서 찾았으면 메모리에도 저장
      if (job) {
        jobs.set(jobId, job);
        console.log(`[Job API] Job ${jobId} loaded from file and cached in memory`);
      }
    }

    if (!job) {
      console.log(`[Job API] Job ${jobId} not found in memory or file`);
      return res.status(404).json({ message: 'Job not found' });
    }

    console.log(`[Job API] Found job ${jobId}:`, job);
    res.status(200).json({
      jobId,
      ...job
    });

  } catch (error) {
    console.error('Job status error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}