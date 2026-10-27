import React, { useState, useEffect } from 'react';
import type { EvidenceRecord, EvidenceType } from '@shared/types/case.js';
import { computeSha256 } from '../../api/client.js';
import {
  ShieldCheck,
  ShieldAlert,
  FileText,
  Binary,
  Key,
  MessageSquare,
  DollarSign,
  Code,
  Link,
  Plus,
  Trash2,
  Copy,
  Check,
  Search,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface EvidenceLedgerProps {
  evidenceList: EvidenceRecord[];
  caseId: string;
  onAddEvidence: (payload: {
    title: string;
    type: EvidenceType;
    content: string;
    sourceUrl?: string;
    hashSha256?: string;
  }) => Promise<void>;
  onDeleteEvidence?: (id: string) => Promise<void>;
}

export const EvidenceLedger: React.FC<EvidenceLedgerProps> = ({
  evidenceList,
  caseId,
  onAddEvidence,
  onDeleteEvidence,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EvidenceType>('document');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [computedLiveHash, setComputedLiveHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute live hash as content or title changes
  useEffect(() => {
    async function updateHash() {
      const textToHash = content.trim() || title.trim();
      if (!textToHash) {
        setComputedLiveHash('');
        return;
      }
      const hash = await computeSha256(textToHash);
      setComputedLiveHash(hash);
    }
    updateHash();
  }, [content, title]);

  // Verification state for existing evidence
  const [verificationMap, setVerificationMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function verifyEvidence() {
      const map: Record<string, boolean> = {};
      for (const item of evidenceList) {
        const textToHash = item.content || item.title;
        const currentHash = await computeSha256(textToHash);
        map[item.id] = currentHash.toLowerCase() === item.hashSha256.toLowerCase();
      }
      setVerificationMap(map);
    }
    if (evidenceList.length > 0) {
      verifyEvidence();
    }
  }, [evidenceList]);

  const copyHash = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeIcon = (evType: EvidenceType) => {
    switch (evType) {
      case 'network_artifact':
        return <Binary className="w-3.5 h-3.5 text-cyan-400" />;
      case 'credential':
        return <Key className="w-3.5 h-3.5 text-amber-400" />;
      case 'communication':
        return <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />;
      case 'financial_record':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-400" />;
      case 'raw_json':
        return <Code className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddEvidence({
        title: title.trim(),
        type,
        content: content.trim(),
        sourceUrl: sourceUrl.trim() || undefined,
        hashSha256: computedLiveHash || undefined,
      });

      setTitle('');
      setContent('');
      setSourceUrl('');
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Failed to create evidence', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEvidence = evidenceList.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.hashSha256.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-slate-800/80 flex flex-col h-full w-full">
      {/* Top Header & Toolbar */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <h3 className="font-tactical-mono text-sm font-semibold text-slate-100">
              Evidence & Chain of Custody Ledger
            </h3>
          </div>
          <span className="text-xs font-tactical-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            {filteredEvidence.length} ARTIFACTS
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, hash, content..."
              className="bg-slate-900/90 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 w-52"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 font-tactical-mono"
          >
            <option value="all">ALL TYPES</option>
            <option value="document">DOCUMENTS</option>
            <option value="network_artifact">NETWORK ARTIFACTS</option>
            <option value="credential">CREDENTIALS</option>
            <option value="communication">COMMUNICATIONS</option>
            <option value="financial_record">FINANCIAL</option>
            <option value="raw_json">RAW JSON</option>
          </select>

          {/* Add Evidence Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-medium text-xs flex items-center gap-1.5 shadow-sm shadow-cyan-900/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ingest Evidence</span>
          </button>
        </div>
      </div>

      {/* Evidence Cards List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {filteredEvidence.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-tactical-mono text-xs">
            No evidence records found in chain of custody.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredEvidence.map((item) => {
              const isVerified = verificationMap[item.id] ?? true;
              return (
                <div
                  key={item.id}
                  className="glass-panel glass-panel-hover p-4 rounded-xl border border-slate-800/80 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                        {getTypeIcon(item.type)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100">{item.title}</h4>
                        <div className="flex items-center gap-2 text-[11px] font-tactical-mono text-slate-400">
                          <span className="uppercase text-slate-300">
                            {item.type.replace(/_/g, ' ')}
                          </span>
                          <span>•</span>
                          <span>Ingested: {new Date(item.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Integrity & Actions */}
                    <div className="flex items-center gap-2">
                      {isVerified ? (
                        <span className="flex items-center gap-1 text-[10px] font-tactical-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 glow-emerald">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          INTEGRITY VERIFIED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-tactical-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/50 glow-crimson">
                          <ShieldAlert className="w-3 h-3 text-rose-400" />
                          TAMPER DETECTED
                        </span>
                      )}

                      {onDeleteEvidence && (
                        <button
                          onClick={() => onDeleteEvidence(item.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                          title="Purge Evidence Artifact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content Preview */}
                  {item.content && (
                    <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 font-tactical-mono break-words max-h-32 overflow-y-auto">
                      {item.content}
                    </div>
                  )}

                  {/* SHA-256 Digest Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[11px] font-tactical-mono">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-cyan-400 font-semibold">SHA-256:</span>
                      <code className="text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 select-all">
                        {item.hashSha256}
                      </code>
                      <button
                        onClick={() => copyHash(item.hashSha256, item.id)}
                        className="p-1 text-slate-400 hover:text-cyan-400"
                        title="Copy Hash"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Source Origin</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ingest Evidence Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel-elevated p-6 rounded-xl border border-cyan-500/40 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-tactical-mono text-sm font-bold text-cyan-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                Ingest Evidence Artifact
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
                  Artifact Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Encrypted Signal Chat Export or IP Packet Dump"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
                    Artifact Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as EvidenceType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-tactical-mono"
                  >
                    <option value="document">DOCUMENT</option>
                    <option value="network_artifact">NETWORK ARTIFACT</option>
                    <option value="credential">CREDENTIAL</option>
                    <option value="communication">COMMUNICATION</option>
                    <option value="financial_record">FINANCIAL RECORD</option>
                    <option value="raw_json">RAW JSON</option>
                    <option value="other">OTHER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
                    Source URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://darkweb.onion/drop/..."
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
                  Artifact Content / Payload *
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste raw log lines, extracted tokens, decoded transcripts, or document text..."
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 font-tactical-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Live Hash Calculation */}
              <div className="p-3 rounded bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="text-[10px] font-tactical-mono uppercase text-slate-400">
                  Real-time WebCrypto SHA-256 Digest:
                </div>
                <code className="text-xs font-tactical-mono text-cyan-300 break-all block">
                  {computedLiveHash || 'Awaiting payload input...'}
                </code>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Ingesting...' : 'Ingest & Seal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
