"use client";
import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  streamUrl?: string;
  rawMp4Url?: string;
  cameraId: string;
  title: string;
  detections?: any[];
}

export default function VideoPlayer({ streamUrl, rawMp4Url, cameraId, title, detections = [] }: VideoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // We are completely bypassing the HLS proxy and using MediaMTX's built-in 
  // WebRTC player via an iframe. This gives us zero latency (perfect for AI overlays)
  // and completely avoids all CORS / Cookie issues.
  const webRtcUrl = `http://localhost:8889/cam${cameraId}/?autoplay=1&muted=1&controls=0`;
  
  // Track canvas dimensions to match iframe size
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (canvasRef.current) {
          canvasRef.current.width = entry.contentRect.width;
          canvasRef.current.height = entry.contentRect.height;
        }
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const [zones, setZones] = React.useState<any[]>([]);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [drawnPoints, setDrawnPoints] = React.useState<{x: number, y: number}[]>([]);

  const fetchZones = () => {
    fetch('http://localhost:8000/api/zones/')
      .then(res => res.json())
      .then(data => {
        setZones(data.zones.filter((z: any) => z.camera_id === parseInt(cameraId)));
      })
      .catch(console.error);
  };

  // Fetch zones on mount
  useEffect(() => {
    fetchZones();
  }, [cameraId]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Scale to the backend's expected 1280x720 resolution
    const scaledX = (x / canvas.width) * 1280;
    const scaledY = (y / canvas.height) * 720;
    
    setDrawnPoints([...drawnPoints, { x: scaledX, y: scaledY }]);
  };

  const saveZone = async () => {
    if (drawnPoints.length < 3) {
      alert("Please click at least 3 points to create a zone.");
      return;
    }
    try {
      await fetch('http://localhost:8000/api/zones/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "User Zone " + (zones.length + 1),
          camera_id: parseInt(cameraId),
          coordinates: drawnPoints
        })
      });
      setIsDrawing(false);
      setDrawnPoints([]);
      fetchZones();
    } catch (err) {
      console.error("Failed to save zone", err);
    }
  };

  const clearZones = async () => {
    if (zones.length === 0) return;
    try {
      await fetch(`http://localhost:8000/api/zones/camera/${cameraId}`, {
        method: 'DELETE'
      });
      fetchZones();
    } catch (err) {
      console.error("Failed to clear zones", err);
    }
  };

  useEffect(() => {
    // Draw bounding boxes when detections change
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / 1280;
    const scaleY = canvas.height / 720;

    // Draw Virtual Fence Zones
    zones.forEach(zone => {
      if (!zone.coordinates || zone.coordinates.length < 3) return;
      ctx.beginPath();
      ctx.moveTo(zone.coordinates[0].x * scaleX, zone.coordinates[0].y * scaleY);
      for (let i = 1; i < zone.coordinates.length; i++) {
        ctx.lineTo(zone.coordinates[i].x * scaleX, zone.coordinates[i].y * scaleY);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(zone.name, zone.coordinates[0].x * scaleX, (zone.coordinates[0].y * scaleY) - 10);
    });

    // Draw the currently drawn zone points
    if (drawnPoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(drawnPoints[0].x * scaleX, drawnPoints[0].y * scaleY);
      for (let i = 1; i < drawnPoints.length; i++) {
        ctx.lineTo(drawnPoints[i].x * scaleX, drawnPoints[i].y * scaleY);
      }
      if (drawnPoints.length > 2) ctx.closePath();
      ctx.fillStyle = 'rgba(0, 150, 255, 0.2)';
      ctx.fill();
      ctx.strokeStyle = '#0096ff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw points
      drawnPoints.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x * scaleX, pt.y * scaleY, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.stroke();
      });
    }

    if (detections.length === 0) return;

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
      
      // Draw Face Name if it's a person (shows Unknown if not in database)
      if (det.class_name === 'person' && det.face_name) {
        ctx.fillStyle = det.is_watchlisted ? '#ff0000' : (det.face_name === "Unknown" ? '#aaaaaa' : '#ffff00');
        ctx.font = 'bold 16px Arial';
        ctx.fillText(det.face_name === "Unknown" ? "ID: Unknown" : `ID: ${det.face_name}`, x, y + h + 20);
      }
      
      // Draw License Plate if detected
      if (det.plate_text) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y + h + 5, 120, 25);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(det.plate_text, x + 5, y + h + 22);
      }
    });

  }, [detections]);

  return (
    <div ref={containerRef} className="relative bg-black rounded-xl overflow-hidden shadow-md w-full h-full border border-gray-800">
      {/* Top Overlay Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent p-3 z-30 flex justify-between items-center pointer-events-none">
        <span className="text-white text-sm font-medium tracking-wide">{title}</span>
        
        <div className="flex items-center space-x-3 pointer-events-auto">
          {!isDrawing ? (
            <>
              {zones.length > 0 && (
                <button 
                  onClick={clearZones}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded shadow"
                >
                  🗑️ Clear Zones
                </button>
              )}
              <button 
                onClick={() => setIsDrawing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded shadow"
              >
                🖌️ Draw Zone
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => { setIsDrawing(false); setDrawnPoints([]); }}
                className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-3 py-1 rounded shadow"
              >
                Cancel
              </button>
              <button 
                onClick={saveZone}
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded shadow font-bold"
              >
                💾 Save Zone
              </button>
            </>
          )}
          <span className="flex items-center text-xs text-red-500 font-bold tracking-widest uppercase ml-4">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
            REC
          </span>
        </div>
      </div>
      
      {rawMp4Url ? (
        <video 
          className="absolute inset-0 w-full h-full object-cover z-10" 
          src={rawMp4Url}
          muted 
          autoPlay 
          playsInline 
          loop
        />
      ) : (
        <iframe 
          src={webRtcUrl}
          className="absolute inset-0 w-full h-full object-cover z-10 border-none"
          allow="autoplay; fullscreen"
        />
      )}
      
      {/* Transparent Canvas Overlay for drawing AI bounding boxes and user zones */}
      <canvas 
        ref={canvasRef} 
        onClick={handleCanvasClick}
        className={`absolute inset-0 w-full h-full z-20 ${isDrawing ? 'cursor-crosshair' : 'pointer-events-none'}`} 
      />
    </div>
  );
}
