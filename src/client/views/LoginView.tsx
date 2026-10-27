import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  ShieldAlert,
  UserCheck,
  Lock,
  Mail,
  User,
  Key,
  Terminal,
  Eye,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, register, switchDemoUser, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'investigator' | 'admin'>('investigator');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password.trim());
      } else {
        if (!fullName.trim()) {
          setLocalError('Full name is required for registration');
          setIsSubmitting(false);
          return;
        }
        await register(email.trim(), password.trim(), fullName.trim(), role);
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Authentication operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = async (targetRole: 'investigator' | 'admin') => {
    setIsSubmitting(true);
    setLocalError(null);
    clearError();
    try {
      await switchDemoUser(targetRole);
    } catch (err: any) {
      setLocalError(err?.message || 'Quick demo authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 tactical-grid-bg relative overflow-hidden">
      {/* Decorative radar scan circle */}
      <div className="absolute w-[800px] h-[800px] rounded-full border border-cyan-500/10 pointer-events-none -top-40 -left-40 animate-pulse" />
      <div className="absolute w-[600px] h-[600px] rounded-full border border-cyan-500/15 pointer-events-none -bottom-20 -right-20" />

      <div className="w-full max-w-md glass-panel-elevated p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/50 glow-cyan mb-2">
            <Eye className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold font-sans tracking-wide text-slate-100">
            NETRA OSINT
          </h1>
          <p className="text-xs font-tactical-mono text-cyan-400 uppercase tracking-widest">
            Tactical Identity Intelligence Platform
          </p>
          <div className="inline-block px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-tactical-mono text-amber-400">
            [ACCESS RESTRICTED // AUTHORIZED AGENTS ONLY]
          </div>
        </div>

        {/* Quick Demo Switcher Card for instant evaluator access */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-tactical-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              ONE-CLICK CREDENTIAL INJECTOR
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('investigator')}
              disabled={isSubmitting}
              className="px-3 py-2 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-600/40 text-cyan-300 text-xs font-tactical-mono flex items-center justify-center gap-1.5 transition-all"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Investigator Demo</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              disabled={isSubmitting}
              className="px-3 py-2 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-600/40 text-amber-300 text-xs font-tactical-mono flex items-center justify-center gap-1.5 transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Demo</span>
            </button>
          </div>
        </div>

        {/* Sign In / Register Tabs */}
        <div className="flex border-b border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setLocalError(null);
            }}
            className={`flex-1 py-2 text-xs font-tactical-mono text-center border-b-2 transition-all ${
              mode === 'login'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            TERMINAL SIGN IN
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setLocalError(null);
            }}
            className={`flex-1 py-2 text-xs font-tactical-mono text-center border-b-2 transition-all ${
              mode === 'register'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ENROLL AGENT
          </button>
        </div>

        {/* Error Alert */}
        {(localError || error) && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-tactical-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
                  Full Agent Legal Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Special Agent Dana Scully"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
                  Designated Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'investigator' | 'admin')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-tactical-mono"
                >
                  <option value="investigator">Investigator (Own case isolation)</option>
                  <option value="admin">System Administrator (Global access)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
              Agent Email Identifier *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@netra.local"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-tactical-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
              Passphrase *
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-tactical-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Verifying Credentials...' : mode === 'login' ? 'Authenticate' : 'Enroll & Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-[10px] font-tactical-mono text-slate-400 pt-2 border-t border-slate-800/80">
          SECURE PROTOCOL • PBKDF2-HMAC-SHA256 • CLOUDFLARE D1
        </div>
      </div>
    </div>
  );
};
