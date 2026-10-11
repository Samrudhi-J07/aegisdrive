import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, LayoutDashboard, Map, BrainCircuit, 
  Sliders, Cpu, BarChart3, UploadCloud, User
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Hotspot Map', icon: Map },
    { id: 'predict', label: 'ML Predictor', icon: BrainCircuit },
    { id: 'simulator', label: 'What-If Simulator', icon: Sliders },
    { id: 'bigdata', label: 'Big Data (Spark)', icon: Cpu },
    { id: 'metrics', label: 'Model Evaluation', icon: BarChart3 },
    { id: 'upload', label: 'Upload & Analyze', icon: UploadCloud },
  ];

  return (
    <header className="sticky top-0 z-50 h-[64px] bg-[#131A2B]/85 backdrop-blur-xl border-b border-[rgba(99,179,237,0.15)] px-6 flex items-center justify-between">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
        
        {/* Logo & Brand Block */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 p-0.5 shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center">
            <div className="w-full h-full bg-[#0B1120] rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white tracking-tight">Aegis<span className="text-cyan-400">Drive</span></span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">v2.4 AI</span>
            </div>
            <p className="text-[11px] text-slate-400">Road Safety Analytics & Big Data Platform</p>
          </div>
        </div>

        {/* Center Segmented Control Nav Tabs */}
        <nav className="hidden lg:inline-flex rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
          {navItems.map((item) => {
            const IconComp = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                  isActive ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="segment-pill"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <IconComp className={`w-3.5 h-3.5 relative z-10 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Status Badge & User Avatar */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-[11px]">FastAPI & Spark Active</span>
          </div>

          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 hover:border-blue-400 hover:text-white transition-all cursor-pointer">
            <User className="w-4 h-4" />
          </div>
        </div>

      </div>
    </header>
  );
}
