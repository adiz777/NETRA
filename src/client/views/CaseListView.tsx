import React, { useState, useEffect, useCallback } from 'react';
import type { Case, CasePriority, CaseStatus } from '@shared/types/case.js';
import apiClient from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import {
  FolderLock,
  Plus,
  Search,
  Filter,
  Shield,
  Clock,
  Tag,
  ArrowRight,
  Trash2,
  AlertTriangle,
  FolderOpen,
  FileBadge,
  Lock,
} from 'lucide-react';

interface CaseListViewProps {
  onSelectCase: (caseId: string) => void;
}

export const CaseListView: React.FC<CaseListViewProps> = ({ onSelectCase }) => {
  const { user, isAdmin } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Create Case Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<CasePriority>('medium');
  const [newTags, setNewTags] = useState('OSINT, SYNTHETIC');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.listCases({
        status: selectedStatus === 'all' ? undefined : (selectedStatus as CaseStatus),
        priority: selectedPriority === 'all' ? undefined : (selectedPriority as CasePriority),
      });
      setCases(res.cases);
      setTotal(res.total);
    } catch (err: any) {
      console.error('Failed to load cases', err);
      setError(err?.message || 'Failed to fetch investigation cases');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedPriority]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const tagsArray = newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const created = await apiClient.createCase({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        priority: newPriority,
        tags: tagsArray,
      });

      setNewTitle('');
      setNewDescription('');
      setIsCreateModalOpen(false);
      await loadCases();
      onSelectCase(created.id);
    } catch (err: any) {
      console.error('Failed to create case', err);
      setError(err?.message || 'Failed to create case');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCase = async (e: React.MouseEvent, caseId: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete case ${caseId}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.deleteCase(caseId);
      await loadCases();
    } catch (err: any) {
      console.error('Failed to delete case', err);
      alert(err?.message || 'Failed to delete case');
    }
  };

  const getPriorityBadge = (p: CasePriority) => {
    switch (p) {
      case 'critical':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/50 glow-crimson';
      case 'high':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50 glow-amber';
      case 'medium':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 glow-cyan-sm';
      default:
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
    }
  };

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold font-sans text-slate-100">
              Investigation Cases Ledger
            </h1>
            <span className="text-xs font-tactical-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              {isAdmin ? 'ADMIN: ALL SYSTEM CASES' : 'INVESTIGATOR ISOLATION ACTIVE'}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-tactical-mono mt-1">
            RBAC-protected operational dossiers, evidence ledgers, and forensic timelines.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Initiate Case</span>
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search case, tag, ID..."
              className="bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 w-60 font-tactical-mono"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-tactical-mono"
          >
            <option value="all">ALL STATUSES</option>
            <option value="active">ACTIVE</option>
            <option value="archived">ARCHIVED</option>
            <option value="closed">CLOSED</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-tactical-mono"
          >
            <option value="all">ALL PRIORITIES</option>
            <option value="critical">CRITICAL</option>
            <option value="high">HIGH</option>
            <option value="medium">MEDIUM</option>
            <option value="low">LOW</option>
          </select>
        </div>

        <div className="text-xs font-tactical-mono text-slate-400">
          SHOWING: <strong className="text-cyan-400">{filteredCases.length}</strong> / {total} CASES
        </div>
      </div>

      {/* Case Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 font-tactical-mono text-xs animate-pulse">
          Querying Cloudflare D1 Relational Engine...
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-4">
          <FolderOpen className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No Investigation Cases Found</h3>
          <p className="text-xs text-slate-400 font-tactical-mono max-w-md mx-auto">
            {isAdmin
              ? 'No cases currently registered across the system database.'
              : 'You do not own any cases matching the current filters. Click "Initiate Case" to create your first investigation file.'}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Initiate Case Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCases.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectCase(c.id)}
              className="glass-panel glass-panel-hover p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between cursor-pointer space-y-4 group relative"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[9px] font-tactical-mono px-2 py-0.5 rounded border uppercase ${getPriorityBadge(
                      c.priority
                    )}`}
                  >
                    {c.priority} THREAT
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-tactical-mono text-slate-400 uppercase bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {c.status}
                    </span>
                    <button
                      onClick={(e) => handleDeleteCase(e, c.id)}
                      className="p-1 rounded text-slate-600 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Delete Case"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
                  {c.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {c.description || 'No description provided for this case.'}
                </p>
              </div>

              {/* Tags and Stats */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                {c.tags && c.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {c.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-tactical-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800"
                      >
                        #{tag}
                      </span>
                    ))}
                    {c.tags.length > 3 && (
                      <span className="text-[10px] font-tactical-mono text-slate-500">
                        +{c.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] font-tactical-mono text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>
                      Dossiers: <strong className="text-cyan-400">{c.dossierCount ?? 0}</strong>
                    </span>
                    <span>
                      Evidence: <strong className="text-slate-200">{c.evidenceCount ?? 0}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-cyan-400 group-hover:translate-x-1 transition-transform">
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Case Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-panel-elevated p-6 rounded-2xl border border-cyan-500/40 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-tactical-mono text-sm font-bold text-cyan-300 flex items-center gap-2">
                <FolderLock className="w-4 h-4 text-cyan-400" />
                Initiate New Investigation Case
              </h4>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
                  Case Title / Code Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. OPERATION NIGHTSHADE // Crypto Laundering Syndicate"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
                    Threat Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as CasePriority)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-tactical-mono"
                  >
                    <option value="low">LOW THREAT</option>
                    <option value="medium">MEDIUM THREAT</option>
                    <option value="high">HIGH THREAT</option>
                    <option value="critical">CRITICAL THREAT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="OSINT, FINANCIAL, RUSSIAN"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-tactical-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
                  Operational Description / Lead Briefing
                </label>
                <textarea
                  rows={4}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Summary of operational objectives, intelligence leads, target entities..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Initiate File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
