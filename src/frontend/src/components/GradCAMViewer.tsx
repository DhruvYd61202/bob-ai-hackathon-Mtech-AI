import React, { useState } from "react";
import { Eye, EyeOff, Layers, ZoomIn, Sliders, X } from "lucide-react";
import { apiService } from "../services/api";

interface GradCAMViewerProps {
  originalUrl?: string | null;
  explanationUrl?: string | null;
  title?: string;
  findingSummary?: string;
  fakeProbability?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const GradCAMViewer: React.FC<GradCAMViewerProps> = ({
  originalUrl,
  explanationUrl,
  title = "Vision Transformer Self-Attention Rollout Map",
  findingSummary,
  fakeProbability,
  isOpen = true,
  onClose
}) => {
  const [mode, setMode] = useState<"overlay" | "side_by_side" | "original">("overlay");
  const [opacity, setOpacity] = useState<number>(75);

  if (!isOpen) return null;

  const originalSrc = apiService.getAssetUrl(originalUrl);
  const explanationSrc = apiService.getAssetUrl(explanationUrl);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
            <p className="text-xs text-slate-400">
              ViT-Base 14x14 Patch Self-Attention Rollout & Synthesis Heatmap
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {fakeProbability !== undefined && (
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                fakeProbability >= 0.70
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  : fakeProbability >= 0.45
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}
            >
              Synthetic Probability: {(fakeProbability * 100).toFixed(1)}%
            </span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setMode("overlay")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              mode === "overlay"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Attention Heatmap
          </button>
          <button
            onClick={() => setMode("side_by_side")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              mode === "side_by_side"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Side-by-Side Comparison
          </button>
          <button
            onClick={() => setMode("original")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              mode === "original"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Original Only
          </button>
        </div>

        {mode === "overlay" && explanationSrc && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Heatmap Blending:</span>
            <input
              type="range"
              min="20"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-24 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="font-mono text-slate-300 w-8">{opacity}%</span>
          </div>
        )}
      </div>

      {/* Image Display Canvas */}
      <div className="relative bg-black/80 rounded-xl overflow-hidden border border-slate-800/80 flex items-center justify-center min-h-[300px] max-h-[500px]">
        {mode === "side_by_side" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full p-2 gap-2">
            <div className="flex flex-col items-center justify-center p-2 bg-slate-950/40 rounded-lg">
              <span className="text-xs text-slate-400 mb-2 font-medium">Original Capture</span>
              <img
                src={originalSrc || explanationSrc}
                alt="Original capture"
                className="max-h-[380px] w-auto object-contain rounded border border-slate-800"
              />
            </div>
            <div className="flex flex-col items-center justify-center p-2 bg-slate-950/40 rounded-lg">
              <span className="text-xs text-indigo-400 mb-2 font-medium">ViT Self-Attention Rollout Map</span>
              <img
                src={explanationSrc || originalSrc}
                alt="Attention overlay"
                className="max-h-[380px] w-auto object-contain rounded border border-indigo-500/30"
              />
            </div>
          </div>
        ) : mode === "original" ? (
          <div className="p-4 flex flex-col items-center">
            <img
              src={originalSrc || explanationSrc}
              alt="Original capture"
              className="max-h-[420px] w-auto object-contain rounded-lg border border-slate-800"
            />
          </div>
        ) : (
          <div className="p-4 flex flex-col items-center relative">
            <img
              src={explanationSrc || originalSrc}
              alt="Attention overlay"
              style={{ opacity: opacity / 100 }}
              className="max-h-[420px] w-auto object-contain rounded-lg border border-indigo-500/30 transition-opacity"
            />
          </div>
        )}
      </div>

      {/* Legend & Forensic Interpretation */}
      <div className="mt-4 p-3 bg-slate-950/60 rounded-lg border border-slate-800/60 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-slate-300">Spectral Attention Intensity:</span>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
            <span>Low (Authentic)</span>
            <div className="w-20 h-2 rounded-full bg-gradient-to-r from-blue-600 via-green-500 to-red-600" />
            <span>High (Anomalous)</span>
          </div>
        </div>
        <p className="text-slate-400 leading-relaxed">
          {findingSummary ||
            "Red/yellow activation zones indicate spatial token clusters with elevated self-attention weights. Deep learning generators (e.g. latent diffusion or autoencoders) typically exhibit high-attention concentration around blending margins, hair contours, or asymmetric periorbital boundaries."}
        </p>
      </div>
    </div>
  );
};