import React from 'react';
import { FileSpreadsheet, FileText, ArrowRight, Sparkles } from 'lucide-react';

export default function SampleDatasets({ onLoadSample, isLoadingSample }) {
  const SAMPLES = [
    {
      id: "indian_roads.csv",
      title: "Indian Roads Master Dataset",
      badge: "CSV",
      rows: "20,000 rows",
      size: "2.7 MB",
      desc: "Full national accident dataset across 10 major Indian states with 24 attributes.",
      icon: FileSpreadsheet,
      themeColor: "emerald",
      borderHover: "hover:border-emerald-400/50",
      iconBg: "bg-emerald-500/10 ring-emerald-500/20 text-emerald-400"
    },
    {
      id: "sample_data.xlsx",
      title: "Urban Expressway Sample",
      badge: "XLSX",
      rows: "500 rows",
      size: "45 KB",
      desc: "Curated multi-lane urban crash records including weather, speed, and casualties.",
      icon: FileSpreadsheet,
      themeColor: "blue",
      borderHover: "hover:border-blue-400/50",
      iconBg: "bg-blue-500/10 ring-blue-500/20 text-blue-400"
    },
    {
      id: "report.pdf",
      title: "Safety Audit Incident Report",
      badge: "PDF",
      rows: "Multi-table PDF",
      size: "4.2 KB",
      desc: "Structured crash summaries extracted from an official road safety audit document.",
      icon: FileText,
      themeColor: "rose",
      borderHover: "hover:border-rose-400/50",
      iconBg: "bg-rose-500/10 ring-rose-500/20 text-rose-400"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Quick Start with Pre-Loaded Sample Datasets
          </h3>
          <p className="text-xs text-slate-400">No file on hand? Click any sample below to experience the full analytics pipeline instantly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {SAMPLES.map((sample) => {
          const IconComp = sample.icon;
          return (
            <div
              key={sample.id}
              onClick={() => !isLoadingSample && onLoadSample(sample.id)}
              className={`group relative rounded-2xl bg-[#131A2B] border border-[rgba(99,179,237,0.15)] p-5 transition-all duration-300 hover:-translate-y-1 ${sample.borderHover} hover:shadow-[0_0_30px_rgba(59,130,246,0.18)] cursor-pointer flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${sample.iconBg} ring-1 transition-transform group-hover:scale-110`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-mono">
                    {sample.badge}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {sample.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {sample.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[rgba(99,179,237,0.1)] flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">
                  {sample.rows} · {sample.size}
                </span>
                <span className="text-cyan-400 group-hover:text-cyan-300 font-bold flex items-center gap-1 transition-all">
                  <span>Try sample</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
