import React, { useState } from 'react';
import type { CaseDetail, DossierRecord, EvidenceRecord, NoteRecord, TimelineRecord } from '@shared/types/case.js';
import type { IdentityDossier } from '@shared/types/dossier.js';
import {
  Printer,
  Copy,
  Check,
  X,
  ShieldAlert,
  FileText,
  Lock,
  Calendar,
  User,
  Fingerprint,
} from 'lucide-react';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseDetail: CaseDetail;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  caseDetail,
}) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const { case: c, dossiers, evidence, notes, timelines } = caseDetail;
  const primaryDossier = dossiers[0]?.dossierData as IdentityDossier | undefined;

  const handlePrint = () => {
    window.print();
  };

  const generateMarkdownReport = (): string => {
    const lines = [
      `# EXECUTIVE INTELLIGENCE BRIEFING`,
      `**CLASSIFICATION**: TOP SECRET // SI-TK // NOFORN`,
      `**CASE FILE**: ${c.title} (ID: ${c.id})`,
      `**STATUS**: ${c.status.toUpperCase()} | **PRIORITY**: ${c.priority.toUpperCase()}`,
      `**DATE GENERATED**: ${new Date().toISOString()}`,
      `---`,
      `## 1. Case Synopsis`,
      `${c.description || 'No formal synopsis recorded.'}`,
      ``,
      `## 2. Target Subject Intelligence`,
    ];

    if (primaryDossier?.personal) {
      const p = primaryDossier.personal;
      lines.push(
        `- **Full Legal Name**: ${p.legalFullName}`,
        `- **Primary Operational Alias**: ${p.aliases?.[0] || 'N/A'}`,
        `- **Nationality**: ${p.nationality}`,
        `- **Date of Birth**: ${p.dateOfBirth} (Age ${p.age})`,
        `- **Place of Birth**: ${p.placeOfBirth?.city}, ${p.placeOfBirth?.country}`
      );
    } else {
      lines.push(`Attached Dossiers Count: ${dossiers.length}`);
    }

    lines.push(``, `## 3. Evidence & Chain of Custody Ledger`);
    if (evidence.length === 0) {
      lines.push(`_No physical or digital evidence registered._`);
    } else {
      evidence.forEach((ev) => {
        lines.push(`- **[${ev.type.toUpperCase()}]** ${ev.title}`);
        lines.push(`  SHA-256 Digest: \`${ev.hashSha256}\``);
        if (ev.content) lines.push(`  Payload excerpt: ${ev.content.slice(0, 120)}...`);
      });
    }

    lines.push(``, `## 4. Chronological Intelligence Timeline`);
    if (timelines.length === 0) {
      lines.push(`_No timeline records logged._`);
    } else {
      timelines.forEach((tl) => {
        lines.push(`- [${tl.eventTimestamp}] **${tl.title}** (${tl.category.toUpperCase()} / ${tl.significance.toUpperCase()}): ${tl.description}`);
      });
    }

    lines.push(``, `## 5. Investigation Notes`);
    if (notes.length === 0) {
      lines.push(`_No investigative notes on record._`);
    } else {
      notes.forEach((n) => {
        lines.push(`### ${n.title || 'Note'} (${n.category.toUpperCase()})`);
        lines.push(`${n.content}`, ``);
      });
    }

    lines.push(`---`, `*VERIFIED SECURE INTELLIGENCE RECORD — NETRA DISPATCH*`);
    return lines.join('\n');
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel-elevated rounded-2xl border border-cyan-500/40 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-4">
        {/* Controls Bar (Hidden in Print) */}
        <div className="no-print p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="font-tactical-mono text-sm font-bold text-slate-100">
              Executive Intelligence Briefing Generator
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs font-tactical-mono text-slate-300 flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Markdown' : 'Copy Markdown'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#070A0F] text-slate-200 font-sans space-y-6">
          {/* Classification Banner Top */}
          <div className="text-center border-b-2 border-amber-500/40 pb-3">
            <div className="text-xs font-tactical-mono font-bold tracking-widest text-amber-400 uppercase">
              TOP SECRET // LAW ENFORCEMENT SENSITIVE // NOFORN
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mt-1 uppercase tracking-wide">
              Case Intelligence Briefing: {c.title}
            </h1>
            <div className="text-xs font-tactical-mono text-slate-400 mt-1">
              RECORD REF: <strong className="text-cyan-400">{c.id}</strong> | GENERATED: {new Date().toLocaleString()}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-tactical-mono">
            <div>
              <span className="text-slate-400 block mb-0.5">CASE STATUS:</span>
              <span className="text-emerald-400 font-bold uppercase">{c.status}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">THREAT PRIORITY:</span>
              <span className="text-rose-400 font-bold uppercase">{c.priority}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">LEAD INVESTIGATOR:</span>
              <span className="text-slate-200 font-medium truncate block">{c.ownerId}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">EVIDENCE ATTESTATIONS:</span>
              <span className="text-cyan-400 font-bold">{evidence.length} HASHED ITEMS</span>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-tactical-mono uppercase tracking-wider text-cyan-400 font-bold border-b border-slate-800 pb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              1. Executive Synopsis
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {c.description || 'No formal synopsis registered for this operational case file.'}
            </p>
          </div>

          {/* Section 2: Synthetic Target Dossiers */}
          <div className="space-y-3">
            <h3 className="text-xs font-tactical-mono uppercase tracking-wider text-cyan-400 font-bold border-b border-slate-800 pb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              2. Synthetic Target Identity Profiles ({dossiers.length})
            </h3>
            {dossiers.map((dos) => {
              const d = dos.dossierData as IdentityDossier;
              return (
                <div key={dos.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs font-tactical-mono">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-100">
                    <span>{dos.fullName}</span>
                    <span className="text-xs font-tactical-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      SEED: {dos.seed}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-slate-300">
                    <div>Alias: <strong className="text-slate-100">{dos.primaryAlias}</strong></div>
                    <div>Nationality: <strong className="text-slate-100">{dos.nationality}</strong></div>
                    <div>DOB / Age: <strong className="text-slate-100">{d?.personal?.dateOfBirth} (Age {d?.personal?.age})</strong></div>
                    <div>Employer: <strong className="text-slate-100">{d?.careerAndEducation?.current?.employer}</strong></div>
                    <div>Primary Phone: <strong className="text-cyan-300">{d?.communications?.phoneNumbers?.[0]?.number}</strong></div>
                    <div>Primary Email: <strong className="text-cyan-300">{d?.communications?.emailAddresses?.[0]?.email}</strong></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section 3: Evidence Ledger */}
          <div className="space-y-3">
            <h3 className="text-xs font-tactical-mono uppercase tracking-wider text-cyan-400 font-bold border-b border-slate-800 pb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              3. Evidence Chain of Custody & Cryptographic Digests
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-tactical-mono border border-slate-800">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="p-2 border-b border-slate-800">Artifact Title</th>
                    <th className="p-2 border-b border-slate-800">Type</th>
                    <th className="p-2 border-b border-slate-800">SHA-256 Digest</th>
                    <th className="p-2 border-b border-slate-800">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {evidence.map((ev) => (
                    <tr key={ev.id} className="bg-slate-900/30">
                      <td className="p-2 text-slate-200 font-semibold">{ev.title}</td>
                      <td className="p-2 uppercase text-slate-400">{ev.type}</td>
                      <td className="p-2 text-cyan-300 font-mono text-[10px] break-all">{ev.hashSha256}</td>
                      <td className="p-2 text-slate-400">{new Date(ev.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Timeline Summary */}
          <div className="space-y-3">
            <h3 className="text-xs font-tactical-mono uppercase tracking-wider text-cyan-400 font-bold border-b border-slate-800 pb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              4. Chronological Intelligence Timeline
            </h3>
            <div className="space-y-2">
              {timelines.map((tl) => (
                <div key={tl.id} className="p-2.5 rounded bg-slate-950/50 border border-slate-800 text-xs font-tactical-mono flex items-center justify-between">
                  <div>
                    <span className="text-cyan-400 font-bold mr-2">[{new Date(tl.eventTimestamp).toLocaleDateString()}]</span>
                    <span className="text-slate-100 font-semibold">{tl.title}</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">{tl.description}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] uppercase text-amber-300">
                    {tl.significance}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Signature & Authentication Seal */}
          <div className="pt-6 border-t border-slate-800 flex justify-between items-end text-xs font-tactical-mono text-slate-400">
            <div>
              <p>PREPARED UNDER AUTH: NETRA-D1-RBAC</p>
              <p>SECURE LEDGER INTEGRITY SEAL: OK</p>
            </div>
            <div className="text-right border-t border-slate-600 pt-1 w-48">
              <span>AUTHORIZED SIGNATURE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
