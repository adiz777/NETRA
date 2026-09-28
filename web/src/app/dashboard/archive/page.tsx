
"use client";

import Link from "next/link";
import NetraSidebar from "@/components/NetraSidebar";
import { useEffect, useMemo, useState } from "react";

type NetraCase = {
  caseId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  createdAt?: string;
  updatedAt?: string;
  subjects?: string[];
  evidence?: unknown[];
  notes?: unknown[];
};

export default function ArchivePage() {
  const [cases, setCases] = useState<NetraCase[]>([]);
  const [identityId, setIdentityId] = useState("");
  const [identityFound, setIdentityFound] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCases() {
      try {
        const response = await fetch("/api/cases", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("CASE ARCHIVE UNAVAILABLE");
        }

        const data = await response.json();

        setCases(
          Array.isArray(data)
            ? data
            : Array.isArray(data.cases)
              ? data.cases
              : []
        );
      } catch {
        setCases([]);
      } finally {
        setLoading(false);
      }
    }

    void loadCases();
  }, []);

  async function searchIdentity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = identityId.trim();

    if (!value) {
      setIdentityFound(null);
      return;
    }

    try {
      const response = await fetch(
        `/api/identity?id=${encodeURIComponent(value)}`,
        {
          cache: "no-store",
        }
      );

      setIdentityFound(response.ok);
    } catch {
      setIdentityFound(false);
    }
  }

  const filteredCases = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return cases;
    }

    return cases.filter((item) =>
      [
        item.caseId,
        item.title,
        item.description,
        item.status,
        item.priority,
        ...(item.subjects || []),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [cases, search]);

  return (
    <main className="min-h-screen bg-[#05070a] text-slate-200">
      <div className="flex min-h-screen">
        <NetraSidebar />

        <section className="min-w-0 flex-1">
          <header className="border-b border-white/10 bg-[#070a0f] px-6 py-5">
            <div className="text-[9px] tracking-[0.35em] text-cyan-500">
              NETRA // ARCHIVE
            </div>

            <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-lg tracking-[0.18em] text-slate-100">
                  ARCHIVE
                </h1>

                <p className="mt-1 text-[10px] tracking-[0.12em] text-slate-600">
                  CASE AND IDENTITY RECORD INDEX
                </p>
              </div>

              <div className="font-mono text-[9px] tracking-[0.2em] text-slate-700">
                RECORD INDEX // ONLINE
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] space-y-5 p-6">
            <section className="border border-white/10 bg-[#080c11]">
              <SectionHeader
                label="IDENTITY ARCHIVE"
                detail="DETERMINISTIC RECORD ACCESS"
              />

              <form
                onSubmit={searchIdentity}
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
                  SEARCH ARCHIVE
                </button>
              </form>

              {identityFound === true && (
                <div className="flex flex-col gap-3 border-t border-emerald-500/20 bg-emerald-500/[0.03] px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-[9px] tracking-[0.2em] text-emerald-500">
                      RECORD LOCATED
                    </div>

                    <div className="mt-1 font-mono text-xs text-slate-400">
                      {identityId.trim()}
                    </div>
                  </div>

                  <Link
                    href={`/dashboard?identity=${encodeURIComponent(
                      identityId.trim()
                    )}`}
                    className="border border-emerald-500/20 px-4 py-2 text-center text-[9px] tracking-[0.18em] text-emerald-400 transition hover:bg-emerald-500/5"
                  >
                    OPEN RECORD
                  </Link>
                </div>
              )}

              {identityFound === false && (
                <div className="border-t border-red-500/20 bg-red-500/[0.03] px-5 py-4">
                  <div className="text-[9px] tracking-[0.2em] text-red-400">
                    RECORD NOT LOCATED
                  </div>

                  <div className="mt-1 text-[9px] tracking-[0.1em] text-slate-700">
                    THE REQUESTED IDENTITY COULD NOT BE RESOLVED
                  </div>
                </div>
              )}
            </section>

            <section className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-4">
              <Stat label="CASE RECORDS" value={String(cases.length)} />
              <Stat
                label="OPEN CASES"
                value={String(
                  cases.filter(
                    (item) => (item.status || "").toUpperCase() === "OPEN"
                  ).length
                )}
              />
              <Stat
                label="CLOSED CASES"
                value={String(
                  cases.filter(
                    (item) => (item.status || "").toUpperCase() === "CLOSED"
                  ).length
                )}
              />
              <Stat
                label="VISIBLE RECORDS"
                value={String(filteredCases.length)}
              />
            </section>

            <section className="border border-white/10 bg-[#080c11]">
              <SectionHeader
                label="CASE ARCHIVE"
                detail={`${filteredCases.length} RECORDS`}
              />

              <div className="border-b border-white/10 p-5">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="SEARCH CASE ID, NAME, SUBJECT OR STATUS"
                  className="w-full border border-white/10 bg-[#05070a] px-4 py-3 font-mono text-xs tracking-[0.1em] text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-500/50"
                />
              </div>

              {loading ? (
                <div className="px-5 py-12 text-center text-[9px] tracking-[0.2em] text-slate-700">
                  LOADING ARCHIVE
                </div>
              ) : filteredCases.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="text-[9px] tracking-[0.25em] text-slate-600">
                    NO CASE RECORDS FOUND
                  </div>

                  <div className="mt-2 text-[9px] tracking-[0.12em] text-slate-800">
                    CASE RECORDS CREATED DURING THIS SESSION WILL APPEAR HERE
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {filteredCases.map((item) => (
                    <ArchiveCase key={item.caseId} item={item} />
                  ))}
                </div>
              )}
            </section>

            <section className="border border-dashed border-white/10 bg-[#080c11]/50 px-5 py-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-[9px] tracking-[0.2em] text-slate-600">
                    ARCHIVE STORAGE
                  </div>

                  <div className="mt-1 text-[9px] tracking-[0.1em] text-slate-800">
                    CASE INDEX CURRENTLY USES SERVER-SIDE SESSION MEMORY
                  </div>
                </div>

                <div className="font-mono text-[8px] tracking-[0.16em] text-amber-500/50">
                  PERSISTENT STORAGE // NOT ENABLED
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

