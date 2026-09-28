"use client";

import NetraSidebar from "@/components/NetraSidebar";
import { FormEvent, useEffect, useState } from "react";

type Identity = {
  netraId: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    gender?: string;
    dateOfBirth?: string;
    age?: number;
    occupation?: string;
    maritalStatus?: string;
    state?: string;
    district?: string;
  };
  governmentIds?: {
    aadhaar?: string;
    pan?: string;
    voterId?: string;
    drivingLicense?: string;
    passport?: string;
    phone?: string;
    email?: string;
    upi?: string;
    vehicleRegistration?: string;
    bank?: {
      bankName?: string;
      bankIFSC?: string;
      bankAccountNumber?: string;
    };
    address?: {
      addressLine?: string;
      locality?: string;
    };
  };
  family?: {
    spouse?: { firstName?: string; lastName?: string };
    parents?: {
      father?: { firstName?: string; lastName?: string };
      mother?: { firstName?: string; lastName?: string };
    };
    children?: unknown[];
    siblings?: unknown[];
  };
  metadata?: {
    generatedAt?: string;
    deterministic?: boolean;
    dataClass?: string;
  };
};

type CaseRecord = {
  caseId: string;
  title: string;
  status?: string;
  priority?: string;
  subjects?: string[];
  evidence?: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    createdAt: string;
  }>;
  notes?: string[];
  createdAt: string;
  updatedAt: string;
};

type GeneratedReport = {
  reportId: string;
  generatedAt: string;
  classification: string;
  dossier?: unknown;
  timeline?: unknown;
  network?: unknown;
  exposure?: unknown;
  case?: CaseRecord;
  type?: string;
  subject?: string;
};

