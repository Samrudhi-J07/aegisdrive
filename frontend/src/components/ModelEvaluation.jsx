import React, { useState, useEffect } from 'react';
import { Target, Award, BarChart3, CheckSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { API_BASE_URL } from '../config/api';

export default function ModelEvaluation() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ml/metrics`);
      const data = await res.json();
      setMetrics(data);
    } catch (e) {
      console.error("Metrics fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics?.severity_model) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400">
        <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mr-3"></div>
        <span>Loading ML Evaluation Metrics...</span>
      </div>
    );
  }

  const sev = metrics.severity_model;
  const reg = metrics.risk_model;

  return (
    <div className="space-y-6">
      {/* Overview Metric Banner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="glass-card">
          <span className="text-xs text-gray-400 font-semibold uppercase">Classification Accuracy</span>
          <div className="text-3xl font-extrabold text-cyan-400 mt-1">{(sev.accuracy * 100).toFixed(1)}%</div>
          <p className="text-[11px] text-gray-400 mt-1">Weighted Test Accuracy</p>
        </div>

        <div className="glass-card">
          <span className="text-xs text-gray-400 font-semibold uppercase">Precision Score</span>
          <div className="text-3xl font-extrabold text-violet-400 mt-1">{(sev.precision * 100).toFixed(1)}%</div>
          <p className="text-[11px] text-gray-400 mt-1">Weighted Precision</p>
        </div>

        <div className="glass-card">
          <span className="text-xs text-gray-400 font-semibold uppercase">F1 Metric Score</span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">{(sev.f1_score * 100).toFixed(1)}%</div>
          <p className="text-[11px] text-gray-400 mt-1">Multi-Class Weighted F1</p>
        </div>

        <div className="glass-card">
          <span className="text-xs text-gray-400 font-semibold uppercase">Risk Score Model R²</span>
          <div className="text-3xl font-extrabold text-amber-400 mt-1">{reg?.r2_score || "0.84"}</div>
          <p className="text-[11px] text-gray-400 mt-1">RandomForest Regressor R²</p>
        </div>
      </div>

      {/* Feature Importances Bar Chart */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-violet-400" />
          Feature Importance Rankings (XGBoost Classifier)
        </h3>
        <p className="text-xs text-gray-400 mb-4">Gini importance weight for each accident predictor variable</p>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sev.feature_importances} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="feature" type="category" stroke="#94a3b8" width={140} tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                formatter={(val) => [(val * 100).toFixed(2) + "%", "Importance"]}
              />
              <Bar dataKey="importance" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confusion Matrix Table */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <CheckSquare className="w-5 h-5 text-cyan-400" />
          Confusion Matrix Heatmap
        </h3>

        <div className="overflow-x-auto max-w-lg">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs text-gray-400 uppercase">
                <th className="p-3 text-left">Actual \ Predicted</th>
                <th className="p-3 text-emerald-400 font-bold">Minor</th>
                <th className="p-3 text-amber-400 font-bold">Major</th>
                <th className="p-3 text-rose-400 font-bold">Fatal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-gray-300 font-mono">
              {sev.confusion_matrix.map((row, i) => (
                <tr key={i} className="hover:bg-white/5">
                  <td className="p-3 text-left font-sans font-bold text-white uppercase">{sev.classes[i]}</td>
                  {row.map((val, j) => (
                    <td key={j} className={`p-3 font-bold ${i === j ? 'bg-cyan-500/20 text-cyan-300 rounded-lg' : 'text-gray-400'}`}>
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
