"use client";
import React, { useState } from 'react';
import { Filter, Calendar, MapPin, Video, Download } from 'lucide-react';

export default function AlertHistoryPage() {
  const [alerts] = useState([
    { id: 1, type: "ZONE INTRUSION", severity: "CRITICAL", date: "2024-03-10", time: "14:32:10", cam: "Gate 1", desc: "Person entered restricted boundary." },
    { id: 2, type: "LOITERING", severity: "HIGH", date: "2024-03-10", time: "13:15:22", cam: "Checkpost North", desc: "Subject lingering > 60s." },
    { id: 3, type: "FACE MATCH", severity: "CRITICAL", date: "2024-03-09", time: "09:45:00", cam: "Gate 1", desc: "Subject 'Alpha' detected." },
    { id: 4, type: "WRONG DIRECTION", severity: "MEDIUM", date: "2024-03-09", time: "08:20:11", cam: "Gate 2 Exit", desc: "Vehicle moving against traffic." },
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Incident History</h1>
          <p className="text-gray-500 mt-1">Review past alerts, snapshots, and video evidence</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
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
            {alerts.map((alert) => (
              <tr key={alert.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="p-4">
                  <div className="flex items-center text-gray-700">
                    <Calendar size={14} className="mr-2 text-gray-400" />
                    <span className="font-medium mr-2">{alert.date}</span>
                    <span className="text-gray-500">{alert.time}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                    alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.type}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center text-gray-600">
                    <MapPin size={14} className="mr-2 text-gray-400" />
                    {alert.cam}
                  </div>
                </td>
                <td className="p-4 text-gray-700">
                  {alert.desc}
                </td>
                <td className="p-4 text-center">
                  <button className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-full transition" title="View Video Clip">
                    <Video size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
