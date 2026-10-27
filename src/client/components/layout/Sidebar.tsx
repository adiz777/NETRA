import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  Cpu,
  FolderLock,
  ScrollText,
  Shield,
  Layers,
  Fingerprint,
  Share2,
} from 'lucide-react';

export type NavView = 'generator' | 'cases' | 'audit';

interface SidebarProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
  selectedCaseId?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, selectedCaseId }) => {
  const { user, isAdmin } = useAuth();

  const navItems = [
    {
      id: 'generator' as NavView,
      label: 'Identity Studio',
      sublabel: 'Deterministic Generator',
      icon: Cpu,
      color: 'text-cyan-400',
      activeColor: 'bg-cyan-950/50 text-cyan-300 border-cyan-500/50',
    },
    {
      id: 'cases' as NavView,
      label: 'Investigation Cases',
      sublabel: selectedCaseId ? 'Workspace Active' : 'Case Management',
      icon: FolderLock,
      color: 'text-emerald-400',
      activeColor: 'bg-emerald-950/50 text-emerald-300 border-emerald-500/50',
    },
    {
      id: 'audit' as NavView,
      label: 'System Audit Log',
      sublabel: isAdmin ? 'Admin Access' : 'Restricted',
      icon: ScrollText,
      color: 'text-amber-400',
      activeColor: 'bg-amber-950/50 text-amber-300 border-amber-500/50',
      badge: isAdmin ? 'ADMIN' : 'RBAC',
    },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-[calc(100vh-57px)] sticky top-[57px]">
      <div className="p-4 space-y-6">
        <div>
          <div className="text-[10px] font-tactical-mono uppercase tracking-wider text-slate-400 px-3 mb-2">
            Operations Console
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all ${
                    isActive
                      ? `${item.activeColor} shadow-lg shadow-black/40`
                      : 'border-transparent text-slate-300 hover:bg-slate-900/60 hover:text-slate-100 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    <div>
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-[11px] text-slate-400 font-tactical-mono">
                        {item.sublabel}
                      </div>
                    </div>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-tactical-mono px-1.5 py-0.5 rounded border ${
                        item.badge === 'ADMIN'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-700/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tactical Status Card */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-tactical-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-cyan-400" />
              INTELLIGENCE DOMAINS
            </span>
            <span className="text-cyan-400 font-semibold">12 ACTIVE</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-tactical-mono text-slate-400">
            <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
              PRNG: Murmur3
            </div>
            <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
              HASH: SHA-256
            </div>
            <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
              CRYPTO: PBKDF2
            </div>
            <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
              AUTH: HS256
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] font-tactical-mono text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Fingerprint className="w-3 h-3 text-cyan-500" />
          SESSION RBAC
        </span>
        <span className="text-slate-300 uppercase font-semibold">
          {user?.role || 'ANON'}
        </span>
      </div>
    </aside>
  );
};
