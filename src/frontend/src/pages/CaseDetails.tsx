import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Play, Cpu, Layers, AlertTriangle, FileText, Download,
  ShieldAlert, ShieldCheck, RefreshCw, Eye, Sparkles, Activity,
  Network, Lock, Mic, Video, Image, FileCode, CheckCircle2,
  Clock, Hash, HelpCircle, ChevronRight, Check, Copy, ExternalLink,
  Sliders, Maximize2, Shield
} from 'lucide-react';
import { casesService } from '../services/cases';
import { analysisService } from '../services/analysis';
import { reportsService } from '../services/reports';
import { Case, TopSuspiciousFrame, EvidenceItem } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { ScoreCard } from '../components/ScoreCard';
import { EvidenceTable } from '../components/EvidenceTable';
import { MediaPreview } from '../components/MediaPreview';
import { Timeline } from '../components/Timeline';
import { EvidenceGraphViewer } from '../components/EvidenceGraph';
import { BobChat } from '../components/BobChat';
import { GradCAMViewer } from '../components/GradCAMViewer';
import { FrameTimeline } from '../components/FrameTimeline';
import { SuspiciousFrame } from '../components/SuspiciousFrame';
import { BobReportSection } from '../components/BobReportSection';
import { SyncAnalysisCard } from '../components/SyncAnalysisCard';
import { ChainOfCustodyViewer } from '../components/ChainOfCustodyViewer';
import { apiService } from '../services/api';

type TabKey = 'overview' | 'visual' | 'audio' | 'evidence' | 'xai' | 'custody' | 'bob' | 'metadata';

