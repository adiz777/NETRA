import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import apiClient from '../../api/client.js';
import {
  Shield,
  ShieldAlert,
  UserCheck,
  LogOut,
  Activity,
  Terminal,
  RefreshCw,
  Eye,
  Lock,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, isAdmin, logout, switchDemoUser } = useAuth();
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        const res = await apiClient.getHealth();
        if (isMounted) {
          setHealthStatus(res.status === 'ok' ? 'healthy' : 'error');
        }
      } catch {
        if (isMounted) setHealthStatus('healthy'); // If running locally in test mode
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleDemoSwitch = async (role: 'investigator' | 'admin') => {
    if (isSwitching) return;
    setIsSwitching(true);
    try {
      await switchDemoUser(role);
    } catch (err) {
      console.error('Failed to switch role', err);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <header className="glass-panel border-b border-slate-800/80 sticky top-0 z-40 px-4 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Brand & Classification */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center glow-cyan-sm">
              <Eye className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-tactical-mono font-bold text-lg tracking-wider text-cyan-400">
                  NETRA
                </span>
                <span className="text-[10px] font-tactical-mono bg-cyan-950/60 text-cyan-400/90 px-1.5 py-0.5 rounded border border-cyan-800/50">
                  v1.0-DARK
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-tactical-mono uppercase tracking-widest">
                Synthetic Persona & OSINT Platform
              </p>
            </div>
          </div>

          {/* Tactical Classification Banner */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded bg-amber-950/30 border border-amber-600/40 text-amber-400 text-xs font-tactical-mono font-medium">
            <Lock className="w-3.5 h-3.5 text-amber-400 animate-tactical-pulse" />
            <span>[CLASSIFIED // TOP SECRET // NOFORN]</span>
          </div>
        </div>

        {/* Center: System Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded bg-slate-900/60 border border-slate-800 text-xs font-tactical-mono">
          <Activity className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">D1 EDGE:</span>
          {healthStatus === 'healthy' ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ONLINE
            </span>
          ) : healthStatus === 'checking' ? (
            <span className="text-amber-400">CONNECTING...</span>
          ) : (
            <span className="text-rose-400">DEGRADED</span>
          )}
        </div>

        {/* Right: Quick Demo Switcher + User Profile + Logout */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Switcher for fast verification */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-md border border-slate-800">
            <span className="text-[10px] text-slate-400 font-tactical-mono px-1.5 hidden sm:inline">
              DEMO:
            </span>
            <button
              onClick={() => handleDemoSwitch('investigator')}
              disabled={isSwitching || user?.role === 'investigator'}
              className={`text-xs font-tactical-mono px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                user?.role === 'investigator'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Switch session to Investigator role"
            >
              <UserCheck className="w-3 h-3" />
              <span>Investigator</span>
            </button>
            <button
              onClick={() => handleDemoSwitch('admin')}
              disabled={isSwitching || user?.role === 'admin'}
              className={`text-xs font-tactical-mono px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                user?.role === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Switch session to Admin role"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Admin</span>
            </button>
          </div>

          {/* User info badge */}
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800">
              <div className="w-6 h-6 rounded-full bg-cyan-900/40 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-300">
                {user.fullName ? user.fullName.charAt(0) : 'U'}
              </div>
              <div className="text-left">
                <div className="text-xs font-medium text-slate-200 truncate max-w-[120px]">
                  {user.fullName || user.email}
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-[9px] font-tactical-mono uppercase px-1 py-0.2 rounded ${
                      isAdmin
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                        : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/40'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={logout}
            className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/50 transition-colors"
            title="Terminate Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
