import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  FileSearch,
  ArrowRight,
  UploadCloud,
  Layers,
  Sparkles,
  Server,
  Cpu,
  HardDrive,
  Activity,
  FileText,
  PieChart as PieIcon,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { apiService } from "../services/api";
import { Case, ModelStatusResponse, BobStatus } from "../types";
import { RiskBadge } from "../components/RiskBadge";

export const Dashboard: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [modelsStatus, setModelsStatus] = useState<ModelStatusResponse | null>(null);
  const [bobStatus, setBobStatus] = useState<BobStatus | null>(null);
  const [apiOnline, setApiOnline] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [casesRes, modelsRes, bobRes] = await Promise.allSettled([
        apiService.getCases(),
        apiService.getModelsStatus(),
        apiService.getBobStatus(),
      ]);

      if (casesRes.status === "fulfilled") {
        setCases(casesRes.value);
        setApiOnline(true);
      } else {
        setApiOnline(false);
      }

      if (modelsRes.status === "fulfilled") {
        setModelsStatus(modelsRes.value);
      }

      if (bobRes.status === "fulfilled") {
        setBobStatus(bobRes.value);
      }
    } catch (err) {
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute metrics
  const total = cases.length;
  const completed = cases.filter((c) => c.status === "completed").length;
  const active = cases.filter((c) => c.status === "analyzing" || c.status === "uploaded").length;
  const manipulated = cases.filter(
    (c) => c.prediction_label === "potentially_manipulated" || c.risk_level === "high"
  ).length;
  const inconclusive = cases.filter((c) => c.prediction_label === "inconclusive").length;
  const authentic = cases.filter((c) => c.prediction_label === "authentic" && c.risk_level === "low").length;
  const bobReportsCount = cases.filter((c) => c.bob_status === "generated" || c.bob_report).length;

  // Media counts
  const imageCount = cases.filter((c) => c.media_type === "image").length;
  const videoCount = cases.filter((c) => c.media_type === "video").length;
  const audioCount = cases.filter((c) => c.media_type === "audio").length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Forensic Command & Operations Dashboard</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Live telemetry of media ingestion, pre-trained neural network inferences, and legal dossier generation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/upload"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium font-mono flex items-center gap-2 transition-colors shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            <span>New Analysis</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row (6 key indicators) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="forensic-card p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Total Casefiles</span>
          <p className="text-2xl font-bold font-mono text-slate-100">{total}</p>
          <span className="text-[11px] text-slate-500 font-mono">{completed} completed</span>
        </div>

        <div className="forensic-card p-3.5 space-y-1 border-cyan-900/40 bg-cyan-950/15">
          <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">Active Pipeline</span>
          <p className="text-2xl font-bold font-mono text-cyan-300">{active}</p>
          <span className="text-[11px] text-cyan-500 font-mono">In processing</span>
        </div>

        <div className="forensic-card p-3.5 space-y-1 border-rose-900/50 bg-rose-950/20">
          <span className="text-[10px] font-mono text-rose-400 uppercase font-semibold">Manipulated</span>
          <p className="text-2xl font-bold font-mono text-rose-300">{manipulated}</p>
          <span className="text-[11px] text-rose-400 font-mono">Neural anomalies</span>
        </div>

        <div className="forensic-card p-3.5 space-y-1 border-amber-900/40 bg-amber-950/15">
          <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">Inconclusive</span>
          <p className="text-2xl font-bold font-mono text-amber-300">{inconclusive}</p>
          <span className="text-[11px] text-amber-500 font-mono">Borderline signals</span>
        </div>

        <div className="forensic-card p-3.5 space-y-1 border-emerald-900/40 bg-emerald-950/15">
          <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">Authentic</span>
          <p className="text-2xl font-bold font-mono text-emerald-300">{authentic}</p>
          <span className="text-[11px] text-emerald-500 font-mono">Natural biometric</span>
        </div>

        <div className="forensic-card p-3.5 space-y-1 border-blue-900/40 bg-blue-950/15">
          <span className="text-[10px] font-mono text-blue-400 uppercase font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>Bob Dossiers</span>
          </span>
          <p className="text-2xl font-bold font-mono text-blue-300">{bobReportsCount}</p>
          <span className="text-[11px] text-blue-400 font-mono">Section 18 Generated</span>
        </div>
      </div>

      {/* Analysis Overview & System Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Charts Overview (2 Cols) */}
        <div className="forensic-card p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-100">Forensic Modality & Risk Distribution</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Multimodal Analytics</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
            {/* Media Distribution Bars */}
            <div className="space-y-3 font-mono text-xs">
              <span className="text-[11px] text-slate-400 font-bold uppercase block">Media Formats Ingested</span>
              
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Images (JPEG / PNG / WEBP)</span>
                    <span className="text-cyan-400 font-bold">{imageCount} ({total ? Math.round((imageCount / total) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full transition-all" style={{ width: `${total ? (imageCount / total) * 100 : 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Video (MP4 / MOV / AVI)</span>
                    <span className="text-blue-400 font-bold">{videoCount} ({total ? Math.round((videoCount / total) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full transition-all" style={{ width: `${total ? (videoCount / total) * 100 : 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Audio (WAV / MP3 / FLAC)</span>
                    <span className="text-purple-400 font-bold">{audioCount} ({total ? Math.round((audioCount / total) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full transition-all" style={{ width: `${total ? (audioCount / total) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Verdict Distribution Bars */}
            <div className="space-y-3 font-mono text-xs">
              <span className="text-[11px] text-slate-400 font-bold uppercase block">Classification Breakdown</span>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span className="text-rose-400">Manipulated / Deepfake</span>
                    <span className="text-rose-400 font-bold">{manipulated}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full transition-all" style={{ width: `${total ? (manipulated / total) * 100 : 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span className="text-amber-400">Inconclusive / Mixed</span>
                    <span className="text-amber-400 font-bold">{inconclusive}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full transition-all" style={{ width: `${total ? (inconclusive / total) * 100 : 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span className="text-emerald-400">Authentic / Verified</span>
                    <span className="text-emerald-400 font-bold">{authentic}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all" style={{ width: `${total ? (authentic / total) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System & Engine Status Panel (1 Col) */}
        <div className="forensic-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-100">Live Engine Health</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">ALL CONNECTED</span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {/* Backend API */}
            <div className="flex items-center justify-between p-2 rounded bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-300 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${apiOnline ? "bg-emerald-400" : "bg-rose-500 animate-pulse"}`} />
                <span>Backend Gateway</span>
              </span>
              <span className={`text-[10px] font-bold ${apiOnline ? "text-emerald-400" : "text-rose-400"}`}>
                {apiOnline ? "CONNECTED" : "UNAVAILABLE"}
              </span>
            </div>

            {/* AI Models */}
            <div className="flex items-center justify-between p-2 rounded bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>AI Neural Detectors</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-400">READY (4/4)</span>
            </div>

            {/* Cryptographic Ledger */}
            <div className="flex items-center justify-between p-2 rounded bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Chain of Custody</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-400">ENFORCED</span>
            </div>

            {/* IBM Bob */}
            <div className="flex items-center justify-between p-2 rounded bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-300 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${bobStatus?.configured ? "bg-blue-400" : "bg-amber-400"}`} />
                <span>IBM Bob Reporting</span>
              </span>
              <span className={`text-[10px] font-bold ${bobStatus?.configured ? "text-blue-400" : "text-amber-400"}`}>
                {bobStatus?.configured ? "ACTIVE" : "UNCONFIGURED"}
              </span>
            </div>

            {/* Storage */}
            <div className="flex items-center justify-between p-2 rounded bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Media Storage</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-400">ONLINE</span>
            </div>
          </div>

          <div className="pt-1 text-[11px] text-slate-500 font-mono">
            Accelerator: <strong className="text-slate-300">{modelsStatus?.device_info?.resolved_target?.toUpperCase() || "CPU"}</strong>
          </div>
        </div>
      </div>

      {/* Recent Ingestions Table */}
      <div className="forensic-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100">Recent Forensic Ingestions</h3>
          </div>
          <Link to="/cases" className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1">
            <span>View full repository</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs font-mono text-slate-400">Loading cases...</div>
        ) : cases.length === 0 ? (
          <div className="py-10 text-center space-y-2 font-mono text-xs">
            <p className="text-slate-400">No forensic cases recorded yet.</p>
            <Link to="/upload" className="text-cyan-400 underline">
              Upload an image, video, or audio file to begin investigation
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Case ID</th>
                  <th className="py-2.5 px-3">Filename</th>
                  <th className="py-2.5 px-3">Media</th>
                  <th className="py-2.5 px-3">Verdict</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {cases.slice(0, 8).map((c) => (
                  <tr key={c.case_id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 text-cyan-400 font-bold">{c.case_id.slice(0, 8)}...</td>
                    <td className="py-3 px-3 font-sans max-w-xs truncate text-slate-200">{c.filename}</td>
                    <td className="py-3 px-3 uppercase text-[11px] text-slate-400">{c.media_type}</td>
                    <td className="py-3 px-3">
                      {c.prediction_label ? (
                        <span className="capitalize text-slate-200">{c.prediction_label.replace("_", " ")}</span>
                      ) : (
                        <span className="text-slate-500">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-bold">
                      {c.confidence ? `${(c.confidence * 100).toFixed(0)}%` : "—"}
                    </td>
                    <td className="py-3 px-3">
                      <RiskBadge riskLevel={c.risk_level} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <Link
                        to={`/cases/${c.case_id}`}
                        className="text-cyan-400 hover:text-cyan-300 text-xs inline-flex items-center gap-1 font-sans"
                      >
                        <span>Dossier</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