export default function ReportsPage() {
  const [identityId, setIdentityId] = useState("");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [caseId, setCaseId] = useState("");
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [mode, setMode] = useState<"IDENTITY" | "CASE">("IDENTITY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadCases();
  }, []);

  async function loadCases() {
    try {
      const response = await fetch("/api/cases", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setCases(data.cases || []);
    } catch {
      // Reports remain usable without the optional case list.
    }
  }

  async function loadIdentity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = identityId.trim();

    if (!id) {
      setError("IDENTITY ID REQUIRED");
      return;
    }

    setLoading(true);
    setError("");
    setReport(null);

    try {
      const response = await fetch(
        "/api/identity?id=" + encodeURIComponent(id),
        { cache: "no-store" },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "IDENTITY RETRIEVAL FAILED");
      }

      setIdentity(data);
      setMode("IDENTITY");
    } catch (err) {
      setIdentity(null);
      setError(err instanceof Error ? err.message : "IDENTITY RETRIEVAL FAILED");
    } finally {
      setLoading(false);
    }
  }

  async function generateIdentityReport() {
    if (!identity) {
      setError("LOAD AN IDENTITY BEFORE GENERATING A REPORT");
      return;
    }

    await generateReport(
      "/api/reports?identityId=" + encodeURIComponent(identity.netraId),
      "IDENTITY",
    );
  }

  async function generateCaseReport() {
    if (!caseId) {
      setError("SELECT A CASE");
      return;
    }

    await generateReport(
      "/api/reports?caseId=" + encodeURIComponent(caseId),
      "CASE",
    );
  }

  async function generateReport(url: string, nextMode: "IDENTITY" | "CASE") {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(url, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "REPORT GENERATION FAILED");
      }

      setReport(data);
      setMode(nextMode);
    } catch (err) {
      setReport(null);
      setError(err instanceof Error ? err.message : "REPORT GENERATION FAILED");
    } finally {
      setLoading(false);
    }
  }

  function downloadJson() {
    if (!report) return;

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = report.reportId + ".json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const identityName = identity
    ? identity.profile?.name ||
      [identity.profile?.firstName, identity.profile?.lastName]
        .filter(Boolean)
        .join(" ") ||
      "UNKNOWN SUBJECT"
    : "NO SUBJECT";

  return (
    <main className="min-h-screen bg-[#05070a] text-slate-200">
      <div className="flex min-h-screen">
        <NetraSidebar />

        <section className="min-w-0 flex-1">
          <header className="border-b border-white/10 bg-[#070a0f] px-6 py-5">
            <div className="text-[9px] tracking-[0.35em] text-cyan-500">NETRA // REPORTS</div>
            <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-lg tracking-[0.18em] text-slate-100">INTELLIGENCE REPORTS</h1>
                <p className="mt-1 text-[10px] tracking-[0.12em] text-slate-600">
                  GENERATE, REVIEW AND EXPORT STRUCTURED REPORTS
                </p>
              </div>
              <div className="font-mono text-[9px] tracking-[0.2em] text-slate-700">REPORT ENGINE // READY</div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] space-y-5 p-6">
            <section className="border border-white/10 bg-[#080c11]">
              <SectionHeader label="IDENTITY REPORT" detail="SUBJECT INITIALIZATION" />
              <form onSubmit={loadIdentity} className="grid gap-3 p-5 md:grid-cols-[1fr_auto]">
                <input
                  value={identityId}
                  onChange={(event) => setIdentityId(event.target.value)}
                  placeholder="ENTER NETRA ID"
                  className="border border-white/10 bg-[#05070a] px-4 py-3 font-mono text-xs tracking-[0.12em] text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-500/50"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="border border-cyan-500/30 bg-cyan-500/5 px-6 py-3 text-[10px] tracking-[0.2em] text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50"
                >
                  {loading ? "LOADING" : "LOAD IDENTITY"}
                </button>
              </form>
              {error && (
                <div className="border-t border-red-500/20 bg-red-500/5 px-5 py-3 text-[9px] tracking-[0.16em] text-red-400">
                  {error}
                </div>
              )}
            </section>

            {identity && (
              <section className="border border-white/10 bg-[#080c11]">
                <SectionHeader label="ACTIVE SUBJECT" detail="REPORT SOURCE" />
                <div className="grid gap-px bg-white/10 md:grid-cols-4">
                  <Stat label="IDENTITY" value={identity.netraId} />
                  <Stat label="NAME" value={identityName} />
                  <Stat label="AGE" value={String(identity.profile?.age ?? "UNKNOWN")} />
                  <Stat label="OCCUPATION" value={identity.profile?.occupation || "UNKNOWN"} />
                </div>
                <div className="border-t border-white/10 p-5">
                  <button
                    type="button"
                    onClick={generateIdentityReport}
                    disabled={loading}
                    className="border border-cyan-500/30 bg-cyan-500/5 px-6 py-3 text-[9px] tracking-[0.2em] text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50"
                  >
                    {loading ? "GENERATING" : "GENERATE IDENTITY DOSSIER"}
                  </button>
                </div>
              </section>
            )}

            <section className="border border-white/10 bg-[#080c11]">
              <SectionHeader label="CASE REPORT" detail="INVESTIGATION DOCUMENTATION" />
              <div className="grid gap-3 p-5 md:grid-cols-[1fr_auto]">
                <select
                  value={caseId}
                  onChange={(event) => setCaseId(event.target.value)}
                  className="border border-white/10 bg-[#05070a] px-4 py-3 font-mono text-[10px] tracking-[0.12em] text-slate-300 outline-none focus:border-cyan-500/50"
                >
                  <option value="">SELECT CASE</option>
                  {cases.map((item) => (
                    <option key={item.caseId} value={item.caseId}>
                      {item.caseId} // {item.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={generateCaseReport}
                  disabled={loading || !caseId}
                  className="border border-cyan-500/30 bg-cyan-500/5 px-6 py-3 text-[9px] tracking-[0.2em] text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-40"
                >
                  {loading ? "GENERATING" : "GENERATE CASE REPORT"}
                </button>
              </div>
            </section>

            {report && (
              <ReportPreview
                report={report}
                identity={identity}
                mode={mode}
                onDownload={downloadJson}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function ReportPreview({
  report,
  identity,
  mode,
  onDownload,
}: {
  report: GeneratedReport;
  identity: Identity | null;
  mode: "IDENTITY" | "CASE";
  onDownload: () => void;
}) {
  const caseRecord = report.case;
  const subjectName = identity?.profile?.name ||
    [identity?.profile?.firstName, identity?.profile?.lastName].filter(Boolean).join(" ") ||
    "UNKNOWN SUBJECT";

  return (
    <section className="border border-cyan-500/20 bg-[#080c11]">
      <div className="border-b border-cyan-500/10 bg-cyan-500/[0.02] px-5 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[9px] tracking-[0.25em] text-cyan-500">GENERATED REPORT</div>
            <h2 className="mt-2 text-lg tracking-[0.12em] text-slate-100">
              {mode === "CASE" ? caseRecord?.title : subjectName}
            </h2>
            <div className="mt-2 font-mono text-[9px] tracking-[0.16em] text-slate-600">
              {report.reportId} // {report.classification}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onDownload}
              className="border border-white/10 px-4 py-2 text-[8px] tracking-[0.16em] text-slate-400 hover:border-cyan-500/30 hover:text-cyan-400"
            >
              EXPORT JSON
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="border border-white/10 px-4 py-2 text-[8px] tracking-[0.16em] text-slate-400 hover:border-cyan-500/30 hover:text-cyan-400"
            >
              PRINT
            </button>
          </div>
        </div>
      </div>

      {mode === "CASE" && caseRecord ? (
        <CaseReport caseRecord={caseRecord} />
      ) : (
        <IdentityReport identity={identity} report={report} />
      )}

      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex flex-col gap-2 font-mono text-[8px] tracking-[0.14em] text-slate-700 md:flex-row md:justify-between">
          <span>NETRA // REPORT ENGINE</span>
          <span>CLASSIFICATION: FICTIONAL / GENERATED DATA</span>
          <span>{new Date(report.generatedAt).toLocaleString("en-GB")}</span>
        </div>
      </div>
    </section>
  );
}

function IdentityReport({ identity, report }: { identity: Identity | null; report: GeneratedReport }) {
  if (!identity) return null;

  const ids = identity.governmentIds;
  const bank = ids?.bank;
  const address = ids?.address;

  return (
    <div className="grid gap-px bg-white/10 md:grid-cols-2">
      <ReportField label="NETRA ID" value={identity.netraId} />
      <ReportField label="DATE OF BIRTH" value={identity.profile?.dateOfBirth || "NOT AVAILABLE"} />
      <ReportField label="GENDER" value={identity.profile?.gender || "NOT AVAILABLE"} />
      <ReportField label="MARITAL STATUS" value={identity.profile?.maritalStatus || "NOT AVAILABLE"} />
      <ReportField label="PHONE" value={ids?.phone || "NOT AVAILABLE"} />
      <ReportField label="EMAIL" value={ids?.email || "NOT AVAILABLE"} />
      <ReportField label="AADHAAR" value={ids?.aadhaar || "NOT AVAILABLE"} />
      <ReportField label="PAN" value={ids?.pan || "NOT AVAILABLE"} />
      <ReportField label="VOTER ID" value={ids?.voterId || "NOT AVAILABLE"} />
      <ReportField label="DRIVING LICENSE" value={ids?.drivingLicense || "NOT AVAILABLE"} />
      <ReportField label="PASSPORT" value={ids?.passport || "NOT AVAILABLE"} />
      <ReportField label="UPI" value={ids?.upi || "NOT AVAILABLE"} />
      <ReportField label="VEHICLE REGISTRATION" value={ids?.vehicleRegistration || "NOT AVAILABLE"} />
      <ReportField label="BANK" value={bank?.bankName || "NOT AVAILABLE"} />
      <ReportField label="BANK IFSC" value={bank?.bankIFSC || "NOT AVAILABLE"} />
      <ReportField label="BANK ACCOUNT" value={bank?.bankAccountNumber || "NOT AVAILABLE"} />
      <ReportField label="LOCALITY" value={address?.locality || "NOT AVAILABLE"} />
      <ReportField label="ADDRESS" value={address?.addressLine || "NOT AVAILABLE"} />
      <ReportField label="REPORT SUBJECT" value={report.subject || identity.netraId} />
      <ReportField label="DETERMINISTIC" value={String(identity.metadata?.deterministic ?? true).toUpperCase()} />
    </div>
  );
}

function CaseReport({ caseRecord }: { caseRecord: CaseRecord }) {
  return (
    <div>
      <div className="grid gap-px bg-white/10 md:grid-cols-4">
        <Stat label="CASE ID" value={caseRecord.caseId} />
        <Stat label="STATUS" value={caseRecord.status || "UNKNOWN"} />
        <Stat label="PRIORITY" value={caseRecord.priority || "UNKNOWN"} />
        <Stat label="SUBJECTS" value={String(caseRecord.subjects?.length || 0)} />
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <ReportList title="SUBJECTS" items={caseRecord.subjects || []} empty="NO SUBJECTS ASSIGNED" />
        <ReportList title="NOTES" items={caseRecord.notes || []} empty="NO INVESTIGATOR NOTES" />
      </div>

      <div className="border-t border-white/10 p-5">
        <div className="mb-4 text-[9px] tracking-[0.2em] text-slate-600">EVIDENCE</div>
        {(caseRecord.evidence || []).length === 0 ? (
          <div className="border border-dashed border-white/10 p-6 text-center text-[9px] tracking-[0.15em] text-slate-700">
            NO EVIDENCE ATTACHED
          </div>
        ) : (
          <div className="space-y-2">
            {(caseRecord.evidence || []).map((item) => (
              <div key={item.id} className="border border-white/10 bg-black/20 p-4">
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-300">{item.title}</div>
                    <div className="mt-1 font-mono text-[8px] tracking-[0.14em] text-cyan-500">
                      {item.type} // {item.id}
                    </div>
                  </div>
                  <div className="font-mono text-[8px] text-slate-700">
                    {new Date(item.createdAt).toLocaleString("en-GB")}
                  </div>
                </div>
                {item.description && (
                  <div className="mt-3 text-[10px] leading-5 text-slate-500">{item.description}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <div className="mb-3 text-[9px] tracking-[0.2em] text-slate-600">{title}</div>
      {items.length === 0 ? (
        <div className="border border-dashed border-white/10 p-5 text-[9px] tracking-[0.12em] text-slate-700">{empty}</div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="border border-white/10 bg-black/20 p-3 font-mono text-[9px] tracking-[0.08em] text-slate-400">
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
      <div className="text-[9px] tracking-[0.25em] text-slate-500">{label}</div>
      <div className="text-[8px] tracking-[0.18em] text-slate-700">{detail}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#080c11] px-5 py-4">
      <div className="text-[8px] tracking-[0.2em] text-slate-600">{label}</div>
      <div className="mt-2 truncate font-mono text-xs tracking-[0.08em] text-slate-300">{value}</div>
    </div>
  );
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#080c11] px-5 py-4">
      <div className="text-[8px] tracking-[0.18em] text-slate-600">{label}</div>
      <div className="mt-2 break-all font-mono text-[11px] tracking-[0.05em] text-slate-300">{value}</div>
    </div>
  );
}
