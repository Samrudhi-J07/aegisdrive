import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, FileCode, FileText, ArrowRight, Loader2, X } from 'lucide-react';

export default function DropzoneCard({ onFileSelect, isUploading, uploadProgress, onCancelUpload }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isUploading && fileInputRef.current?.click()}
      className={`relative min-h-[280px] rounded-3xl border-2 transition-all duration-300 p-8 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden ${
        isDragOver
          ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_50px_rgba(34,211,238,0.3)] scale-[1.01]"
          : "border-dashed border-[rgba(99,179,237,0.25)] bg-[#131A2B]/70 hover:border-cyan-400/60 hover:bg-[#131A2B]/90 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]"
      }`}
      style={{
        backgroundImage: `radial-gradient(rgba(99, 179, 237, 0.12) 1px, transparent 1px)`,
        backgroundSize: '24px 24px'
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv, .xlsx, .xls, .json, .pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* 4 L-shaped Corner Accents */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-sm pointer-events-none opacity-80" />
      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-sm pointer-events-none opacity-80" />
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-sm pointer-events-none opacity-80" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br-sm pointer-events-none opacity-80" />

      {isUploading ? (
        /* Uploading State with Circular Ring & Progress */
        <div className="flex flex-col items-center justify-center space-y-4 py-4 z-10" onClick={(e) => e.stopPropagation()}>
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="rgba(99, 179, 237, 0.2)"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="#22D3EE"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={213}
                strokeDashoffset={213 - (213 * (uploadProgress || 65)) / 100}
                className="transition-all duration-300"
              />
            </svg>
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin absolute" />
          </div>

          <div className="space-y-1">
            <p className="text-base font-bold text-white">Analyzing & Processing Dataset...</p>
            <p className="text-xs text-slate-400">Validating columns, calculating missingness, auto-generating charts ({uploadProgress || 65}%)</p>
          </div>

          {onCancelUpload && (
            <button
              onClick={onCancelUpload}
              className="mt-2 px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 flex items-center gap-1.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      ) : (
        /* Default / Drag-Over State */
        <div className="space-y-4 z-10">
          <div className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-cyan-400/30 flex items-center justify-center transition-all duration-300 ${
            isDragOver ? "scale-115 rotate-6 shadow-[0_0_30px_rgba(34,211,238,0.5)]" : "group-hover:scale-105"
          }`}>
            <UploadCloud className={`w-8 h-8 text-cyan-400 ${isDragOver ? "animate-bounce" : "animate-pulse"}`} />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Drag & drop your dataset file here
            </h3>
            <p className="text-xs text-slate-400">
              Supports structured tables, spreadsheets, JSON records, or police crash incident PDFs
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="h-[1px] w-12 bg-white/10" />
            <span className="text-[11px] text-slate-500 uppercase font-semibold">or</span>
            <div className="h-[1px] w-12 bg-white/10" />
          </div>

          <button
            type="button"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold text-xs shadow-glow transition-all inline-flex items-center gap-2"
          >
            <span>Browse Local Files</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Formats Row */}
          <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">.CSV</span>
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">.XLSX</span>
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">.XLS</span>
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">.JSON</span>
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">.PDF</span>
          </div>
        </div>
      )}
    </div>
  );
}
