import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { CaseDetail, CasePriority, CaseStatus } from '@shared/types/case.js';
import type { IdentityDossier, NetworkNode, NetworkEdge } from '@shared/types/dossier.js';
import apiClient, { ApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { NetworkGraphView } from '../components/graph/NetworkGraphView.js';
import { TimelineView } from '../components/timeline/TimelineView.js';
import { DossierInspector } from '../components/dossier/DossierInspector.js';
import { EvidenceLedger } from '../components/evidence/EvidenceLedger.js';
import { NotesEditor } from '../components/notes/NotesEditor.js';
import { ExecutiveReportModal } from '../components/report/ExecutiveReportModal.js';
import {
  ArrowLeft,
  Share2,
  Calendar,
  Lock,
  Notebook,
  User,
  Shield,
  Printer,
  Sparkles,
  AlertOctagon,
  Clock,
  Layers,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface CaseDetailViewProps {
  caseId: string;
  onBack: () => void;
  onNavigateToGenerator?: () => void;
}

type WorkspaceTab = 'overview' | 'dossiers' | 'graph' | 'timeline' | 'evidence' | 'notes';

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({
  caseId,
  onBack,
  onNavigateToGenerator,
}) => {
  const { user, isAdmin } = useAuth();
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');

  // Selected dossier for the Dossiers tab
  const [selectedDossierIndex, setSelectedDossierIndex] = useState(0);

  // Executive Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Reload case details
  const loadCase = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsForbidden(false);
    try {
      const data = await apiClient.getCase(caseId);
      setDetail(data);
    } catch (err: any) {
      console.error('Failed to load case', err);
      if (err instanceof ApiError && err.statusCode === 403) {
        setIsForbidden(true);
        setError('FORBIDDEN: You do not have authorization to access this operational case file.');
      } else {
        setError(err?.message || 'Failed to load case details');
      }
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  // Aggregate network nodes and edges from all attached dossiers
  const aggregatedNetwork = useMemo(() => {
    if (!detail?.dossiers || detail.dossiers.length === 0) {
      return { nodes: [], edges: [] };
    }

    const nodeMap = new Map<string, NetworkNode>();
    const edgeMap = new Map<string, NetworkEdge>();

    detail.dossiers.forEach((dosRecord) => {
      const d = dosRecord.dossierData as IdentityDossier;
      if (d?.networkGraph) {
        d.networkGraph.nodes?.forEach((n) => nodeMap.set(n.id, n));
        d.networkGraph.edges?.forEach((e) => edgeMap.set(e.id, e));
      }
    });

    return {
      nodes: Array.from(nodeMap.values()),
      edges: Array.from(edgeMap.values()),
    };
  }, [detail?.dossiers]);

  // Aggregate timeline items from case timeline + attached dossiers' timeline
  const aggregatedTimeline = useMemo(() => {
    const list: Array<{
      id: string;
      timestamp: string;
      title: string;
      description: string;
      category: string;
      severity?: string;
      location?: string;
      sourceEvidence?: string;
      tags?: string[];
    }> = [];

    // Case specific timeline records
    detail?.timelines?.forEach((tl) => {
      list.push({
        id: tl.id,
        timestamp: tl.eventTimestamp,
        title: tl.title,
        description: tl.description,
        category: tl.category,
        severity: tl.significance,
      });
    });

    // Dossiers timeline records
    detail?.dossiers?.forEach((dos) => {
      const d = dos.dossierData as IdentityDossier;
      d?.timeline?.events?.forEach((evt) => {
        list.push({
          id: `${dos.id}_${evt.id}`,
          timestamp: evt.timestamp,
          title: `[${dos.fullName}] ${evt.title}`,
          description: evt.description,
          category: evt.category,
          severity: evt.severity,
          location: evt.location,
          sourceEvidence: evt.sourceEvidence,
          tags: evt.tags,
        });
      });
    });

    return list;
  }, [detail]);

  // Handlers for evidence, notes, timeline mutations
  const handleAddEvidence = async (payload: any) => {
    await apiClient.createEvidence(caseId, payload);
    await loadCase();
  };

  const handleDeleteEvidence = async (id: string) => {
    if (!window.confirm('Confirm deletion of this evidence artifact?')) return;
    await apiClient.deleteEvidence(id);
    await loadCase();
  };

  const handleAddNote = async (payload: any) => {
    await apiClient.createNote(caseId, payload);
    await loadCase();
  };

  const handleUpdateNote = async (id: string, updates: any) => {
    await apiClient.updateNote(id, updates);
    await loadCase();
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm('Confirm deletion of this note?')) return;
    await apiClient.deleteNote(id);
    await loadCase();
  };

  const handleAddTimeline = async (payload: any) => {
    await apiClient.createTimelineEvent(caseId, payload);
    await loadCase();
  };

  const handleStatusChange = async (newStatus: CaseStatus) => {
    if (!detail) return;
    await apiClient.updateCase(caseId, { status: newStatus });
    await loadCase();
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

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 font-tactical-mono text-xs animate-pulse">
        Retrieving Case Security Compartment...
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <button
          onClick={onBack}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-tactical-mono text-slate-300 hover:text-cyan-400 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Cases Ledger</span>
        </button>

        <div className="glass-panel p-8 rounded-2xl border border-rose-500/50 text-center space-y-4 glow-crimson">
          <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold font-sans text-rose-300">
            HTTP 403 FORBIDDEN — RBAC ACCESS DENIED
          </h2>
          <p className="text-xs font-tactical-mono text-slate-300 max-w-md mx-auto leading-relaxed">
            You are authenticated as{' '}
            <strong className="text-cyan-400">{user?.fullName || user?.email}</strong> (Role:{' '}
            <span className="uppercase text-amber-400">{user?.role}</span>). Under NETRA
            Investigator Compartment policies, investigators can only access cases they own.
          </p>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-tactical-mono text-slate-400">
            Audit Flag: <code className="text-rose-400">FORBIDDEN_CASE_ACCESS_LOGGED</code>
          </div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <p className="text-rose-400 font-tactical-mono text-xs">{error || 'Case not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs"
        >
          Back to Ledger
        </button>
      </div>
    );
  }

  const { case: c, dossiers, evidence, notes, timelines } = detail;
  const currentDossier = dossiers[selectedDossierIndex]?.dossierData as IdentityDossier | undefined;

  const workspaceTabs = [
    { id: 'overview' as WorkspaceTab, label: 'Overview', icon: Shield, count: null },
    { id: 'dossiers' as WorkspaceTab, label: 'Personas', icon: User, count: dossiers.length },
    { id: 'graph' as WorkspaceTab, label: 'Network Graph', icon: Share2, count: aggregatedNetwork.nodes.length },
    { id: 'timeline' as WorkspaceTab, label: 'Timeline', icon: Calendar, count: aggregatedTimeline.length },
    { id: 'evidence' as WorkspaceTab, label: 'Evidence', icon: Lock, count: evidence.length },
    { id: 'notes' as WorkspaceTab, label: 'Notes', icon: Notebook, count: notes.length },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Case Header Command Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 transition-colors"
              title="Return to Case Ledger"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold font-sans text-slate-100">{c.title}</h1>
                <span
                  className={`text-[9px] font-tactical-mono px-2 py-0.5 rounded border uppercase ${getPriorityBadge(
                    c.priority
                  )}`}
                >
                  {c.priority} THREAT
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-tactical-mono text-slate-400 mt-1">
                <span>CASE ID: <code className="text-cyan-400">{c.id}</code></span>
                <span>•</span>
                <span>OWNER: <strong className="text-slate-200">{c.ownerId}</strong></span>
                <span>•</span>
                <span>LAST UPDATED: {new Date(c.updatedAt || c.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Status Selector + Briefing Exporter */}
          <div className="flex items-center gap-2">
            <select
              value={c.status}
              onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-tactical-mono uppercase"
            >
              <option value="active">STATUS: ACTIVE</option>
              <option value="archived">STATUS: ARCHIVED</option>
              <option value="closed">STATUS: CLOSED</option>
            </select>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-cyan-950 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export Briefing</span>
            </button>
          </div>
        </div>

        {/* Case Tags */}
        {c.tags && c.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60">
            <span className="text-[10px] font-tactical-mono text-slate-500 uppercase">Tags:</span>
            {c.tags.map((t) => (
              <span
                key={t}
                className="text-[10px] font-tactical-mono px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-slate-300"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Workspace Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto">
        {workspaceTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-tactical-mono whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
                isActive
                  ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded ${
                    isActive ? 'bg-cyan-900/60 text-cyan-200' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panes */}
      <div className="min-h-[600px]">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Description / Lead */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
              <h3 className="text-xs font-tactical-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Case Synopsis & Objectives
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                {c.description || 'No formal synopsis recorded for this case file.'}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-panel p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-tactical-mono text-slate-400 block mb-1">
                  Attached Personas
                </span>
                <span className="text-2xl font-bold font-sans text-cyan-400">{dossiers.length}</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-tactical-mono text-slate-400 block mb-1">
                  Evidence Artifacts
                </span>
                <span className="text-2xl font-bold font-sans text-emerald-400">{evidence.length}</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-tactical-mono text-slate-400 block mb-1">
                  Timeline Events
                </span>
                <span className="text-2xl font-bold font-sans text-amber-400">{timelines.length}</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-tactical-mono text-slate-400 block mb-1">
                  Investigator Notes
                </span>
                <span className="text-2xl font-bold font-sans text-indigo-400">{notes.length}</span>
              </div>
            </div>

            {/* Attached Personas Quick Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-tactical-mono uppercase text-slate-400 font-bold">
                  Target Synthetic Personas ({dossiers.length})
                </h3>
                {onNavigateToGenerator && (
                  <button
                    onClick={onNavigateToGenerator}
                    className="text-xs font-tactical-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Synthesize & Attach New Persona</span>
                  </button>
                )}
              </div>

              {dossiers.length === 0 ? (
                <div className="glass-panel p-8 rounded-xl border border-slate-800 text-center space-y-3">
                  <p className="text-xs font-tactical-mono text-slate-400">
                    No synthetic identity dossiers attached to this case yet.
                  </p>
                  {onNavigateToGenerator && (
                    <button
                      onClick={onNavigateToGenerator}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs"
                    >
                      Open Generator Studio
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dossiers.map((dos, idx) => (
                    <div
                      key={dos.id}
                      onClick={() => {
                        setSelectedDossierIndex(idx);
                        setActiveTab('dossiers');
                      }}
                      className="glass-panel glass-panel-hover p-4 rounded-xl border border-slate-800/80 cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-300">
                          {dos.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                            {dos.fullName}
                          </div>
                          <div className="text-xs font-tactical-mono text-slate-400">
                            Alias: <strong className="text-slate-200">{dos.primaryAlias}</strong> • Seed:{' '}
                            <code className="text-cyan-400">{dos.seed}</code>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DOSSIERS TAB */}
        {activeTab === 'dossiers' && (
          <div className="space-y-4">
            {dossiers.length === 0 ? (
              <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
                <p className="text-xs font-tactical-mono text-slate-400">
                  No dossiers attached. Use the Identity Generator Studio to synthesize personas and attach them.
                </p>
                {onNavigateToGenerator && (
                  <button
                    onClick={onNavigateToGenerator}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs"
                  >
                    Open Generator Studio
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Dossier Selector Bar if multiple */}
                {dossiers.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-xs font-tactical-mono text-slate-400 shrink-0">
                      TARGET:
                    </span>
                    {dossiers.map((dos, idx) => (
                      <button
                        key={dos.id}
                        onClick={() => setSelectedDossierIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-tactical-mono whitespace-nowrap border transition-all ${
                          selectedDossierIndex === idx
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {dos.fullName} ({dos.seed})
                      </button>
                    ))}
                  </div>
                )}

                {currentDossier && (
                  <DossierInspector
                    dossier={currentDossier}
                    showAttachButton={false}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* NETWORK GRAPH TAB */}
        {activeTab === 'graph' && (
          <NetworkGraphView
            nodes={aggregatedNetwork.nodes}
            edges={aggregatedNetwork.edges}
            title={`Case ${c.id} Relationship Network`}
          />
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <TimelineView
            events={aggregatedTimeline}
            title={`Case ${c.id} Chronological Stream`}
            onAddEvent={handleAddTimeline}
          />
        )}

        {/* EVIDENCE LEDGER TAB */}
        {activeTab === 'evidence' && (
          <EvidenceLedger
            evidenceList={evidence}
            caseId={caseId}
            onAddEvidence={handleAddEvidence}
            onDeleteEvidence={handleDeleteEvidence}
          />
        )}

        {/* INVESTIGATION NOTES TAB */}
        {activeTab === 'notes' && (
          <NotesEditor
            notes={notes}
            caseId={caseId}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
          />
        )}
      </div>

      {/* Executive Report Briefing Modal */}
      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        caseDetail={detail}
      />
    </div>
  );
};
