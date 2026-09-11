"use client";
import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  streamUrl?: string;
  cameraId: string;
  title: string;
  detections?: any[];
}

export default function VideoPlayer({ streamUrl, cameraId, title, detections = [] }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // If we have a stream URL and the browser supports HLS
    if (videoRef.current && streamUrl) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play().catch(() => console.log("Autoplay prevented"));
        });
        
        return () => {
          hls.destroy();
        };
      } 
      // Fallback for Safari which supports HLS natively
      else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = streamUrl;
        videoRef.current.addEventListener('loadedmetadata', () => {
          videoRef.current?.play();
        });
      }
    }
  }, [streamUrl]);
  useEffect(() => {
    // Draw bounding boxes when detections change
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video || detections.length === 0) {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas internal resolution to the video element's display size
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Detections come in as [x1, y1, x2, y2] scaled 0-1 from backend
    detections.forEach(det => {
      const [x1, y1, x2, y2] = det.bbox;
      const x = x1 * canvas.width;
      const y = y1 * canvas.height;
      const w = (x2 - x1) * canvas.width;
      const h = (y2 - y1) * canvas.height;

      // Color mapping
      let color = '#00ff00'; // Default Green
      if (det.class_name === 'person') color = '#00ffff'; // Cyan
      if (['car', 'bus', 'truck', 'motorcycle'].includes(det.class_name)) color = '#ff00ff'; // Magenta
      if (det.is_watchlisted) color = '#ff0000'; // RED for watchlisted

      // Draw box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      // Draw label
      ctx.fillStyle = color;
      const label = `${det.class_name} ${det.track_id ? '#' + det.track_id : ''}`;
      ctx.font = '14px Arial';
      ctx.fillText(label, x, y > 20 ? y - 5 : y + 15);
      
      // Draw Face Name if recognized
      if (det.face_name && det.face_name !== "Unknown") {
        ctx.fillStyle = det.is_watchlisted ? 'red' : 'yellow';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`ID: ${det.face_name}`, x, y + h + 20);
      }
    });

  }, [detections]);

  return (
    <div className="relative bg-black rounded-xl overflow-hidden shadow-md aspect-video border border-gray-800">
      {/* Top Overlay Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent p-3 z-10 flex justify-between items-center pointer-events-none">
        <span className="text-white text-sm font-medium tracking-wide">{title}</span>
        <span className="flex items-center text-xs text-red-500 font-bold tracking-widest uppercase">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
          REC
        </span>
      </div>
      
      {streamUrl ? (
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover" 
          muted 
          autoPlay 
          playsInline 
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900">
          <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium">Waiting for signal...</p>
        </div>
      )}
      
      {/* Transparent Canvas Overlay for drawing AI bounding boxes later */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none z-20" 
      />
    </div>
  );
}
