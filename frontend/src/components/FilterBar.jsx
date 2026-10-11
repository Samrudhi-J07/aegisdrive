import React from 'react';
import { Search, Filter, RotateCcw, Check } from 'lucide-react';

export default function FilterBar({ 
  searchQuery, setSearchQuery, 
  selectedState, setSelectedState, 
  selectedSeverity, setSelectedSeverity,
  selectedWeather, setSelectedWeather,
  selectedRoadType, setSelectedRoadType,
  onReset 
}) {
  const statesList = [
    'all', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 
    'Telangana', 'Punjab', 'Gujarat', 'Uttar Pradesh', 'West Bengal'
  ];

  // Count active non-default filters
  let activeCount = 0;
  if (searchQuery) activeCount++;
  if (selectedState && selectedState !== 'all') activeCount++;
  if (selectedSeverity && selectedSeverity !== 'all') activeCount++;
  if (selectedWeather && selectedWeather !== 'all') activeCount++;
  if (selectedRoadType && selectedRoadType !== 'all') activeCount++;

  return (
    <div className="sticky top-[72px] z-40 mb-8 rounded-2xl bg-[#131A2B]/95 backdrop-blur-xl border border-[rgba(99,179,237,0.15)] p-3 shadow-card transition-all">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
        
        {/* Search Input Box */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-2.5" />
          <input 
            type="text"
            placeholder="Search city, state, road type or cause..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0B1120] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
          />
        </div>

        {/* Dropdowns Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* State Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#0B1120] px-3 py-1.5 rounded-xl border border-white/10">
            <span className="text-slate-400 font-medium">State:</span>
            <select 
              value={selectedState} 
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              {statesList.map(s => (
                <option key={s} value={s} className="bg-[#131A2B] text-white">{s === 'all' ? 'All India' : s}</option>
              ))}
            </select>
          </div>

          {/* Severity Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#0B1120] px-3 py-1.5 rounded-xl border border-white/10">
            <span className="text-slate-400 font-medium">Severity:</span>
            <select 
              value={selectedSeverity} 
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#131A2B]">All Severity</option>
              <option value="fatal" className="bg-[#131A2B] text-rose-400">Fatal Only</option>
              <option value="major" className="bg-[#131A2B] text-amber-400">Major Only</option>
              <option value="minor" className="bg-[#131A2B] text-emerald-400">Minor Only</option>
            </select>
          </div>

          {/* Weather Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#0B1120] px-3 py-1.5 rounded-xl border border-white/10">
            <span className="text-slate-400 font-medium">Weather:</span>
            <select 
              value={selectedWeather} 
              onChange={(e) => setSelectedWeather(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#131A2B]">All Weather</option>
              <option value="clear" className="bg-[#131A2B]">Clear</option>
              <option value="fog" className="bg-[#131A2B]">Fog / Smog</option>
              <option value="rain" className="bg-[#131A2B]">Rain</option>
            </select>
          </div>

          {/* Active Count Badge & Reset Button */}
          {activeCount > 0 && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                {activeCount} Active Filter{activeCount > 1 ? 's' : ''}
              </span>
              <button 
                onClick={onReset}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1 text-[11px]"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
