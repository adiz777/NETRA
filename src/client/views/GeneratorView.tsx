import React, { useState, useEffect } from 'react';
import type { IdentityDossier, GeneratorOptions } from '@shared/types/dossier.js';
import type { Case } from '@shared/types/case.js';
import apiClient from '../api/client.js';
import { DossierInspector } from '../components/dossier/DossierInspector.js';
import {
  Cpu,
  Shuffle,
  Sliders,
  FileBadge,
  Check,
  AlertCircle,
  FolderPlus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const GeneratorView: React.FC = () => {
  const [seed, setSeed] = useState('NETRA-TARGET-ALPHA-01');
  const [nationality, setNationality] = useState<'US' | 'GB' | 'DE' | 'IN' | 'JP' | 'CA' | 'EE'>('US');
  const [minAge, setMinAge] = useState(28);
  const [maxAge, setMaxAge] = useState(55);
  const [occupationCategory, setOccupationCategory] = useState<
    'cybersecurity' | 'finance' | 'defense' | 'logistics' | 'academic' | 'medical' | 'auto'
  >('cybersecurity');
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const [dossier, setDossier] = useState<IdentityDossier | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Attach to case modal state
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [isAttaching, setIsAttaching] = useState(false);
  const [attachSuccessMessage, setAttachSuccessMessage] = useState<string | null>(null);

  // Generate identity
  const handleGenerate = async (targetSeed?: string) => {
    setIsGenerating(true);
    setError(null);
    setAttachSuccessMessage(null);

    const actualSeed = targetSeed || seed || `NETRA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    try {
      const options: Partial<GeneratorOptions> = {
        seed: actualSeed,
        nationality,
        ageRange: [Math.min(minAge, maxAge), Math.max(minAge, maxAge)],
        occupationCategory,
        riskLevel,
      };

      const result = await apiClient.generateIdentity(options);
      setDossier(result.dossier);
      setSeed(result.seed);
    } catch (err: any) {
      console.error('Generation error', err);
      setError(err?.message || 'Failed to generate synthetic identity');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate initial identity on mount
  useEffect(() => {
    handleGenerate();
  }, []);

  const randomizeSeed = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomSuffix = '';
    for (let i = 0; i < 6; i++) {
      randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const newSeed = `NETRA-${randomSuffix}`;
    setSeed(newSeed);
    handleGenerate(newSeed);
  };

  // Fetch cases for the attach modal
  const openAttachModal = async () => {
    setIsAttachModalOpen(true);
    try {
      const res = await apiClient.listCases();
      setCases(res.cases);
      if (res.cases.length > 0) {
        setSelectedCaseId(res.cases[0].id);
      }
    } catch (err) {
      console.error('Failed to load cases', err);
    }
  };

  const handleAttachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId || !dossier) return;

    setIsAttaching(true);
    try {
      await apiClient.attachDossier(selectedCaseId, {
        seed: dossier.meta.seed,
        generatorParams: { nationality, ageRange: [minAge, maxAge], occupationCategory, riskLevel },
        fullName: dossier.personal.legalFullName,
        primaryAlias: dossier.personal.aliases?.[0] || 'Target',
        nationality: dossier.personal.nationality,
        dossierData: dossier,
      });

      setAttachSuccessMessage(`Dossier successfully linked to Case ${selectedCaseId}!`);
      setIsAttachModalOpen(false);
    } catch (err: any) {
      console.error('Failed to attach dossier', err);
      setError(err?.message || 'Failed to attach dossier to case');
    } finally {
      setIsAttaching(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold font-sans text-slate-100">
              Identity Generator Studio
            </h1>
            <span className="text-xs font-tactical-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/50">
              PRNG DETERMINISTIC
            </span>
          </div>
          <p className="text-xs text-slate-400 font-tactical-mono mt-1">
            Zero-dependency 12-domain synthetic persona generation with seed reproducibility.
          </p>
        </div>

        {attachSuccessMessage && (
          <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-tactical-mono flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{attachSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* Control Panel Card */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="text-xs font-tactical-mono text-cyan-400 font-semibold uppercase flex items-center gap-2">
          <Sliders className="w-4 h-4" />
          Generation Parameters & Entropy Seeding
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Seed Input with Randomizer */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
              Master Seed String *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="e.g. NETRA-TARGET-ALPHA-01"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-tactical-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={randomizeSeed}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-tactical-mono flex items-center gap-1.5 transition-colors"
                title="Randomize entropy seed"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Randomize</span>
              </button>
            </div>
          </div>

          {/* Nationality Locale */}
          <div>
            <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
              Nationality Locale
            </label>
            <select
              value={nationality}
              onChange={(e) => setNationality(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-tactical-mono"
            >
              <option value="US">US — United States</option>
              <option value="GB">GB — United Kingdom</option>
              <option value="DE">DE — Germany</option>
              <option value="IN">IN — India</option>
              <option value="JP">JP — Japan</option>
              <option value="CA">CA — Canada</option>
              <option value="EE">EE — Estonia</option>
            </select>
          </div>

          {/* Occupation Sector */}
          <div>
            <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
              Career Sector
            </label>
            <select
              value={occupationCategory}
              onChange={(e) => setOccupationCategory(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-tactical-mono"
            >
              <option value="cybersecurity">Cybersecurity / Intelligence</option>
              <option value="finance">Finance / Capital Markets</option>
              <option value="defense">Defense & Aerospace</option>
              <option value="logistics">Maritime & Logistics</option>
              <option value="academic">Academic & Research</option>
              <option value="medical">Biomedical & Healthcare</option>
              <option value="auto">Auto / Unconstrained</option>
            </select>
          </div>
        </div>

        {/* Row 2: Age Range Slider + Threat Profile + Generate Button */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80 items-end">
          {/* Age Range */}
          <div>
            <div className="flex justify-between text-xs font-tactical-mono text-slate-300 mb-1">
              <span>Age Range Constraints</span>
              <span className="text-cyan-400 font-bold">{minAge} — {maxAge} yrs</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={18}
                max={50}
                value={minAge}
                onChange={(e) => setMinAge(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <input
                type="range"
                min={51}
                max={85}
                value={maxAge}
                onChange={(e) => setMaxAge(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Threat Profile */}
          <div>
            <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
              Threat Tier Conditioning
            </label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-tactical-mono"
            >
              <option value="low">Low — Routine Civilian Identity</option>
              <option value="medium">Medium — Notable Digital Activity</option>
              <option value="high">High — Significant Threat & Crypto Activity</option>
              <option value="critical">Critical — Hostile Breach & Shell Network</option>
            </select>
          </div>

          {/* Execute Synthesis Button */}
          <div>
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-cyan-950 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesize Persona</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-tactical-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Dossier Inspector Area */}
      {dossier && (
        <div className="min-h-[600px]">
          <DossierInspector
            dossier={dossier}
            showAttachButton={true}
            onAttachToCase={openAttachModal}
          />
        </div>
      )}

      {/* Attach to Case Modal */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-panel-elevated p-6 rounded-2xl border border-cyan-500/40 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-tactical-mono text-sm font-bold text-cyan-300 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-cyan-400" />
                Attach Dossier to Investigation Case
              </h4>
              <button
                onClick={() => setIsAttachModalOpen(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAttachSubmit} className="space-y-4">
              <div>
                <p className="text-xs text-slate-300 mb-2">
                  Select the active investigation case to permanently attach synthetic identity{' '}
                  <strong className="text-cyan-400">{dossier?.personal?.legalFullName}</strong> ({dossier?.meta?.seed}):
                </p>

                {cases.length === 0 ? (
                  <div className="p-4 rounded bg-slate-900 border border-slate-800 text-xs text-slate-400 text-center font-tactical-mono">
                    No active cases found. Create a case first in the Cases Ledger.
                  </div>
                ) : (
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-tactical-mono"
                  >
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} [{c.priority.toUpperCase()}] ({c.id})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAttachModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAttaching || cases.length === 0}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs disabled:opacity-50"
                >
                  {isAttaching ? 'Attaching...' : 'Confirm Attachment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
