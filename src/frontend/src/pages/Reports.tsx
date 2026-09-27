import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Download,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { apiService } from "../services/api";
import { Case } from "../types";
import { RiskBadge } from "../components/RiskBadge";

export const Reports: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const data = await apiService.getCases();
      // Only show completed cases or cases with reports
      setCases(data.filter((c) => c.status === "completed"));
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleRegenerate = async (caseId: string) => {
    setRegeneratingId(caseId);
    try {
      await apiService.generateBobReport(caseId);
      await fetchCases();
    } catch (err) {
      alert("Failed to regenerate report dossier.");
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleDownloadJson = (caseItem: Case) => {
    const jsonStr = JSON.stringify(caseItem, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Case_${caseItem.case_id.slice(0, 8)}_ForensicReport.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.prediction_label && c.prediction_label.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRisk = riskFilter === "all" || c.risk_level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const totalReports = cases.length;
  const bobReportsCount = cases.filter((c) => c.bob_status === "generated" || c.bob_report).length;
  const highRiskReports = cases.filter((c) => c.risk_level === "high").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Forensic Case Reports & Dossiers</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Tamper-evident legal investigation dossiers, Section 18 Bob briefings, and Section 19 custody ledgers
          </p>
        </div>

        <button
          onClick={fetchCases}
          disabled={loading}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs font-mono flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="forensic-card p-4 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Available Dossiers</span>
          <p className="text-2xl font-bold font-mono text-slate-100">{totalReports}</p>
          <span className="text-[11px] text-slate-500 font-mono">100% Cryptographically signed</span>
        </div>

        <div className="forensic-card p-4 space-y-1 border-blue-900/40 bg-blue-950/15">
          <span className="text-[10px] font-mono text-blue-400 uppercase font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>IBM Bob Verified</span>
          </span>
          <p className="text-2xl font-bold font-mono text-blue-300">{bobReportsCount}</p>
          <span className="text-[11px] text-blue-400 font-mono">Section 18 Narrative Included</span>
        </div>

        <div className="forensic-card p-4 space-y-1 border-rose-900/40 bg-rose-950/15">
          <span className="text-[10px] font-mono text-rose-400 uppercase font-semibold">High-Risk Casefiles</span>
          <p className="text-2xl font-bold font-mono text-rose-300">{highRiskReports}</p>
          <span className="text-[11px] text-rose-400 font-mono">Elevated Manipulation Likelihood</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="forensic-card p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded px-3 py-2 w-full sm:flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports by Case ID, Filename, or Verdict..."
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Risk:</span>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:outline-none"
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="forensic-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-slate-400 space-y-2">
            <RefreshCw className="w-5 h-5 mx-auto animate-spin text-cyan-400" />
            <p>Loading forensic reports catalogue...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-mono text-xs space-y-2">
            <FileText className="w-6 h-6 mx-auto text-slate-600" />
            <p>No completed forensic reports match your criteria.</p>
            <Link to="/upload" className="text-cyan-400 underline inline-block text-[11px] mt-1">
              Start a new analysis to generate investigation reports
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Report ID / Case</th>
                  <th className="py-3 px-3">Evidence Filename</th>
                  <th className="py-3 px-3">Verdict</th>
                  <th className="py-3 px-3">Confidence</th>
                  <th className="py-3 px-3">Risk</th>
                  <th className="py-3 px-3">IBM Bob Briefing</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredCases.map((c) => {
                  const hasBob = c.bob_status === "generated" || !!c.bob_report;
                  const pdfUrl = apiService.getReportPdfUrl(c.case_id);

                  return (
                    <tr key={c.case_id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-3 align-middle font-bold text-cyan-400">
                        <span>REP-{c.case_id.slice(0, 8)}</span>
                        <span className="block text-[10px] text-slate-500 font-normal">
                          {c.media_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 align-middle max-w-xs truncate font-sans text-slate-200">
                        {c.filename}
                      </td>
                      <td className="py-3.5 px-3 align-middle capitalize">
                        {c.prediction_label ? c.prediction_label.replace("_", " ") : "Inconclusive"}
                      </td>
                      <td className="py-3.5 px-3 align-middle text-slate-300 font-bold">
                        {c.confidence ? `${(c.confidence * 100).toFixed(0)}%` : "—"}
                      </td>
                      <td className="py-3.5 px-3 align-middle">
                        <RiskBadge riskLevel={c.risk_level} size="sm" />
                      </td>
                      <td className="py-3.5 px-3 align-middle">
                        {hasBob ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded">
                            <Sparkles className="w-3 h-3" />
                            <span>Section 18 Generated</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            Automated AI
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 align-middle text-slate-400 text-[11px]">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3 align-middle text-right space-x-1.5 whitespace-nowrap">
                        <Link
                          to={`/report/${c.case_id}`}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded text-[11px] inline-flex items-center gap-1 transition-colors"
                          title="View Interactive Report Viewer"
                        >
                          <Eye className="w-3 h-3 text-cyan-400" />
                          <span>View</span>
                        </Link>

                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-semibold inline-flex items-center gap-1 transition-colors shadow-sm"
                          title="Download Official Forensic PDF Report"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </a>

                        <button
                          onClick={() => handleDownloadJson(c)}
                          className="px-2 py-1 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 rounded text-[11px] inline-flex items-center gap-1 transition-colors"
                          title="Export JSON Evidence"
                        >
                          <span>JSON</span>
                        </button>

                        <button
                          onClick={() => handleRegenerate(c.case_id)}
                          disabled={regeneratingId === c.case_id}
                          className="px-2 py-1 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-cyan-400 border border-slate-800 rounded text-[11px] inline-flex items-center gap-1 transition-colors"
                          title="Regenerate Report with IBM Bob"
                        >
                          <RefreshCw className={`w-3 h-3 ${regeneratingId === c.case_id ? "animate-spin" : ""}`} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
