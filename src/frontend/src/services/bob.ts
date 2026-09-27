import { client } from "./api";
import { BobStatus, BobResponse, BobReport } from "../types";

export interface BobGenerateResponse {
  status: "success" | "unavailable";
  bob_status: string;
  report?: BobReport;
  message?: string;
}

export const bobService = {
  getStatus: async (): Promise<BobStatus> => {
    const res = await client.get<BobStatus>("/api/bob/status");
    return res.data;
  },

  askBob: async (caseId: string, message: string): Promise<BobResponse> => {
    const res = await client.post<BobResponse>(`/api/bob/chat/${caseId}`, { message });
    return res.data;
  },

  getSummary: async (caseId: string): Promise<BobResponse> => {
    const res = await client.get<BobResponse>(`/api/bob/summary/${caseId}`);
    return res.data;
  },

  generateReport: async (caseId: string): Promise<BobGenerateResponse> => {
    const res = await client.post<BobGenerateResponse>(`/api/bob/generate-report/${caseId}`);
    return res.data;
  },
};
