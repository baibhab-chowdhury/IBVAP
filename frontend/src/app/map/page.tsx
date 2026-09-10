"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

// Leaflet must be loaded dynamically in Next.js to avoid SSR 'window is not defined' errors
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 font-medium">Loading Geographical Data...</p>
    </div>
  )
});

export default function MapPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-screen flex flex-col pb-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <MapPin className="mr-3 text-blue-600" />
          Tactical Map View
        </h1>
        <p className="text-gray-500 mt-1">Geographical overview of Border Out Posts (BOP) and camera networks</p>
      </div>
      
      <div className="flex-grow bg-white p-2 rounded-xl border border-gray-200 shadow-sm relative z-0">
        <MapComponent />
      </div>
    </div>
  );
}
