"use client";

import React, { useState, useEffect } from 'react';
import { Car, Search, MapPin, Clock, Wifi, WifiOff } from 'lucide-react';

interface PlateLog {
  plate_text: string;
  confidence?: number;
  timestamp: string;
  camera_id: number;
}

export default function ANPRPage() {
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<PlateLog[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    // Fetch existing plate logs
    fetch('http://localhost:8000/api/alerts/plates')
      .then(res => res.json())
      .then(data => {
        const plates = (data.plates || []).map((p: any) => ({
          plate_text: p.plate_text,
          confidence: p.confidence || 90,
          timestamp: p.timestamp,
          camera_id: p.camera_id
        }));
        setLogs(plates);
      })
      .catch(() => {});

    // Listen for new plate detections in real-time
    const ws = new WebSocket('ws://localhost:8000/ws');
    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'alert' && data.data?.type === 'ANPR_READ') {
          const newPlate: PlateLog = {
            plate_text: data.data.plate_text,
            confidence: 90,
            timestamp: data.data.timestamp,
            camera_id: data.data.camera_id
          };
          setLogs(prev => [newPlate, ...prev].slice(0, 50));
        }
      } catch {}
    };
    return () => ws.close();
  }, []);

  const filteredLogs = logs.filter(log => log.plate_text.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Car className="mr-3 text-blue-600" />
          Vehicle ANPR Logs
        </h1>
        
        <div className="flex items-center space-x-3">
          <span className={`flex items-center text-sm font-medium px-3 py-1.5 rounded-full border ${wsConnected ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
            {wsConnected ? <Wifi size={14} className="mr-1.5" /> : <WifiOff size={14} className="mr-1.5" />}
            {wsConnected ? 'Live' : 'Offline'}
          </span>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search license plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-600">License Plate</th>
              <th className="p-4 font-semibold text-gray-600">Timestamp</th>
              <th className="p-4 font-semibold text-gray-600">Location</th>
              <th className="p-4 font-semibold text-gray-600">AI Confidence</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="p-4">
                  <span className="inline-block px-3 py-1 bg-yellow-100 border border-yellow-300 font-mono font-bold text-yellow-800 rounded">
                    {log.plate_text}
                  </span>
                </td>
                <td className="p-4 text-gray-600 flex items-center">
                  <Clock size={16} className="mr-2 text-gray-400" />
                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                </td>
                <td className="p-4 text-gray-600">
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2 text-gray-400" />
                    Camera {log.camera_id}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2 max-w-[100px]">
                      <div 
                        className={`h-2 rounded-full ${(log.confidence || 0) > 90 ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${log.confidence || 90}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{log.confidence || 90}%</span>
                  </div>
                </td>
              </tr>
            ))}
            
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  {search ? `No license plates found matching "${search}"` : 'No plates detected yet. Plates will appear here in real-time.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
