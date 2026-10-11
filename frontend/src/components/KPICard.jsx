import React from 'react';
import CountUp from 'react-countup';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KPICard({ title, value, change, isPositive = true, icon: Icon, colorTheme = "blue", sparklineData }) {
  // Theme color maps
  const colorMap = {
    blue: {
      bar: "from-blue-500 to-cyan-400",
      iconBg: "bg-blue-500/10 ring-blue-500/20 text-blue-400",
      text: "text-blue-400",
      stroke: "#3B82F6"
    },
    rose: {
      bar: "from-rose-500 to-red-400",
      iconBg: "bg-rose-500/10 ring-rose-500/20 text-rose-400",
      text: "text-rose-400",
      stroke: "#EF4444"
    },
    amber: {
      bar: "from-amber-500 to-orange-400",
      iconBg: "bg-amber-500/10 ring-amber-500/20 text-amber-400",
      text: "text-amber-400",
      stroke: "#F59E0B"
    },
    cyan: {
      bar: "from-cyan-400 to-teal-400",
      iconBg: "bg-cyan-500/10 ring-cyan-500/20 text-cyan-400",
      text: "text-cyan-400",
      stroke: "#22D3EE"
    }
  };

  const theme = colorMap[colorTheme] || colorMap.blue;
  
  // Parse numeric value for CountUp if float/int
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
  const isNumeric = !isNaN(numericValue);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#131A2B] to-[#1A2338] border border-[rgba(99,179,237,0.15)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(99,179,237,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col justify-between">
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b ${theme.bar}`} />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-[38px] font-extrabold leading-none text-white drop-shadow-[0_0_12px_rgba(59,130,246,0.3)]">
            {isNumeric ? (
              <CountUp 
                end={numericValue} 
                duration={1.8} 
                separator="," 
                decimals={String(value).includes('.') ? 1 : 0}
                suffix={String(value).includes('/100') ? '/100' : ''}
              />
            ) : (
              value
            )}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${theme.iconBg} ring-1 transition-transform group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span className={isPositive ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
            {change}
          </span>
        </div>

        {/* SVG Sparkline Curve */}
        <svg className="w-16 h-6 overflow-visible opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 60 24">
          <path
            d="M0 18 Q 15 6, 30 14 T 60 4"
            fill="none"
            stroke={theme.stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
