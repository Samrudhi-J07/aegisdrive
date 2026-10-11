import React from 'react';
import { BarChart3, Search, BrainCircuit, FileDown, ShieldCheck } from 'lucide-react';

export default function FeaturesGrid() {
  const FEATURES = [
    {
      icon: BarChart3,
      title: "10+ Auto-Generated Charts",
      desc: "Instantly generates numerical histograms, categorical frequency bars, correlation heatmaps, and missing value distributions.",
      gradient: "from-blue-500 to-cyan-400"
    },
    {
      icon: Search,
      title: "Smart Schema Profiling",
      desc: "Auto-detects data types, evaluates missingness ratios, checks data hygiene, and computes a composite 0–100 Data Health Score.",
      gradient: "from-cyan-400 to-teal-400"
    },
    {
      icon: BrainCircuit,
      title: "ML Severity & Hotspot Risk",
      desc: "Runs multi-class XGBoost models to predict fatal/major/minor probabilities and estimates road safety risk indexes.",
      gradient: "from-violet-500 to-purple-400"
    },
    {
      icon: FileDown,
      title: "Executive PDF Export",
      desc: "Compiles complete findings into a professional, multi-page ReportLab PDF document with styled tables and safety recommendations.",
      gradient: "from-amber-400 to-orange-500"
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Automated Pipeline Capabilities
        </h3>
        <p className="text-xs text-slate-400">Everything you get within seconds of dropping your data file.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {FEATURES.map((feat, idx) => {
          const IconComp = feat.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-[#131A2B] border border-[rgba(99,179,237,0.15)] p-5 transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feat.gradient} p-0.5 shadow-glow mb-3`}>
                  <div className="w-full h-full bg-[#0B1120] rounded-[10px] flex items-center justify-center">
                    <IconComp className="w-5 h-5 text-white" />
                  </div>
                </div>

                <h4 className="text-sm font-bold text-white mb-1.5">{feat.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
