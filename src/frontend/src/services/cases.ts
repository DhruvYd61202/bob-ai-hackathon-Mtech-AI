import { client } from "./api";
import { Case } from "../types";

export const casesService = {
  getCases: async (): Promise<Case[]> => {
    const res = await client.get<Case[]>("/api/cases");
    return res.data;
  },

  getCase: async (caseId: string): Promise<Case> => {
    const res = await client.get<Case>(`/api/cases/${caseId}`);
    return res.data;
  },

  deleteCase: async (caseId: string): Promise<{ status: string; case_id: string }> => {
    const res = await client.delete(`/api/cases/${caseId}`);
    return res.data;
  },
};
