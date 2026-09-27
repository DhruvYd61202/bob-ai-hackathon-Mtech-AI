import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  FolderSearch,
  Layers,
  FileText,
  Sparkles,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Fingerprint
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/cases', label: 'Cases Repository', icon: FolderSearch },
    { to: '/upload', label: 'New Analysis', icon: UploadCloud },
    { to: '/evidence', label: 'Evidence Library', icon: Layers },
    { to: '/reports', label: 'Forensic Reports', icon: FileText },
    { to: '/bob', label: 'IBM Bob Assistant', icon: Sparkles },
    { to: '/settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out border-r border-slate-800 bg-slate-950/90 md:bg-slate-950/60 backdrop-blur flex flex-col justify-between p-3 min-h-[calc(100vh-4rem)] ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <div className="space-y-6">
          {/* Header toggle on desktop */}
          <div className="flex items-center justify-between px-2 pt-1">
            {!collapsed && (
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                <span>Forensic Suite</span>
              </span>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-850 transition-colors ml-auto"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-mono font-medium transition-colors ${
                      isActive
                        ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                    } ${collapsed ? 'justify-center px-2' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${collapsed ? '' : 'text-cyan-400'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="space-y-3">
          {!collapsed && (
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Forensic Standard</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[10px]">
                Pre-trained ViT + Wav2Vec2 + MTCNN + SHA-256 Block-Linked Chain of Custody.
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-center truncate">
            {collapsed ? 'DF-AI' : 'DeepFake ForensicAI v1.0'}
          </div>
        </div>
      </aside>
    </>
  );
};
