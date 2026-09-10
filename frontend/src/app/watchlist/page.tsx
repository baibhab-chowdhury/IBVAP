"use client";

import React, { useState } from 'react';
import { Upload, UserX, UserPlus, ShieldAlert } from 'lucide-react';

// Mock data interface until connected to backend
interface EnrolledFace {
  id: number;
  name: string;
  threat_level: string;
  enrolled_date: string;
}

export default function WatchlistPage() {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  // Mock state
  const [faces, setFaces] = useState<EnrolledFace[]>([
    { id: 1, name: "Unknown Subject Alpha", threat_level: "High", enrolled_date: "2024-03-10" },
  ]);

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !file) return;
    
    // TODO: Connect to backend API `POST /api/watchlist`
    // which forwards the photo to the GPU Server `POST /face/enroll`
    
    alert(`Enrolling ${name}... (Backend integration pending)`);
    setFaces([...faces, { id: Date.now(), name, threat_level: "Medium", enrolled_date: new Date().toISOString().split('T')[0] }]);
    setName('');
    setFile(null);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <ShieldAlert className="mr-3 text-red-600" />
          Watchlist Management
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Enrollment Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <UserPlus className="mr-2" size={20} />
            Enroll New Face
          </h2>
          <form onSubmit={handleEnroll} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name / ID</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="e.g. John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Face Photo</label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:bg-gray-50 transition cursor-pointer">
                <input 
                  type="file" 
                  accept="image/jpeg, image/png"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="hidden" 
                  id="file-upload" 
                  required
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">
                    {file ? file.name : "Click to upload clear front-facing photo"}
                  </span>
                </label>
              </div>
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 transition"
            >
              Enroll into Database
            </button>
          </form>
        </div>

        {/* Enrolled Faces Grid */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-2">
          <h2 className="text-xl font-semibold mb-4">Active Watchlist ({faces.length})</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {faces.map((face) => (
              <div key={face.id} className="border rounded-lg p-4 flex items-start space-x-4 bg-gray-50">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-500 text-xs">Photo</span>
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold text-gray-800">{face.name}</h3>
                  <p className="text-xs text-gray-500">Enrolled: {face.enrolled_date}</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                    {face.threat_level} Threat
                  </span>
                </div>
                <button className="text-gray-400 hover:text-red-600 transition">
                  <UserX size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
