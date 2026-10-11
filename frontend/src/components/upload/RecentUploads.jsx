import React from 'react';
import { History, FileSpreadsheet, FileCode, FileText, RotateCcw, Trash2 } from 'lucide-react';

export default function RecentUploads({ history, onReopen, onDelete, onClearAll }) {
  if (!history || history.length === 0) return null;

  const getFileIcon = (filename) => {
    const ext = filename?.toLowerCase().split('.').pop();
    if (['xlsx', 'xls', 'csv'].includes(ext)) return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    if (ext === 'json') return <FileCode className="w-4 h-4 text-amber-400" />;
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-rose-400" />;
    return <FileSpreadsheet className="w-4 h-4 text-cyan-400" />;
  };

  return (
    <div className="rounded-2xl bg-[#131A2B] border border-[rgba(99,179,237,0.15)] p-6 space-y-4 shadow-card">
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(99,179,237,0.1)]">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">Recent Dataset Uploads</h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {history.length} saved
          </span>
        </div>

        <button
          onClick={onClearAll}
          className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear all</span>
        </button>
      </div>

      <div className="divide-y divide-[rgba(99,179,237,0.08)]">
        {history.map((item, idx) => (
          <div
            key={idx}
            className="py-3 flex items-center justify-between gap-4 group hover:bg-white/[0.02] px-2 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 shrink-0">
                {getFileIcon(item.filename)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                  {item.filename}
                </p>
                <p className="text-[11px] text-slate-400">
                  {item.rows?.toLocaleString()} rows · {item.cols} columns · {item.timeAgo || 'Recently'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onReopen(item)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                title="Reopen analysis"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(item.filename)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Remove from history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
