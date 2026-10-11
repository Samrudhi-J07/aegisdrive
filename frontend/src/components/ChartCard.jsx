import React, { useState } from 'react';
import { RefreshCw, Download, MoreHorizontal } from 'lucide-react';

export default function ChartCard({ icon: Icon, title, subtitle, children, onRefresh, showTimeSwitcher = true }) {
  const [timeRange, setTimeRange] = useState('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="rounded-2xl bg-[#131A2B] border border-[rgba(99,179,237,0.12)] shadow-card overflow-hidden flex flex-col justify-between">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-[rgba(99,179,237,0.12)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-cyan-400">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
        </div>

        {/* Right Actions: Time Range Pills & Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {showTimeSwitcher && (
            <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
              {['24h', '7d', '30d', '1y'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    timeRange === t 
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]" 
                    : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1">
            <button 
              onClick={handleRefreshClick}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              title="Refresh chart data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="p-6">
        {children}
      </div>

      {/* Footer Status */}
      <div className="px-6 py-2.5 border-t border-[rgba(99,179,237,0.08)] bg-white/[0.01] flex items-center justify-between text-[11px] text-slate-500">
        <span>Powered by PySpark Big Data Engine</span>
        <span className="flex items-center gap-1.5 text-cyan-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Live Data
        </span>
      </div>
    </div>
  );
}
