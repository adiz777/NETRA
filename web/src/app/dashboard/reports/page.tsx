
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Identity = {
  id?: string;
  name?: string;
  profile?: {
    name?: string;
    gender?: string;
    dateOfBirth?: string;
    age?: number;
    occupation?: string;
  };
  governmentIds?: {
    aadhaar?: string;
    pan?: string;
    voterId?: string;
    drivingLicense?: string;
    passport?: string;
  };
  bank?: {
    bankName?: string;
    bankIFSC?: string;
    bankAccountNumber?: string;
  };
  address?: {
    addressLine?: string;
    locality?: string;
    district?: string;
    state?: string;
    pinCode?: string;
  };
  phone?: string;
  email?: string;
};

type Report = {
  id: string;
  title: string;
  type: string;
  status: string;
  created: string;
  description: string;
};

const reportTemplates: Report[] = [
  {
    id: "RPT-IDENTITY",
    title: "IDENTITY DOSSIER",
    type: "IDENTITY",
    status: "READY",
    created: "ON DEMAND",
    description: "Complete identity profile containing personal, government, financial and location records.",
  },
  {
    id: "RPT-NETWORK",
    title: "RELATIONSHIP NETWORK",
    type: "NETWORK",
    status: "READY",
    created: "ON DEMAND",
    description: "Family and relationship intelligence associated with a selected identity.",
  },
  {
    id: "RPT-CASE",
    title: "CASE INTELLIGENCE",
    type: "CASE",
    status: "READY",
    created: "ON DEMAND",
    description: "Case subjects, evidence, notes, metadata and investigative timeline.",
  },
];

