import React from "react";
import { AlertTriangle, Clock, Eye, Layers } from "lucide-react";
import { TopSuspiciousFrame } from "../types";
import { apiService } from "../services/api";

interface SuspiciousFrameProps {
  frame: TopSuspiciousFrame;
  onInspect?: (frame: TopSuspiciousFrame) => void;
}

export const SuspiciousFrame: React.FC<SuspiciousFrameProps> = ({ frame, onInspect }) => {
  const isHighRisk = frame.fake_probability >= 0.70;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 hover:border-slate-700 transition-colors">
      <div className="relative group shrink-0 w-44 h-28 bg-black rounded-lg overflow-hidden border border-slate-800">
        <img
          src={apiService.getAssetUrl(frame.explanation_image_url || frame.original_frame_url)}
          alt={`Suspicious frame #${frame.frame_index}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-1.5 left-1.5 bg-black/75 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300">
          Rank #{frame.rank}
        </div>
      </div>

      <div className="flex-1 space-y-1.5 w-full text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200 text-sm">
              Frame #{frame.frame_index}
            </span>
            <span className="text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" /> {frame.timestamp_sec}s
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full font-semibold ${
              isHighRisk
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}
          >
            Synthetic: {(frame.fake_probability * 100).toFixed(1)}%
          </span>
        </div>

        <p className="text-slate-300 leading-relaxed">
          {frame.finding_summary}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-slate-400">
          <span>Confidence: {(frame.confidence * 100).toFixed(0)}%</span>
          {onInspect && frame.explanation_image_url && (
            <button
              onClick={() => onInspect(frame)}
              className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect Self-Attention Map</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};