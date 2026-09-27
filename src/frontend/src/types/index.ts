export type PredictionLabel = "authentic" | "inconclusive" | "potentially_manipulated";
export type RiskLevel = "low" | "medium" | "high";
export type SeverityLevel = "info" | "low" | "medium" | "high" | "critical";
export type EvidenceCategory = "metadata" | "visual" | "face" | "audio" | "temporal" | "compression" | "model" | "system";

export interface EvidenceItem {
  id: string;
  category: EvidenceCategory;
  title: string;
  description: string;
  severity: SeverityLevel;
  confidence: number;
  source: string;
  timestamp?: number | null;
  frame_number?: number | null;
  location?: Record<string, any> | null;
  technical_details?: Record<string, any> | null;
  model_name?: string | null;
  model_id?: string | null;
  model_version?: string | null;
}

export interface EvidenceGraphNode {
  id: string;
  label: string;
  type: string;
  severity?: string;
  details?: Record<string, any>;
}

export interface EvidenceGraphEdge {
  source: string;
  target: string;
  relation: string;
}

export interface EvidenceGraph {
  nodes: EvidenceGraphNode[];
  edges: EvidenceGraphEdge[];
  total_nodes?: number;
  total_edges?: number;
}

export interface ScoresResult {
  visual: number;
  audio: number;
  metadata: number;
  temporal: number;
  fusion: number;
}

export interface PredictionResult {
  label: PredictionLabel;
  confidence: number;
  risk_level: RiskLevel;
}

export interface ModelMetadata {
  model_id: string;
  name: string;
  role: string;
  architecture: string;
  framework: string;
  source: string;
  license: string;
  version: string;
  input_shape: string;
  classes: Record<string, string>;
  description: string;
  paper_citation?: string | null;
}

export interface ModelInfo {
  name: string;
  model_id: string;
  loaded: boolean;
  device: string;
  error?: string | null;
  metadata?: ModelMetadata;
}

export interface DeviceStatus {
  device_type: string;
  cuda_available: boolean;
  configured_target: string;
  resolved_target: string;
  gpu_name?: string | null;
  gpu_count?: number;
  vram_allocated_mb?: number;
  vram_reserved_mb?: number;
}

export interface ModelStatusResponse {
  device_info: DeviceStatus;
  models: {
    face_detector: ModelInfo;
    visual_detector: ModelInfo;
    audio_detector: ModelInfo;
    temporal_detector: ModelInfo;
  };
}

export interface TopSuspiciousFrame {
  rank: number;
  frame_index: number;
  timestamp_sec: number;
  fake_probability: number;
  real_probability: number;
  confidence: number;
  explanation_image_url?: string | null;
  original_frame_url?: string | null;
  faces_detected: number;
  finding_summary: string;
}

export interface ExplanationData {
  primary_explanation_url?: string | null;
  all_explanations?: string[];
  narrative?: string;
  top_suspicious_frames?: TopSuspiciousFrame[];
}

export interface FrameItem {
  frame_index: number;
  timestamp_sec: number;
  fake_probability: number;
  real_probability: number;
  confidence: number;
  predicted_label: string;
  faces_detected: number;
  frame_url: string;
  explanation_image_url?: string | null;
}

export interface FrameTimelineResponse {
  case_id: string;
  total_frames: number;
  frames: FrameItem[];
  top_suspicious_frames: TopSuspiciousFrame[];
}

export interface ExplanationsResponse {
  case_id: string;
  explanations: ExplanationData;
  top_suspicious_frames: TopSuspiciousFrame[];
}

export interface AnalysisResult {
  case_id: string;
  media: {
    filename: string;
    media_type: "image" | "video" | "audio";
    width?: number;
    height?: number;
    total_frames?: number;
    fps?: number;
    duration?: number;
    resolution?: string;
    codec?: string;
    sample_rate?: number;
    file_size?: number;
    format?: string;
    sha256?: string;
    md5?: string;
  };
  prediction: PredictionResult;
  scores: ScoresResult;
  metadata: Record<string, any>;
  faces: Record<string, any>;
  audio: Record<string, any>;
  visual: Record<string, any>;
  temporal: Record<string, any>;
  sync_analysis?: SyncAnalysis;
  chain_of_custody?: ChainOfCustody;
  bob_status?: string;
  bob_report?: BobReport;
  bob_message?: string;
  evidence: EvidenceItem[];
  evidence_graph: EvidenceGraph;
  bob_explanation: string;
  limitations: string[];
  model_status: string;
  models_provenance?: ModelStatusResponse;
  explanations?: ExplanationData;
  top_suspicious_frames?: TopSuspiciousFrame[];
}

export interface Case {
  case_id: string;
  created_at: string;
  filename: string;
  media_type: "image" | "video" | "audio";
  file_size: number;
  status: "uploaded" | "analyzing" | "completed" | "failed";
  stored_path?: string;
  risk_level: RiskLevel | "unknown";
  prediction_label?: PredictionLabel;
  confidence?: number;
  evidence_count?: number;
  analysis_result?: AnalysisResult;
  evidence?: EvidenceItem[];
  sync_analysis?: SyncAnalysis;
  chain_of_custody?: ChainOfCustody;
  bob_status?: string;
  bob_report?: BobReport;
  bob_message?: string;
  error_message?: string;
}

export interface BobResponse {
  case_id: string;
  query: string;
  answer: string;
  source: string;
  citations: string[];
}

export interface BobStatus {
  configured: boolean;
  reachable: boolean;
  service: string;
  status_message: string;
  model: string;
  endpoint: string;
}

export interface BobReport {
  case_summary: string;
  overall_forensic_assessment: string;
  verdict_statement: string;
  visual_forensic_analysis: string;
  audio_forensic_analysis: string;
  temporal_forensic_analysis: string;
  synchronization_analysis: string;
  metadata_forensic_analysis: string;
  conflicting_evidence_analysis: string;
  limitations_and_caveats: string[];
  forensic_recommendations: string[];
  confidence_assessment: string;
  chain_of_custody_notes: string;
  generated_at: string;
  model_id: string;
}

export interface CustodyEvent {
  event_id: string;
  timestamp: string;
  event_type: string;
  actor_or_component: string;
  description: string;
  device?: string | null;
  input_hash?: string | null;
  output_hash?: string | null;
  metadata?: Record<string, any>;
  previous_event_hash?: string | null;
  event_signature?: string | null;
}

export interface ChainOfCustody {
  case_id: string;
  media_sha256: string;
  created_at: string;
  total_events: number;
  integrity_verified: boolean;
  events: CustodyEvent[];
}

export interface SyncAnalysis {
  available: boolean;
  status: string;
  sync_score: number;
  desync_risk: number;
  correlation: number;
  sampled_windows?: number;
  is_supporting_signal: boolean;
  evidence_label: string;
  is_anomalous?: boolean;
  finding_summary: string;
  details?: Record<string, any>;
}