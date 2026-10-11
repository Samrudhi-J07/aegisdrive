import React from 'react';
import { Sparkles, FileSpreadsheet, FileCode, FileText } from 'lucide-react';

export default function HeroHeader() {
  const formats = [
    { label: "CSV", icon: FileSpreadsheet, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
    { label: "XLSX / XLS", icon: FileSpreadsheet, color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
    { label: "JSON", icon: FileCode, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
    { label: "PDF", icon: FileText, color: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-500/15 via-cyan-500/8 to-slate-900/60 border border-blue-500/25 p-8 backdrop-blur-xl shadow-glow">
      {/* Background glow orbs */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 p-0.5 shadow-[0_0_25px_rgba(59,130,246,0.5)] flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0B1120] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">Automated Data Ingestion & EDA</span>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Upload & Analyze</h1>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Drop any road accident or traffic dataset — get instant statistical validation, column schema profiling, 
            10+ auto-generated charts, and executive PDF reports with zero manual setup.
          </p>

          {/* Supported Format Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-400 font-medium mr-1">Supported Formats:</span>
            {formats.map((f, i) => (
              <span key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${f.color}`}>
                <f.icon className="w-3.5 h-3.5" />
                <span>{f.label}</span>
              </span>
            ))}
            <span className="text-[11px] text-slate-500 font-mono ml-2">Max file size: 50 MB</span>
          </div>
        </div>

        {/* Right Info Box */}
        <div className="hidden lg:flex flex-col items-end justify-center p-4 rounded-2xl bg-[#0B1120]/60 border border-white/10 text-right space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Local & Private Processing</span>
          </div>
          <p className="text-[11px] text-slate-400 max-w-[200px]">
            Data parsed entirely on your local machine. No external cloud transfer.
          </p>
        </div>
      </div>
    </div>
  );
}
