import React from 'react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  riskLevel: RiskLevel | string;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ riskLevel, size = 'md' }) => {
  const normalized = riskLevel?.toLowerCase() || 'unknown';

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  if (normalized === 'high') {
    colorClasses = 'badge-high font-bold';
  } else if (normalized === 'medium') {
    colorClasses = 'badge-medium font-bold';
  } else if (normalized === 'low') {
    colorClasses = 'badge-low font-bold';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3.5 py-1.5 text-sm font-semibold'
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider font-mono border ${colorClasses} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${normalized === 'high' ? 'bg-rose-500 animate-ping' : (normalized === 'medium' ? 'bg-amber-500' : 'bg-emerald-500')}`} />
      {normalized} RISK
    </span>
  );
};
