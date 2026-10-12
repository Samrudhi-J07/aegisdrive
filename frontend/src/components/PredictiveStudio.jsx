import React, { useState } from 'react';
import { BrainCircuit, Sparkles, AlertTriangle, ShieldCheck, Gauge } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function PredictiveStudio() {
  const [formData, setFormData] = useState({
    hour: 20,
    is_weekend: 1,
    lanes: 3,
    traffic_signal: 0,
    visibility_num: 1,
    temperature: 24,
    vehicles_involved: 3,
    casualties: 2,
    is_peak_hour: 1,
    weather: 'fog',
    road_type: 'highway',
    traffic_density: 'high',
    cause: 'overspeeding'
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/predict/severity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Prediction error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Input Parameters Form (Left Column) */}
      <div className="glass-panel p-6 lg:col-span-7 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">ML Accident Severity Predictor</h3>
            <p className="text-xs text-gray-400">Powered by XGBoost Multi-Class Classifier & PyTorch Risk Regressor</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">Weather Condition</label>
              <select 
                value={formData.weather}
                onChange={(e) => setFormData({...formData, weather: e.target.value})}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="clear">Clear</option>
                <option value="fog">Fog / Smog</option>
                <option value="rain">Rain / Heavy Rain</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">Road Infrastructure Type</label>
              <select 
                value={formData.road_type}
                onChange={(e) => setFormData({...formData, road_type: e.target.value})}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="highway">Expressway / Highway</option>
                <option value="urban">Urban Arterial Road</option>
                <option value="rural">Rural Road</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">Primary Crash Cause</label>
              <select 
                value={formData.cause}
                onChange={(e) => setFormData({...formData, cause: e.target.value})}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="overspeeding">Overspeeding</option>
                <option value="drunk driving">Drunk Driving</option>
                <option value="distraction">Driver Distraction / Mobile Use</option>
                <option value="poor road">Potholes / Damaged Road</option>
                <option value="weather">Extreme Weather Impact</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">Traffic Density</label>
              <select 
                value={formData.traffic_density}
                onChange={(e) => setFormData({...formData, traffic_density: e.target.value})}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="low">Low Traffic Flow</option>
                <option value="medium">Medium Congestion</option>
                <option value="high">Heavy / Severe Congestion</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">Time of Incident (0-23 Hour)</label>
              <input 
                type="number" min="0" max="23"
                value={formData.hour}
                onChange={(e) => setFormData({...formData, hour: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">Visibility Level</label>
              <select 
                value={formData.visibility_num}
                onChange={(e) => setFormData({...formData, visibility_num: parseInt(e.target.value)})}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white focus:border-violet-500 focus:outline-none"
              >
                <option value={1}>Low Visibility (&lt; 50 meters)</option>
                <option value={2}>Moderate Visibility (50-200m)</option>
                <option value={3}>High Clear Visibility (&gt; 200m)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">Vehicles Involved</label>
              <input 
                type="number" min="1" max="10"
                value={formData.vehicles_involved}
                onChange={(e) => setFormData({...formData, vehicles_involved: parseInt(e.target.value) || 1})}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">Casualties / Injured Count</label>
              <input 
                type="number" min="0" max="15"
                value={formData.casualties}
                onChange={(e) => setFormData({...formData, casualties: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-glow-violet flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? "Calculating ML Probabilities..." : "Compute ML Severity & Risk Score"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Output Results Panel (Right Column) */}
      <div className="glass-panel p-6 lg:col-span-5 flex flex-col justify-between space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
            <Gauge className="w-5 h-5 text-cyan-400" />
            Inference Results & Probabilities
          </h3>
          <p className="text-xs text-gray-400">Real-time model prediction output</p>
        </div>

        {result ? (
          <div className="space-y-6">
            {/* Predicted Severity Badge */}
            <div className="glass-card p-5 border border-violet-500/30 text-center relative overflow-hidden">
              <span className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Predicted Severity</span>
              <div className={`text-3xl font-extrabold uppercase my-2 tracking-tight ${
                result.predicted_severity === 'fatal' ? 'text-rose-500' :
                (result.predicted_severity === 'major' ? 'text-amber-400' : 'text-emerald-400')
              }`}>
                {result.predicted_severity} Impact
              </div>
              <p className="text-xs text-gray-300 font-medium">
                Model Confidence: <span className="text-cyan-400 font-bold">{(result.confidence * 100).toFixed(1)}%</span>
              </p>
            </div>

            {/* Class Probabilities Bars */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Severity Class Probabilities</h4>
              
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between mb-1 text-gray-300">
                    <span>Fatal Outcome Probability</span>
                    <span className="text-rose-400 font-bold">{(result.probabilities.fatal * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div className="bg-rose-500 h-2 rounded-full transition-all duration-500" style={{ width: `${result.probabilities.fatal * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-gray-300">
                    <span>Major Injury Probability</span>
                    <span className="text-amber-400 font-bold">{(result.probabilities.major * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div className="bg-amber-400 h-2 rounded-full transition-all duration-500" style={{ width: `${result.probabilities.major * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-gray-300">
                    <span>Minor Damage Probability</span>
                    <span className="text-emerald-400 font-bold">{(result.probabilities.minor * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div className="bg-emerald-400 h-2 rounded-full transition-all duration-500" style={{ width: `${result.probabilities.minor * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Score Meter */}
            <div className="glass-card p-4 flex items-center justify-between border-t border-white/10">
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase">Hotspot Risk Index</span>
                <div className="text-2xl font-black text-cyan-400 font-mono">{(result.predicted_risk_score * 100).toFixed(1)}/100</div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
                result.risk_category === 'High Risk' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}>
                {result.risk_category}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-white/10 rounded-2xl p-6 text-center space-y-3">
            <Sparkles className="w-10 h-10 text-violet-400/50 animate-bounce" />
            <p className="text-sm text-gray-400">Fill in the environmental parameters and click "Compute ML Severity" to view instant model predictions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
