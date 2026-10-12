import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import FilterBar from './components/FilterBar';
import Dashboard from './components/Dashboard';
import GeospatialMap from './components/GeospatialMap';
import PredictiveStudio from './components/PredictiveStudio';
import WhatIfSimulator from './components/WhatIfSimulator';
import BigDataAnalytics from './components/BigDataAnalytics';
import ModelEvaluation from './components/ModelEvaluation';
import DatasetUploader from './components/DatasetUploader';
import AegisChatbot from './components/AegisChatbot';
import { API_BASE_URL } from './config/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedWeather, setSelectedWeather] = useState('all');
  const [selectedRoadType, setSelectedRoadType] = useState('all');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [sumRes, chartRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/analytics/summary`),
        fetch(`${API_BASE_URL}/api/analytics/charts`)
      ]);
      const sumData = await sumRes.json();
      const chartData = await chartRes.json();
      setSummary(sumData);
      setCharts(chartData);
    } catch (e) {
      console.error("Failed to connect to FastAPI backend:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedState('all');
    setSelectedSeverity('all');
    setSelectedWeather('all');
    setSelectedRoadType('all');
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Redesigned Sticky Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Sticky Filter Toolbar (Dashboard & Map views) */}
        {(activeTab === 'dashboard' || activeTab === 'map') && (
          <FilterBar 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedState={selectedState}
            setSelectedState={setSelectedState}
            selectedSeverity={selectedSeverity}
            setSelectedSeverity={setSelectedSeverity}
            selectedWeather={selectedWeather}
            setSelectedWeather={setSelectedWeather}
            selectedRoadType={selectedRoadType}
            setSelectedRoadType={setSelectedRoadType}
            onReset={handleResetFilters}
          />
        )}

        {/* Dynamic Tab Views */}
        {activeTab === 'dashboard' && (
          <Dashboard summary={summary} charts={charts} loading={loading} />
        )}
        {activeTab === 'map' && <GeospatialMap />}
        {activeTab === 'predict' && <PredictiveStudio />}
        {activeTab === 'simulator' && <WhatIfSimulator />}
        {activeTab === 'bigdata' && <BigDataAnalytics />}
        {activeTab === 'metrics' && <ModelEvaluation />}
        {activeTab === 'upload' && <DatasetUploader />}
      </main>

      {/* Floating Aegis AI Chatbot */}
      <AegisChatbot setActiveTab={setActiveTab} />

      {/* Footer */}
      <footer className="border-t border-[rgba(99,179,237,0.12)] bg-[#090E1A] px-6 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <span>AegisDrive AI Platform — PySpark Big Data & XGBoost ML Engine</span>
          <span className="font-mono text-slate-400">Dataset: 20,000+ Records | Port 8000 API | Port 5173 Frontend</span>
        </div>
      </footer>
    </div>
  );
}
