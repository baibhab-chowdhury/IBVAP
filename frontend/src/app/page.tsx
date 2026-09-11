"use client";

import React, { useState, useEffect } from 'react';
import { Users, Car, Activity, ShieldAlert, Zap } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';

export default function Dashboard() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({ people: 0, vehicles: 0 });
  const [wsConnected, setWsConnected] = useState(false);
  const [wsData, setWsData] = useState<any>({});

  useEffect(() => {
    // Connect to the Python Backend WebSocket
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
  }, []);

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
            <VideoPlayer cameraId="1" title="CAM 1: Border Road" streamUrl="http://localhost:8888/cam1/index.m3u8" detections={wsData?.cameras?.["1"]?.detections || []} />
            <VideoPlayer cameraId="2" title="CAM 2: Restricted Zone" streamUrl="http://localhost:8888/cam2/index.m3u8" detections={wsData?.cameras?.["2"]?.detections || []} />
            <VideoPlayer cameraId="3" title="CAM 3: Campus Checkpoint" streamUrl="http://localhost:8888/cam3/index.m3u8" detections={wsData?.cameras?.["3"]?.detections || []} />
            <VideoPlayer cameraId="4" title="CAM 4: Night Perimeter" streamUrl="http://localhost:8888/cam4/index.m3u8" detections={wsData?.cameras?.["4"]?.detections || []} />
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