// Shared NETRA navigation is provided by NetraSidebar.

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

      <div className="mt-2 font-mono text-sm tracking-[0.08em] text-slate-300">
        {value}
      </div>
    </div>
  );
}

function ArchiveCase({ item }: { item: NetraCase }) {
  const status = (item.status || "UNKNOWN").toUpperCase();
  const priority = (item.priority || "NORMAL").toUpperCase();

  return (
    <article className="px-5 py-5 transition hover:bg-white/[0.015]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.15em] text-cyan-500">
              {item.caseId}
            </span>

            <span className="border border-white/10 px-2 py-1 text-[7px] tracking-[0.16em] text-slate-600">
              {status}
            </span>

            <span className="border border-white/10 px-2 py-1 text-[7px] tracking-[0.16em] text-slate-700">
              {priority}
            </span>
          </div>

          <h2 className="mt-3 text-sm tracking-[0.1em] text-slate-200">
            {item.title || "UNTITLED CASE"}
          </h2>

          {item.description && (
            <p className="mt-2 max-w-3xl text-[9px] leading-5 tracking-[0.05em] text-slate-600">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-3 xl:items-end">
          <div className="text-[8px] tracking-[0.14em] text-slate-700">
            {formatDate(item.updatedAt || item.createdAt)}
          </div>

          <Link
            href={`/dashboard/cases/${encodeURIComponent(item.caseId)}`}
            className="border border-white/10 px-4 py-2 text-center text-[8px] tracking-[0.18em] text-slate-500 transition hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-400"
          >
            OPEN CASE
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-px bg-white/10 sm:grid-cols-3">
        <ArchiveMetric
          label="SUBJECTS"
          value={String(item.subjects?.length || 0)}
        />

        <ArchiveMetric
          label="EVIDENCE"
          value={String(
            Array.isArray(item.evidence) ? item.evidence.length : 0
          )}
        />

        <ArchiveMetric
          label="NOTES"
          value={String(
            Array.isArray(item.notes) ? item.notes.length : 0
          )}
        />
      </div>
    </article>
  );
}

function ArchiveMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#080c11] px-4 py-3">
      <div className="text-[7px] tracking-[0.18em] text-slate-700">
        {label}
      </div>

      <div className="mt-1 font-mono text-xs text-slate-500">
        {value}
      </div>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return "DATE NOT AVAILABLE";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

