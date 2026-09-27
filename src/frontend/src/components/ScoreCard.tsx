import React from 'react';
import { ScoresResult } from '../types';

interface ScoreCardProps {
  scores: ScoresResult;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ scores }) => {
  const channels = [
    { label: 'Visual Artifacts (ELA / Noise / FFT)', value: scores.visual },
    { label: 'Acoustic Coherence (MFCC / Spectral)', value: scores.audio },
    { label: 'Temporal Consistency (Jitter / SSIM)', value: scores.temporal },
    { label: 'Metadata Provenance (EXIF / Codec)', value: scores.metadata },
  ];

  const getScoreColor = (val: number) => {
    if (val >= 0.65) return 'bg-rose-500 text-rose-400';
    if (val >= 0.35) return 'bg-amber-500 text-amber-400';
    return 'bg-emerald-500 text-emerald-400';
  };

  return (
    <div className="forensic-card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-100">Multimodal Signal Channels</h4>
          <p className="text-xs text-slate-300 font-mono">Weighted heuristic evaluation (0.00 = Authentic, 1.00 = Tampered)</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-slate-300">FUSION RISK SCORE</span>
          <p className="text-lg font-bold font-mono text-cyan-400">
            {(scores.fusion * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {channels.map((ch) => {
          const colorCls = getScoreColor(ch.value);
          const percent = Math.round(ch.value * 100);

          return (
            <div key={ch.label} className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">{ch.label}</span>
                <span className="font-semibold text-slate-100">{percent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${colorCls.split(' ')[0]}`}
                  style={{ width: `${Math.max(5, percent)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
