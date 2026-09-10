"use client";

import React, { useState } from 'react';
import { Car, Search, MapPin, Clock } from 'lucide-react';

export default function ANPRPage() {
  const [search, setSearch] = useState('');

  // Mock data until connected to DB
  const [logs] = useState([
    { id: 1, plate: "MH12AB1234", conf: 92.5, time: "2024-03-10 14:32:10", camera: "Gate A Entry" },
    { id: 2, plate: "DL8CAB5678", conf: 88.1, time: "2024-03-10 14:15:05", camera: "Checkpost North" },
    { id: 3, plate: "KA01XY9999", conf: 95.0, time: "2024-03-10 13:45:22", camera: "Gate B Exit" },
  ]);

  const filteredLogs = logs.filter(log => log.plate.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Car className="mr-3 text-blue-600" />
          Vehicle ANPR Logs
        </h1>
        
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
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="p-4">
                  <span className="inline-block px-3 py-1 bg-yellow-100 border border-yellow-300 font-mono font-bold text-yellow-800 rounded">
                    {log.plate}
                  </span>
                </td>
                <td className="p-4 text-gray-600 flex items-center">
                  <Clock size={16} className="mr-2 text-gray-400" />
                  {log.time}
                </td>
                <td className="p-4 text-gray-600">
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2 text-gray-400" />
                    {log.camera}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2 max-w-[100px]">
                      <div 
                        className={`h-2 rounded-full ${log.conf > 90 ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${log.conf}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{log.conf}%</span>
                  </div>
                </td>
              </tr>
            ))}
            
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  No license plates found matching "{search}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
