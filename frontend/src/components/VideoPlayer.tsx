"use client";
import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  streamUrl?: string;
  cameraId: string;
  title: string;
}

export default function VideoPlayer({ streamUrl, cameraId, title }: VideoPlayerProps) {
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
