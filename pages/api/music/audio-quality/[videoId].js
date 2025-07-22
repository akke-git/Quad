// pages/api/music/audio-quality/[videoId].js

import { spawn } from 'child_process';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { videoId } = req.query;

  if (!videoId) {
    return res.status(400).json({ message: 'Video ID is required' });
  }

  try {
    const audioFormats = await getAudioQuality(videoId);
    
    res.status(200).json({ 
      videoId,
      audioFormats
    });

  } catch (error) {
    console.error('Audio quality check error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

function getAudioQuality(videoId) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      '-F',
      '--no-warnings',
      `https://www.youtube.com/watch?v=${videoId}`
    ]);

    let output = '';
    let errorOutput = '';

    ytdlp.stdout.on('data', (data) => {
      output += data.toString();
    });

    ytdlp.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`yt-dlp exited with code ${code}: ${errorOutput}`));
        return;
      }

      try {
        const lines = output.split('\n');
        const audioLines = lines.filter(line => 
          line.includes('audio only') && 
          !line.includes('storyboard')
        );

        const audioFormats = audioLines.map(line => {
          const parts = line.trim().split(/\s+/);
          const formatId = parts[0];
          
          // Extract bitrate info - look for patterns like "130k", "52k"
          let bitrate = 'unknown';
          let codec = 'unknown';
          
          // Match bitrate patterns more broadly
          const bitrateMatch = line.match(/(\d+)k/g);
          if (bitrateMatch && bitrateMatch.length > 0) {
            // Take the highest bitrate found
            const bitrates = bitrateMatch.map(b => parseInt(b.replace('k', '')));
            const maxBitrate = Math.max(...bitrates);
            bitrate = `${maxBitrate}k`;
          }
          
          // Detect codec
          if (line.includes('opus')) {
            codec = 'OPUS';
          } else if (line.includes('mp4a.40.2') || line.includes('m4a')) {
            codec = 'AAC';
          } else if (line.includes('mp4a')) {
            codec = 'AAC';
          }
          
          return {
            formatId,
            bitrate,
            codec,
            description: line.trim()
          };
        });

        // Get the best quality info
        const bestQuality = getBestAudioQuality(audioFormats);
        
        resolve({
          available: audioFormats,
          best: bestQuality,
          summary: formatQualitySummary(bestQuality)
        });

      } catch (parseError) {
        reject(new Error(`Failed to parse audio formats: ${parseError.message}`));
      }
    });

    ytdlp.on('error', (error) => {
      reject(new Error(`Failed to spawn yt-dlp: ${error.message}`));
    });
  });
}

function getBestAudioQuality(formats) {
  if (!formats || formats.length === 0) {
    return { bitrate: 'unknown', codec: 'unknown' };
  }

  // Find highest bitrate
  let bestFormat = formats[0];
  let maxBitrate = 0;

  for (const format of formats) {
    if (format.bitrate !== 'unknown') {
      const bitrateNum = parseInt(format.bitrate.replace('k', ''));
      if (bitrateNum > maxBitrate) {
        maxBitrate = bitrateNum;
        bestFormat = format;
      }
    }
  }

  return bestFormat;
}

function formatQualitySummary(bestQuality) {
  if (!bestQuality || bestQuality.bitrate === 'unknown') {
    return '품질 확인 중...';
  }

  const bitrate = bestQuality.bitrate;
  const codec = bestQuality.codec;

  if (codec === 'opus' || codec === 'aac') {
    return `최대 ${bitrate} ${codec.toUpperCase()}`;
  }
  
  return `최대 ${bitrate}`;
}