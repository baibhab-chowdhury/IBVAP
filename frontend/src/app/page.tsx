"use client";

import React, { useState } from 'react';
import { Users, Car, Activity, ShieldAlert, Zap } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';

export default function Dashboard() {
  // Mock Data
  const [alerts] = useState([
    { id: 1, type: "ZONE INTRUSION", severity: "CRITICAL", time: "Just now", cam: "Gate 1", desc: "Person entered restricted boundary." },
    { id: 2, type: "LOITERING", severity: "HIGH", time: "2 min ago", cam: "Checkpost North", desc: "Subject lingering > 60s." },
    { id: 3, type: "FACE MATCH", severity: "CRITICAL", time: "15 min ago", cam: "Gate 1", desc: "Subject 'Alpha' detected." },
  ]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Command Center</h1>
          <p className="text-gray-500 text-sm mt-1">Intelligent Border Video Analytics Platform</p>
        </div>
        <div className="flex items-center text-sm font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
          <Zap size={16} className="mr-2" />
          AI Engine Online
        </div>
      </div>
      
      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-4"><Users size={24}/></div>
          <div><p className="text-sm text-gray-500">Total People (Live)</p><p className="text-2xl font-bold">12</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg mr-4"><Car size={24}/></div>
          <div><p className="text-sm text-gray-500">Vehicles Tracked</p><p className="text-2xl font-bold">4</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg mr-4"><ShieldAlert size={24}/></div>
          <div><p className="text-sm text-gray-500">Critical Alerts</p><p className="text-2xl font-bold">2</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg mr-4"><Activity size={24}/></div>
          <div><p className="text-sm text-gray-500">System Status</p><p className="text-xl font-bold text-green-600">Optimal</p></div>
        </div>
      </div>
      
      <div className="flex flex-col xl:flex-row gap-6">
        {/* 2x2 Video Grid */}
        <div className="flex-grow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <VideoPlayer cameraId="1" title="CAM 1: Border Road" />
            <VideoPlayer cameraId="2" title="CAM 2: Main Gate" />
            <VideoPlayer cameraId="3" title="CAM 3: Checkpost North" />
            <VideoPlayer cameraId="4" title="CAM 4: Perimeter Fence" />
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
            {alerts.map(a => (
              <div key={a.id} className="border border-gray-100 shadow-sm rounded-lg overflow-hidden">
                <div className={`h-1 w-full ${a.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-400'}`}></div>
                <div className="p-3 bg-gray-50">
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-xs font-bold ${a.severity === 'CRITICAL' ? 'text-red-700' : 'text-orange-700'}`}>
                      {a.type}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium">{a.time}</p>
                  </div>
                  <p className="text-sm text-gray-800 font-medium mb-1">{a.desc}</p>
                  <p className="text-xs text-gray-500 flex items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5"></span>
                    {a.cam}
                  </p>
                </div>
              </div>
            ))}
            <div className="text-center p-4">
              <p className="text-xs text-gray-400">End of recent alerts.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