export default function ReportsPage() {
  const [identityId, setIdentityId] = useState("");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState<string | null>(null);

  async function loadIdentity(id: string) {
    const value = id.trim();

    if (!value) {
      setError("IDENTITY ID REQUIRED");
      return;
    }

    setError("");
    setGenerated(null);

    try {
      const response = await fetch(
        `/api/identity?id=${encodeURIComponent(value)}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("IDENTITY NOT FOUND");
      }

      const data = await response.json();
      setIdentity(data);
    } catch {
      setIdentity(null);
      setError("IDENTITY RETRIEVAL FAILED");
    }
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadIdentity(identityId);
  }

  function generateReport(type: string) {
    if (!identity) {
      setError("LOAD AN IDENTITY BEFORE GENERATING A REPORT");
      return;
    }

    setError("");
    setGenerated(type);
  }

  return (
    <main className="min-h-screen bg-[#05070a] text-slate-200">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <header className="border-b border-white/10 bg-[#070a0f] px-6 py-5">
            <div className="text-[9px] tracking-[0.35em] text-cyan-500">
              NETRA // REPORTS
            </div>

            <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-lg tracking-[0.18em] text-slate-100">
                  INTELLIGENCE REPORTS
                </h1>
                <p className="mt-1 text-[10px] tracking-[0.12em] text-slate-600">
                  STRUCTURED ANALYSIS AND CASE DOCUMENTATION
                </p>
              </div>

              <div className="font-mono text-[9px] tracking-[0.2em] text-slate-700">
                REPORT ENGINE // READY
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] space-y-5 p-6">
            <section className="border border-white/10 bg-[#080c11]">
              <SectionHeader
                label="REPORT SUBJECT"
                detail="LOAD AN IDENTITY"
              />

              <form
                onSubmit={submitSearch}
                className="grid gap-3 p-5 md:grid-cols-[1fr_auto]"
              >
                <input
                  value={identityId}
                  onChange={(event) => setIdentityId(event.target.value)}
                  placeholder="ENTER IDENTITY ID"
                  className="border border-white/10 bg-[#05070a] px-4 py-3 font-mono text-xs tracking-[0.12em] text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-500/50"
                />

                <button
                  type="submit"
                  className="border border-cyan-500/30 bg-cyan-500/5 px-6 py-3 text-[10px] tracking-[0.2em] text-cyan-400 transition hover:bg-cyan-500/10"
                >
                  LOAD IDENTITY
                </button>
              </form>

              {error && (
                <div className="border-t border-red-500/20 bg-red-500/5 px-5 py-3 text-[9px] tracking-[0.16em] text-red-400">
                  {error}
                </div>
              )}
            </section>

            {identity && (
              <>
                <section className="border border-white/10 bg-[#080c11]">
                  <SectionHeader
                    label="ACTIVE SUBJECT"
                    detail="IDENTITY RECORD"
                  />

                  <div className="grid gap-px bg-white/10 md:grid-cols-4">
                    <Stat
                      label="IDENTITY"
                      value={identity.id || identityId}
                    />
                    <Stat
                      label="NAME"
                      value={
                        identity.profile?.name ||
                        identity.name ||
                        "UNKNOWN"
                      }
                    />
                    <Stat
                      label="OCCUPATION"
                      value={identity.profile?.occupation || "UNKNOWN"}
                    />
                    <Stat
                      label="LOCATION"
                      value={
                        identity.address?.district ||
                        identity.address?.state ||
                        "UNKNOWN"
                      }
                    />
                  </div>
                </section>

                <section className="grid gap-5 lg:grid-cols-3">
                  {reportTemplates.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onGenerate={() => generateReport(report.type)}
                    />
                  ))}
                </section>

                {generated && (
                  <GeneratedReport
                    identity={identity}
                    type={generated}
                  />
                )}
              </>
            )}

            {!identity && (
              <section className="border border-dashed border-white/10 bg-[#080c11]/60 px-6 py-16 text-center">
                <div className="text-[10px] tracking-[0.3em] text-slate-600">
                  NO REPORT SUBJECT LOADED
                </div>
                <div className="mt-2 text-xs tracking-[0.08em] text-slate-700">
                  SEARCH AN IDENTITY TO INITIALIZE THE REPORT ENGINE
                </div>
              </section>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-white/10 bg-[#06080c] lg:block">
      <div className="border-b border-white/10 px-5 py-6">
        <div className="text-sm font-semibold tracking-[0.35em] text-slate-100">
          NETRA
        </div>
        <div className="mt-1 text-[8px] tracking-[0.25em] text-slate-700">
          INTELLIGENCE SYSTEM
        </div>
      </div>

      <nav className="space-y-1 p-3">
        <NavItem href="/dashboard" label="IDENTITIES" />
        <NavItem href="/dashboard/cases" label="CASES" />
        <NavItem href="/dashboard/network" label="NETWORK" />
        <NavItem href="/dashboard/reports" label="REPORTS" active />
        <NavItem href="/dashboard/archive" label="ARCHIVE" />
      </nav>

      <div className="mt-8 border-t border-white/10 px-5 py-5">
        <div className="text-[8px] tracking-[0.2em] text-slate-700">
          SYSTEM
        </div>
        <div className="mt-2 flex items-center gap-2 text-[9px] tracking-[0.15em] text-emerald-500/70">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          OPERATIONAL
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "block border px-3 py-2.5 text-[9px] tracking-[0.18em] transition",
        active
          ? "border-cyan-500/20 bg-cyan-500/5 text-cyan-400"
          : "border-transparent text-slate-600 hover:border-white/10 hover:bg-white/[0.02] hover:text-slate-300",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function SectionHeader({
  label,
  detail,
}: {
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
      <div className="text-[9px] tracking-[0.25em] text-slate-500">
        {label}
      </div>
      <div className="text-[8px] tracking-[0.18em] text-slate-700">
        {detail}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#080c11] px-5 py-4">
      <div className="text-[8px] tracking-[0.2em] text-slate-600">
        {label}
      </div>
      <div className="mt-2 truncate font-mono text-xs tracking-[0.08em] text-slate-300">
        {value}
      </div>
    </div>
  );
}

function ReportCard({
  report,
  onGenerate,
}: {
  report: Report;
  onGenerate: () => void;
}) {
  return (
    <article className="border border-white/10 bg-[#080c11]">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-[9px] tracking-[0.2em] text-cyan-500">
            {report.type}
          </span>
          <span className="text-[8px] tracking-[0.15em] text-emerald-500/70">
            {report.status}
          </span>
        </div>

        <h2 className="mt-3 text-sm tracking-[0.12em] text-slate-200">
          {report.title}
        </h2>
      </div>

      <div className="px-5 py-5">
        <p className="text-[10px] leading-5 tracking-[0.05em] text-slate-600">
          {report.description}
        </p>

        <button
          type="button"
          onClick={onGenerate}
          className="mt-5 w-full border border-white/10 bg-white/[0.02] px-4 py-3 text-[9px] tracking-[0.2em] text-slate-400 transition hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-400"
        >
          GENERATE REPORT
        </button>
      </div>
    </article>
  );
}

function GeneratedReport({
  identity,
  type,
}: {
  identity: Identity;
  type: string;
}) {
  const name =
    identity.profile?.name ||
    identity.name ||
    "UNKNOWN SUBJECT";

  return (
    <section className="border border-cyan-500/20 bg-[#080c11]">
      <div className="border-b border-cyan-500/10 bg-cyan-500/[0.02] px-5 py-5">
        <div className="text-[9px] tracking-[0.25em] text-cyan-500">
          GENERATED REPORT
        </div>

        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <h2 className="text-lg tracking-[0.12em] text-slate-100">
            {type} // {name}
          </h2>

          <div className="font-mono text-[9px] tracking-[0.12em] text-slate-600">
            {identity.id || "NO-ID"}
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-white/10 md:grid-cols-2">
        <ReportField
          label="DATE OF BIRTH"
          value={identity.profile?.dateOfBirth || "NOT AVAILABLE"}
        />
        <ReportField
          label="GENDER"
          value={identity.profile?.gender || "NOT AVAILABLE"}
        />
        <ReportField
          label="PHONE"
          value={identity.phone || "NOT AVAILABLE"}
        />
        <ReportField
          label="EMAIL"
          value={identity.email || "NOT AVAILABLE"}
        />
        <ReportField
          label="AADHAAR"
          value={identity.governmentIds?.aadhaar || "NOT AVAILABLE"}
        />
        <ReportField
          label="PAN"
          value={identity.governmentIds?.pan || "NOT AVAILABLE"}
        />
        <ReportField
          label="VOTER ID"
          value={identity.governmentIds?.voterId || "NOT AVAILABLE"}
        />
        <ReportField
          label="PASSPORT"
          value={identity.governmentIds?.passport || "NOT AVAILABLE"}
        />
        <ReportField
          label="BANK"
          value={identity.bank?.bankName || "NOT AVAILABLE"}
        />
        <ReportField
          label="ACCOUNT"
          value={
            identity.bank?.bankAccountNumber || "NOT AVAILABLE"
          }
        />
        <ReportField
          label="IFSC"
          value={identity.bank?.bankIFSC || "NOT AVAILABLE"}
        />
        <ReportField
          label="LOCATION"
          value={
            [
              identity.address?.locality,
              identity.address?.district,
              identity.address?.state,
            ]
              .filter(Boolean)
              .join(", ") || "NOT AVAILABLE"
          }
        />
      </div>

      <div className="border-t border-white/10 px-5 py-5">
        <div className="text-[8px] tracking-[0.2em] text-slate-600">
          ADDRESS
        </div>
        <div className="mt-2 text-xs leading-6 tracking-[0.04em] text-slate-300">
          {identity.address?.addressLine || "NOT AVAILABLE"}
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex flex-col gap-2 text-[8px] tracking-[0.14em] text-slate-700 md:flex-row md:items-center md:justify-between">
          <span>NETRA // REPORT ENGINE</span>
          <span>GENERATED FROM ACTIVE IDENTITY RECORD</span>
        </div>
      </div>
    </section>
  );
}

function ReportField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#080c11] px-5 py-4">
      <div className="text-[8px] tracking-[0.18em] text-slate-600">
        {label}
      </div>
      <div className="mt-2 break-all font-mono text-[11px] tracking-[0.05em] text-slate-300">
        {value}
      </div>
    </div>
  );
}

