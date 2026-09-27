import React, { useState } from 'react';
import { EvidenceItem } from '../types';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';

interface EvidenceTableProps {
  evidence: EvidenceItem[];
}

export const EvidenceTable: React.FC<EvidenceTableProps> = ({ evidence }) => {
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all'
    ? evidence
    : evidence.filter(e => e.severity === filter || e.category === filter);

  return (
    <div className="forensic-card overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-100">Structured Forensic Evidence</h4>
          <p className="text-xs text-slate-300 font-mono">{evidence.length} computational indicators localized</p>
        </div>

        <div className="flex gap-1.5">
          {['all', 'high', 'medium', 'low', 'info'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 text-xs font-mono rounded uppercase transition-colors ${
                filter === f
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-300 font-mono uppercase text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">ID</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Title & Technical Description</th>
              <th className="py-2.5 px-3">Severity</th>
              <th className="py-2.5 px-3">Confidence</th>
              <th className="py-2.5 px-3">Source & Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-mono">
                  No evidence items match active filter.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                let badgeClass = 'badge-info';
                if (item.severity === 'high' || item.severity === 'critical') badgeClass = 'badge-high';
                else if (item.severity === 'medium') badgeClass = 'badge-medium';
                else if (item.severity === 'low') badgeClass = 'badge-low';

                return (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-cyan-400">{item.id}</td>
                    <td className="py-3 px-3 uppercase font-mono text-[11px] text-slate-300">{item.category}</td>
                    <td className="py-3 px-3 max-w-md">
                      <p className="font-semibold text-slate-100">{item.title}</p>
                      <p className="text-slate-300 text-xs mt-0.5">{item.description}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold ${badgeClass}`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {(item.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                      <div>{item.source}</div>
                      {item.frame_number !== null && item.frame_number !== undefined && (
                        <div className="text-cyan-400">Frame #{item.frame_number}</div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
