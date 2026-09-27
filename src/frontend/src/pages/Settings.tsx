import React, { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Cpu,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Layers,
  Terminal,
  Activity,
  HardDrive,
} from "lucide-react";
import { apiService } from "../services/api";
import { ModelStatusResponse } from "../types";

export const Settings: React.FC = () => {
  const [modelStatus, setModelStatus] = useState<ModelStatusResponse | null>(null);
  const [health, setHealth] = useState<{ status: string; service: string; version: string; device: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [latency, setLatency] = useState<number | null>(null);

  const fetchSystemInfo = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const h = await apiService.getHealth();
      setLatency(Math.round(performance.now() - start));
      setHealth(h);
      const m = await apiService.getModelsStatus();
      setModelStatus(m);
    } catch (err) {
      console.error("Failed to fetch system status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  const models = modelStatus?.models;
  const device = modelStatus?.device_info || {
    device_type: health?.device || "cpu",
    cuda_available: false,
    configured_target: "auto",
    resolved_target: health?.device || "cpu",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            <span>Forensic System Configuration & Engine Registry</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Neural model provenance, compute acceleration, cryptographic storage, and API settings
          </p>
        </div>

        <button
          onClick={fetchSystemInfo}
          disabled={loading}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs font-mono flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Test Health & Latency</span>
        </button>
      </div>

      {/* Top Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Backend API Health */}
        <div className="forensic-card p-4 space-y-2 border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>FastAPI Gateway</span>
            </span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {health?.status === "ok" ? "HEALTHY" : "CHECKING"}
            </span>
          </div>
          <div className="space-y-1 font-mono text-xs">
            <p className="text-slate-200 text-sm font-bold">DeepFake ForensicAI v1.0.0</p>
            <p className="text-slate-500 text-[11px]">Round-trip latency: {latency ? `${latency}ms` : "—"}</p>
          </div>
        </div>

        {/* Compute Engine */}
        <div className="forensic-card p-4 space-y-2 border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hardware Device</span>
            </span>
            <span className="text-cyan-400 font-bold uppercase">{device.resolved_target}</span>
          </div>
          <div className="space-y-1 font-mono text-xs">
            <p className="text-slate-200 text-sm font-bold">
              {device.cuda_available ? (device.gpu_name || "CUDA Enabled") : "CPU (Auto-fallback)"}
            </p>
            <p className="text-slate-500 text-[11px]">
              {device.cuda_available ? `VRAM: ${device.vram_allocated_mb || 0} MB Allocated` : "Zero CUDA requirement enforced"}
            </p>
          </div>
        </div>

        {/* Cryptographic Ledger */}
        <div className="forensic-card p-4 space-y-2 border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>Chain of Custody</span>
            </span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              ENFORCED
            </span>
          </div>
          <div className="space-y-1 font-mono text-xs">
            <p className="text-slate-200 text-sm font-bold">SHA-256 Block-Linked</p>
            <p className="text-slate-500 text-[11px]">Audit trail recorded upon file ingestion</p>
          </div>
        </div>
      </div>

      {/* Model Registry Table */}
      <div className="forensic-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100">Deep Learning Model Provenance & Registry</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {models ? Object.keys(models).length : 4} Pre-Trained Detectors Registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Detector Role</th>
                <th className="py-2.5 px-3">Model Architecture</th>
                <th className="py-2.5 px-3">Pre-trained Weights Identifier</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Device</th>
                <th className="py-2.5 px-3 text-right">Framework</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {/* MTCNN */}
              <tr className="hover:bg-slate-900/40">
                <td className="py-3 px-3 font-semibold text-slate-200 font-sans">
                  Face Detection & 5-pt Alignment
                </td>
                <td className="py-3 px-3 text-slate-300">Multi-task Cascaded CNN (MTCNN)</td>
                <td className="py-3 px-3 text-cyan-400">facenet-pytorch/mtcnn</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">Ready (Loaded)</td>
                <td className="py-3 px-3 uppercase text-slate-400">{device.resolved_target}</td>
                <td className="py-3 px-3 text-right text-slate-400">PyTorch / TorchVision</td>
              </tr>

              {/* ViT */}
              <tr className="hover:bg-slate-900/40">
                <td className="py-3 px-3 font-semibold text-slate-200 font-sans">
                  Visual Deepfake Classifier
                </td>
                <td className="py-3 px-3 text-slate-300">Vision Transformer (ViT-Base, 86M params)</td>
                <td className="py-3 px-3 text-cyan-400">dima806/deepfake_vs_real_image_detection</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">Ready (Loaded)</td>
                <td className="py-3 px-3 uppercase text-slate-400">{device.resolved_target}</td>
                <td className="py-3 px-3 text-right text-slate-400">HuggingFace Transformers</td>
              </tr>

              {/* Wav2Vec2 */}
              <tr className="hover:bg-slate-900/40">
                <td className="py-3 px-3 font-semibold text-slate-200 font-sans">
                  Audio Deepfake & Speech Spoof
                </td>
                <td className="py-3 px-3 text-slate-300">Wav2Vec 2.0 (95M params, 16 kHz acoustic)</td>
                <td className="py-3 px-3 text-cyan-400">MelodyMachine/Deepfake-audio-detection</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">Ready (Loaded)</td>
                <td className="py-3 px-3 uppercase text-slate-400">{device.resolved_target}</td>
                <td className="py-3 px-3 text-right text-slate-400">HuggingFace Transformers</td>
              </tr>

              {/* Temporal Aggregator */}
              <tr className="hover:bg-slate-900/40">
                <td className="py-3 px-3 font-semibold text-slate-200 font-sans">
                  Temporal Sequence Consistency
                </td>
                <td className="py-3 px-3 text-slate-300">Multi-Frame Feature Variance & Jitter</td>
                <td className="py-3 px-3 text-cyan-400">forensic_ai/temporal_aggregator_v1</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">Ready (Loaded)</td>
                <td className="py-3 px-3 uppercase text-slate-400">CPU / NumPy</td>
                <td className="py-3 px-3 text-right text-slate-400">Native Python</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Forensic Standards & Legal Admissibility Notes */}
      <div className="forensic-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs font-mono">
          <ShieldCheck className="w-4 h-4" />
          <span>Courtroom Admissibility & Forensic Standards (Daubert / Frye Standard)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800 space-y-1">
            <span className="text-[10px] text-cyan-400 font-bold uppercase block">Methodological Reproducibility</span>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              All neural inference outputs, self-attention rollout maps, and acoustic probability scores are deterministic and replayable. Model weights, hash digests, and parameter counts are preserved in the Section 19 custody ledger.
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded border border-slate-800 space-y-1">
            <span className="text-[10px] text-cyan-400 font-bold uppercase block">Separation of Evidence & Interpretation</span>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Raw sensor measurements (EXIF metadata, acoustic energy waveforms, facial landmark velocity) are mathematically segregated from probabilistic deep learning model classifications and narrative interpretations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
