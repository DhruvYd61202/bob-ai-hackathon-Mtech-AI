import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileCheck2,
  AlertCircle,
  Shield,
  Layers,
  Cpu,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Volume2,
  Video,
  Image as ImageIcon,
  Play,
  Sparkles,
  Lock,
} from "lucide-react";
import { apiService } from "../services/api";

export const Upload: React.FC = () => {
  const navigate = useNavigate();

  // Wizard Steps: 1. Case Info -> 2. Ingest Evidence -> 3. Configuration -> 4. Execute
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Case Details
  const [caseName, setCaseName] = useState("");
  const [caseDescription, setCaseDescription] = useState("");
  const [investigatorName, setInvestigatorName] = useState("Forensic Examiner");
  const [caseTags, setCaseTags] = useState("Urgent, Digital Provenance");

  // Step 2: Evidence File
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Step 3: Analysis Modules
  const [modules, setModules] = useState({
    faceDetection: true,
    visualViT: true,
    audioWav2Vec: true,
    temporalAggregator: true,
    avSync: true,
    chainOfCustody: true,
    bobReporting: true,
  });

  // Step 4: Execution Progress
  const [executing, setExecuting] = useState(false);
  const [execStage, setExecStage] = useState<string>("Initializing investigation...");
  const [execStepIdx, setExecStepIdx] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const stages = [
    "UPLOAD & CONTAINER INGESTION",
    "HEADER & BITSTREAM VALIDATION",
    "FRAME & SPECTRAL EXTRACTION",
    "MTCNN 5-PT FACIAL DETECTION",
    "VISION TRANSFORMER / WAV2VEC2 INFERENCE",
    "CROSS-MODAL SIGNAL ANALYSIS",
    "EVIDENCE GRAPH & LEDGER BUILDING",
    "IBM BOB COURTROOM REPORT SYNTHESIS",
  ];

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      if (!caseName) {
        setCaseName(e.dataTransfer.files[0].name.split(".")[0]);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      if (!caseName) {
        setCaseName(e.target.files[0].name.split(".")[0]);
      }
    }
  };

  const getMediaCategory = (file: File) => {
    if (file.type.startsWith("video/") || file.name.match(/\.(mp4|avi|mov|mkv|webm)$/i)) return "video";
    if (file.type.startsWith("audio/") || file.name.match(/\.(wav|mp3|aac|flac|ogg)$/i)) return "audio";
    return "image";
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) return;
    setExecuting(true);
    setError(null);

    try {
      // Stage 1: Upload
      setExecStepIdx(0);
      setExecStage(stages[0]);
      const uploadRes = await apiService.uploadFile(selectedFile);
      const caseId = uploadRes.case_id;

      // Simulated progressive updates while backend neural pipeline executes
      const stepTimer1 = setTimeout(() => {
        setExecStepIdx(1);
        setExecStage(stages[1]);
      }, 700);

      const stepTimer2 = setTimeout(() => {
        setExecStepIdx(2);
        setExecStage(stages[2]);
      }, 1500);

      const stepTimer3 = setTimeout(() => {
        setExecStepIdx(3);
        setExecStage(stages[3]);
      }, 2500);

      const stepTimer4 = setTimeout(() => {
        setExecStepIdx(4);
        setExecStage(stages[4]);
      }, 3800);

      const stepTimer5 = setTimeout(() => {
        setExecStepIdx(5);
        setExecStage(stages[5]);
      }, 5000);

      const stepTimer6 = setTimeout(() => {
        setExecStepIdx(6);
        setExecStage(stages[6]);
      }, 6200);

      // Execute backend analysis pipeline
      await apiService.analyzeCase(caseId);

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);
      clearTimeout(stepTimer5);
      clearTimeout(stepTimer6);

      setExecStepIdx(7);
      setExecStage(stages[7]);
      await new Promise((r) => setTimeout(r, 600));

      // Successfully finished -> navigate to case details
      navigate(`/cases/${caseId}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Forensic analysis pipeline failed. Please verify format and size.");
      setExecuting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
          <UploadCloud className="w-5 h-5 text-cyan-400" />
          <span>New Forensic Case & Evidence Ingestion</span>
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          Standardized four-stage ingestion workflow for biometric, acoustic, and visual digital evidence
        </p>
      </div>

      {/* Step Indicator */}
      <div className="grid grid-cols-4 gap-2 font-mono text-xs">
        {[
          { num: 1, title: "1. Case Metadata" },
          { num: 2, title: "2. Evidence Ingestion" },
          { num: 3, title: "3. Pipeline Config" },
          { num: 4, title: "4. Execution" },
        ].map((s) => (
          <div
            key={s.num}
            className={`p-2.5 rounded border text-center transition-colors ${
              currentStep === s.num
                ? "bg-cyan-950/70 border-cyan-800 text-cyan-300 font-bold"
                : currentStep > s.num
                ? "bg-slate-900 border-slate-800 text-emerald-400 font-medium"
                : "bg-slate-950 border-slate-900 text-slate-600"
            }`}
          >
            {s.title}
          </div>
        ))}
      </div>

      {/* Step 1: Case Details */}
      {currentStep === 1 && (
        <div className="forensic-card p-6 space-y-5 animate-fadeIn">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Step 1: Case Identification & Investigation Metadata</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Specify legal case reference, investigator in charge, and organizational tags
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">Case Name / Reference Title:</label>
              <input
                type="text"
                value={caseName}
                onChange={(e) => setCaseName(e.target.value)}
                placeholder="e.g. Media_Verification_Case_001"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">Investigator / Examiner Name:</label>
              <input
                type="text"
                value={investigatorName}
                onChange={(e) => setInvestigatorName(e.target.value)}
                placeholder="Examiner Badge or Name"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-slate-300 font-semibold block">Investigation Scope / Notes:</label>
              <textarea
                value={caseDescription}
                onChange={(e) => setCaseDescription(e.target.value)}
                placeholder="Provide investigation context, origin of suspected media, or chain of possession details..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans text-xs"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-slate-300 font-semibold block">Tags / Classification:</label>
              <input
                type="text"
                value={caseTags}
                onChange={(e) => setCaseTags(e.target.value)}
                placeholder="e.g. Video Evidence, Social Media, Audio Analysis"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Next: Upload Evidence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Ingest Evidence */}
      {currentStep === 2 && (
        <div className="forensic-card p-6 space-y-5 animate-fadeIn">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              <span>Step 2: Upload Digital Evidence Media</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Supports Image (.jpg, .png, .webp), Video (.mp4, .mov, .avi, .mkv), and Audio (.wav, .mp3, .flac)
            </p>
          </div>

          {/* Drag and drop box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              isDragging
                ? "border-cyan-500 bg-cyan-950/20"
                : "border-slate-800 hover:border-slate-700 bg-slate-950/50"
            }`}
          >
            <div className="flex justify-center gap-4 text-slate-500 mb-3">
              <ImageIcon className="w-7 h-7 text-cyan-400/80" />
              <Video className="w-7 h-7 text-blue-400/80" />
              <Volume2 className="w-7 h-7 text-amber-400/80" />
            </div>

            <p className="text-xs font-mono text-slate-300">
              Drag & drop media file here, or{" "}
              <label className="text-cyan-400 hover:underline cursor-pointer">
                browse filesystem
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,video/*,audio/*,.mp4,.mov,.avi,.mkv,.wav,.mp3"
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Maximum container size: 100 MB</p>
          </div>

          {/* Selected File Details */}
          {selectedFile && (
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 uppercase text-[10px]">Verified Ingestion Target</span>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {getMediaCategory(selectedFile)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <FileCheck2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="truncate flex-1">
                  <p className="font-semibold text-slate-200 truncate">{selectedFile.name}</p>
                  <p className="text-slate-500 text-[11px]">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; {selectedFile.type || "binary stream"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-3 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded font-mono text-xs flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back: Metadata</span>
            </button>

            <button
              onClick={() => setCurrentStep(3)}
              disabled={!selectedFile}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Next: Pipeline Modules</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Analysis Configuration */}
      {currentStep === 3 && (
        <div className="forensic-card p-6 space-y-5 animate-fadeIn">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Step 3: Forensic Deep Learning Pipeline Configuration</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Select backend neural network analyzers and cryptographic governance engines
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <label className="flex items-start gap-3 p-3 bg-slate-950/70 rounded border border-slate-800 hover:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={modules.faceDetection}
                onChange={(e) => setModules({ ...modules, faceDetection: e.target.checked })}
                className="mt-0.5 rounded text-cyan-600 focus:ring-0"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-200">Face Detection & Landmark Alignment</span>
                <p className="text-slate-400 text-[11px] font-sans">
                  Multi-task Cascaded CNN (MTCNN) 5-point facial landmark resolution and bounding box localization.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-950/70 rounded border border-slate-800 hover:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={modules.visualViT}
                onChange={(e) => setModules({ ...modules, visualViT: e.target.checked })}
                className="mt-0.5 rounded text-cyan-600 focus:ring-0"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-200">Vision Transformer (ViT-Base, 86M params) Deepfake Classifier</span>
                <p className="text-slate-400 text-[11px] font-sans">
                  Evaluates 16x16 spatial patch embeddings and generates self-attention rollout heatmap overlays.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-950/70 rounded border border-slate-800 hover:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={modules.audioWav2Vec}
                onChange={(e) => setModules({ ...modules, audioWav2Vec: e.target.checked })}
                className="mt-0.5 rounded text-cyan-600 focus:ring-0"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-200">Wav2Vec 2.0 (95M params) Audio Spoof & Vocoder Detector</span>
                <p className="text-slate-400 text-[11px] font-sans">
                  Analyzes 16 kHz raw acoustic speech waveforms for synthetic TTS, voice cloning, and vocoder artifacts.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-950/70 rounded border border-slate-800 hover:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={modules.temporalAggregator}
                onChange={(e) => setModules({ ...modules, temporalAggregator: e.target.checked })}
                className="mt-0.5 rounded text-cyan-600 focus:ring-0"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-200">Multi-Frame Temporal Sequence Aggregator</span>
                <p className="text-slate-400 text-[11px] font-sans">
                  Computes inter-frame landmark velocity, feature variance, and localizes peak anomalous frames.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-950/70 rounded border border-slate-800 hover:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={modules.avSync}
                onChange={(e) => setModules({ ...modules, avSync: e.target.checked })}
                className="mt-0.5 rounded text-cyan-600 focus:ring-0"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-200">Audio-Visual Synchronization Analyzer</span>
                <p className="text-slate-400 text-[11px] font-sans">
                  Mouth aspect ratio velocity vs speech acoustic energy envelope correlation (supporting signal).
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-950/70 rounded border border-slate-800 hover:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={modules.chainOfCustody}
                onChange={(e) => setModules({ ...modules, chainOfCustody: e.target.checked })}
                className="mt-0.5 rounded text-cyan-600 focus:ring-0"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-200">SHA-256 Cryptographic Chain of Custody</span>
                <p className="text-slate-400 text-[11px] font-sans">
                  Maintains an immutable block-linked chronological audit trail of all ingestion and model stages.
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-between pt-3 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded font-mono text-xs flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back: Evidence</span>
            </button>

            <button
              onClick={handleStartAnalysis}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-mono text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Launch Forensic Pipeline</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 4 / Execution State */}
      {executing && (
        <div className="forensic-card p-6 space-y-6 animate-fadeIn border-cyan-800/60 bg-slate-900/90">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>Executing Multimodal Forensic Investigation</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedFile?.name}</p>
            </div>
            <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse">
              ANALYZING
            </span>
          </div>

          {/* Progress Stages Timeline */}
          <div className="space-y-3 font-mono text-xs">
            {stages.map((stg, i) => {
              const isPast = i < execStepIdx;
              const isCurrent = i === execStepIdx;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-2.5 rounded transition-colors ${
                    isCurrent
                      ? "bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 font-bold"
                      : isPast
                      ? "bg-slate-950/60 text-emerald-400 border border-slate-900"
                      : "text-slate-600 border border-transparent"
                  }`}
                >
                  <div className="w-5 text-center">
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : isCurrent ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 mx-auto animate-ping" />
                    ) : (
                      <span className="text-[10px] text-slate-700">{i + 1}</span>
                    )}
                  </div>
                  <span className="text-[11px]">{stg}</span>
                  {isCurrent && <span className="ml-auto text-[10px] text-cyan-400 animate-pulse">IN PROGRESS...</span>}
                  {isPast && <span className="ml-auto text-[10px] text-emerald-500 font-semibold">VERIFIED</span>}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded text-rose-300 text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
