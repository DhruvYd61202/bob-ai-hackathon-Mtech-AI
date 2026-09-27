import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface AnalysisProgressProps {
  currentStage: 'uploading' | 'processing' | 'analyzing' | 'evidence' | 'completed';
}

const STAGES = [
  { id: 'uploading', label: '1. Ingestion & Validation' },
  { id: 'processing', label: '2. Frame & Audio Decoding' },
  { id: 'analyzing', label: '3. Multi-Channel Signal Inspection' },
  { id: 'evidence', label: '4. Evidence Graph & BOB Synthesis' },
  { id: 'completed', label: '5. Forensic Dossier Ready' }
];

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ currentStage }) => {
  const currentIndex = STAGES.findIndex(s => s.id === currentStage);

  return (
    <div className="forensic-card p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-semibold text-slate-100 text-sm">DeepFake Pipeline Execution</h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">Active computation across local forensic heuristics</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>RUNNING</span>
        </div>
      </div>

      <div className="space-y-4">
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentIndex || currentStage === 'completed';
          const isCurrent = idx === currentIndex && currentStage !== 'completed';

          return (
            <div key={stage.id} className="flex items-center gap-4">
              <div className="shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-700 bg-slate-900" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-mono font-medium ${isCurrent ? 'text-cyan-400' : isDone ? 'text-slate-200' : 'text-slate-500'}`}>
                  {stage.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
