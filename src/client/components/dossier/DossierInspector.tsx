import React, { useState } from 'react';
import type { IdentityDossier } from '@shared/types/dossier.js';
import {
  User,
  Shield,
  MapPin,
  Phone,
  FileBadge,
  Briefcase,
  Coins,
  Globe,
  Car,
  Share2,
  Calendar,
  Eye,
  Copy,
  Check,
  Building,
  Key,
  AlertTriangle,
  CreditCard,
  Laptop,
} from 'lucide-react';

interface DossierInspectorProps {
  dossier: IdentityDossier;
  onAttachToCase?: () => void;
  showAttachButton?: boolean;
}

type DomainTab =
  | 'overview'
  | 'demographics'
  | 'physical'
  | 'address'
  | 'telecom'
  | 'ids'
  | 'career'
  | 'financial'
  | 'digital'
  | 'assets'
  | 'json';

export const DossierInspector: React.FC<DossierInspectorProps> = ({
  dossier,
  onAttachToCase,
  showAttachButton = false,
}) => {
  const [activeTab, setActiveTab] = useState<DomainTab>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const {
    meta,
    personal,
    physical,
    addresses,
    communications,
    governmentIds,
    careerAndEducation,
    financial,
    digitalFootprint,
    assets,
    networkGraph,
    timeline,
  } = dossier;

  const tabs = [
    { id: 'overview' as DomainTab, label: 'Overview', icon: Shield },
    { id: 'demographics' as DomainTab, label: 'Demographics', icon: User },
    { id: 'physical' as DomainTab, label: 'Physical', icon: Eye },
    { id: 'address' as DomainTab, label: 'Addresses', icon: MapPin },
    { id: 'telecom' as DomainTab, label: 'Telecom & Comms', icon: Phone },
    { id: 'ids' as DomainTab, label: 'National IDs', icon: FileBadge },
    { id: 'career' as DomainTab, label: 'Career & Edu', icon: Briefcase },
    { id: 'financial' as DomainTab, label: 'Financial & Crypto', icon: Coins },
    { id: 'digital' as DomainTab, label: 'Digital Footprint', icon: Laptop },
    { id: 'assets' as DomainTab, label: 'Assets & Corps', icon: Car },
    { id: 'json' as DomainTab, label: 'Raw JSON', icon: Globe },
  ];

  const primaryAlias = personal?.aliases?.[0] || 'N/A';
  const primaryPassport = governmentIds?.passports?.[0];

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-slate-800/80 flex flex-col h-full w-full">
      {/* Target Identity Header */}
      <div className="p-5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-300 font-bold text-xl shadow-lg shadow-cyan-950/50">
            {personal?.legalFullName ? personal.legalFullName.charAt(0) : 'T'}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-100 font-sans tracking-wide">
                {personal?.legalFullName}
              </h2>
              <span className="text-xs font-tactical-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                {meta?.classification || 'CLASSIFIED'}
              </span>
              <span className="text-xs font-tactical-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                {meta?.status?.toUpperCase() || 'ACTIVE'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs font-tactical-mono text-slate-400">
              <span>ALIAS: <strong className="text-slate-200">{primaryAlias}</strong></span>
              <span>•</span>
              <span>NATIONALITY: <strong className="text-slate-200">{personal?.nationality}</strong></span>
              <span>•</span>
              <span>AGE: <strong className="text-slate-200">{personal?.age}</strong> ({personal?.dateOfBirth})</span>
              <span>•</span>
              <span>SEED: <code className="text-cyan-400">{meta?.seed}</code></span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(meta?.seed || '', 'seed')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs font-tactical-mono text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            {copiedField === 'seed' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Seed</span>
          </button>

          {showAttachButton && onAttachToCase && (
            <button
              onClick={onAttachToCase}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-950 transition-all"
            >
              <FileBadge className="w-4 h-4" />
              <span>Attach to Case</span>
            </button>
          )}
        </div>
      </div>

      {/* Domain Navigation Tabs */}
      <div className="bg-slate-950/60 border-b border-slate-800 px-4 flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 text-xs font-tactical-mono whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
                isActive
                  ? 'border-cyan-400 text-cyan-300 font-semibold bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Domain Details Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Quick Identity Card */}
              <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-tactical-mono text-cyan-400 font-semibold uppercase flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Primary Profile
                </div>
                <div className="space-y-1.5 text-xs font-tactical-mono">
                  <div className="flex justify-between"><span className="text-slate-400">Gender / Sex:</span><span className="text-slate-200">{personal?.gender} ({personal?.sex})</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Marital Status:</span><span className="text-slate-200">{personal?.maritalStatus}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Blood Type:</span><span className="text-slate-200">{personal?.bloodType}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Place of Birth:</span><span className="text-slate-200">{personal?.placeOfBirth?.city}, {personal?.placeOfBirth?.country}</span></div>
                </div>
              </div>

              {/* Current Career */}
              <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-tactical-mono text-cyan-400 font-semibold uppercase flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  Active Employment
                </div>
                <div className="space-y-1.5 text-xs font-tactical-mono">
                  <div className="flex justify-between"><span className="text-slate-400">Role:</span><span className="text-slate-200 font-semibold">{careerAndEducation?.current?.jobTitle}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Employer:</span><span className="text-slate-200">{careerAndEducation?.current?.employer}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Industry:</span><span className="text-slate-200">{careerAndEducation?.current?.industry}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Salary:</span><span className="text-emerald-400">${careerAndEducation?.current?.annualSalaryUsd?.toLocaleString()} USD</span></div>
                </div>
              </div>

              {/* Threat & Graph Stats */}
              <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-tactical-mono text-cyan-400 font-semibold uppercase flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" />
                  Network & Threat Indicators
                </div>
                <div className="space-y-1.5 text-xs font-tactical-mono">
                  <div className="flex justify-between"><span className="text-slate-400">Network Nodes:</span><span className="text-cyan-400 font-bold">{networkGraph?.nodes?.length || 0}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Network Edges:</span><span className="text-cyan-400 font-bold">{networkGraph?.edges?.length || 0}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Flagged Breaches:</span><span className="text-rose-400 font-bold">{digitalFootprint?.knownBreaches?.length || 0}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Suspicious Fin Items:</span><span className="text-amber-400 font-bold">{financial?.suspiciousIndicators?.length || 0}</span></div>
                </div>
              </div>
            </div>

            {/* Primary Address & Telecom Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="text-xs font-tactical-mono text-cyan-400 font-semibold uppercase flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Primary Residence
                </div>
                <p className="text-sm text-slate-100 font-medium">
                  {addresses?.current?.addressLine1}, {addresses?.current?.city}, {addresses?.current?.stateProvince} {addresses?.current?.postalCode}, {addresses?.current?.country}
                </p>
                <div className="text-xs font-tactical-mono text-slate-400">
                  Coordinates: {addresses?.current?.coordinates?.latitude}, {addresses?.current?.coordinates?.longitude}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="text-xs font-tactical-mono text-cyan-400 font-semibold uppercase flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Primary Communications
                </div>
                <div className="space-y-1 text-xs font-tactical-mono">
                  <div>Phone: <span className="text-cyan-300">{communications?.phoneNumbers?.[0]?.number}</span> ({communications?.phoneNumbers?.[0]?.carrier})</div>
                  <div>Email: <span className="text-cyan-300">{communications?.emailAddresses?.[0]?.email}</span></div>
                  {communications?.secureMessaging?.[0] && (
                    <div>App: <span className="text-slate-200">{communications.secureMessaging[0].platform}</span>: <span className="text-cyan-300">{communications.secureMessaging[0].handle}</span></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DEMOGRAPHICS TAB */}
        {activeTab === 'demographics' && (
          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
              <h3 className="font-tactical-mono text-xs font-bold uppercase text-cyan-400 tracking-wider">
                Full Demographic Records
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-tactical-mono">
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800"><span className="text-slate-400 block mb-1">Full Legal Name:</span><span className="text-slate-100 font-semibold text-sm">{personal?.legalFullName}</span></div>
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800"><span className="text-slate-400 block mb-1">Primary Operational Alias:</span><span className="text-slate-100 font-semibold text-sm">{primaryAlias}</span></div>
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800"><span className="text-slate-400 block mb-1">Other Known Aliases:</span><span className="text-slate-300">{personal?.aliases?.join(', ') || 'None recorded'}</span></div>
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800"><span className="text-slate-400 block mb-1">Date of Birth:</span><span className="text-slate-200">{personal?.dateOfBirth} (Age {personal?.age})</span></div>
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800"><span className="text-slate-400 block mb-1">Place of Birth:</span><span className="text-slate-200">{personal?.placeOfBirth?.city}, {personal?.placeOfBirth?.stateProvince}, {personal?.placeOfBirth?.country}</span></div>
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800"><span className="text-slate-400 block mb-1">Nationality:</span><span className="text-slate-200">{personal?.nationality}</span></div>
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800"><span className="text-slate-400 block mb-1">Gender / Sex:</span><span className="text-slate-200">{personal?.gender} / {personal?.sex}</span></div>
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800"><span className="text-slate-400 block mb-1">Marital Status:</span><span className="text-slate-200">{personal?.maritalStatus}</span></div>
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800"><span className="text-slate-400 block mb-1">Blood Type:</span><span className="text-slate-200">{personal?.bloodType}</span></div>
              </div>

              {/* Language proficiencies */}
              <div>
                <h4 className="font-tactical-mono text-xs text-slate-400 uppercase mb-2">Language Proficiencies</h4>
                <div className="flex flex-wrap gap-2">
                  {personal?.languages?.map((lang) => (
                    <span key={lang.language} className="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-tactical-mono text-slate-200">
                      {lang.language}: <strong className="text-cyan-400">{lang.proficiency}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PHYSICAL TAB */}
        {activeTab === 'physical' && (
          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
              <h3 className="font-tactical-mono text-xs font-bold uppercase text-cyan-400 tracking-wider">
                Biometric & Physical Characteristics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-tactical-mono">
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800"><span className="text-slate-400 block mb-1">Height:</span><span className="text-slate-100 font-semibold">{physical?.heightCm} cm</span></div>
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800"><span className="text-slate-400 block mb-1">Weight:</span><span className="text-slate-100 font-semibold">{physical?.weightKg} kg</span></div>
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800"><span className="text-slate-400 block mb-1">Eye Color:</span><span className="text-slate-200">{physical?.eyeColor}</span></div>
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800"><span className="text-slate-400 block mb-1">Hair:</span><span className="text-slate-200">{physical?.hairColor} ({physical?.hairStyle})</span></div>
              </div>

              {/* Distinguishing Features */}
              <div>
                <h4 className="font-tactical-mono text-xs text-slate-400 uppercase mb-2">Distinguishing Scars, Tattoos, Marks</h4>
                <div className="space-y-2">
                  {physical?.distinguishingFeatures?.map((f, idx) => (
                    <div key={idx} className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs font-tactical-mono flex items-center justify-between">
                      <span className="text-cyan-300 font-semibold uppercase">{f.type}: {f.location}</span>
                      <span className="text-slate-300">{f.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADDRESSES TAB */}
        {activeTab === 'address' && (
          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
              <h3 className="font-tactical-mono text-xs font-bold uppercase text-cyan-400 tracking-wider">
                Geographic Residence History
              </h3>
              {/* Primary Address */}
              <div className="p-4 rounded-lg bg-cyan-950/20 border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-tactical-mono">
                  <span className="text-cyan-300 font-bold uppercase flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> CURRENT RESIDENCE</span>
                  <span className="text-slate-400">Since: {addresses?.current?.residenceSince}</span>
                </div>
                <p className="text-sm font-semibold text-slate-100">
                  {addresses?.current?.addressLine1}, {addresses?.current?.city}, {addresses?.current?.stateProvince} {addresses?.current?.postalCode}, {addresses?.current?.country}
                </p>
                <div className="text-xs font-tactical-mono text-slate-400 flex items-center gap-4">
                  <span>Tenure: <strong className="text-slate-200">{addresses?.current?.domicileType}</strong></span>
                  <span>Lat/Long: <strong className="text-slate-200">{addresses?.current?.coordinates?.latitude}, {addresses?.current?.coordinates?.longitude}</strong></span>
                </div>
              </div>

              {/* Previous Addresses */}
              <div>
                <h4 className="font-tactical-mono text-xs text-slate-400 uppercase mb-2">Previous Historical Addresses</h4>
                <div className="space-y-2">
                  {addresses?.previous?.map((prev, idx) => (
                    <div key={idx} className="p-3 rounded bg-slate-900/70 border border-slate-800 text-xs font-tactical-mono space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>{prev.residenceSince} → {prev.residenceUntil || 'N/A'}</span>
                        <span className="uppercase">{prev.domicileType}</span>
                      </div>
                      <div className="text-slate-200 font-medium">
                        {prev.addressLine1}, {prev.city}, {prev.country}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TELECOM TAB */}
        {activeTab === 'telecom' && (
          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
              <h3 className="font-tactical-mono text-xs font-bold uppercase text-cyan-400 tracking-wider">
                Telecommunications & Secure Channels
              </h3>
              
              {/* Phones */}
              <div>
                <h4 className="font-tactical-mono text-xs text-slate-400 uppercase mb-2">Phone Lines</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {communications?.phoneNumbers?.map((p, idx) => (
                    <div key={idx} className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs font-tactical-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="text-cyan-300 font-bold">{p.number}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 uppercase">{p.type}</span>
                      </div>
                      <div className="text-slate-400">Carrier: {p.carrier} | Status: {p.status.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emails */}
              <div>
                <h4 className="font-tactical-mono text-xs text-slate-400 uppercase mb-2">Email Accounts</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {communications?.emailAddresses?.map((e, idx) => (
                    <div key={idx} className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs font-tactical-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="text-cyan-300 font-bold">{e.email}</span>
                        {e.primary && <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">PRIMARY</span>}
                      </div>
                      <div className="text-slate-400">Domain: {e.domain} | Breach Exposed: {e.compromisedInBreach ? 'YES' : 'NO'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secure messaging */}
              <div>
                <h4 className="font-tactical-mono text-xs text-slate-400 uppercase mb-2">Encrypted Messaging Handles</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {communications?.secureMessaging?.map((s, idx) => (
                    <div key={idx} className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs font-tactical-mono space-y-1">
                      <span className="text-emerald-400 font-bold uppercase">{s.platform}</span>
                      <div className="text-slate-200">{s.handle}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NATIONAL IDS TAB */}
        {activeTab === 'ids' && (
          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
              <h3 className="font-tactical-mono text-xs font-bold uppercase text-cyan-400 tracking-wider">
                Government Identity Credentials
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-tactical-mono">
                <div className="p-4 rounded bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="text-slate-400 uppercase">National Identity (SSN/ID)</div>
                  <div className="text-lg font-bold text-cyan-300">{governmentIds?.nationalId?.number}</div>
                  <div className="text-slate-400">Type: {governmentIds?.nationalId?.type} ({governmentIds?.nationalId?.issuingCountry})</div>
                </div>

                <div className="p-4 rounded bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="text-slate-400 uppercase">Passport Document</div>
                  <div className="text-lg font-bold text-cyan-300">{primaryPassport?.passportNumber}</div>
                  <div className="text-slate-400">Country: {primaryPassport?.issuingCountry} | Expires: {primaryPassport?.expiryDate}</div>
                </div>

                <div className="p-4 rounded bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="text-slate-400 uppercase">Driver's License</div>
                  <div className="text-lg font-bold text-slate-100">{governmentIds?.driversLicense?.licenseNumber}</div>
                  <div className="text-slate-400">State: {governmentIds?.driversLicense?.issuingState} | Class: {governmentIds?.driversLicense?.class}</div>
                </div>

                <div className="p-4 rounded bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="text-slate-400 uppercase">Tax Identifier</div>
                  <div className="text-lg font-bold text-slate-100">{governmentIds?.taxIdentifier?.tin}</div>
                  <div className="text-slate-400">Jurisdiction: {governmentIds?.taxIdentifier?.jurisdiction}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CAREER & EDU TAB */}
        {activeTab === 'career' && (
          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
              <h3 className="font-tactical-mono text-xs font-bold uppercase text-cyan-400 tracking-wider">
                Professional History & Education
              </h3>
              
              {/* Prior Employment */}
              <div>
                <h4 className="font-tactical-mono text-xs text-slate-400 uppercase mb-2">Employment History</h4>
                <div className="space-y-2">
                  {careerAndEducation?.employmentHistory?.map((emp: any, idx: number) => (
                    <div key={idx} className="p-3 rounded bg-slate-900/70 border border-slate-800 text-xs font-tactical-mono flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-100">{emp.jobTitle}</div>
                        <div className="text-slate-400">{emp.employer}</div>
                      </div>
                      <div className="text-right text-slate-400">
                        {emp.startDate} → {emp.endDate}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Degrees */}
              <div>
                <h4 className="font-tactical-mono text-xs text-slate-400 uppercase mb-2">Academic Credentials</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {careerAndEducation?.education?.map((edu: any, idx: number) => (
                    <div key={idx} className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs font-tactical-mono space-y-1">
                      <div className="font-bold text-cyan-300">{edu.degree} in {edu.fieldOfStudy}</div>
                      <div className="text-slate-300">{edu.institution} ({edu.graduationYear})</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FINANCIAL & CRYPTO TAB */}
        {activeTab === 'financial' && (
          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
              <h3 className="font-tactical-mono text-xs font-bold uppercase text-cyan-400 tracking-wider">
                Financial Accounts & Crypto Assets
              </h3>
              
              {/* Crypto Wallets */}
              <div>
                <h4 className="font-tactical-mono text-xs text-slate-400 uppercase mb-2">Cryptocurrency Wallets</h4>
                <div className="space-y-2">
                  {financial?.cryptoWallets?.map((w, idx) => (
                    <div key={idx} className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs font-tactical-mono space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-400 font-bold uppercase">{w.network}</span>
                        <span className="text-emerald-400 font-semibold">{w.balanceEstimate}</span>
                      </div>
                      <div className="text-slate-300 break-all select-all">{w.address}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bank Accounts */}
              <div>
                <h4 className="font-tactical-mono text-xs text-slate-400 uppercase mb-2">Banking Accounts</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {financial?.bankAccounts?.map((b, idx) => (
                    <div key={idx} className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs font-tactical-mono space-y-1">
                      <div className="font-bold text-slate-200">{b.institution} ({b.accountType})</div>
                      <div className="text-slate-400">Account: {b.accountNumberMasked} | Currency: {b.currency}</div>
                      <div className="text-emerald-400 font-medium">Bracket: {b.balanceBracket}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suspicious Activity Indicators */}
              {financial?.suspiciousIndicators && financial.suspiciousIndicators.length > 0 && (
                <div>
                  <h4 className="font-tactical-mono text-xs text-amber-400 uppercase mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Suspicious Activity Indicators
                  </h4>
                  <div className="space-y-1.5">
                    {financial.suspiciousIndicators.map((ind, idx) => (
                      <div key={idx} className="p-2.5 rounded bg-amber-950/30 border border-amber-600/40 text-xs font-tactical-mono text-amber-200">
                        <strong>[{ind.code}]:</strong> {ind.description} ({ind.reportedDate})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DIGITAL FOOTPRINT TAB */}
        {activeTab === 'digital' && (
          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
              <h3 className="font-tactical-mono text-xs font-bold uppercase text-cyan-400 tracking-wider">
                Cyber Persona & Digital Footprint
              </h3>

              {/* Social Profiles */}
              <div>
                <h4 className="font-tactical-mono text-xs text-slate-400 uppercase mb-2">Social Profiles</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {digitalFootprint?.socialProfiles?.map((s, idx) => (
                    <div key={idx} className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs font-tactical-mono space-y-1">
                      <div className="text-cyan-400 font-bold uppercase">{s.platform}</div>
                      <div className="text-slate-200">@{s.handle}</div>
                      <div className="text-slate-400 text-[10px]">Followers: {s.followersCount?.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* IP Geolocation */}
              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2 text-xs font-tactical-mono">
                <div className="text-slate-400 uppercase font-semibold">Primary IP Address & Geolocation</div>
                <div className="text-base font-bold text-cyan-300">{digitalFootprint?.digitalFingerprint?.primaryIpAddress}</div>
                <div className="text-slate-300">ISP / ASN: {digitalFootprint?.digitalFingerprint?.ipGeolocation?.isp} ({digitalFootprint?.digitalFingerprint?.ipGeolocation?.asn})</div>
                <div className="text-slate-400">Location: {digitalFootprint?.digitalFingerprint?.ipGeolocation?.city}, {digitalFootprint?.digitalFingerprint?.ipGeolocation?.country}</div>
              </div>

              {/* Known Breaches */}
              {digitalFootprint?.knownBreaches && (
                <div>
                  <h4 className="font-tactical-mono text-xs text-rose-400 uppercase mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Compromised Credential Breaches
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {digitalFootprint.knownBreaches.map((b, idx) => (
                      <div key={idx} className="p-3 rounded bg-rose-950/30 border border-rose-600/40 text-xs font-tactical-mono space-y-1">
                        <div className="font-bold text-rose-300">{b.breachName} ({b.year})</div>
                        <div className="text-slate-400">Exposed: {b.leakedDataTypes?.join(', ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ASSETS TAB */}
        {activeTab === 'assets' && (
          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
              <h3 className="font-tactical-mono text-xs font-bold uppercase text-cyan-400 tracking-wider">
                Physical Assets & Corporate Affiliations
              </h3>

              {/* Vehicles */}
              <div>
                <h4 className="font-tactical-mono text-xs text-slate-400 uppercase mb-2">Registered Vehicles</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assets?.vehicles?.map((v, idx) => (
                    <div key={idx} className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs font-tactical-mono space-y-1">
                      <div className="font-bold text-slate-100">{v.year} {v.make} {v.model} ({v.color})</div>
                      <div className="text-cyan-300">Plate: {v.licensePlate} ({v.registrationStateCountry})</div>
                      <div className="text-slate-400">VIN: {v.vin}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Corporate Affiliations */}
              <div>
                <h4 className="font-tactical-mono text-xs text-slate-400 uppercase mb-2">Corporate Holdings</h4>
                <div className="space-y-2">
                  {assets?.corporateAffiliations?.map((c, idx) => (
                    <div key={idx} className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs font-tactical-mono flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-200">{c.companyName}</div>
                        <div className="text-slate-400">Role: {c.role} | Jurisdiction: {c.jurisdiction}</div>
                      </div>
                      {c.isShellCompanyCandidate && (
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700 text-[10px]">
                          SHELL CORP CANDIDATE
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RAW JSON TAB */}
        {activeTab === 'json' && (
          <div className="space-y-2">
            <div className="flex justify-end">
              <button
                onClick={() => copyToClipboard(JSON.stringify(dossier, null, 2), 'json')}
                className="px-3 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-tactical-mono text-slate-300 hover:text-cyan-300 flex items-center gap-1.5"
              >
                {copiedField === 'json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy Raw JSON</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-[#05070C] border border-slate-800 text-xs font-tactical-mono text-cyan-300/90 overflow-x-auto max-h-[500px]">
              {JSON.stringify(dossier, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
