import React from "react";
import { ChainOfCustody } from "../types";
import { Shield, CheckCircle2, AlertOctagon, Hash, Clock, Cpu, FileCheck } from "lucide-react";

interface ChainOfCustodyViewerProps {
  custodyData?: ChainOfCustody | null;
}

export const ChainOfCustodyViewer: React.FC<ChainOfCustodyViewerProps> = ({ custodyData }) => {
  if (!custodyData || !custodyData.events || custodyData.events.length === 0) {
    return (
      <div className="forensic-card p-5 border border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
          <Shield className="w-4 h-4 text-slate-500" />
          <span>Chain of custody ledger initialized. Records will appear after ingestion.</span>
        </div>
      </div>
    );
  }

  const isVerified = custodyData.integrity_verified;

  return (
    <div className="forensic-card p-5 space-y-4 border border-slate-800 bg-slate-900/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-indigo-950/60 border border-indigo-800/60 text-indigo-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Cryptographic Chain of Custody Audit Ledger
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Immutable SHA-256 block-linked event trail for forensic evidentiary integrity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isVerified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-950/80 border border-emerald-800 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              INTEGRITY VERIFIED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-950/80 border border-rose-800 text-rose-400">
              <AlertOctagon className="w-3.5 h-3.5" />
              INTEGRITY TAMPERED
            </span>
          )}
        </div>
      </div>

      {custodyData.media_sha256 && (
        <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80 flex items-center gap-2 text-xs font-mono">
          <Hash className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-400 text-[11px]">Primary Media SHA-256:</span>
          <span className="text-cyan-300 text-[11px] truncate select-all">{custodyData.media_sha256}</span>
        </div>
      )}

      {/* Events Table */}
      <div className="overflow-x-auto rounded border border-slate-800/80">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-slate-950/80 text-[11px] text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Event ID</th>
              <th className="py-2.5 px-3">UTC Timestamp</th>
              <th className="py-2.5 px-3">Stage</th>
              <th className="py-2.5 px-3">Actor / Component</th>
              <th className="py-2.5 px-3">Audit Details</th>
              <th className="py-2.5 px-3">Event Signature</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 bg-slate-900/30 text-slate-300 text-[11px]">
            {custodyData.events.map((evt) => (
              <tr key={evt.event_id} className="hover:bg-slate-850/50 transition-colors">
                <td className="py-2 px-3 font-bold text-cyan-400 whitespace-nowrap">{evt.event_id}</td>
                <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                  {evt.timestamp ? evt.timestamp.substring(0, 19).replace("T", " ") : "N/A"}
                </td>
                <td className="py-2 px-3 whitespace-nowrap">
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
                    {evt.event_type}
                  </span>
                </td>
                <td className="py-2 px-3 text-indigo-300 font-medium whitespace-nowrap">
                  {evt.actor_or_component}
                </td>
                <td className="py-2 px-3 max-w-xs text-slate-300">{evt.description}</td>
                <td className="py-2 px-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                  {evt.event_signature ? `${evt.event_signature.substring(0, 12)}...` : "GENESIS"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
