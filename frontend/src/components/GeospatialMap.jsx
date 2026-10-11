import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Filter, Info } from 'lucide-react';

const createCustomIcon = (severity) => {
  let color = '#10B981'; // minor = green
  let glow = 'rgba(16, 185, 129, 0.4)';
  if (severity === 'fatal') {
    color = '#EF4444'; // fatal = red
    glow = 'rgba(239, 68, 68, 0.6)';
  } else if (severity === 'major') {
    color = '#F59E0B'; // major = orange
    glow = 'rgba(245, 158, 11, 0.5)';
  }

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="
      background-color: ${color};
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 0 12px ${glow};
      cursor: pointer;
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const CARTO_KEY = import.meta.env.VITE_CARTO_KEY;

export default function GeospatialMap() {
  const [mapPoints, setMapPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  const statesList = [
    'all', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 
    'Telangana', 'Punjab', 'Gujarat', 'Uttar Pradesh', 'West Bengal'
  ];

  useEffect(() => {
    fetchMapData();
  }, [selectedState, selectedSeverity]);

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const url = `http://localhost:8000/api/analytics/map?state=${selectedState}&severity=${selectedSeverity}&limit=1200`;
      const res = await fetch(url);
      const data = await res.json();
      setMapPoints(data.points || []);
    } catch (e) {
      console.error("Map fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Map Control Header */}
      <div className="rounded-2xl bg-[#131A2B] border border-[rgba(99,179,237,0.15)] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Geospatial Accident Hotspots & Map Explorer</h3>
            <p className="text-xs text-slate-400">Showing {mapPoints.length} interactive crash coordinates across India</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-[#0B1120] px-3 py-1.5 rounded-xl border border-white/10 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>State:</span>
            <select 
              value={selectedState} 
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              {statesList.map(s => (
                <option key={s} value={s} className="bg-[#131A2B] text-white">{s === 'all' ? 'All India' : s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#0B1120] px-3 py-1.5 rounded-xl border border-white/10 text-xs text-slate-300">
            <span>Severity:</span>
            <select 
              value={selectedSeverity} 
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#131A2B]">All Severity</option>
              <option value="fatal" className="bg-[#131A2B] text-rose-400">Fatal Only</option>
              <option value="major" className="bg-[#131A2B] text-amber-400">Major Only</option>
              <option value="minor" className="bg-[#131A2B] text-emerald-400">Minor Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className="rounded-2xl bg-[#131A2B] border border-[rgba(99,179,237,0.15)] p-2 h-[600px] relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-[#0B1120]/80 backdrop-blur-sm z-50 flex items-center justify-center space-x-3">
            <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-300 text-sm font-medium">Fetching map coordinates...</span>
          </div>
        )}

        <MapContainer 
          center={[20.5937, 78.9629]} 
          zoom={5} 
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
        >
          <TileLayer
            url={`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={20}
          />

          {mapPoints.map((pt, idx) => (
            <Marker 
              key={idx} 
              position={[pt.latitude, pt.longitude]}
              icon={createCustomIcon(pt.accident_severity)}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-3 bg-[#0B1120] text-slate-100 rounded-lg border border-slate-700 min-w-[200px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      pt.accident_severity === 'fatal' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      (pt.accident_severity === 'major' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30')
                    }`}>
                      {pt.accident_severity} Incident
                    </span>
                    <span className="text-xs text-slate-400 font-mono">#{pt.accident_id}</span>
                  </div>

                  <h4 className="font-bold text-sm text-white mb-1">{pt.city}, {pt.state}</h4>
                  
                  <div className="space-y-1 text-xs text-slate-300 mt-2 border-t border-slate-800 pt-2">
                    <p><strong className="text-slate-400">Cause:</strong> <span className="capitalize">{pt.cause}</span></p>
                    <p><strong className="text-slate-400">Weather:</strong> <span className="capitalize">{pt.weather}</span></p>
                    <p><strong className="text-slate-400">Road Type:</strong> <span className="capitalize">{pt.road_type}</span></p>
                    <p><strong className="text-slate-400">Risk Score:</strong> <span className="text-cyan-400 font-bold">{(pt.risk_score * 100).toFixed(0)}/100</span></p>
                    <p><strong className="text-slate-400">Casualties:</strong> {pt.casualties}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-6 right-6 z-[1000] bg-[#0B1120]/90 backdrop-blur-md border border-white/10 p-3 rounded-xl text-xs space-y-2">
          <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" /> Hotspot Legend
          </div>
          <div className="flex items-center gap-2 text-rose-400 font-medium">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span> Fatal Crash
          </div>
          <div className="flex items-center gap-2 text-amber-400 font-medium">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span> Major Accident
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> Minor Incident
          </div>
        </div>
      </div>
    </div>
  );
}
