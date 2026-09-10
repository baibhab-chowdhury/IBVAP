"use client";
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons missing in Next.js build
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const alertIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Mock camera locations (we use generic coords here, can be changed to actual border coords)
const cameras = [
  { id: 1, name: "Gate 1 (Entry)", lat: 28.6139, lng: 77.2090, status: "Active" },
  { id: 2, name: "Checkpost North", lat: 28.6239, lng: 77.2190, status: "Alert: Intrusion" },
  { id: 3, name: "Border Road", lat: 28.6039, lng: 77.1990, status: "Active" },
  { id: 4, name: "Perimeter Fence", lat: 28.6150, lng: 77.1950, status: "Active" },
];

export default function MapComponent() {
  return (
    <MapContainer 
      center={[28.6139, 77.2090]} 
      zoom={14} 
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {cameras.map(cam => (
        <Marker 
          key={cam.id} 
          position={[cam.lat, cam.lng]} 
          icon={cam.status.includes('Alert') ? alertIcon : icon}
        >
          <Popup>
            <div className="font-sans min-w-[150px]">
              <h3 className="font-bold text-gray-800">{cam.name}</h3>
              <div className="mt-2 text-sm">
                <span className="text-gray-500 mr-2">Status:</span>
                <span className={`font-bold ${cam.status.includes('Alert') ? 'text-red-600' : 'text-green-600'}`}>
                  {cam.status}
                </span>
              </div>
              {cam.status.includes('Alert') && (
                <button className="mt-3 w-full bg-red-50 text-red-600 border border-red-200 py-1 px-2 rounded text-xs font-semibold hover:bg-red-100">
                  View Live Feed
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
