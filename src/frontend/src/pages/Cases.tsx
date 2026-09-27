import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderSearch, Trash2, ArrowRight, UploadCloud, Search, Filter,
  FileText, Download, Play, RefreshCw, Grid, List, CheckCircle2,
  AlertTriangle, ShieldAlert, ShieldCheck, Video, Image, Music,
  Copy, Check, Layers, Clock, HardDrive, Cpu, AlertCircle, X
} from 'lucide-react';
import { casesService } from '../services/cases';
import { analysisService } from '../services/analysis';
import { reportsService } from '../services/reports';
import { Case } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const Cases: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'risk_desc' | 'confidence_desc' | 'filename_asc'>('date_desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteModalCase, setDeleteModalCase] = useState<Case | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [runningAnalysisId, setRunningAnalysisId] = useState<string | null>(null);

  const fetchCases = async () => {
    try {
      setRefreshing(true);
      const data = await casesService.getCases();
      setCases(data);
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExecuteAnalysis = async (caseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      setRunningAnalysisId(caseId);
      await analysisService.analyzeCase(caseId);
      await fetchCases();
    } catch (err: any) {
      alert(`Analysis failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setRunningAnalysisId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModalCase) return;
    try {
      setDeleting(true);
      await casesService.deleteCase(deleteModalCase.case_id);
      setDeleteModalCase(null);
      await fetchCases();
    } catch (err) {
      alert('Failed to delete casefile.');
    } finally {
      setDeleting(false);
    }
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = cases.length;
    const critical = cases.filter(c => c.risk_level === 'high' || c.prediction_label === 'potentially_manipulated').length;
    const authentic = cases.filter(c => c.risk_level === 'low' || c.prediction_label === 'authentic').length;
    const processing = cases.filter(c => c.status === 'analyzing').length;
    const videoCount = cases.filter(c => c.media_type === 'video').length;
    const imageCount = cases.filter(c => c.media_type === 'image').length;
    const audioCount = cases.filter(c => c.media_type === 'audio').length;
    return { total, critical, authentic, processing, videoCount, imageCount, audioCount };
  }, [cases]);

  // Filtering and sorting
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      // Search filter
      const matchesSearch =
        c.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.prediction_label && c.prediction_label.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.risk_level && c.risk_level.toLowerCase().includes(searchTerm.toLowerCase()));

      // Media filter
      const matchesMedia = selectedMediaType === 'all' || c.media_type === selectedMediaType;

      // Risk filter
      const matchesRisk =
        selectedRisk === 'all' ||
        (selectedRisk === 'high' && c.risk_level === 'high') ||
        (selectedRisk === 'medium' && c.risk_level === 'medium') ||
        (selectedRisk === 'low' && c.risk_level === 'low') ||
        (selectedRisk === 'unprocessed' && (c.risk_level === 'unknown' || !c.risk_level));

      // Status filter
      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'completed' && c.status === 'completed') ||
        (selectedStatus === 'processing' && c.status === 'analyzing') ||
        (selectedStatus === 'ingested' && c.status === 'uploaded') ||
        (selectedStatus === 'failed' && c.status === 'failed');

      return matchesSearch && matchesMedia && matchesRisk && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'risk_desc') {
        const riskWeights: Record<string, number> = { high: 3, medium: 2, low: 1, unknown: 0 };
        const wA = riskWeights[a.risk_level || 'unknown'] || 0;
        const wB = riskWeights[b.risk_level || 'unknown'] || 0;
        return wB - wA;
      }
      if (sortBy === 'confidence_desc') {
        return (b.confidence || 0) - (a.confidence || 0);
      }
      if (sortBy === 'filename_asc') {
        return a.filename.localeCompare(b.filename);
      }
      return 0;
    });
  }, [cases, searchTerm, selectedMediaType, selectedRisk, selectedStatus, sortBy]);

  const getMediaIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video':
        return <Video className="w-3.5 h-3.5 text-indigo-400" />;
      case 'image':
        return <Image className="w-3.5 h-3.5 text-cyan-400" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <HardDrive className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <FolderSearch className="w-5 h-5 text-cyan-400" />
              <span>Forensic Casefiles Repository</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-mono text-[11px] border border-slate-700">
              {filteredCases.length} / {cases.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Tamper-evident chain of custody archives & multimodal AI inference records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCases}
            disabled={refreshing}
            className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Refresh repository"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <Link
            to="/upload"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-mono font-medium flex items-center gap-2 shadow-sm transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>New Forensic Ingestion</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="forensic-card p-3 border-l-2 border-l-cyan-500">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Casefiles</span>
          <span className="text-lg font-bold font-mono text-slate-100 mt-0.5 block">{metrics.total}</span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Stored evidence</span>
        </div>

        <div className="forensic-card p-3 border-l-2 border-l-rose-500">
          <span className="text-[10px] font-mono text-rose-400 uppercase block">High / Critical Risk</span>
          <span className="text-lg font-bold font-mono text-rose-300 mt-0.5 block">{metrics.critical}</span>
          <span className="text-[10px] text-rose-400/70 font-mono mt-0.5 block">Manipulated flag</span>
        </div>

        <div className="forensic-card p-3 border-l-2 border-l-emerald-500">
          <span className="text-[10px] font-mono text-emerald-400 uppercase block">Verified Authentic</span>
          <span className="text-lg font-bold font-mono text-emerald-300 mt-0.5 block">{metrics.authentic}</span>
          <span className="text-[10px] text-emerald-400/70 font-mono mt-0.5 block">Organic media</span>
        </div>

        <div className="forensic-card p-3 border-l-2 border-l-amber-500">
          <span className="text-[10px] font-mono text-amber-400 uppercase block">In Pipeline</span>
          <span className="text-lg font-bold font-mono text-amber-300 mt-0.5 block">{metrics.processing}</span>
          <span className="text-[10px] text-amber-400/70 font-mono mt-0.5 block">Active inference</span>
        </div>

        <div className="forensic-card p-3 border-l-2 border-l-indigo-500">
          <span className="text-[10px] font-mono text-indigo-400 uppercase block">Video Streams</span>
          <span className="text-lg font-bold font-mono text-indigo-300 mt-0.5 block">{metrics.videoCount}</span>
          <span className="text-[10px] text-indigo-400/70 font-mono mt-0.5 block">Temporal scrutiny</span>
        </div>

        <div className="forensic-card p-3 border-l-2 border-l-teal-500">
          <span className="text-[10px] font-mono text-teal-400 uppercase block">Images & Audio</span>
          <span className="text-lg font-bold font-mono text-teal-300 mt-0.5 block">
            {metrics.imageCount + metrics.audioCount}
          </span>
          <span className="text-[10px] text-teal-400/70 font-mono mt-0.5 block">
            {metrics.imageCount} img / {metrics.audioCount} aud
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="forensic-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 w-full flex items-center gap-2 bg-slate-950/80 px-3 py-2 rounded border border-slate-800 focus-within:border-cyan-500 transition-colors">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by Case ID, Filename, Verdict, or SHA-256..."
              className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded border border-slate-800 self-end md:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'cards' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Grid Cards View"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Modality</label>
            <select
              value={selectedMediaType}
              onChange={e => setSelectedMediaType(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 text-xs font-mono p-1.5 rounded border border-slate-800 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Media Streams</option>
              <option value="image">Image Only</option>
              <option value="video">Video Only</option>
              <option value="audio">Audio Only</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Risk Severity</label>
            <select
              value={selectedRisk}
              onChange={e => setSelectedRisk(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 text-xs font-mono p-1.5 rounded border border-slate-800 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">Critical & High Risk</option>
              <option value="medium">Suspicious & Medium</option>
              <option value="low">Authentic & Low Risk</option>
              <option value="unprocessed">Unprocessed</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Pipeline Status</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 text-xs font-mono p-1.5 rounded border border-slate-800 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">In Analysis</option>
              <option value="ingested">Ingested (Ready)</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Sort Order</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full bg-slate-950 text-slate-200 text-xs font-mono p-1.5 rounded border border-slate-800 focus:border-cyan-500 focus:outline-none"
            >
              <option value="date_desc">Ingested (Newest First)</option>
              <option value="date_asc">Ingested (Oldest First)</option>
              <option value="risk_desc">Risk Severity (High to Low)</option>
              <option value="confidence_desc">Confidence Score (High to Low)</option>
              <option value="filename_asc">Filename (A &rarr; Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Cards View */}
      {loading ? (
        <div className="forensic-card py-20 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
          <p className="text-xs font-mono text-slate-400">Querying cryptographic repository records...</p>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="forensic-card py-16 text-center space-y-3">
          <FolderSearch className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No matching casefiles found</p>
          <p className="text-xs text-slate-500 font-mono max-w-sm mx-auto">
            Try adjusting your search query, clearing active filters, or ingesting a new evidence artifact.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedMediaType('all'); setSelectedRisk('all'); setSelectedStatus('all'); }}
            className="px-3 py-1.5 rounded bg-slate-800 text-xs font-mono text-cyan-400 hover:bg-slate-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="forensic-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800 tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Case ID & Ingest</th>
                  <th className="py-3 px-3.5">Target Artifact</th>
                  <th className="py-3 px-3.5">Modality</th>
                  <th className="py-3 px-3.5">AI Verdict</th>
                  <th className="py-3 px-3.5">Confidence</th>
                  <th className="py-3 px-3.5">Risk Level</th>
                  <th className="py-3 px-3.5">Signals</th>
                  <th className="py-3 px-3.5 text-right">Forensic Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredCases.map(c => {
                  const isFinished = c.status === 'completed';
                  const isRunning = runningAnalysisId === c.case_id || c.status === 'analyzing';
                  return (
                    <tr
                      key={c.case_id}
                      onClick={() => navigate(`/cases/${c.case_id}`)}
                      className="hover:bg-slate-900/50 cursor-pointer transition-colors group"
                    >
                      {/* Case ID & Date */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-cyan-400 font-bold group-hover:underline">
                            {c.case_id.slice(0, 8)}...
                          </span>
                          <button
                            onClick={(e) => handleCopyId(c.case_id, e)}
                            className="text-slate-500 hover:text-slate-300 p-0.5"
                            title="Copy full UUID"
                          >
                            {copiedId === c.case_id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {new Date(c.created_at).toLocaleDateString()} &bull; {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Filename & Size */}
                      <td className="py-3 px-3.5 max-w-xs truncate">
                        <span className="font-sans font-medium text-slate-200 block truncate group-hover:text-cyan-300">
                          {c.filename}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {(c.file_size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </td>

                      {/* Modality */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5">
                          {getMediaIcon(c.media_type)}
                          <span className="uppercase text-[11px] text-slate-300 font-semibold">{c.media_type}</span>
                        </div>
                      </td>

                      {/* Verdict */}
                      <td className="py-3 px-3.5">
                        {isFinished && c.prediction_label ? (
                          <div className="flex items-center gap-1.5">
                            {c.prediction_label === 'potentially_manipulated' ? (
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                            <span className={`capitalize font-semibold ${
                              c.prediction_label === 'potentially_manipulated'
                                ? 'text-rose-300'
                                : 'text-emerald-300'
                            }`}>
                              {c.prediction_label.replace('_', ' ')}
                            </span>
                          </div>
                        ) : isRunning ? (
                          <span className="flex items-center gap-1 text-amber-400 text-[11px]">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Analyzing...</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Unanalyzed</span>
                        )}
                      </td>

                      {/* Confidence */}
                      <td className="py-3 px-3.5">
                        {c.confidence !== undefined && c.confidence !== null ? (
                          <div className="space-y-1">
                            <span className="text-slate-200 font-bold block">
                              {(c.confidence * 100).toFixed(1)}%
                            </span>
                            <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  c.confidence > 0.7
                                    ? 'bg-rose-500'
                                    : c.confidence > 0.4
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.round(c.confidence * 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Risk Badge */}
                      <td className="py-3 px-3.5">
                        <RiskBadge riskLevel={c.risk_level} size="sm" />
                      </td>

                      {/* Signals Count */}
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-cyan-400 font-bold text-[11px]">
                          {c.evidence_count || 0}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isFinished ? (
                            <>
                              <Link
                                to={`/report/${c.case_id}`}
                                className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 transition-colors"
                                title="View Courtroom Report"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </Link>
                              <a
                                href={reportsService.getReportPdfUrl(c.case_id)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 transition-colors"
                                title="Download PDF Report"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </>
                          ) : (
                            <button
                              onClick={(e) => handleExecuteAnalysis(c.case_id, e)}
                              disabled={isRunning}
                              className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[10px] flex items-center gap-1 transition-colors"
                              title="Run Local AI Models"
                            >
                              <Play className="w-3 h-3" />
                              <span>{isRunning ? 'Analyzing...' : 'Analyze'}</span>
                            </button>
                          )}

                          <Link
                            to={`/cases/${c.case_id}`}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 font-sans text-xs flex items-center gap-1 transition-colors"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>

                          <button
                            onClick={() => setDeleteModalCase(c)}
                            className="p-1.5 rounded hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Purge Casefile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCases.map(c => {
            const isFinished = c.status === 'completed';
            const isRunning = runningAnalysisId === c.case_id || c.status === 'analyzing';
            return (
              <div
                key={c.case_id}
                onClick={() => navigate(`/cases/${c.case_id}`)}
                className="forensic-card p-4 space-y-3 cursor-pointer hover:border-cyan-500/50 transition-all flex flex-col justify-between group"
              >
                {/* Header */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {getMediaIcon(c.media_type)}
                      <span className="uppercase text-[10px] font-mono text-slate-400 font-bold">{c.media_type}</span>
                    </div>
                    <RiskBadge riskLevel={c.risk_level} size="sm" />
                  </div>

                  <h3 className="font-sans font-semibold text-slate-100 text-sm truncate group-hover:text-cyan-300">
                    {c.filename}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>UUID: {c.case_id.slice(0, 8)}...</span>
                    <span>{(c.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                </div>

                {/* Score & Verdict Section */}
                <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[10px] uppercase">Assessed Verdict</span>
                    {isFinished && c.prediction_label ? (
                      <span className={`font-semibold capitalize ${
                        c.prediction_label === 'potentially_manipulated'
                          ? 'text-rose-300'
                          : 'text-emerald-300'
                      }`}>
                        {c.prediction_label.replace('_', ' ')}
                      </span>
                    ) : isRunning ? (
                      <span className="text-amber-400 font-mono text-[11px]">Processing...</span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">Unanalyzed</span>
                    )}
                  </div>

                  {c.confidence !== undefined && c.confidence !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-500">Confidence:</span>
                        <span className="text-slate-300 font-bold">{(c.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            c.confidence > 0.7 ? 'bg-rose-500' : c.confidence > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.round(c.confidence * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Bar */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs" onClick={e => e.stopPropagation()}>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isFinished ? (
                      <Link
                        to={`/report/${c.case_id}`}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                        title="View Report"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <button
                        onClick={(e) => handleExecuteAnalysis(c.case_id, e)}
                        disabled={isRunning}
                        className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[10px] flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        <span>Run</span>
                      </button>
                    )}

                    <Link
                      to={`/cases/${c.case_id}`}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono flex items-center gap-1"
                    >
                      <span>Examine</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>

                    <button
                      onClick={() => setDeleteModalCase(c)}
                      className="p-1 rounded hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Purge Casefile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="forensic-card max-w-md w-full p-6 border-rose-900/60 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-100">Permanently Purge Casefile?</h3>
            </div>

            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              You are about to irreversibly purge casefile{' '}
              <span className="text-cyan-400 font-bold">{deleteModalCase.case_id.slice(0, 8)}...</span> ({deleteModalCase.filename}).
            </p>

            <div className="p-3 bg-rose-950/30 rounded border border-rose-900/40 text-[11px] font-mono text-rose-300 space-y-1">
              <p>&bull; Evidence hashes, chain of custody blocks, and report artifacts will be deleted.</p>
              <p>&bull; Uploaded forensic media files on disk will be wiped.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModalCase(null)}
                disabled={deleting}
                className="px-3 py-1.5 rounded text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-1.5 rounded text-xs font-mono text-white bg-rose-600 hover:bg-rose-500 flex items-center gap-1.5 font-semibold"
              >
                {deleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{deleting ? 'Purging...' : 'Confirm Purge'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
