"use client";
import React, { useState, useEffect } from 'react';
import { Filter, Calendar, MapPin, Video, Download, Wifi, WifiOff } from 'lucide-react';

export default function AlertHistoryPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    // Fetch historical alerts
    fetch('http://localhost:8000/api/alerts/')
      .then(res => res.json())
      .then(data => setAlerts(data.alerts || []))
      .catch(() => {});

    // Connect to WebSocket for real-time alerts
    const ws = new WebSocket('ws://localhost:8000/ws');
    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'alert' && data.data) {
          setAlerts(prev => [data.data, ...prev].slice(0, 50));
        }
      } catch {}
    };
    return () => ws.close();
  }, []);

  const severityColor = (sev: string) => {
    if (sev === 'CRITICAL') return 'bg-red-100 text-red-800';
    if (sev === 'HIGH') return 'bg-orange-100 text-orange-800';
    if (sev === 'MEDIUM') return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Video Modal Overlay */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl overflow-hidden max-w-4xl w-full border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center p-4 bg-black border-b border-gray-800">
              <h3 className="text-white font-medium">Incident Evidence Clip</h3>
              <button onClick={() => setSelectedVideo(null)} className="text-gray-400 hover:text-white transition">
                ✕ Close
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              <video 
                src={`http://localhost:8000/${selectedVideo.replace(/\\/g, '/')}`} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Incident History</h1>
          <p className="text-gray-500 mt-1">Review past alerts, snapshots, and video evidence</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <span className={`flex items-center text-sm font-medium px-3 py-1.5 rounded-full border ${wsConnected ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
            {wsConnected ? <Wifi size={14} className="mr-1.5" /> : <WifiOff size={14} className="mr-1.5" />}
            {wsConnected ? 'Live' : 'Offline'}
          </span>
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
            <Filter size={16} className="mr-2" /> Filter
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm">
            <Download size={16} className="mr-2" /> Export Report
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm">
              <th className="p-4 font-semibold text-gray-600">Timestamp</th>
              <th className="p-4 font-semibold text-gray-600">Alert Type</th>
              <th className="p-4 font-semibold text-gray-600">Location</th>
              <th className="p-4 font-semibold text-gray-600">Description</th>
              <th className="p-4 font-semibold text-gray-600 text-center">Evidence</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {alerts.map((alert, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="p-4">
                  <div className="flex items-center text-gray-700">
                    <Calendar size={14} className="mr-2 text-gray-400" />
                    <span className="font-medium">{alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Just now'}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${severityColor(alert.severity)}`}>
                    {alert.type}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center text-gray-600">
                    <MapPin size={14} className="mr-2 text-gray-400" />
                    Camera {alert.camera_id}
                  </div>
                </td>
                <td className="p-4 text-gray-700">
                  {alert.description}
                </td>
                  <td className="p-4 text-center">
                    {alert.clip_path ? (
                      <button 
                        onClick={() => setSelectedVideo(alert.clip_path)}
                        className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-full transition" 
                        title="View Video Clip"
                      >
                        <Video size={18} />
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">No clip</span>
                    )}
                  </td>
                </tr>
              ))}
            {alerts.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No alerts recorded yet. Alerts will appear here in real-time.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
