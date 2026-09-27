import React from "react";
import { SyncAnalysis } from "../types";
import { Mic, Video, Activity, Info, CheckCircle, AlertTriangle } from "lucide-react";

interface SyncAnalysisCardProps {
  syncData?: SyncAnalysis | null;
}

export const SyncAnalysisCard: React.FC<SyncAnalysisCardProps> = ({ syncData }) => {
  if (!syncData) return null;

  const isAnomalous = syncData.is_anomalous;
  const isAvailable = syncData.available;

  return (
    <div className="forensic-card p-5 space-y-4 border border-slate-800 bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Audio-Visual Synchronization Analysis
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Temporal correlation between facial mouth landmarks and speech acoustic energy
            </p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-amber-950/80 border border-amber-800/80 text-amber-300">
          Supporting Signal
        </span>
      </div>

      {!isAvailable ? (
        <div className="p-3 rounded bg-slate-950/40 border border-slate-800/50 text-xs font-mono text-slate-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500 shrink-0" />
          <span>{syncData.finding_summary || "Audio-visual sync analysis not available for this media."}</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-1">Sync Alignment Score</span>
              <span className={`text-xl font-bold ${isAnomalous ? "text-rose-400" : "text-emerald-400"}`}>
                {(syncData.sync_score * 100).toFixed(1)}%
              </span>
            </div>
            <div className="p-3 rounded bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-1">Pearson Correlation (r)</span>
              <span className="text-xl font-bold text-cyan-300">
                {syncData.correlation >= 0 ? `+${syncData.correlation.toFixed(3)}` : syncData.correlation.toFixed(3)}
              </span>
            </div>
            <div className="p-3 rounded bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-1">Desynchronization Risk</span>
              <span className={`text-xl font-bold ${isAnomalous ? "text-amber-400" : "text-slate-300"}`}>
                {(syncData.desync_risk * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className={`p-3 rounded border text-xs font-mono flex items-start gap-2.5 ${
            isAnomalous
              ? "bg-rose-950/30 border-rose-800/60 text-rose-300"
              : "bg-emerald-950/20 border-emerald-800/50 text-emerald-300"
          }`}>
            {isAnomalous ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold mb-0.5">
                {isAnomalous ? "Elevated Desynchronization Detected" : "Nominal Audio-Visual Coherence"}
              </p>
              <p className="text-[11px] opacity-90 leading-relaxed">{syncData.finding_summary}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
