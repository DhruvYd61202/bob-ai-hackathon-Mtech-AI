import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { AnalysisResult } from '../types';
import { AnalysisProgress } from '../components/AnalysisProgress';
import { RiskBadge } from '../components/RiskBadge';
import { ScoreCard } from '../components/ScoreCard';
import { ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export const Analysis: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const [stage, setStage] = useState<'uploading' | 'processing' | 'analyzing' | 'evidence' | 'completed'>('processing');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;

    let isMounted = true;
    const runAnalysis = async () => {
      try {
        setStage('processing');
        await new Promise(r => setTimeout(r, 600));

        if (!isMounted) return;
        setStage('analyzing');

        const data = await apiService.analyzeCase(caseId);

        if (!isMounted) return;
        setStage('evidence');
        await new Promise(r => setTimeout(r, 400));

        if (!isMounted) return;
        setResult(data);
        setStage('completed');
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.response?.data?.detail || "Pipeline execution encountered an error.");
      }
    };

    runAnalysis();
    return () => { isMounted = false; };
  }, [caseId]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Live Forensic Analysis</h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">Case ID: {caseId}</p>
        </div>

        {stage === 'completed' && (
          <Link
            to={`/cases/${caseId}`}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-mono font-medium flex items-center gap-2 transition-colors"
          >
            <span>Open Case Dossier</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {error ? (
        <div className="forensic-card p-6 border-rose-900/40 bg-rose-950/20 text-rose-300 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="w-5 h-5" />
            <span>Forensic Processing Error</span>
          </div>
          <p className="text-xs font-mono">{error}</p>
          <button
            onClick={() => navigate('/upload')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-mono"
          >
            Return to Upload
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <AnalysisProgress currentStage={stage} />

          {result && (
            <div className="space-y-6 animate-fadeIn">
              <div className="forensic-card p-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Assessed Verdict</span>
                  <h3 className="text-xl font-bold capitalize text-slate-100 mt-1">
                    {result.prediction.label.replace('_', ' ')}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    System Confidence: {(result.prediction.confidence * 100).toFixed(0)}%
                  </p>
                </div>
                <RiskBadge riskLevel={result.prediction.risk_level} size="lg" />
              </div>

              <ScoreCard scores={result.scores} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
