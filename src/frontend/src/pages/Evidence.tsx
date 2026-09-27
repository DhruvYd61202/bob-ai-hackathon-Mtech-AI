import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  Search,
  Filter,
  ArrowRight,
  AlertTriangle,
  Shield,
  Eye,
  Volume2,
  Clock,
  FileText,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { evidenceService, AggregatedEvidenceItem } from "../services/evidence";
import { RiskBadge } from "../components/RiskBadge";

export const Evidence: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<AggregatedEvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedMediaType, setSelectedMediaType] = useState<string>("all");

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const items = await evidenceService.getAllEvidence();
      setEvidenceList(items);
    } catch (err) {
      console.error("Failed to load evidence library:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const filteredEvidence = evidenceList.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.model_name && item.model_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.filename.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSeverity = selectedSeverity === "all" || item.severity === selectedSeverity;
    const matchesMedia = selectedMediaType === "all" || item.media_type === selectedMediaType;

    return matchesSearch && matchesCategory && matchesSeverity && matchesMedia;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "visual":
      case "face":
        return <Eye className="w-3.5 h-3.5 text-cyan-400" />;
      case "audio":
        return <Volume2 className="w-3.5 h-3.5 text-blue-400" />;
      case "temporal":
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case "metadata":
        return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Cpu className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const sev = severity.toLowerCase();
    if (sev === "critical") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800">
          CRITICAL
        </span>
      );
    }
    if (sev === "high") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-900/60 text-rose-400 border border-rose-800/60">
          HIGH
        </span>
      );
    }
    if (sev === "medium") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/70 text-amber-400 border border-amber-800/60">
          MEDIUM
        </span>
      );
    }
    if (sev === "low") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
          LOW
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950/70 text-blue-400 border border-blue-800/60">
        INFO
      </span>
    );
  };

  // Severity counts
  const criticalCount = evidenceList.filter((e) => e.severity === "critical").length;
  const highCount = evidenceList.filter((e) => e.severity === "high").length;
  const mediumCount = evidenceList.filter((e) => e.severity === "medium").length;
  const lowCount = evidenceList.filter((e) => e.severity === "low" || e.severity === "info").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Forensic Evidence Library</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Catalog of verified multimodal signals, neural anomalies, and biometric findings
          </p>
        </div>

        <button
          onClick={fetchEvidence}
          disabled={loading}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs font-mono flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Evidence</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="forensic-card p-3 border-rose-900/50 bg-rose-950/20">
          <span className="text-[10px] font-mono text-rose-400 uppercase font-semibold">Critical Signals</span>
          <p className="text-xl font-bold font-mono text-rose-300 mt-0.5">{criticalCount}</p>
        </div>
        <div className="forensic-card p-3 border-rose-900/30 bg-rose-950/10">
          <span className="text-[10px] font-mono text-rose-400 uppercase font-semibold">High Severity</span>
          <p className="text-xl font-bold font-mono text-rose-400 mt-0.5">{highCount}</p>
        </div>
        <div className="forensic-card p-3 border-amber-900/30 bg-amber-950/10">
          <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">Medium Anomalies</span>
          <p className="text-xl font-bold font-mono text-amber-400 mt-0.5">{mediumCount}</p>
        </div>
        <div className="forensic-card p-3 border-emerald-900/30 bg-emerald-950/10">
          <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">Baseline / Info</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{lowCount}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="forensic-card p-4 space-y-3">
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by finding title, description, neural model, filename, or Case ID..."
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="visual">Visual</option>
              <option value="face">Face Analysis</option>
              <option value="audio">Audio</option>
              <option value="temporal">Temporal</option>
              <option value="metadata">Metadata</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Media:</span>
            <select
              value={selectedMediaType}
              onChange={(e) => setSelectedMediaType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none"
            >
              <option value="all">All Formats</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
          </div>

          <span className="ml-auto text-slate-500 text-[11px]">
            Showing {filteredEvidence.length} of {evidenceList.length} finding(s)
          </span>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="forensic-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-slate-400 space-y-2">
            <RefreshCw className="w-5 h-5 mx-auto animate-spin text-cyan-400" />
            <p>Compiling multimodal evidence catalog...</p>
          </div>
        ) : filteredEvidence.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-mono text-xs space-y-2">
            <Layers className="w-6 h-6 mx-auto text-slate-600" />
            <p>No forensic evidence findings match your active filters.</p>
            <p className="text-[11px] text-slate-500">Run analysis on ingested cases to build findings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Evidence Item & Category</th>
                  <th className="py-3 px-3">Neural Model / Detector</th>
                  <th className="py-3 px-3">Location / Time</th>
                  <th className="py-3 px-3">Confidence</th>
                  <th className="py-3 px-3">Originating Case</th>
                  <th className="py-3 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredEvidence.map((item, idx) => (
                  <tr key={`${item.case_id}-${item.id}-${idx}`} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 align-top whitespace-nowrap">{getSeverityBadge(item.severity)}</td>
                    <td className="py-3 px-3 align-top max-w-sm">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {getCategoryIcon(item.category)}
                        <span className="font-semibold text-slate-200 capitalize font-sans">{item.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </td>
                    <td className="py-3 px-3 align-top whitespace-nowrap">
                      {item.model_name ? (
                        <div className="space-y-0.5">
                          <span className="text-cyan-400 font-semibold block text-[11px]">{item.model_name}</span>
                          <span className="text-[10px] text-slate-500 block">{item.model_id || "v1.0"}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Heuristic Detector</span>
                      )}
                    </td>
                    <td className="py-3 px-3 align-top whitespace-nowrap text-slate-400 text-[11px]">
                      {item.frame_number !== undefined && item.frame_number !== null ? (
                        <span>Frame #{item.frame_number}</span>
                      ) : item.timestamp ? (
                        <span>{item.timestamp.toFixed(2)}s</span>
                      ) : (
                        <span className="text-slate-600">Global Asset</span>
                      )}
                    </td>
                    <td className="py-3 px-3 align-top whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="text-slate-200 font-bold">{(item.confidence * 100).toFixed(0)}%</span>
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              item.severity === "critical" || item.severity === "high"
                                ? "bg-rose-500"
                                : item.severity === "medium"
                                ? "bg-amber-500"
                                : "bg-cyan-500"
                            }`}
                            style={{ width: `${item.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 align-top max-w-[140px] truncate">
                      <Link
                        to={`/cases/${item.case_id}`}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold block truncate"
                        title={item.filename}
                      >
                        {item.filename}
                      </Link>
                      <span className="text-[10px] text-slate-500 block truncate">{item.case_id.slice(0, 8)}...</span>
                    </td>
                    <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                      <Link
                        to={`/cases/${item.case_id}`}
                        className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-sans text-xs"
                      >
                        <span>Dossier</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
