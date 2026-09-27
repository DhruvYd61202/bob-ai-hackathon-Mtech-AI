import React, { useEffect, useState } from "react";
import { Cpu, CheckCircle2, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Layers, Activity } from "lucide-react";
import { apiService } from "../services/api";
import { ModelStatusResponse } from "../types";

export const ModelStatus: React.FC = () => {
  const [status, setStatus] = useState<ModelStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await apiService.getModelsStatus();
      setStatus(res);
    } catch (e) {
      console.error("Failed to load model status", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (!status && loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3 animate-pulse">
        <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
        <span className="text-sm text-slate-400">Querying neural model statuses & compute devices...</span>
      </div>
    );
  }

  if (!status) return null;

  const { device_info, models } = status;
  const isCuda = device_info.cuda_available;

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 mb-6 shadow-lg backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              Deep Learning Inference Engines
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Active & Pre-Trained
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Compute Device: <span className="font-mono text-slate-300">{device_info.resolved_target.toUpperCase()}</span>
              {isCuda && device_info.gpu_name ? ` (${device_info.gpu_name})` : " (Native CPU Architecture)"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Refresh model status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 transition-colors font-medium"
          >
            <span>{expanded ? "Hide Provenance" : "View Architecture Provenance"}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Model Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {Object.entries(models).map(([key, m]) => (
          <div
            key={key}
            className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  {key.replace("_", " ")}
                </span>
                <h4 className="text-xs font-semibold text-slate-200 mt-0.5 truncate" title={m.name}>
                  {m.name}
                </h4>
              </div>
              {m.loaded ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono text-slate-300 truncate max-w-[120px]" title={m.model_id}>
                {m.model_id.split("/").pop()}
              </span>
              <span className="text-emerald-400/90 font-medium">Ready</span>
            </div>
          </div>
        ))}
      </div>

      {/* Expanded Provenance Drawer */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
          <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Neural Model Provenance & Verification Matrix
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {Object.entries(models).map(([key, m]) => {
              const meta = m.metadata;
              return (
                <div key={key} className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3">
                  <div className="font-semibold text-slate-200 mb-1 flex items-center justify-between">
                    <span>{m.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      v{meta?.version || "1.0.0"}
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-400 text-[11px]">
                    <p><span className="text-slate-400">Architecture:</span> <span className="text-slate-300">{meta?.architecture}</span></p>
                    <p><span className="text-slate-400">Framework:</span> <span className="text-slate-300">{meta?.framework}</span></p>
                    <p><span className="text-slate-400">Input Specification:</span> <span className="font-mono text-slate-300">{meta?.input_shape}</span></p>
                    <p><span className="text-slate-400">Source:</span> <a href={meta?.source} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">{meta?.source}</a></p>
                    {meta?.paper_citation && (
                      <p><span className="text-slate-400">Citation:</span> <span className="italic text-slate-300">{meta.paper_citation}</span></p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};