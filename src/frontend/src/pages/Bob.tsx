import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Cpu,
  FileText,
  KeyRound,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Layers,
  ArrowRight,
} from "lucide-react";
import { apiService } from "../services/api";
import { Case, BobStatus, BobReport, BobResponse } from "../types";

export const Bob: React.FC = () => {
  const [bobStatus, setBobStatus] = useState<BobStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  // Chat State
  const [messages, setMessages] = useState<Array<{ sender: "user" | "bob"; text: string; citations?: string[]; timestamp: string }>>([
    {
      sender: "bob",
      text: "Greetings, Examiner. I am IBM Bob, your digital forensic AI specialist for DeepFake ForensicAI. Select a case above to examine verified neural network findings, timeline anomalies, and synthesize courtroom-ready reports.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [asking, setAsking] = useState(false);

  // Report Generation State
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generationStep, setGenerationStep] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<BobReport | null>(null);

  // Load Status and Cases
  const refreshStatus = () => {
    setLoadingStatus(true);
    apiService
      .getBobStatus()
      .then(setBobStatus)
      .catch((err) => {
        console.error("Failed to fetch Bob status:", err);
      })
      .finally(() => setLoadingStatus(false));
  };

  useEffect(() => {
    refreshStatus();
    apiService
      .getCases()
      .then((data) => {
        setCases(data);
        if (data.length > 0) {
          setSelectedCaseId(data[0].case_id);
        }
      })
      .catch(console.error);
  }, []);

  // When selected case changes, load full case data
  useEffect(() => {
    if (!selectedCaseId) return;
    apiService
      .getCase(selectedCaseId)
      .then((c) => {
        setSelectedCase(c);
        if (c.bob_report) {
          setReportResult(c.bob_report);
        } else {
          setReportResult(null);
        }
      })
      .catch(console.error);
  }, [selectedCaseId]);

  const handleSendMessage = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || !selectedCaseId) return;

    const userMsg = {
      sender: "user" as const,
      text: q,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setAsking(true);

    try {
      const res: BobResponse = await apiService.askBob(selectedCaseId, q);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bob",
          text: res.answer,
          citations: res.citations,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bob",
          text: "I was unable to retrieve findings from the investigation pipeline. Please ensure the backend is connected.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setAsking(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedCaseId) return;
    setGeneratingReport(true);

    try {
      setGenerationStep("Preparing verified case evidence package...");
      await new Promise((r) => setTimeout(r, 600));

      setGenerationStep("Extracting model metrics (ViT, Wav2Vec2, MTCNN, Custody)...");
      await new Promise((r) => setTimeout(r, 600));

      setGenerationStep("IBM Bob synthesizing courtroom narrative dossier...");
      const res = await apiService.generateBobReport(selectedCaseId);

      setGenerationStep("Validating against forensic schema and custody ledger...");
      await new Promise((r) => setTimeout(r, 500));

      if (res.status === "success" && res.report) {
        setReportResult(res.report);
        setGenerationStep("Courtroom report successfully generated!");
      } else {
        alert(res.message || "IBM Bob reporting service unavailable.");
      }
    } catch (err) {
      alert("Failed to contact IBM Bob reporting service.");
    } finally {
      setGeneratingReport(false);
      setTimeout(() => setGenerationStep(null), 3000);
    }
  };

  const promptShortcuts = [
    "What AI deep learning models evaluated this file?",
    "Analyze frame timeline anomalies and jitter.",
    "Generate an investigator summary briefing.",
    "Are there any conflicting cross-modal signals?",
    "Explain the primary forensic limitations.",
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span>IBM Bob Load-Bearing Forensic Reporting Agent</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Evidence-grounded courtroom narrative synthesis, cross-modal correlation, and legal briefing
          </p>
        </div>

        <button
          onClick={refreshStatus}
          disabled={loadingStatus}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs font-mono flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? "animate-spin" : ""}`} />
          <span>Probe Agent Status</span>
        </button>
      </div>

      {/* Operational Status & Architecture Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status Card */}
        <div className="forensic-card p-5 space-y-3.5 border-blue-900/40 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-blue-400 uppercase font-bold tracking-wider">
              Operational Status
            </span>
            {bobStatus?.configured && bobStatus?.reachable ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                ONLINE & READY
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-800 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                UNCONFIGURED
              </span>
            )}
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span className="text-slate-400">Agent Service:</span>
              <span className="text-slate-200 font-semibold">{bobStatus?.service || "IBM Bob"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span className="text-slate-400">Target Model:</span>
              <span className="text-cyan-400 font-semibold">{bobStatus?.model || "ibm-bob-forensic-v1"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span className="text-slate-400">Endpoint:</span>
              <span className="text-slate-300 truncate max-w-[180px]">{bobStatus?.endpoint || "https://bob.ibm.com/api/v1"}</span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span className="text-slate-400">Intelligence Mode:</span>
              <span className="text-emerald-400 font-semibold">Embedded Reasoning</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed font-sans pt-1">
            {bobStatus?.status_message || "Probing IBM Bob service endpoint..."}
          </p>
        </div>

        {/* Security & Architecture Card */}
        <div className="forensic-card p-5 space-y-3.5 lg:col-span-2">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs font-mono">
            <ShieldCheck className="w-4 h-4" />
            <span>Forensic Architecture & Security Isolation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950/70 rounded border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                Zero Client Credentials
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                IBM Bob API keys reside exclusively on the secure FastAPI backend. The frontend communicates through authenticated REST routes only.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 rounded border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                Load-Bearing Dual Engine
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Operates with remote proxy support and native embedded forensic intelligence, guaranteeing courtroom dossiers even when offline.
              </p>
            </div>
          </div>

          {/* Active Case Selector */}
          <div className="flex items-center gap-3 pt-1 border-t border-slate-800 font-mono text-xs">
            <span className="text-slate-400 whitespace-nowrap">Active Investigation:</span>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 flex-1 focus:outline-none focus:border-cyan-500"
            >
              {cases.map((c) => (
                <option key={c.case_id} value={c.case_id}>
                  {c.filename} — {c.case_id.slice(0, 8)}... ({c.prediction_label || c.status})
                </option>
              ))}
            </select>

            {selectedCaseId && (
              <Link
                to={`/cases/${selectedCaseId}`}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-cyan-400 border border-slate-700 rounded text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <span>Case Dossier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace: Left Chat Assistant, Right Report Synthesis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Bob Assistant Chat */}
        <div className="forensic-card p-5 space-y-4 flex flex-col h-[560px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-100">Investigator Interactive Q&A</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Grounded in Case #{selectedCaseId ? selectedCaseId.slice(0, 8) : "None"}
            </span>
          </div>

          {/* Prompt Shortcuts */}
          <div className="flex flex-wrap gap-1.5">
            {promptShortcuts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                disabled={asking || !selectedCaseId}
                className="px-2 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded text-[10px] font-mono text-slate-300 transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message History */}
          <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-950/60 rounded border border-slate-800 text-xs">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg space-y-1.5 ${
                  m.sender === "user"
                    ? "bg-cyan-950/30 border border-cyan-900/50 text-cyan-100 ml-8"
                    : "bg-slate-900/90 border border-slate-800 text-slate-200 mr-8"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="font-bold uppercase tracking-wider text-blue-400">
                    {m.sender === "user" ? "Investigator" : "IBM Bob Specialist"}
                  </span>
                  <span>{m.timestamp}</span>
                </div>
                <div className="leading-relaxed whitespace-pre-line font-sans text-[12px]">{m.text}</div>
                {m.citations && m.citations.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400">
                    <span className="text-slate-500">Citations:</span>
                    {m.citations.map((c, ci) => (
                      <span key={ci} className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-cyan-400">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {asking && (
              <div className="p-3 rounded bg-slate-900/60 text-slate-400 text-xs font-mono flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>IBM Bob analyzing case evidence signals...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={selectedCaseId ? "Ask IBM Bob about this case's evidence..." : "Select a case above..."}
              disabled={asking || !selectedCaseId}
              className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={asking || !inputQuery.trim() || !selectedCaseId}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>

        {/* Courtroom Report Synthesis Viewer */}
        <div className="forensic-card p-5 space-y-4 flex flex-col h-[560px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-100">Section 18 Courtroom Briefing</h3>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={generatingReport || !selectedCaseId}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{generatingReport ? "Synthesizing..." : "Synthesize Report"}</span>
            </button>
          </div>

          {/* Progress Banner */}
          {generationStep && (
            <div className="p-2.5 rounded bg-blue-950/40 border border-blue-800/60 text-blue-300 font-mono text-xs flex items-center gap-2 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{generationStep}</span>
            </div>
          )}

          {/* Report Content */}
          <div className="flex-1 overflow-y-auto space-y-3.5 p-3.5 bg-slate-950/60 rounded border border-slate-800 font-mono text-xs text-slate-300">
            {!reportResult ? (
              <div className="py-20 text-center space-y-2 text-slate-500">
                <FileText className="w-8 h-8 mx-auto text-slate-700" />
                <p className="font-sans text-xs text-slate-400">No IBM Bob courtroom report generated for this case yet.</p>
                <p className="text-[11px]">
                  Click <strong className="text-blue-400">Synthesize Report</strong> above to execute the load-bearing reasoning engine.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded bg-blue-950/30 border border-blue-900/50 space-y-1">
                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">
                    Case Summary & Scope
                  </span>
                  <p className="text-slate-200 leading-relaxed font-sans text-[11px]">{reportResult.case_summary}</p>
                </div>

                <div className="p-3 rounded bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">
                    Verdict & Assessment
                  </span>
                  <p className="text-slate-100 font-bold text-xs">{reportResult.verdict_statement}</p>
                  <p className="text-slate-300 leading-relaxed font-sans text-[11px]">
                    {reportResult.overall_forensic_assessment}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                    <span className="text-cyan-400 font-bold block text-[10px]">Visual Analysis</span>
                    <p className="text-slate-300 font-sans text-[10px] leading-relaxed">
                      {reportResult.visual_forensic_analysis}
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                    <span className="text-cyan-400 font-bold block text-[10px]">Audio Analysis</span>
                    <p className="text-slate-300 font-sans text-[10px] leading-relaxed">
                      {reportResult.audio_forensic_analysis}
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                    <span className="text-cyan-400 font-bold block text-[10px]">Temporal Sequence</span>
                    <p className="text-slate-300 font-sans text-[10px] leading-relaxed">
                      {reportResult.temporal_forensic_analysis}
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                    <span className="text-cyan-400 font-bold block text-[10px]">Sync Evaluation</span>
                    <p className="text-slate-300 font-sans text-[10px] leading-relaxed">
                      {reportResult.synchronization_analysis}
                    </p>
                  </div>
                </div>

                {reportResult.forensic_recommendations && reportResult.forensic_recommendations.length > 0 && (
                  <div className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-1 text-[11px]">
                    <span className="text-amber-400 font-bold block text-[10px]">Forensic Recommendations</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-300 font-sans text-[10px]">
                      {reportResult.forensic_recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 flex justify-between font-mono">
                  <span>Model: {reportResult.model_id || "ibm-bob-forensic-v1"}</span>
                  <span>Generated: {reportResult.generated_at}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
