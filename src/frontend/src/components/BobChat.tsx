import React, { useState } from 'react';
import { Bot, Send, User, Sparkles, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';

interface BobChatProps {
  caseId: string;
  initialSummary?: string;
}

interface Message {
  role: 'bob' | 'user';
  text: string;
  source?: string;
  citations?: string[];
}

export const BobChat: React.FC<BobChatProps> = ({ caseId, initialSummary }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bob',
      text: initialSummary || "Hello Investigator. I am BOB (Behavioral/Observation-based Forensic Briefing). I can explain the evidence, frame citations, acoustic signals, and forensic limitations of this case.",
      source: "BOB Local Engine"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "Why was this file flagged?",
    "What evidence was found?",
    "What frames contain suspicious signals?",
    "Was audio available?",
    "What are the limitations?",
    "Explain the result in simple language.",
    "Generate an investigator summary."
  ];

  const handleSend = async (queryText?: string) => {
    const q = queryText || input;
    if (!q.trim() || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiService.askBob(caseId, q);
      setMessages(prev => [
        ...prev,
        {
          role: 'bob',
          text: res.answer,
          source: res.source,
          citations: res.citations
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'bob',
          text: "An error occurred while formulating the forensic briefing. Verify case status.",
          source: "System Error"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forensic-card flex flex-col h-[520px]">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-950 border border-cyan-800 rounded text-cyan-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">BOB Forensic Assistant</h4>
            <p className="text-[10px] text-slate-300 font-mono">Grounded strictly in verified case evidence</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
          Deterministic Engine
        </span>
      </div>

      <div className="p-2 border-b border-slate-800 bg-slate-950/40 flex gap-1.5 overflow-x-auto">
        {quickPrompts.map(p => (
          <button
            key={p}
            onClick={() => handleSend(p)}
            className="shrink-0 text-[11px] font-mono px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 text-xs ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'bob' && (
              <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg p-3 whitespace-pre-line leading-relaxed ${
                m.role === 'user'
                  ? 'bg-cyan-600 text-white font-medium'
                  : 'bg-slate-900 border border-slate-800 text-slate-200'
              }`}
            >
              {m.text}

              {m.citations && m.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-800 flex flex-wrap gap-1">
                  <span className="text-[10px] text-slate-300 font-mono">Evidence Citations:</span>
                  {m.citations.map(c => (
                    <span key={c} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800/60 text-cyan-400">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 items-center text-xs font-mono text-cyan-400">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>BOB inspecting evidence graph...</span>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask BOB about evidence, frames, or limitations..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </div>
    </div>
  );
};
