import { client, API_BASE } from "./api";

export const reportsService = {
  getReportJson: async (caseId: string) => {
    const res = await client.get(`/api/analysis/${caseId}/report`);
    return res.data;
  },

  getReportPdfUrl: (caseId: string): string => {
    return `${API_BASE}/api/analysis/${caseId}/download-report`;
  },

  regenerateReport: async (caseId: string) => {
    const res = await client.post(`/api/analysis/${caseId}/generate-report`);
    return res.data;
  },
};
