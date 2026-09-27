import React from 'react';

interface TimelineProps {
  frameBreakdown?: Array<{
    frame_number: number;
    timestamp: number;
    face_count: number;
    laplacian_var: number;
  }>;
  onFrameClick?: (frameNum: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ frameBreakdown }) => {
  if (!frameBreakdown || frameBreakdown.length === 0) return null;

  return (
    <div className="forensic-card p-4 space-y-3">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="font-semibold text-slate-200">Temporal Frame-Sampling Timeline</span>
        <span className="text-slate-400">{frameBreakdown.length} sampled frames</span>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {frameBreakdown.map((f) => (
          <div
            key={f.frame_number}
            className={`shrink-0 w-16 p-2 rounded border text-center font-mono text-[10px] transition-colors ${
              f.face_count > 0
                ? 'bg-slate-900 border-cyan-800/60 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <div className="font-bold">F#{f.frame_number}</div>
            <div className="text-[9px] text-slate-400">{f.timestamp}s</div>
            <div className="mt-1">
              <span className={`px-1 py-0.5 rounded text-[8px] ${f.face_count > 0 ? 'bg-cyan-950 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                {f.face_count} face
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
