import axios from "axios";
import {
  AnalysisResult,
  BobResponse,
  Case,
  EvidenceItem,
  ModelStatusResponse,
  FrameTimelineResponse,
  ExplanationsResponse,
  BobStatus,
  ChainOfCustody
} from "../types";

export const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const client = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export const apiService = {
  getHealth: async () => {
    const res = await client.get("/health");
    return res.data;
  },

  getModelsStatus: async (): Promise<ModelStatusResponse> => {
    const res = await client.get<ModelStatusResponse>("/api/analysis/models/status");
    return res.data;
  },

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await client.post<{
      case_id: string;
      filename: string;
      media_type: "image" | "video" | "audio";
      status: string;
    }>("/api/analysis/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  analyzeCase: async (caseId: string) => {
    const res = await client.post<AnalysisResult>(`/api/analysis/analyze/${caseId}`);
    return res.data;
  },

  getCases: async () => {
    const res = await client.get<Case[]>("/api/cases");
    return res.data;
  },

  getCase: async (caseId: string) => {
    const res = await client.get<Case>(`/api/cases/${caseId}`);
    return res.data;
  },

  deleteCase: async (caseId: string) => {
    const res = await client.delete(`/api/cases/${caseId}`);
    return res.data;
  },

  getEvidence: async (caseId: string) => {
    const res = await client.get<{ case_id: string; total_count: number; evidence: EvidenceItem[] }>(
      `/api/analysis/${caseId}/evidence`
    );
    return res.data;
  },

  getCaseFrames: async (caseId: string): Promise<FrameTimelineResponse> => {
    const res = await client.get<FrameTimelineResponse>(`/api/analysis/${caseId}/frames`);
    return res.data;
  },

  getCaseExplanations: async (caseId: string): Promise<ExplanationsResponse> => {
    const res = await client.get<ExplanationsResponse>(`/api/analysis/${caseId}/explanations`);
    return res.data;
  },

  getReport: async (caseId: string) => {
    const res = await client.get(`/api/analysis/${caseId}/report`);
    return res.data;
  },

  getReportPdfUrl: (caseId: string) => {
    return `${API_BASE}/api/analysis/${caseId}/report/pdf`;
  },

  askBob: async (caseId: string, message: string) => {
    const res = await client.post<BobResponse>(`/api/bob/chat/${caseId}`, { message });
    return res.data;
  },

  getBobSummary: async (caseId: string) => {
    const res = await client.get(`/api/bob/summary/${caseId}`);
    return res.data;
  },

  getBobStatus: async (): Promise<BobStatus> => {
    const res = await client.get<BobStatus>("/api/bob/status");
    return res.data;
  },

  generateBobReport: async (caseId: string) => {
    const res = await client.post(`/api/bob/generate-report/${caseId}`);
    return res.data;
  },

  getCustody: async (caseId: string): Promise<{ case_id: string; chain_of_custody: ChainOfCustody }> => {
    const res = await client.get(`/api/analysis/${caseId}/custody`);
    return res.data;
  },

  getMediaUrl: (storedPath?: string) => {
    if (!storedPath) return "";
    const filename = storedPath.split(/[/\\]/).pop();
    return `${API_BASE}/media/${filename}`;
  },

  getAssetUrl: (relUrl?: string | null) => {
    if (!relUrl) return "";
    if (relUrl.startsWith("http://") || relUrl.startsWith("https://")) return relUrl;
    return `${API_BASE}${relUrl.startsWith("/") ? "" : "/"}${relUrl}`;
  }
};