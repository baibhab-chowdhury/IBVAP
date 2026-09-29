"use client";

import React, { useState, useEffect } from 'react';
import { Upload, UserX, UserPlus, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

interface EnrolledFace {
  id: number;
  name: string;
  threat_level: string;
  enrolled_date: string;
}

export default function WatchlistPage() {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [faces, setFaces] = useState<EnrolledFace[]>([]);
  const [enrollStatus, setEnrollStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch enrolled faces on mount
  useEffect(() => {
    fetch('http://localhost:8001/face/list')
      .then(res => res.json())
      .then(data => {
        const enrolled = (data.names || []).map((n: string, i: number) => ({
          id: i + 1,
          name: n,
          threat_level: n.toLowerCase().includes('suspect') || n.toLowerCase().includes('watchlist') ? 'High' : 'Medium',
          enrolled_date: new Date().toISOString().split('T')[0]
        }));
        setFaces(enrolled);
      })
      .catch(() => {});
  }, []);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !file) return;
    
    setLoading(true);
    setEnrollStatus(null);
    
    try {
      const formData = new FormData();
      formData.append('face_img', file);
      
      const res = await fetch(`http://localhost:8001/face/enroll?person_name=${encodeURIComponent(name)}`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (data.status === 'success') {
        setEnrollStatus('success');
        setFaces(prev => [...prev, {
          id: Date.now(),
          name,
          threat_level: name.toLowerCase().includes('suspect') || name.toLowerCase().includes('watchlist') ? 'High' : 'Medium',
          enrolled_date: new Date().toISOString().split('T')[0]
        }]);
        setName('');
        setFile(null);
      } else {
        setEnrollStatus('failed');
      }
    } catch {
      setEnrollStatus('error');
    } finally {
      setLoading(false);
      setTimeout(() => setEnrollStatus(null), 4000);
    }
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
          
          {enrollStatus === 'success' && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-800 text-sm">
              <CheckCircle size={16} className="mr-2" /> Face enrolled successfully!
            </div>
          )}
          {enrollStatus === 'failed' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-800 text-sm">
              <XCircle size={16} className="mr-2" /> No face found. Use a clear, front-facing photo.
            </div>
          )}
          {enrollStatus === 'error' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-800 text-sm">
              <XCircle size={16} className="mr-2" /> Connection failed. Is the inference server running?
            </div>
          )}
          
          <form onSubmit={handleEnroll} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name / ID</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder='e.g. "Suspect Alpha" for watchlist'
                required
              />
              <p className="text-xs text-gray-400 mt-1">Include &quot;suspect&quot; or &quot;watchlist&quot; in name for high-threat flagging</p>
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
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Enrolling...' : 'Enroll into Database'}
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
                  <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${face.threat_level === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {face.threat_level} Threat
                  </span>
                </div>
                <button className="text-gray-400 hover:text-red-600 transition">
                  <UserX size={20} />
                </button>
              </div>
            ))}
            {faces.length === 0 && (
              <div className="col-span-2 text-center p-8 text-gray-500">
                No faces enrolled yet. Use the form to add subjects.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
