import React from 'react';
import { HelpCircle, BookOpen, ExternalLink, FileText, CheckCircle } from 'lucide-react';

export default function HelpStrip({ onViewExamplePdf }) {
  return (
    <div className="rounded-3xl bg-gradient-to-r from-blue-500/10 via-[#131A2B] to-cyan-500/10 border border-[rgba(99,179,237,0.2)] p-6 shadow-card">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white tracking-tight">Need assistance formatting your crash dataset?</h4>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Any dataset containing accident identifiers, coordinates, timestamps, or severity labels works seamlessly. 
              Our engine handles missing values, detects column types automatically, and normalizes headers on the fly.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
          <button
            onClick={() => alert("Recommended Columns:\n- accident_id (int/text)\n- latitude, longitude (decimal)\n- date, time, hour (temporal)\n- weather (clear, rain, fog)\n- accident_severity (fatal, major, minor)\n- casualties (integer)")}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Schema Reference</span>
          </button>

          <button
            onClick={onViewExamplePdf}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-cyan-400/40 text-xs font-semibold text-cyan-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sample PDF Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