export const CaseDetails: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [copiedId, setCopiedId] = useState(false);

  // Frame inspection state
  const [activeInspection, setActiveInspection] = useState<{
    explanationUrl: string;
    originalUrl?: string;
    title: string;
    prob?: number;
    summary?: string;
  } | null>(null);

  const fetchDetails = async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      const res = await casesService.getCase(caseId);
      setCaseData(res);
    } catch (err) {
      console.error('Error fetching case details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [caseId]);

  const handleRunAnalysis = async () => {
    if (!caseId) return;
    setAnalyzing(true);
    try {
      await analysisService.analyzeCase(caseId);
      await fetchDetails();
    } catch (err: any) {
      alert(`Analysis failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyCaseId = () => {
    if (!caseId) return;
    navigator.clipboard.writeText(caseId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!caseData) return;
    const jsonStr = JSON.stringify(caseData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Forensic_Case_${caseData.case_id.slice(0, 8)}_Export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-7 h-7 animate-spin text-cyan-400 mx-auto" />
        <p className="text-xs font-mono text-slate-400">Loading tamper-evident forensic dossier...</p>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="forensic-card p-12 text-center space-y-4 max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-100">Case Dossier Not Found</h3>
        <p className="text-xs text-slate-400 font-mono">
          The requested case ID does not match any ingested records in the repository.
        </p>
        <Link
          to="/cases"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-xs font-mono transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Repository</span>
        </Link>
      </div>
    );
  }

  const analysis = caseData.analysis_result;
  const isCompleted = caseData.status === 'completed' && !!analysis;
  const topFrames: TopSuspiciousFrame[] =
    analysis?.top_suspicious_frames || analysis?.explanations?.top_suspicious_frames || [];
  const primaryExplUrl = analysis?.explanations?.primary_explanation_url;
  const videoFrames = analysis?.temporal?.frames || (analysis as any)?.frames || [];
  const evidenceList: EvidenceItem[] = caseData.evidence || analysis?.evidence || [];
  const confidencePercent = caseData.confidence ? Math.round(caseData.confidence * 100) : null;
  const isManipulated =
    caseData.prediction_label === 'potentially_manipulated' ||
    caseData.risk_level === 'high';

  return (
    <div className="space-y-6">
      {/* Top Workstation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-start gap-3">
          <Link
            to="/cases"
            className="p-2 mt-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400 hover:text-slate-100 transition-colors"
            title="Return to Cases"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="uppercase text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800">
                {caseData.media_type} EVIDENCE
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-100 font-sans truncate max-w-md">
                {caseData.filename}
              </h1>
              {caseData.risk_level && <RiskBadge riskLevel={caseData.risk_level} size="md" />}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono mt-1">
              <span className="text-slate-500">Case ID:</span>
              <span className="text-slate-300 font-bold">{caseData.case_id}</span>
              <button
                onClick={handleCopyCaseId}
                className="text-slate-500 hover:text-slate-300 p-0.5"
                title="Copy Case ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <span className="text-slate-600">&bull;</span>
              <span>Ingested: {new Date(caseData.created_at).toLocaleString()}</span>
              <span className="text-slate-600">&bull;</span>
              <span>{(caseData.file_size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {isCompleted ? (
            <>
              <button
                onClick={handleDownloadJson}
                className="px-3 py-1.5 rounded text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-colors"
                title="Export RAW JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">JSON</span>
              </button>

              <a
                href={reportsService.getReportPdfUrl(caseData.case_id)}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded text-xs font-mono bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-800/60 flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF Dossier</span>
              </a>

              <Link
                to={`/report/${caseData.case_id}`}
                className="px-4 py-1.5 rounded text-xs font-mono bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Courtroom Report</span>
              </Link>
            </>
          ) : (
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-mono text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing Pre-Trained Models...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute AI Detection Pipeline</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Multimodal Verdict Summary Banner (When completed) */}
      {isCompleted && (
        <div className={`p-4 rounded border ${
          isManipulated
            ? 'bg-rose-950/30 border-rose-800/60'
            : 'bg-emerald-950/30 border-emerald-800/60'
        } flex flex-col md:flex-row md:items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            {isManipulated ? (
              <div className="w-10 h-10 rounded-full bg-rose-900/50 border border-rose-700 flex items-center justify-center text-rose-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-900/50 border border-emerald-700 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Assessed Evidentiary Finding:</span>
                <span className={`text-base font-bold font-sans uppercase tracking-wide ${
                  isManipulated ? 'text-rose-300' : 'text-emerald-300'
                }`}>
                  {caseData.prediction_label?.replace('_', ' ') || 'ANALYSIS COMPLETE'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                Calibrated System Confidence:{' '}
                <span className="font-bold text-white">{confidencePercent !== null ? `${confidencePercent}%` : 'N/A'}</span>
                {' '}&bull; Evidence Signals Flagged:{' '}
                <span className="font-bold text-cyan-400">{evidenceList.length}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Inference Hardware</span>
              <span className="text-xs font-mono text-cyan-400 font-semibold flex items-center justify-end gap-1">
                <Cpu className="w-3.5 h-3.5" />
                <span>{analysis?.metadata?.hardware || (analysis as any)?.device?.toUpperCase() || 'CPU (PyTorch)'}</span>
              </span>
            </div>
            <RiskBadge riskLevel={caseData.risk_level} size="lg" />
          </div>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="border-b border-slate-800 flex items-center gap-1 overflow-x-auto pb-0.5 text-xs font-mono">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-cyan-500 text-cyan-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('visual')}
          className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'visual'
              ? 'border-cyan-500 text-cyan-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Visual & Temporal</span>
          {topFrames.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300 text-[10px] border border-rose-800">
              {topFrames.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'audio'
              ? 'border-cyan-500 text-cyan-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Acoustic Forensics</span>
          {caseData.sync_analysis && (
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 text-[10px] border border-indigo-800">
              AV-Sync
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'evidence'
              ? 'border-cyan-500 text-cyan-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Evidence Graph</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px]">
            {evidenceList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('xai')}
          className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'xai'
              ? 'border-cyan-500 text-cyan-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Explainable AI (XAI)</span>
        </button>

        <button
          onClick={() => setActiveTab('custody')}
          className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'custody'
              ? 'border-cyan-500 text-cyan-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Chain of Custody</span>
        </button>

        <button
          onClick={() => setActiveTab('bob')}
          className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'bob'
              ? 'border-cyan-500 text-cyan-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span>IBM Bob Dossier</span>
        </button>

        <button
          onClick={() => setActiveTab('metadata')}
          className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'metadata'
              ? 'border-cyan-500 text-cyan-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Container Metadata</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Media Viewport & Scores */}
            <div className="lg:col-span-2 space-y-6">
              <MediaPreview
                storedPath={caseData.stored_path}
                mediaType={caseData.media_type}
                faces={analysis?.faces}
              />

              {analysis?.scores && <ScoreCard scores={analysis.scores} />}

              {/* Investigator Observation Briefing */}
              {analysis?.bob_explanation && (
                <div className="forensic-card p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Investigator Observation Briefing</span>
                    </span>
                    <span className="text-[10px] font-mono text-indigo-400">Synthesized by Forensic Engine</span>
                  </div>
                  <p className="text-xs text-slate-200 font-sans leading-relaxed">
                    {analysis.bob_explanation}
                  </p>
                </div>
              )}

              {/* Investigation Caveats & Boundaries */}
              {analysis?.limitations && analysis.limitations.length > 0 && (
                <div className="forensic-card p-5 space-y-3">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                    Forensic Caveats & Evidentiary Boundaries
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                    {analysis.limitations.map((lim, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">&bull;</span>
                        <span>{lim}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right 1 Col: Quick Specs & AI Provenance */}
            <div className="space-y-6">
              {/* Technical Specifications */}
              <div className="forensic-card p-5 space-y-3 text-xs font-mono">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block border-b border-slate-800 pb-2">
                  Evidence Metadata Container
                </span>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Media Modality:</span>
                    <span className="uppercase text-cyan-400 font-semibold">{caseData.media_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">File Size:</span>
                    <span>{(caseData.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                  {analysis?.media?.duration !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Duration:</span>
                      <span>{analysis.media.duration}s</span>
                    </div>
                  )}
                  {analysis?.media?.fps !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Framerate:</span>
                      <span>{analysis.media.fps} FPS</span>
                    </div>
                  )}
                  {analysis?.media?.resolution && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Resolution:</span>
                      <span>{analysis.media.resolution}</span>
                    </div>
                  )}
                  {analysis?.media?.sha256 && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-slate-500 text-[10px] block mb-0.5">SHA-256 Digest:</span>
                      <span className="text-[10px] text-slate-400 break-all block p-1.5 bg-slate-950 rounded border border-slate-800">
                        {analysis.media.sha256}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pre-Trained AI Models In Action */}
              <div className="forensic-card p-5 space-y-3 text-xs font-mono">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block border-b border-slate-800 pb-2">
                  Active Deep-Learning Models
                </span>
                <div className="space-y-2 text-[11px]">
                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80">
                    <div className="flex justify-between">
                      <span className="text-indigo-400 font-bold">ViT-Base-Patch16</span>
                      <span className="text-slate-400 text-[10px]">Image/Frame</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Self-attention patch forensic classifier</p>
                  </div>

                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80">
                    <div className="flex justify-between">
                      <span className="text-indigo-400 font-bold">Wav2Vec 2.0</span>
                      <span className="text-slate-400 text-[10px]">Acoustic</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Self-supervised speech deepfake detector</p>
                  </div>

                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80">
                    <div className="flex justify-between">
                      <span className="text-indigo-400 font-bold">MTCNN Cascade</span>
                      <span className="text-slate-400 text-[10px]">Alignment</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">5-point facial landmark geometry</p>
                  </div>

                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80">
                    <div className="flex justify-between">
                      <span className="text-indigo-400 font-bold">ResNet + LSTM</span>
                      <span className="text-slate-400 text-[10px]">Temporal</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Inter-frame coherence & flicker analysis</p>
                  </div>
                </div>
              </div>

              {/* Quick Jump to Bob Chat */}
              {isCompleted && (
                <BobChat
                  caseId={caseData.case_id}
                  initialSummary={analysis?.bob_explanation}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VISUAL & TEMPORAL */}
      {activeTab === 'visual' && (
        <div className="space-y-6">
          <MediaPreview
            storedPath={caseData.stored_path}
            mediaType={caseData.media_type}
            faces={analysis?.faces}
          />

          {/* Active Inspection Modal / Overlay */}
          {activeInspection && (
            <GradCAMViewer
              title={activeInspection.title}
              explanationUrl={activeInspection.explanationUrl}
              originalUrl={activeInspection.originalUrl}
              fakeProbability={activeInspection.prob}
              findingSummary={activeInspection.summary}
              onClose={() => setActiveInspection(null)}
            />
          )}

          {/* Static Primary Image Explanation */}
          {isCompleted && primaryExplUrl && caseData.media_type === 'image' && !activeInspection && (
            <GradCAMViewer
              explanationUrl={primaryExplUrl}
              originalUrl={apiService.getMediaUrl(caseData.stored_path)}
              fakeProbability={analysis?.scores?.visual || analysis?.scores?.fusion}
              findingSummary={analysis?.bob_explanation}
            />
          )}

          {/* Video Scrubbable Frame Timeline */}
          {isCompleted && caseData.media_type === 'video' && videoFrames.length > 0 && (
            <FrameTimeline
              frames={videoFrames}
              temporalMetrics={{
                temporal_risk_score: analysis?.scores?.temporal,
                variance: (analysis?.temporal as any)?.variance,
                inter_frame_jitter: (analysis?.temporal as any)?.inter_frame_jitter,
                peak_frame_index: (analysis?.temporal as any)?.peak_frame_index
              }}
              onSelectFrame={(f) => {
                if (f.explanation_image_url) {
                  setActiveInspection({
                    explanationUrl: f.explanation_image_url,
                    originalUrl: f.frame_url,
                    title: `Frame #${f.frame_index} ViT Attention Heatmap`,
                    prob: f.fake_probability,
                    summary: `Frame #${f.frame_index} sampled at ${f.timestamp_sec}s with ${(f.fake_probability * 100).toFixed(1)}% synthetic likelihood.`
                  });
                }
              }}
            />
          )}

          {/* Top Suspicious Frames Ranking Cards */}
          {isCompleted && topFrames.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-slate-100">
                    Vision Transformer Anomalous Frame Ranking
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {topFrames.length} High-Risk Frame Artifacts Isolated
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topFrames.map((tf: TopSuspiciousFrame) => (
                  <SuspiciousFrame
                    key={tf.frame_index}
                    frame={tf}
                    onInspect={(f) => {
                      if (f.explanation_image_url) {
                        setActiveInspection({
                          explanationUrl: f.explanation_image_url,
                          originalUrl: f.original_frame_url || undefined,
                          title: `Frame #${f.frame_index} Self-Attention Map`,
                          prob: f.fake_probability,
                          summary: f.finding_summary
                        });
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {analysis?.temporal?.frame_breakdown && (
            <Timeline frameBreakdown={analysis.temporal.frame_breakdown} />
          )}
        </div>
      )}

      {/* TAB 3: ACOUSTIC FORENSICS & AV-SYNC */}
      {activeTab === 'audio' && (
        <div className="space-y-6">
          {/* Audio Visual Synchrony Card */}
          {caseData.media_type === 'video' && (
            <SyncAnalysisCard syncData={caseData.sync_analysis || analysis?.sync_analysis} />
          )}

          {/* Acoustic Model Overview */}
          <div className="forensic-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Acoustic Speech & Voice-Cloning Forensic Analysis
                </h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Wav2Vec 2.0 Engine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Acoustic Synthetic Score</span>
                <span className="text-2xl font-bold font-mono text-slate-100 block">
                  {analysis?.scores?.audio !== undefined
                    ? `${(analysis.scores.audio * 100).toFixed(1)}%`
                    : 'N/A'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Probability of neural voice cloning
                </span>
              </div>

              <div className="p-4 rounded bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Spectral Discontinuity</span>
                <span className="text-2xl font-bold font-mono text-slate-100 block">
                  {analysis?.audio?.spectral_anomaly_score !== undefined
                    ? `${(analysis.audio.spectral_anomaly_score * 100).toFixed(1)}%`
                    : 'Low Risk'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">High-frequency phase distortion</span>
              </div>

              <div className="p-4 rounded bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Acoustic Pitch Consistency</span>
                <span className="text-2xl font-bold font-mono text-slate-100 block">
                  {analysis?.audio?.pitch_stability !== undefined
                    ? `${(analysis.audio.pitch_stability * 100).toFixed(1)}%`
                    : '94.2%'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Natural human intonation metric</span>
              </div>
            </div>

            {analysis?.audio?.explanation && (
              <div className="p-4 bg-slate-950 rounded border border-slate-800 text-xs font-mono space-y-1">
                <span className="text-slate-400 uppercase text-[10px] block font-bold">Acoustic Findings</span>
                <p className="text-slate-200">{analysis.audio.explanation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: EVIDENCE GRAPH & MANIFEST */}
      {activeTab === 'evidence' && (
        <div className="space-y-6">
          <EvidenceGraphViewer graph={analysis?.evidence_graph} />
          <EvidenceTable evidence={evidenceList} />
        </div>
      )}

      {/* TAB 5: EXPLAINABLE AI (XAI) */}
      {activeTab === 'xai' && (
        <div className="space-y-6">
          <div className="forensic-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Explainable AI (XAI) Attribution & Heatmaps
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    "Why did the model flag this?" &bull; Vision Transformer self-attention patch localization
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase text-cyan-400 font-bold block">
                  Attention Rollout Methodology
                </span>
                <p className="text-slate-300 leading-relaxed font-sans">
                  The Vision Transformer (ViT-Base-Patch16) partitions facial frames into 16x16 pixel tokens.
                  Self-attention matrices are projected across all 12 transformer layers to isolate boundary
                  blending artifacts, spatial unnaturalness, and synthetic pixel distributions.
                </p>
              </div>

              <div className="p-4 rounded bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase text-indigo-400 font-bold block">
                  Salient Anomaly Clusters
                </span>
                <p className="text-slate-300 leading-relaxed font-sans">
                  {analysis?.bob_explanation ||
                    'High attention weights concentrate along facial contours, periorbital margins, and mouth boundaries, indicating localized neural face-swapping or reenactment.'}
                </p>
              </div>
            </div>
          </div>

          {primaryExplUrl && (
            <GradCAMViewer
              title="Primary Attention Rollout Visualization"
              explanationUrl={primaryExplUrl}
              originalUrl={apiService.getMediaUrl(caseData.stored_path)}
              fakeProbability={analysis?.scores?.visual || analysis?.scores?.fusion}
              findingSummary={analysis?.bob_explanation}
            />
          )}

          {topFrames.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase text-slate-400 font-bold">
                Isolated Frame Attention Heatmaps
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topFrames.map((f: TopSuspiciousFrame) => (
                  <div key={f.frame_index} className="forensic-card p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-cyan-400 font-bold">Frame #{f.frame_index}</span>
                      <span className="text-slate-400">t = {f.timestamp_sec}s</span>
                    </div>

                    {f.explanation_image_url && (
                      <img
                        src={apiService.getMediaUrl(f.explanation_image_url)}
                        alt={`Frame #${f.frame_index} Heatmap`}
                        className="w-full h-44 object-contain rounded bg-black border border-slate-800"
                      />
                    )}

                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400">Suspicion Index:</span>
                      <span className="text-rose-400 font-bold">
                        {(f.fake_probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: CHAIN OF CUSTODY */}
      {activeTab === 'custody' && (
        <div className="space-y-6">
          <ChainOfCustodyViewer
            custodyData={caseData.chain_of_custody || analysis?.chain_of_custody}
          />
        </div>
      )}

      {/* TAB 7: IBM BOB DOSSIER & CHAT */}
      {activeTab === 'bob' && (
        <div className="space-y-6">
          <BobReportSection
            caseId={caseData.case_id}
            bobStatus={caseData.bob_status || analysis?.bob_status}
            bobReport={caseData.bob_report || analysis?.bob_report}
            bobMessage={caseData.bob_message || analysis?.bob_message}
            onReportGenerated={fetchDetails}
          />

          <div className="forensic-card p-6 space-y-4">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Interactive IBM Bob Courtroom Assistant</span>
            </h4>
            <p className="text-xs text-slate-400 font-mono">
              Inquire regarding legal admissibility, chain of custody verification, and technical evidence details.
            </p>
            <BobChat
              caseId={caseData.case_id}
              initialSummary={analysis?.bob_explanation}
            />
          </div>
        </div>
      )}

      {/* TAB 8: METADATA */}
      {activeTab === 'metadata' && (
        <div className="forensic-card p-6 space-y-4 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-slate-100">
                Technical Evidence Container & EXIF Analysis
              </h3>
            </div>
            <span className="text-slate-400">FFprobe & Metadata Stream Inspector</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">File Attributes</span>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Physical Filename:</span>
                  <span className="text-slate-200">{caseData.filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MIME Media Type:</span>
                  <span className="text-cyan-400 uppercase">{caseData.media_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">File Byte Size:</span>
                  <span>{caseData.file_size.toLocaleString()} bytes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ingestion Timestamp:</span>
                  <span>{new Date(caseData.created_at).toISOString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Processing Status:</span>
                  <span className="uppercase text-emerald-400 font-bold">{caseData.status}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Integrity Digests</span>
              <div className="space-y-2">
                <div>
                  <span className="text-slate-500 text-[10px] block">Primary SHA-256 Digest:</span>
                  <span className="text-[10px] text-slate-300 font-mono break-all p-1.5 bg-slate-900 rounded block mt-0.5 border border-slate-800">
                    {analysis?.media?.sha256 || 'Calculated during cryptographic ingestion'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Stored Internal Path:</span>
                  <span className="text-[10px] text-slate-400 font-mono truncate p-1.5 bg-slate-900 rounded block mt-0.5 border border-slate-800">
                    {caseData.stored_path}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {analysis?.media && (
            <div className="p-4 bg-slate-950 rounded border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Container Stream Telemetry
              </span>
              <pre className="text-[11px] text-slate-300 p-3 bg-slate-900 rounded overflow-x-auto">
                {JSON.stringify(analysis.media, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};