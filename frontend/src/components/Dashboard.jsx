import React from 'react';
import { 
  Activity, HeartPulse, AlertTriangle, Gauge, Clock, 
  Car, MapPin, CloudRain, Download
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid 
} from 'recharts';

import KPICard from './KPICard';
import SectionHeader from './SectionHeader';
import ChartCard from './ChartCard';

const PIE_COLORS = ['#3B82F6', '#22D3EE', '#8B5CF6', '#F43F5E', '#10B981', '#F59E0B'];

export default function Dashboard({ summary, charts, loading }) {
  if (loading || !summary || !charts) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium animate-pulse text-sm">Loading accident analytics data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── ROW 1: [KPI] [KPI] [KPI] [KPI] (Flat, Equal) ── */}
      <div>
        <SectionHeader 
          number="01" 
          title="Key Performance Indicators" 
          subtitle="Real-time macro accident analytics and risk indices"
          actions={
            <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold text-xs shadow-glow flex items-center gap-2 transition-all">
              <Download className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <KPICard 
            title="Total Accidents Analyzed"
            value={summary.total_accidents}
            change="+2.4% vs prev batch"
            isPositive={true}
            icon={Activity}
            colorTheme="blue"
          />

          <KPICard 
            title="Total Casualties Recorded"
            value={summary.total_casualties}
            change={`Avg ${(summary.total_casualties / summary.total_accidents).toFixed(2)} per incident`}
            isPositive={false}
            icon={HeartPulse}
            colorTheme="rose"
          />

          <KPICard 
            title="Fatal Incidents"
            value={summary.fatal_accidents}
            change={`${summary.fatal_rate_pct}% Fatal Rate`}
            isPositive={false}
            icon={AlertTriangle}
            colorTheme="amber"
          />

          <KPICard 
            title="Avg Hotspot Risk Index"
            value={`${(summary.avg_risk_score * 100).toFixed(1)}/100`}
            change={`Highest: ${summary.highest_accident_state}`}
            isPositive={true}
            icon={Gauge}
            colorTheme="cyan"
          />
        </div>
      </div>

      {/* ── ROW 2: [ Chart 1 ] [ Chart 2 ] (Equal 50/50 Split) ── */}
      <div>
        <SectionHeader 
          number="02" 
          title="Temporal Trends & Primary Crash Causes" 
          subtitle="Hourly accident distribution and breakdown of primary reported drivers"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1 (Equal 50% Width) */}
          <ChartCard 
            icon={Clock} 
            title="Hourly Accident Frequency & Risk Profile" 
            subtitle="Crash volume trend across 24-hour cycle"
          >
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.hourly_trend}>
                  <defs>
                    <linearGradient id="colorBlueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.08)" />
                  <XAxis dataKey="hour" stroke="#64748B" tickFormatter={(h) => `${h}:00`} tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(11, 17, 32, 0.95)', borderColor: 'rgba(99, 179, 237, 0.3)', borderRadius: '12px', color: '#F8FAFC', boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)' }} 
                    formatter={(val, name) => [val, name === 'accidents' ? 'Total Incidents' : 'Avg Risk Index']}
                    labelFormatter={(h) => `Hour: ${h}:00`}
                  />
                  <Area type="monotone" dataKey="accidents" stroke="#60A5FA" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBlueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Chart 2 (Equal 50% Width) */}
          <ChartCard 
            icon={Car} 
            title="Primary Accident Drivers Breakdown" 
            subtitle="Categorical breakdown of reported crash causes"
            showTimeSwitcher={false}
          >
            <div className="h-[230px] w-full my-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.cause_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="cause"
                  >
                    {charts.cause_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(11, 17, 32, 0.95)', borderColor: 'rgba(99, 179, 237, 0.3)', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-3 border-t border-[rgba(99,179,237,0.12)]">
              {charts.cause_distribution.slice(0, 6).map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                  <span className="capitalize truncate text-[11px]">{item.cause}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>

      {/* ── ROW 3: [       Chart 3       ] (Full Width) ── */}
      <div>
        <SectionHeader 
          number="03" 
          title="Environmental & Weather Impact Matrix" 
          subtitle="Severity distribution cross-tabulated against weather conditions"
        />

        <ChartCard 
          icon={CloudRain} 
          title="Weather Condition vs Accident Severity" 
          subtitle="Fatal, Major, and Minor incidents across weather conditions"
          showTimeSwitcher={false}
        >
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.weather_severity}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.08)" />
                <XAxis dataKey="weather" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(11, 17, 32, 0.95)', borderColor: 'rgba(99, 179, 237, 0.3)', borderRadius: '12px' }} />
                <Bar dataKey="fatal" name="Fatal" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="major" name="Major" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="minor" name="Minor" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* ── ROW 4: [       Chart 4       ] (Full Width) ── */}
      <div>
        <SectionHeader 
          number="04" 
          title="State-Wise Geographic Distribution" 
          subtitle="High-volume state crash and casualty hotspots across India"
        />

        <ChartCard 
          icon={MapPin} 
          title="State-Wise Incident & Casualty Volume" 
          subtitle="Total accidents compared with reported casualties per state"
        >
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.state_breakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.08)" />
                <XAxis dataKey="state" stroke="#64748B" interval={0} tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(11, 17, 32, 0.95)', borderColor: 'rgba(99, 179, 237, 0.3)', borderRadius: '12px' }} />
                <Bar dataKey="accidents" name="Total Accidents" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="casualties" name="Casualties" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
