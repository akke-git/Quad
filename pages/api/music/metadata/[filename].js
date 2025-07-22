// pages/api/music/metadata/[filename].js

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { filename } = req.query;

  if (!filename) {
    return res.status(400).json({ message: 'Filename is required' });
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'downloads', filename);
    
    // 파일 존재 확인
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    const metadata = await getFileMetadata(filePath);
    
    res.status(200).json({ 
      filename,
      metadata,
      filePath: `/downloads/${filename}`
    });

  } catch (error) {
    console.error('Metadata error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

function getFileMetadata(filePath) {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath
    ]);

    let output = '';
    let errorOutput = '';

    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe exited with code ${code}: ${errorOutput}`));
        return;
      }

      try {
        const data = JSON.parse(output);
        
        // 메타데이터 정리
        const tags = data.format?.tags || {};
        const streams = data.streams || [];
        const audioStream = streams.find(s => s.codec_type === 'audio');
        
        const metadata = {
          // 기본 파일 정보
          duration: parseFloat(data.format?.duration || 0),
          bitrate: parseInt(data.format?.bit_rate || 0),
          size: parseInt(data.format?.size || 0),
          format: data.format?.format_name || 'unknown',
          
          // 오디오 스트림 정보
          audioCodec: audioStream?.codec_name || 'unknown',
          sampleRate: parseInt(audioStream?.sample_rate || 0),
          channels: audioStream?.channels || 0,
          
          // 태그 정보 (대소문자 구분 없이 처리)
          title: tags.title || tags.Title || tags.TITLE || '',
          artist: tags.artist || tags.Artist || tags.ARTIST || '',
          album: tags.album || tags.Album || tags.ALBUM || '',
          date: tags.date || tags.Date || tags.DATE || '',
          genre: tags.genre || tags.Genre || tags.GENRE || '',
          track: tags.track || tags.Track || tags.TRACK || '',
          comment: tags.comment || tags.Comment || tags.COMMENT || '',
          encoder: tags.encoder || tags.Encoder || tags.ENCODER || '',
          
          // 원본 태그 (디버깅용)
          rawTags: tags
        };
        
        resolve(metadata);
      } catch (parseError) {
        reject(new Error(`Failed to parse metadata: ${parseError.message}`));
      }
    });

    ffprobe.on('error', (error) => {
      reject(new Error(`Failed to spawn ffprobe: ${error.message}`));
    });
  });
}