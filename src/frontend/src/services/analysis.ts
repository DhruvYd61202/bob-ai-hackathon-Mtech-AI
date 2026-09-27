import { client } from "./api";
import {
  AnalysisResult,
  ModelStatusResponse,
  FrameTimelineResponse,
  ExplanationsResponse,
  ChainOfCustody
} from "../types";

export interface UploadResponse {
  case_id: string;
  filename: string;
  media_type: "image" | "video" | "audio";
  file_size?: number;
  status: string;
}

export const analysisService = {
  uploadFile: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await client.post<UploadResponse>("/api/analysis/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  analyzeCase: async (caseId: string): Promise<AnalysisResult> => {
    const res = await client.post<AnalysisResult>(`/api/analysis/analyze/${caseId}`);
    return res.data;
  },

  getModelsStatus: async (): Promise<ModelStatusResponse> => {
    const res = await client.get<ModelStatusResponse>("/api/analysis/models/status");
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

  getCustody: async (caseId: string): Promise<{ case_id: string; chain_of_custody: ChainOfCustody }> => {
    const res = await client.get(`/api/analysis/${caseId}/custody`);
    return res.data;
  },
};
