import React from 'react';

export default function SectionHeader({ number, title, subtitle, actions }) {
  return (
    <div className="mb-6 flex items-end justify-between border-b border-[rgba(99,179,237,0.15)] pb-4 mt-8 first:mt-2">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]">
          {number}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          {subtitle && <p className="text-[13px] text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
