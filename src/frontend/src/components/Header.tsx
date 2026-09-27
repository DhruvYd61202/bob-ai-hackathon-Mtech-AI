import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Shield, Cpu, Sparkles, ChevronRight, Menu, X, Activity } from 'lucide-react';
import { apiService } from '../services/api';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const [device, setDevice] = useState<string>('Detecting...');
  const [status, setStatus] = useState<'online' | 'offline'>('online');
  const [bobConfigured, setBobConfigured] = useState<boolean>(false);
  const location = useLocation();

  useEffect(() => {
    // Check backend health
    apiService.getHealth()
      .then(res => {
        setDevice(res.device?.toUpperCase() || 'CPU');
        setStatus('online');
      })
      .catch(() => {
        setStatus('offline');
        setDevice('OFFLINE');
      });

    // Check IBM Bob status
    apiService.getBobStatus()
      .then(res => {
        setBobConfigured(res.configured && res.reachable);
      })
      .catch(() => {
        setBobConfigured(false);
      });
  }, [location.pathname]);

  // Generate dynamic breadcrumb from location
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isCasePath = pathParts[0] === 'cases' && pathParts[1];
  const activeCaseId = isCasePath ? pathParts[1] : null;

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {/* Mobile toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2 bg-cyan-950 border border-cyan-800/60 rounded-lg text-cyan-400 group-hover:border-cyan-500 transition-colors">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold tracking-tight text-slate-100 text-base md:text-lg">
                DeepFake <span className="text-cyan-400">ForensicAI</span>
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/40 hidden sm:inline-block">
                v1.0.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Multimodal Digital-Forensics Investigation Platform
            </p>
          </div>
        </Link>

        {/* Breadcrumb */}
        {pathParts.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 ml-6 pl-6 border-l border-slate-800 text-xs font-mono text-slate-400">
            <Link to="/" className="hover:text-slate-200 transition-colors">DASHBOARD</Link>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            {isCasePath ? (
              <>
                <Link to="/cases" className="hover:text-slate-200 transition-colors">CASES</Link>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <span className="text-cyan-400 font-semibold">{activeCaseId?.slice(0, 8)}...</span>
              </>
            ) : (
              <span className="text-cyan-400 font-semibold uppercase">{pathParts[0]}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Active Case ID Pill if in case */}
        {activeCaseId && (
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-cyan-900/60 font-mono text-[11px] text-cyan-300">
            <span className="text-slate-500">CASE:</span>
            <span className="font-bold">{activeCaseId.slice(0, 12)}...</span>
          </div>
        )}

        {/* Compute Accelerator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-500 text-[10px]">DEVICE:</span>
          <span className="text-cyan-400 font-semibold text-[11px]">{device}</span>
        </div>

        {/* IBM Bob Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 font-mono text-xs">
          <Sparkles className={`w-3.5 h-3.5 ${bobConfigured ? "text-blue-400" : "text-slate-500"}`} />
          <span className="text-slate-500 text-[10px] hidden md:inline">BOB:</span>
          <span className={`text-[11px] font-semibold ${bobConfigured ? "text-blue-400" : "text-slate-500"}`}>
            {bobConfigured ? "ACTIVE" : "OFFLINE"}
          </span>
        </div>

        {/* Backend Status */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 font-mono text-xs">
          <span className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className={`text-[11px] font-semibold ${status === 'online' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {status === 'online' ? 'ONLINE' : 'DISCONNECTED'}
          </span>
        </div>
      </div>
    </header>
  );
};
