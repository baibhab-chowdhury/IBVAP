"use client";

import React, { useState, useEffect } from 'react';
import { Users, Car, Activity, ShieldAlert, Zap } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';

export default function Dashboard() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({ people: 0, vehicles: 0 });
  const [wsConnected, setWsConnected] = useState(false);
  const [wsData, setWsData] = useState<any>({});

  // ==========================================
  // DEPLOYMENT TOGGLE
  // SET TO TRUE for the public Vercel link.
  // SET TO FALSE when running locally for the judges.
  // ==========================================
  const IS_STATIC_DEMO = false;

  useEffect(() => {
    if (IS_STATIC_DEMO) {
      setWsConnected(true);
      
      // Simulate fluctuating stats
      const statsInterval = setInterval(() => {
        setStats({
          people: Math.floor(Math.random() * 5) + 12, // 12-16 people
          vehicles: Math.floor(Math.random() * 3) + 3 // 3-5 vehicles
        });
      }, 3000);
      
      // Simulate occasional alerts
      const alertInterval = setInterval(() => {
        if (Math.random() > 0.7) {
          setAlerts(prev => {
            const newAlert = {
              id: Date.now(),
              type: "ZONE INTRUSION",
              severity: "HIGH",
              cam: `Gate ${Math.floor(Math.random() * 4) + 1}`,
              description: "Movement detected in restricted boundary."
            };
            return [newAlert, ...prev].slice(0, 10);
          });
        }
      }, 8000);
      
      return () => {
        clearInterval(statsInterval);
        clearInterval(alertInterval);
      };
    }

    // Connect to the Python Backend WebSocket (For Real Live Demo)
    const ws = new WebSocket('ws://localhost:8000/ws');

    ws.onopen = () => {
      console.log('WebSocket Connected to Backend');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "tracking_update") {
          setWsData((prev: any) => {
            const newData = { ...prev, [data.camera_id]: { detections: data.detections } };
            
            // Recalculate stats based on all cameras
            let peopleCount = 0;
            let vehicleCount = 0;
            Object.values(newData).forEach((camData: any) => {
              (camData.detections || []).forEach((det: any) => {
                if (det.class_name === 'person') peopleCount++;
                else if (['car', 'bus', 'truck', 'motorcycle'].includes(det.class_name)) vehicleCount++;
              });
            });
            setStats({ people: peopleCount, vehicles: vehicleCount });
            
            return newData;
          });
        } else if (data.type === "alert") {
          // Prepend new alert to the feed
          setAlerts((prev: any) => {
            const newAlerts = [data.alert, ...prev];
            return newAlerts.slice(0, 20); // Keep max 20 alerts
          });
        }
        
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      setWsConnected(false);
    };

    return () => ws.close();
  }, [IS_STATIC_DEMO]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Command Center</h1>
          <p className="text-gray-500 text-sm mt-1">Intelligent Border Video Analytics Platform</p>
        </div>
        <div className={`flex items-center text-sm font-medium px-3 py-1.5 rounded-full border ${wsConnected ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
          <Zap size={16} className="mr-2" />
          {wsConnected ? 'AI Engine Online' : 'Connecting to AI...'}
        </div>
      </div>
      
      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-4"><Users size={24}/></div>
          <div><p className="text-sm text-gray-500">Total People (Live)</p><p className="text-2xl font-bold">{stats.people}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg mr-4"><Car size={24}/></div>
          <div><p className="text-sm text-gray-500">Vehicles Tracked</p><p className="text-2xl font-bold">{stats.vehicles}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg mr-4"><ShieldAlert size={24}/></div>
          <div><p className="text-sm text-gray-500">Critical Alerts</p><p className="text-2xl font-bold">{alerts.filter(a => a.severity === 'CRITICAL').length}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg mr-4"><Activity size={24}/></div>
          <div><p className="text-sm text-gray-500">System Status</p><p className={`text-xl font-bold ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>{wsConnected ? 'Optimal' : 'Offline'}</p></div>
        </div>
      </div>
      
      <div className="flex flex-col xl:flex-row gap-6">
        {/* 2x2 Video Grid */}
        <div className="flex-grow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* CAM 1 - SLIDESHOW */}
            <div className="flex flex-col">
              <div className="bg-gray-800 text-white px-4 py-2 rounded-t-xl text-sm font-bold flex justify-between">
                <span>CAM 1: Master Slideshow</span>
                <span className="text-red-400 animate-pulse">● REC</span>
              </div>
              <VideoPlayer cameraId="1" title="" streamUrl="http://localhost:8888/cam1/index.m3u8" rawMp4Url={IS_STATIC_DEMO ? "/videos/B1_loop.mp4" : undefined} detections={wsData?.["1"]?.detections || []} />
            </div>

            {/* CAM 2 - SUBHODEEP / PHONE */}
            <div className="flex flex-col">
              <div className="bg-gray-800 text-white px-4 py-2 rounded-t-xl text-sm font-bold flex justify-between items-center">
                <span>CAM 2: Facial Recognition Checkpoint</span>
                
                {/* Phone Connection Toggle */}
                {!IS_STATIC_DEMO && (
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      placeholder="http://192.168.1.5:8080/video" 
                      className="text-black text-xs px-2 py-1 rounded w-48"
                      id="phoneUrlInput"
                      defaultValue="http://192.168.1.x:8080/video"
                    />
                    <button 
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded shadow"
                      onClick={async () => {
                        const url = (document.getElementById('phoneUrlInput') as HTMLInputElement).value;
                        if (url) {
                          try {
                            const res = await fetch('http://localhost:8000/api/cameras/2/switch', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ url })
                            });
                            if (!res.ok) throw new Error("Switch failed");
                            alert("Switched Cam 2 to Phone Stream!");
                          } catch (e) {
                            alert("Failed to connect phone. Is the backend running?");
                          }
                        } else {
                          // Switch back to script loop
                          await fetch('http://localhost:8000/api/cameras/2/switch', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: "C2.mp4" })
                          });
                          alert("Switched back to default Clip");
                        }
                      }}
                    >
                      Connect Phone
                    </button>
                    <button 
                      className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-3 py-1 rounded shadow"
                      onClick={async () => {
                          await fetch('http://localhost:8000/api/cameras/2/switch', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: "C2.mp4" })
                          });
                          alert("Disconnected Phone. Reverted to Clip.");
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
              <VideoPlayer cameraId="2" title="" streamUrl="http://localhost:8888/cam2/index.m3u8" rawMp4Url={IS_STATIC_DEMO ? "/videos/C2_loop.mp4" : undefined} detections={wsData?.["2"]?.detections || []} />
            </div>

          </div>
        </div>
        
        {/* Live Alert Feed */}
        <div className="w-full xl:w-[400px] bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-auto xl:h-[calc(100vh-200px)]">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-lg text-gray-800">Live Incident Feed</h2>
            <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
              LIVE
            </span>
          </div>
          <div className="p-4 flex-grow overflow-y-auto space-y-4">
            {alerts.map((a, idx) => (
              <div key={idx} className="border border-gray-100 shadow-sm rounded-lg overflow-hidden">
                <div className={`h-1 w-full ${a.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-400'}`}></div>
                <div className="p-3 bg-gray-50">
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-xs font-bold ${a.severity === 'CRITICAL' ? 'text-red-700' : 'text-orange-700'}`}>
                      {a.type}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium">Just now</p>
                  </div>
                  <p className="text-sm text-gray-800 font-medium mb-1">{a.description || a.desc}</p>
                  <p className="text-xs text-gray-500 flex items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5"></span>
                    CAM {a.camera_id || a.cam}
                  </p>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center p-4">
                <p className="text-sm text-gray-500">No active alerts.</p>
              </div>
            )}
            {alerts.length > 0 && (
              <div className="text-center p-4">
                <p className="text-xs text-gray-400">End of recent alerts.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
