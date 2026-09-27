import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { casesService } from '../services/cases';
import { Case } from '../types';
import { ReportViewer } from '../components/ReportViewer';
import { ArrowLeft, RefreshCw, AlertTriangle, Shield } from 'lucide-react';

export const Report: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCase = async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await casesService.getCase(caseId);
      setCaseData(data);
    } catch (err: any) {
      console.error('Failed to load case report:', err);
      setError('Unable to retrieve case record. Please ensure the Case ID exists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [caseId]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3 font-mono">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
        <p className="text-xs text-slate-400">Compiling 14-Section Courtroom Forensic Dossier...</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="forensic-card p-12 text-center space-y-4 max-w-lg mx-auto font-mono">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-100">Dossier Unavailable</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          {error || 'The requested forensic report could not be found.'}
        </p>
        <Link
          to="/cases"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Repository</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Return Navigation */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          to={`/cases/${caseId}`}
          className="text-xs font-mono text-cyan-400 flex items-center gap-1.5 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Interactive Case Workstation</span>
        </Link>

        <span className="text-xs font-mono text-slate-500">
          Casefile: <span className="text-slate-300 font-semibold">{caseData.filename}</span>
        </span>
      </div>

      <ReportViewer caseData={caseData} onRegenerateBob={fetchCase} />
    </div>
  );
};
