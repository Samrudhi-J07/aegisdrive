import React, { useState, useEffect } from 'react';
import { Sliders, ShieldCheck, AlertTriangle, Zap, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function WhatIfSimulator() {
  const [params, setParams] = useState({
    speed_factor: 1.2,
    weather: 'rain',
    visibility_num: 1,
    traffic_density: 'high',
    lanes: 2,
    is_peak_hour: 1,
    is_weekend: 0,
    cause: 'overspeeding'
  });

  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runSimulation();
  }, [params]);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/simulation/what-if`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      setSimResult(data);
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Interactive What-If Safety Policy Simulator</h2>
            <p className="text-xs text-gray-400">Dynamically adjust traffic parameters & weather to simulate safety interventions</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (Left) */}
        <div className="glass-panel p-6 lg:col-span-6 space-y-6">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" /> Scenario Control Sliders
          </h3>

          {/* Speed Multiplier Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-300">Average Traffic Speed Factor</span>
              <span className="text-cyan-400 font-mono font-bold">{params.speed_factor}x Speed Limit</span>
            </div>
            <input 
              type="range" min="0.5" max="2.0" step="0.1"
              value={params.speed_factor}
              onChange={(e) => setParams({...params, speed_factor: parseFloat(e.target.value)})}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>0.5x (Strict Enforcement)</span>
              <span>1.0x (Normal)</span>
              <span>2.0x (Extreme Speeding)</span>
            </div>
          </div>

          {/* Weather Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 block">Simulated Weather Environment</label>
            <div className="grid grid-cols-3 gap-2">
              {['clear', 'fog', 'rain'].map(w => (
                <button
                  key={w}
                  onClick={() => setParams({...params, weather: w})}
                  className={`py-2 rounded-xl text-xs font-bold uppercase transition-all border ${
                    params.weather === w 
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-glow-cyan' 
                    : 'bg-slate-900/60 text-gray-400 border-white/10 hover:bg-slate-800'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility Level Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-300">Visibility Distance</span>
              <span className="text-violet-400 font-bold">
                {params.visibility_num === 1 ? 'Low (<50m)' : (params.visibility_num === 2 ? 'Medium (100m)' : 'High (>200m)')}
              </span>
            </div>
            <input 
              type="range" min="1" max="3" step="1"
              value={params.visibility_num}
              onChange={(e) => setParams({...params, visibility_num: parseInt(e.target.value)})}
              className="w-full accent-violet-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Peak Hour Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/10">
            <div>
              <span className="text-xs font-bold text-white block">Peak Rush Hour Traffic</span>
              <span className="text-[11px] text-gray-400">High volume commuter hours</span>
            </div>
            <button
              onClick={() => setParams({...params, is_peak_hour: params.is_peak_hour === 1 ? 0 : 1})}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                params.is_peak_hour === 1 
                ? 'bg-rose-500 text-white shadow-glow-rose' 
                : 'bg-slate-800 text-gray-400'
              }`}
            >
              {params.is_peak_hour === 1 ? 'ACTIVE' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Results & Recommendation Column (Right) */}
        <div className="glass-panel p-6 lg:col-span-6 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" /> Simulated Impact Metrics
            </h3>

            {simResult && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass-card p-4 text-center border-l-4 border-cyan-400">
                  <span className="text-xs text-gray-400 font-semibold block uppercase">Baseline Risk</span>
                  <div className="text-2xl font-extrabold text-white mt-1 font-mono">{(simResult.baseline_risk_score * 100).toFixed(0)}/100</div>
                </div>

                <div className={`glass-card p-4 text-center border-l-4 ${
                  simResult.simulated_risk_score > 0.6 ? 'border-rose-500' : 'border-emerald-400'
                }`}>
                  <span className="text-xs text-gray-400 font-semibold block uppercase">Simulated Risk Score</span>
                  <div className={`text-2xl font-extrabold mt-1 font-mono ${
                    simResult.simulated_risk_score > 0.6 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {(simResult.simulated_risk_score * 100).toFixed(0)}/100
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Recommended Safety Interventions */}
          <div className="glass-card p-5 border border-cyan-500/20">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Recommended Traffic Safety Actions
            </h4>

            <ul className="space-y-2.5 text-xs text-gray-300">
              {simResult?.recommendations?.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
