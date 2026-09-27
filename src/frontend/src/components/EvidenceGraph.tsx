import React, { useState } from 'react';
import { EvidenceGraph } from '../types';
import { Network, CircleDot, ArrowRight } from 'lucide-react';

interface EvidenceGraphProps {
  graph?: EvidenceGraph;
}

export const EvidenceGraphViewer: React.FC<EvidenceGraphProps> = ({ graph }) => {
  const [selectedNode, setSelectedNode] = useState<any>(null);

  if (!graph || !graph.nodes || graph.nodes.length === 0) {
    return (
      <div className="forensic-card p-6 text-center text-slate-500 font-mono text-xs">
        No graph topology available for this case.
      </div>
    );
  }

  const nodesByType = graph.nodes.reduce((acc: Record<string, any[]>, node) => {
    acc[node.type] = acc[node.type] || [];
    acc[node.type].push(node);
    return acc;
  }, {});

  const typeOrder = ['case', 'media', 'frame', 'face', 'signal', 'evidence', 'conclusion'];

  return (
    <div className="forensic-card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-semibold text-slate-100">Forensic Evidence Graph</h4>
        </div>
        <div className="font-mono text-xs text-slate-400">
          <span>{graph.nodes.length} Nodes</span> · <span>{graph.edges.length} Relational Edges</span>
        </div>
      </div>

      <div className="space-y-4">
        {typeOrder.map((t) => {
          const list = nodesByType[t];
          if (!list || list.length === 0) return null;

          return (
            <div key={t} className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-slate-300 tracking-wider">
                {t} Level Nodes
              </div>
              <div className="flex flex-wrap gap-2">
                {list.map((node) => {
                  let badge = 'border-slate-700 bg-slate-900 text-slate-300';
                  if (node.type === 'conclusion') {
                    badge = node.severity === 'high' ? 'border-rose-600 bg-rose-950/40 text-rose-300 font-bold' : (
                      node.severity === 'medium' ? 'border-amber-600 bg-amber-950/40 text-amber-300 font-bold' : 'border-emerald-600 bg-emerald-950/40 text-emerald-300 font-bold'
                    );
                  } else if (node.type === 'evidence') {
                    badge = node.severity === 'high' ? 'border-rose-500/60 bg-rose-950/30 text-rose-300' : (
                      node.severity === 'medium' ? 'border-amber-500/60 bg-amber-950/30 text-amber-300' : 'border-cyan-800 bg-cyan-950/30 text-cyan-300'
                    );
                  } else if (node.type === 'signal') {
                    badge = 'border-purple-800 bg-purple-950/30 text-purple-300';
                  }

                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`px-2.5 py-1 rounded text-xs font-mono border transition-all text-left flex items-center gap-1.5 ${badge} ${selectedNode?.id === node.id ? 'ring-2 ring-cyan-400' : 'hover:border-slate-500'}`}
                    >
                      <CircleDot className="w-3 h-3 shrink-0" />
                      <span>{node.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedNode && (
        <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono space-y-1">
          <div className="flex justify-between text-slate-400">
            <span className="text-cyan-400 font-bold">Node Inspector: {selectedNode.id}</span>
            <span className="uppercase">{selectedNode.type}</span>
          </div>
          <p className="text-slate-200">{selectedNode.label}</p>
          {selectedNode.details && (
            <pre className="text-[10px] text-slate-400 overflow-x-auto mt-2 p-2 bg-slate-900 rounded">
              {JSON.stringify(selectedNode.details, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
