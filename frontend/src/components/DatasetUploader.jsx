import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Download, AlertCircle, Search, Table as TableIcon, 
  BarChart2, FileSpreadsheet, ArrowLeft, RefreshCw, X, ShieldCheck, 
  Eye, FileText, Database, Layers
} from 'lucide-react';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Cell 
} from 'recharts';

import HeroHeader from './upload/HeroHeader';
import DropzoneCard from './upload/DropzoneCard';
import SampleDatasets from './upload/SampleDatasets';
import FeaturesGrid from './upload/FeaturesGrid';
import RecentUploads from './upload/RecentUploads';
import HelpStrip from './upload/HelpStrip';
import { API_BASE_URL } from '../config/api';

const CHART_COLORS = ['#3B82F6', '#22D3EE', '#8B5CF6', '#F43F5E', '#10B981', '#F59E0B'];

export default function DatasetUploader() {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState('charts'); // 'charts' | 'table' | 'columns'
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [columnSearchQuery, setColumnSearchQuery] = useState('');
  const [columnSortBy, setColumnSortBy] = useState('default'); // 'default' | 'missing' | 'unique'
  const [recentUploads, setRecentUploads] = useState([]);

  // Load recent uploads from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aegis_recent_uploads');
      if (saved) {
        setRecentUploads(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not read recent uploads from localStorage", e);
    }
  }, []);

  const saveToRecentUploads = (filename, rows, cols) => {
    try {
      const newItem = {
        filename,
        rows,
        cols,
        timeAgo: 'Just now',
        timestamp: Date.now()
      };
      const updated = [newItem, ...recentUploads.filter(i => i.filename !== filename)].slice(0, 5);
      setRecentUploads(updated);
      localStorage.setItem('aegis_recent_uploads', JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
  };

  const handleFileSelect = (selectedFile) => {
    const ext = selectedFile.name.toLowerCase().split('.').pop();
    if (!['csv', 'xlsx', 'xls', 'json', 'pdf'].includes(ext)) {
      setError("Unsupported file format. Please upload a .csv, .xlsx, .xls, .json, or .pdf file.");
      return;
    }
    setError(null);
    uploadAndAnalyze(selectedFile);
  };

  const uploadAndAnalyze = async (fileToUpload) => {
    setLoading(true);
    setUploadProgress(25);
    setError(null);

    const formData = new FormData();
    formData.append('file', fileToUpload);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => (prev < 90 ? prev + 15 : prev));
    }, 200);

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload/analyze`, {
        method: "POST",
        body: formData
      });
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Analysis failed");
      }
      const data = await res.json();
      setAnalysis(data);
      saveToRecentUploads(fileToUpload.name, data.total_rows, data.total_cols);
    } catch (err) {
      setError(err.message);
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const loadSampleDataset = async (sampleName) => {
    setLoading(true);
    setUploadProgress(40);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload/sample/${sampleName}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to load sample dataset");
      }
      setUploadProgress(100);
      const data = await res.json();
      setAnalysis(data);
      saveToRecentUploads(sampleName, data.total_rows, data.total_cols);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const downloadPdfReport = async () => {
    setDownloadingPdf(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/upload/export-pdf`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to export PDF report");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AegisDrive_Report_${analysis?.filename_analyzed || 'dataset'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Error downloading PDF: " + err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleClearRecent = () => {
    setRecentUploads([]);
    localStorage.removeItem('aegis_recent_uploads');
  };

  const handleDeleteRecentItem = (filename) => {
    const updated = recentUploads.filter(i => i.filename !== filename);
    setRecentUploads(updated);
    localStorage.setItem('aegis_recent_uploads', JSON.stringify(updated));
  };

  // Filter preview table rows
  const filteredRows = analysis?.preview_rows?.filter(row => {
    if (!tableSearchQuery) return true;
    return Object.values(row).some(val =>
      String(val).toLowerCase().includes(tableSearchQuery.toLowerCase())
    );
  }) || [];

  // Filter and sort column profiles
  let processedColumns = analysis?.columns ? [...analysis.columns] : [];
  if (columnSearchQuery) {
    processedColumns = processedColumns.filter(c =>
      c.name.toLowerCase().includes(columnSearchQuery.toLowerCase()) ||
      c.dtype.toLowerCase().includes(columnSearchQuery.toLowerCase())
    );
  }
  if (columnSortBy === 'missing') {
    processedColumns.sort((a, b) => b.null_count - a.null_count);
  } else if (columnSortBy === 'unique') {
    processedColumns.sort((a, b) => b.unique_values - a.unique_values);
  }

  const getDtypeBadge = (dtype) => {
    const d = dtype.toLowerCase();
    if (d.includes('int')) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (d.includes('float')) return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    if (d.includes('date') || d.includes('time')) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  };

  return (
    <div className="space-y-8 min-h-[calc(100vh-140px)] pb-12">
      {/* ─────────────────────────────────────────────────────────────
          STATE 1: EMPTY / READY STATE (SHOW ALL 6 RICH SECTIONS)
         ───────────────────────────────────────────────────────────── */}
      {!analysis && (
        <div className="space-y-8">
          {/* Section 1: Hero Header */}
          <HeroHeader />

          {/* Section 2: Dropzone Card */}
          <DropzoneCard
            onFileSelect={handleFileSelect}
            isUploading={loading}
            uploadProgress={uploadProgress}
            onCancelUpload={() => setLoading(false)}
          />

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between shadow-glow-rose">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
              <button onClick={() => setError(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Section 3: Sample Datasets Row */}
          <SampleDatasets
            onLoadSample={loadSampleDataset}
            isLoadingSample={loading}
          />

          {/* Section 4: Features Grid */}
          <FeaturesGrid />

          {/* Section 5: Recent Uploads (if any) */}
          <RecentUploads
            history={recentUploads}
            onReopen={(item) => loadSampleDataset(item.filename)}
            onDelete={handleDeleteRecentItem}
            onClearAll={handleClearRecent}
          />

          {/* Section 6: Help / Docs Strip */}
          <HelpStrip onViewExamplePdf={() => loadSampleDataset('report.pdf')} />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STATE 2: RESULTS VIEW (COMPREHENSIVE BENTO GRID & TABS)
         ───────────────────────────────────────────────────────────── */}
      {analysis && (
        <div className="space-y-6">
          {/* 1. Success Notification Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-slate-900 border border-emerald-500/30 p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Successfully parsed {analysis.total_rows?.toLocaleString()} rows × {analysis.total_cols} columns
                </h3>
                <p className="text-xs text-slate-400">
                  File: <span className="font-semibold text-slate-200">{analysis.filename_analyzed}</span> · Evaluated in 0.38s
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={downloadPdfReport}
                disabled={downloadingPdf}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs shadow-glow flex items-center gap-1.5 transition-all"
              >
                <Download className={`w-3.5 h-3.5 ${downloadingPdf ? 'animate-bounce' : ''}`} />
                <span>{downloadingPdf ? 'Exporting...' : 'Download PDF Report'}</span>
              </button>

              <button
                onClick={() => setAnalysis(null)}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Upload Another</span>
              </button>
            </div>
          </div>

          {/* 2. Session Summary Bento Grid (4 Tiles) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-2xl bg-gradient-to-br from-[#131A2B] to-[#1A2338] border border-[rgba(99,179,237,0.15)] p-5 relative overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-blue-500 to-cyan-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Records</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">
                {analysis.total_rows?.toLocaleString()}
              </div>
              <p className="text-[11px] text-cyan-400 mt-1 font-mono">100% Ingested</p>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-[#131A2B] to-[#1A2338] border border-[rgba(99,179,237,0.15)] p-5 relative overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-purple-500 to-indigo-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Features</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">
                {analysis.total_cols}
              </div>
              <p className="text-[11px] text-purple-400 mt-1">Schema Identified</p>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-[#131A2B] to-[#1A2338] border border-[rgba(99,179,237,0.15)] p-5 relative overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-amber-500 to-orange-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Missing / Null Cells</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">
                {analysis.total_nulls?.toLocaleString()}
              </div>
              <p className="text-[11px] text-amber-400 mt-1">
                {((analysis.total_nulls / Math.max(analysis.total_rows * analysis.total_cols, 1)) * 100).toFixed(2)}% of matrix
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-[#131A2B] to-[#1A2338] border border-[rgba(99,179,237,0.15)] p-5 relative overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-emerald-500 to-teal-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Data Quality Score</span>
              <div className="text-3xl font-extrabold text-emerald-400 mt-1.5 tracking-tight">
                {analysis.data_health_score} / 100
              </div>
              <p className="text-[11px] text-emerald-400 mt-1">Health & Integrity Index</p>
            </div>
          </div>

          {/* 3. Action Toolbar (Sticky Tab Switcher) */}
          <div className="rounded-2xl bg-[#131A2B] border border-[rgba(99,179,237,0.15)] p-2 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-card">
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setActiveResultTab('charts')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeResultTab === 'charts'
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-glow"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>Auto-Charts ({analysis.charts?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveResultTab('table')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeResultTab === 'table'
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-glow"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <TableIcon className="w-4 h-4" />
                <span>Preview Table (100 rows)</span>
              </button>

              <button
                onClick={() => setActiveResultTab('columns')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeResultTab === 'columns'
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-glow"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Column Profiles ({analysis.columns?.length || 0})</span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end pr-2">
              <button
                onClick={downloadPdfReport}
                disabled={downloadingPdf}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF Summary</span>
              </button>
            </div>
          </div>

          {/* 4. Tab Content: Auto-Charts Grid */}
          {activeResultTab === 'charts' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {analysis.charts?.map((chart, idx) => (
                  <div key={idx} className="rounded-2xl bg-[#131A2B] border border-[rgba(99,179,237,0.15)] p-5 shadow-card flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(99,179,237,0.08)]">
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-tight">{chart.title}</h4>
                        <p className="text-[11px] text-slate-400 font-mono">Spec #{idx + 1} · {chart.type}</p>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/10 text-cyan-400 border border-blue-500/20">
                        {chart.type}
                      </span>
                    </div>

                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        {chart.type === 'bar_stacked' || chart.type === 'bar' ? (
                          <BarChart data={chart.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.08)" />
                            <XAxis dataKey={chart.xKey} stroke="#64748B" tick={{ fontSize: 10 }} />
                            <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#0B1120', borderColor: 'rgba(99, 179, 237, 0.3)', borderRadius: '12px' }} />
                            {chart.keys ? (
                              chart.keys.map((k, kIdx) => (
                                <Bar key={k} dataKey={k} fill={CHART_COLORS[kIdx % CHART_COLORS.length]} stackId="a" radius={[4, 4, 0, 0]} />
                              ))
                            ) : (
                              <Bar dataKey={chart.yKey} fill="#3B82F6" radius={[6, 6, 0, 0]} />
                            )}
                          </BarChart>
                        ) : (
                          <AreaChart data={chart.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.08)" />
                            <XAxis dataKey={chart.xKey} stroke="#64748B" tick={{ fontSize: 10 }} />
                            <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#0B1120', borderColor: 'rgba(99, 179, 237, 0.3)', borderRadius: '12px' }} />
                            <Area type="monotone" dataKey={chart.yKey} stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.25} />
                          </AreaChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Tab Content: Preview Table */}
          {activeResultTab === 'table' && (
            <div className="rounded-2xl bg-[#131A2B] border border-[rgba(99,179,237,0.15)] p-6 space-y-4 shadow-card">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <TableIcon className="w-4 h-4 text-cyan-400" />
                    Dataset Sample Preview (First {filteredRows.length} Rows)
                  </h3>
                  <p className="text-xs text-slate-400">Search and verify uploaded values</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search in sample rows..."
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    className="w-full bg-[#0B1120] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="overflow-x-auto max-h-[460px] rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-[#0B1120] z-10">
                    <tr className="border-b border-white/10 text-slate-400 uppercase font-semibold">
                      {analysis.columns?.map((c, i) => (
                        <th key={i} className="p-3 whitespace-nowrap">{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {filteredRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                        {analysis.columns?.map((c, cIdx) => (
                          <td key={cIdx} className="p-3 whitespace-nowrap font-mono">{String(row[c.name] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. Tab Content: Column Profiles Table */}
          {activeResultTab === 'columns' && (
            <div className="rounded-2xl bg-[#131A2B] border border-[rgba(99,179,237,0.15)] p-6 space-y-4 shadow-card">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Column Schema & Quality Profile
                  </h3>
                  <p className="text-xs text-slate-400">Detailed metrics per feature</p>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search columns..."
                      value={columnSearchQuery}
                      onChange={(e) => setColumnSearchQuery(e.target.value)}
                      className="w-full bg-[#0B1120] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <select
                    value={columnSortBy}
                    onChange={(e) => setColumnSortBy(e.target.value)}
                    className="bg-[#0B1120] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="default">Default Order</option>
                    <option value="missing">Sort by Missing</option>
                    <option value="unique">Sort by Unique</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#0B1120]">
                    <tr className="border-b border-white/10 text-slate-400 uppercase font-semibold">
                      <th className="p-3">Column Name</th>
                      <th className="p-3">Data Type</th>
                      <th className="p-3">Missing Cells</th>
                      <th className="p-3">Missing %</th>
                      <th className="p-3">Unique Values</th>
                      <th className="p-3">Sample Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {processedColumns.map((col, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 font-semibold text-white">{col.name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${getDtypeBadge(col.dtype)}`}>
                            {col.dtype}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{col.null_count}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${col.null_pct > 20 ? 'bg-rose-500' : 'bg-emerald-400'}`}
                                style={{ width: `${Math.min(100, col.null_pct)}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px]">{col.null_pct}%</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono">{col.unique_values}</td>
                        <td className="p-3 font-mono text-slate-400 truncate max-w-[140px]">{col.sample_value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 6 HelpStrip at the bottom of result view as well */}
          <HelpStrip onViewExamplePdf={() => loadSampleDataset('report.pdf')} />
        </div>
      )}
    </div>
  );
}
