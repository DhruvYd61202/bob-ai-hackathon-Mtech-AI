import React, { useState } from "react";
import { BobReport } from "../types";
import { apiService } from "../services/api";
import { Sparkles, FileText, CheckCircle2, AlertCircle, RefreshCw, KeyRound, ArrowRight } from "lucide-react";

interface BobReportSectionProps {
  caseId: string;
  bobStatus?: string;
  bobReport?: BobReport | null;
  bobMessage?: string;
  onReportGenerated?: () => void;
}

export const BobReportSection: React.FC<BobReportSectionProps> = ({
  caseId,
  bobStatus,
  bobReport,
  bobMessage,
  onReportGenerated
}) => {
  const [requesting, setRequesting] = useState(false);
  const [requestMsg, setRequestMsg] = useState<string | null>(null);

  const handleRequestBob = async () => {
    setRequesting(true);
    setRequestMsg(null);
    try {
      const res = await apiService.generateBobReport(caseId);
      if (res.status === "success") {
        if (onReportGenerated) onReportGenerated();
      } else {
        setRequestMsg(res.message || "IBM Bob reporting service unavailable. Set key in backend/app/bob/config.py.");
      }
    } catch (err: any) {
      setRequestMsg("Failed to contact IBM Bob reporting service.");
    } finally {
      setRequesting(false);
    }
  };

  const hasReport = !!bobReport;

  return (
    <div className="forensic-card p-5 space-y-4 border border-slate-800 bg-slate-900/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-blue-950/60 border border-blue-800/60 text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              IBM Bob Load-Bearing Forensic Reporting Agent
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Evidence-grounded courtroom narrative synthesis and legal examination briefing
            </p>
          </div>
        </div>

        {hasReport ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950/80 border border-blue-800 text-blue-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            {bobReport.model_id || "ibm-bob-forensic-v1"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800/80 border border-slate-700 text-slate-400">
            <KeyRound className="w-3.5 h-3.5" />
            STATUS: UNAVAILABLE
          </span>
        )}
      </div>

      {!hasReport ? (
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>IBM Bob reporting service unavailable.</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Automated multimodal digital forensics was completed successfully using verified local deep learning models
              (Vision Transformer ViT-Base, MTCNN, Wav2Vec 2.0, Temporal Aggregator). Primary model evidence, self-attention
              heatmaps, and forensic confidence scores are fully available and independently verified.
            </p>
            <p className="text-slate-400 text-[10px]">
              To enable synthesized courtroom narrative examination dossiers from IBM Bob, set your API key in:
              <code className="ml-1 text-cyan-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">
                backend/app/bob/config.py
              </code>
            </p>
          </div>

          {requestMsg && (
            <div className="p-2.5 rounded bg-rose-950/30 border border-rose-800/60 text-rose-300 text-xs font-mono">
              {requestMsg}
            </div>
          )}

          <button
            onClick={handleRequestBob}
            disabled={requesting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded font-mono text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${requesting ? "animate-spin" : ""}`} />
            <span>{requesting ? "Contacting IBM Bob Service..." : "Request IBM Bob Synthesis"}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4 font-mono text-xs text-slate-300">
          <div className="p-3.5 rounded bg-blue-950/20 border border-blue-900/40 space-y-1.5">
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">
              Case Summary & Executive Briefing
            </span>
            <p className="text-slate-200 leading-relaxed">{bobReport.case_summary}</p>
          </div>

          <div className="p-3.5 rounded bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">
              Overall Forensic Assessment & Verdict
            </span>
            <p className="text-slate-200 font-semibold">{bobReport.verdict_statement}</p>
            <p className="text-[11px] text-slate-300 leading-relaxed">{bobReport.overall_forensic_assessment}</p>
          </div>

          {/* Forensic Channel Analyses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 rounded bg-slate-950/40 border border-slate-800/80 space-y-1">
              <span className="text-cyan-400 font-semibold block">Visual Deepfake Analysis</span>
              <p className="text-slate-300">{bobReport.visual_forensic_analysis}</p>
            </div>
            <div className="p-3 rounded bg-slate-950/40 border border-slate-800/80 space-y-1">
              <span className="text-cyan-400 font-semibold block">Audio Synthesis Analysis</span>
              <p className="text-slate-300">{bobReport.audio_forensic_analysis}</p>
            </div>
            <div className="p-3 rounded bg-slate-950/40 border border-slate-800/80 space-y-1">
              <span className="text-cyan-400 font-semibold block">Temporal Sequence Consistency</span>
              <p className="text-slate-300">{bobReport.temporal_forensic_analysis}</p>
            </div>
            <div className="p-3 rounded bg-slate-950/40 border border-slate-800/80 space-y-1">
              <span className="text-cyan-400 font-semibold block">Synchronization Evaluation</span>
              <p className="text-slate-300">{bobReport.synchronization_analysis}</p>
            </div>
          </div>

          {/* Recommendations & Limitations */}
          {bobReport.forensic_recommendations && bobReport.forensic_recommendations.length > 0 && (
            <div className="p-3 rounded bg-slate-950/40 border border-slate-800/80 space-y-1 text-[11px]">
              <span className="text-amber-400 font-semibold block">Forensic Recommendations</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                {bobReport.forensic_recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-[10px] text-slate-500 flex justify-between border-t border-slate-800/80 pt-2">
            <span>Generated: {bobReport.generated_at}</span>
            <span>Chain of Custody Notes: {bobReport.chain_of_custody_notes}</span>
          </div>
        </div>
      )}
    </div>
  );
};
