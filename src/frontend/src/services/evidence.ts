import { client } from "./api";
import { EvidenceItem, Case } from "../types";

export interface CaseEvidenceResponse {
  case_id: string;
  total_count: number;
  evidence: EvidenceItem[];
}

export interface AggregatedEvidenceItem extends EvidenceItem {
  case_id: string;
  filename: string;
  media_type: string;
  created_at: string;
  risk_level: string;
}

export const evidenceService = {
  getEvidenceForCase: async (caseId: string): Promise<CaseEvidenceResponse> => {
    const res = await client.get<CaseEvidenceResponse>(`/api/analysis/${caseId}/evidence`);
    return res.data;
  },

  getAllEvidence: async (): Promise<AggregatedEvidenceItem[]> => {
    const casesRes = await client.get<Case[]>("/api/cases");
    const cases = casesRes.data || [];
    const aggregated: AggregatedEvidenceItem[] = [];

    // Fetch evidence for all cases concurrently
    await Promise.all(
      cases.map(async (c) => {
        try {
          const evRes = await client.get<CaseEvidenceResponse>(`/api/analysis/${c.case_id}/evidence`);
          const items = evRes.data?.evidence || [];
          for (const item of items) {
            aggregated.push({
              ...item,
              case_id: c.case_id,
              filename: c.filename,
              media_type: c.media_type,
              created_at: c.created_at,
              risk_level: c.risk_level,
            });
          }
        } catch {
          // If case has no evidence or failed, continue
        }
      })
    );

    return aggregated;
  },
};
