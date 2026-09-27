import React, { useState } from "react";
import { Film, AlertTriangle, CheckCircle, Clock, Eye } from "lucide-react";
import { FrameItem } from "../types";
import { apiService } from "../services/api";

interface FrameTimelineProps {
  frames: FrameItem[];
  temporalMetrics?: {
    temporal_risk_score?: number;
    variance?: number;
    inter_frame_jitter?: number;
    peak_frame_index?: number;
  };
  onSelectFrame?: (frame: FrameItem) => void;
}

export const FrameTimeline: React.FC<FrameTimelineProps> = ({
  frames,
  temporalMetrics,
  onSelectFrame
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  if (!frames || frames.length === 0) return null;

  const currentFrame = frames[selectedIdx] || frames[0];

  const handleFrameClick = (idx: number) => {
    setSelectedIdx(idx);
    if (onSelectFrame) {
      onSelectFrame(frames[idx]);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Video Frame Timeline Scrubber
            </h3>
            <p className="text-xs text-slate-400">
              {frames.length} frames sampled across video duration &bull; Evaluated frame-by-frame
            </p>
          </div>
        </div>

        {temporalMetrics && (
          <div className="flex items-center gap-3 text-xs bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-400">Temporal Risk: </span>
              <span className="font-semibold text-slate-200">
                {((temporalMetrics.temporal_risk_score || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <span className="text-slate-400">Jitter: </span>
              <span className="font-mono text-slate-200">
                {(temporalMetrics.inter_frame_jitter || 0).toFixed(3)}
              </span>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <span className="text-slate-400">Variance: </span>
              <span className="font-mono text-slate-200">
                {(temporalMetrics.variance || 0).toFixed(4)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Frame Timeline Bar Scrubber */}
      <div className="mb-4">
        <div className="flex items-end gap-1 h-14 bg-slate-950/80 p-2 rounded-lg border border-slate-800 overflow-x-auto">
          {frames.map((f, i) => {
            const p = f.fake_probability;
            const isSelected = i === selectedIdx;
            const heightPct = Math.max(15, Math.round(p * 100));
            const barColor =
              p >= 0.70
                ? "bg-rose-500 hover:bg-rose-400"
                : p >= 0.45
                ? "bg-amber-500 hover:bg-amber-400"
                : "bg-emerald-500 hover:bg-emerald-400";

            return (
              <button
                key={f.frame_index}
                onClick={() => handleFrameClick(i)}
                style={{ height: `${heightPct}%` }}
                title={`Frame #${f.frame_index} (${f.timestamp_sec}s) - Fake: ${(p * 100).toFixed(0)}%`}
                className={`flex-1 min-w-[8px] rounded-t transition-all ${barColor} ${
                  isSelected ? "ring-2 ring-white ring-offset-1 ring-offset-slate-900" : "opacity-85"
                }`}
              />
            );
          })}
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400 px-1 mt-1 font-mono">
          <span>0.00s</span>
          <span>Timeline Progression &rarr;</span>
          <span>{frames[frames.length - 1]?.timestamp_sec || 0}s</span>
        </div>
      </div>

      {/* Selected Frame Detail Inspection */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative group shrink-0 w-48 h-32 bg-black rounded-lg overflow-hidden border border-slate-800">
          <img
            src={apiService.getAssetUrl(currentFrame.frame_url)}
            alt={`Frame #${currentFrame.frame_index}`}
            className="w-full h-full object-cover"
          />
          {currentFrame.explanation_image_url && (
            <div className="absolute inset-0 bg-indigo-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
              <span className="text-xs text-white flex items-center gap-1 font-medium bg-indigo-600/90 px-2 py-1 rounded">
                <Eye className="w-3.5 h-3.5" /> Inspect Heatmap
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2 text-xs w-full">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 text-sm">
              Frame #{currentFrame.frame_index}
            </span>
            <span className="text-slate-400 flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5" /> {currentFrame.timestamp_sec}s
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-1">
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Synthetic Likelihood</span>
              <span
                className={`font-semibold ${
                  currentFrame.fake_probability >= 0.70
                    ? "text-rose-400"
                    : currentFrame.fake_probability >= 0.45
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {(currentFrame.fake_probability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Authentic Probability</span>
              <span className="font-semibold text-slate-300">
                {(currentFrame.real_probability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Model Confidence</span>
              <span className="font-semibold text-slate-300">
                {(currentFrame.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Faces Localized</span>
              <span className="font-semibold text-slate-300">
                {currentFrame.faces_detected} Face(s)
              </span>
            </div>
          </div>

          {currentFrame.explanation_image_url && (
            <div className="pt-1 flex items-center gap-2">
              <span className="text-indigo-400 font-medium">Attention map available for this frame.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};