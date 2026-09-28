
"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Evidence = {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
};

type NetraCase = {
  caseId: string;
  title: string;
  status: string;
  priority: string;
  subjects: string[];
  objectives: string[];
  evidence: Evidence[];
  notes: string[];
  createdAt: string;
  updatedAt: string;
};

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = String(params.caseId ?? "");

  const [netraCase, setNetraCase] = useState<NetraCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [subjectId, setSubjectId] = useState("");
  const [note, setNote] = useState("");

  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [evidenceType, setEvidenceType] = useState("DOCUMENT");

  const [actionLoading, setActionLoading] = useState(false);

  async function loadCase() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/cases?caseId=" + encodeURIComponent(caseId),
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "CASE NOT FOUND");
      }

      setNetraCase(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "CASE LOAD FAILED"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (caseId) {
      loadCase();
    }
  }, [caseId]);

  async function performAction(
    payload: Record<string, string>
  ) {
    setActionLoading(true);
    setError("");

    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          caseId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "CASE OPERATION FAILED"
        );
      }

      setNetraCase(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "CASE OPERATION FAILED"
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function addSubject(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const subjectValue = subjectId.trim();

    if (!subjectValue) {
      return;
    }

    await performAction({
      action: "subject",
      identityId: subjectValue,
    });

    setSubjectId("");
  }

  async function addNote(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const noteValue = note.trim();

    if (!noteValue) {
      return;
    }

    await performAction({
      action: "note",
      note: noteValue,
    });

    setNote("");
  }

  async function addEvidence(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const titleValue = evidenceTitle.trim();

    if (!titleValue) {
      return;
    }

    await performAction({
      action: "evidence",
      type: evidenceType,
      title: titleValue,
      description: evidenceDescription.trim(),
    });

    setEvidenceTitle("");
    setEvidenceDescription("");
    setEvidenceType("DOCUMENT");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050709] text-slate-300">
        <div className="font-mono text-[10px] tracking-[0.3em] text-cyan-400">
          LOADING CASE INTELLIGENCE...
        </div>
      </main>
    );
  }

  if (!netraCase) {
    return (
      <main className="min-h-screen bg-[#050709] text-slate-300">
        <div className="flex min-h-screen">
          <Sidebar />

          <div className="flex-1 p-8">
            <Link
              href="/dashboard/cases"
              className="font-mono text-[10px] tracking-[0.2em] text-cyan-400 hover:text-cyan-300"
            >
              ← RETURN TO CASES
            </Link>

            <div className="mt-8 border border-red-400/20 bg-red-400/5 p-6">
              <div className="font-mono text-[9px] tracking-[0.25em] text-red-400">
                CASE ERROR
              </div>

              <div className="mt-3 font-mono text-sm tracking-[0.1em]">
                {error || "CASE NOT FOUND"}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050709] text-slate-200">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(0,255,200,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,200,0.018)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative flex min-h-screen">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <header className="border-b border-white/10 bg-[#070a0e]/95 px-5 py-5 backdrop-blur md:px-8">
            <div className="mx-auto max-w-[1500px]">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="font-mono text-[9px] tracking-[0.3em] text-cyan-500">
                    CASE FILE
                  </div>

                  <h1 className="mt-2 break-words font-mono text-2xl uppercase tracking-[0.12em] text-slate-100 md:text-3xl">
                    {netraCase.title}
                  </h1>

                  <div className="mt-3 font-mono text-[10px] tracking-[0.2em] text-cyan-400/70">
                    {netraCase.caseId}
                  </div>
                </div>

                <div className="flex gap-3">
                  <StatusBadge label={netraCase.status} />
                  <StatusBadge label={netraCase.priority} />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/cases"
                  className="border border-white/10 bg-white/[0.02] px-4 py-2 font-mono text-[9px] tracking-[0.18em] text-slate-500 transition hover:border-cyan-400/30 hover:text-cyan-300"
                >
                  ← BACK TO CASES
                </Link>

                <Link
                  href="/dashboard"
                  className="border border-white/10 bg-white/[0.02] px-4 py-2 font-mono text-[9px] tracking-[0.18em] text-slate-500 transition hover:border-cyan-400/30 hover:text-cyan-300"
                >
                  DASHBOARD
                </Link>

                <Link
                  href="/dashboard/network"
                  className="border border-white/10 bg-white/[0.02] px-4 py-2 font-mono text-[9px] tracking-[0.18em] text-slate-500 transition hover:border-cyan-400/30 hover:text-cyan-300"
                >
                  NETWORK
                </Link>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] p-5 md:p-8">
            {error && (
              <div className="mb-5 border border-red-400/20 bg-red-400/5 px-5 py-4 font-mono text-[10px] tracking-[0.15em] text-red-300">
                {error}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                label="SUBJECTS"
                value={String(netraCase.subjects.length)}
              />

              <Stat
                label="EVIDENCE"
                value={String(netraCase.evidence.length)}
              />

              <Stat
                label="NOTES"
                value={String(netraCase.notes.length)}
              />

              <Stat
                label="OBJECTIVES"
                value={String(netraCase.objectives.length)}
              />
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <section className="border border-white/10 bg-[#080c11]/90">
                <SectionHeader title="SUBJECT IDENTITIES" />

                <div className="p-5">
                  <form
                    onSubmit={addSubject}
                    className="flex gap-2"
                  >
                    <input
                      value={subjectId}
                      onChange={(event) =>
                        setSubjectId(event.target.value)
                      }
                      placeholder="ENTER NETRA ID / SEED"
                      className="min-w-0 flex-1 border border-white/10 bg-black/30 px-3 py-3 font-mono text-[10px] tracking-[0.1em] text-slate-300 outline-none focus:border-cyan-400/40"
                    />

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="border border-cyan-400/30 px-4 font-mono text-[9px] tracking-[0.15em] text-cyan-300 hover:bg-cyan-400/5 disabled:opacity-50"
                    >
                      ADD
                    </button>
                  </form>

                  <div className="mt-5 space-y-2">
                    {netraCase.subjects.length === 0 ? (
                      <Empty text="NO SUBJECTS ASSIGNED" />
                    ) : (
                      netraCase.subjects.map((subject) => (
                        <Link
                          key={subject}
                          href={
                            "/dashboard?identity=" +
                            encodeURIComponent(subject)
                          }
                          className="block border border-white/10 bg-black/20 px-4 py-3 font-mono text-[10px] tracking-[0.15em] text-cyan-300 hover:border-cyan-400/30"
                        >
                          {subject}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </section>

              <section className="border border-white/10 bg-[#080c11]/90">
                <SectionHeader title="CASE METADATA" />

                <div className="grid gap-px bg-white/10 sm:grid-cols-2">
                  <Info label="CASE ID" value={netraCase.caseId} />
                  <Info label="STATUS" value={netraCase.status} />
                  <Info label="PRIORITY" value={netraCase.priority} />
                  <Info
                    label="CREATED"
                    value={formatDate(netraCase.createdAt)}
                  />
                  <Info
                    label="UPDATED"
                    value={formatDate(netraCase.updatedAt)}
                  />
                  <Info label="TITLE" value={netraCase.title} />
                </div>
              </section>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <section className="border border-white/10 bg-[#080c11]/90">
                <SectionHeader title="EVIDENCE BOARD" />

                <div className="p-5">
                  <form
                    onSubmit={addEvidence}
                    className="space-y-3"
                  >
                    <input
                      value={evidenceTitle}
                      onChange={(event) =>
                        setEvidenceTitle(event.target.value)
                      }
                      placeholder="EVIDENCE TITLE"
                      className="w-full border border-white/10 bg-black/30 px-3 py-3 font-mono text-[10px] tracking-[0.1em] text-slate-300 outline-none focus:border-cyan-400/40"
                    />

                    <select
                      value={evidenceType}
                      onChange={(event) =>
                        setEvidenceType(event.target.value)
                      }
                      className="w-full border border-white/10 bg-[#080c11] px-3 py-3 font-mono text-[10px] tracking-[0.1em] text-slate-400 outline-none"
                    >
                      <option value="DOCUMENT">DOCUMENT</option>
                      <option value="IMAGE">IMAGE</option>
                      <option value="LINK">LINK</option>
                      <option value="RECORD">RECORD</option>
                      <option value="NOTE">NOTE</option>
                    </select>

                    <textarea
                      value={evidenceDescription}
                      onChange={(event) =>
                        setEvidenceDescription(event.target.value)
                      }
                      placeholder="DESCRIPTION"
                      rows={3}
                      className="w-full resize-none border border-white/10 bg-black/30 px-3 py-3 font-mono text-[10px] tracking-[0.08em] text-slate-300 outline-none focus:border-cyan-400/40"
                    />

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full border border-cyan-400/30 bg-cyan-400/5 py-3 font-mono text-[9px] tracking-[0.2em] text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-50"
                    >
                      ADD EVIDENCE
                    </button>
                  </form>

                  <div className="mt-5 space-y-3">
                    {netraCase.evidence.length === 0 ? (
                      <Empty text="NO EVIDENCE ATTACHED" />
                    ) : (
                      netraCase.evidence.map((item) => (
                        <div
                          key={item.id}
                          className="border border-white/10 bg-black/20 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="font-mono text-xs tracking-[0.1em] text-slate-300">
                                {item.title}
                              </div>

                              <div className="mt-1 font-mono text-[8px] tracking-[0.2em] text-cyan-500">
                                {item.type} // {item.id}
                              </div>
                            </div>

                            <div className="font-mono text-[8px] text-slate-600">
                              {formatDate(item.createdAt)}
                            </div>
                          </div>

                          {item.description && (
                            <p className="mt-4 font-mono text-[10px] leading-5 tracking-[0.05em] text-slate-500">
                              {item.description}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>

              <section className="border border-white/10 bg-[#080c11]/90">
                <SectionHeader title="INVESTIGATOR NOTES" />

                <div className="p-5">
                  <form
                    onSubmit={addNote}
                    className="space-y-3"
                  >
                    <textarea
                      value={note}
                      onChange={(event) =>
                        setNote(event.target.value)
                      }
                      placeholder="ENTER INVESTIGATION NOTE"
                      rows={5}
                      className="w-full resize-none border border-white/10 bg-black/30 px-3 py-3 font-mono text-[10px] tracking-[0.08em] text-slate-300 outline-none focus:border-cyan-400/40"
                    />

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full border border-cyan-400/30 bg-cyan-400/5 py-3 font-mono text-[9px] tracking-[0.2em] text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-50"
                    >
                      ADD NOTE
                    </button>
                  </form>

                  <div className="mt-5 space-y-3">
                    {netraCase.notes.length === 0 ? (
                      <Empty text="NO INVESTIGATOR NOTES" />
                    ) : (
                      netraCase.notes
                        .slice()
                        .reverse()
                        .map((item, index) => (
                          <div
                            key={`${item}-${index}`}
                            className="border-l border-cyan-400/30 bg-black/20 px-4 py-3"
                          >
                            <div className="font-mono text-[10px] leading-5 tracking-[0.05em] text-slate-400">
                              {item}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </section>
            </div>

            <section className="mt-5 border border-white/10 bg-[#080c11]/90">
              <SectionHeader title="CASE TIMELINE" />

              <div className="p-5">
                <TimelineItem
                  label="CASE CREATED"
                  date={netraCase.createdAt}
                />

                {netraCase.evidence.map((item) => (
                  <TimelineItem
                    key={item.id}
                    label={`EVIDENCE // ${item.title}`}
                    date={item.createdAt}
                  />
                ))}

                <TimelineItem
                  label="LAST UPDATED"
                  date={netraCase.updatedAt}
                  last
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/10 bg-[#07090c]/95 lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 px-6 py-6">
          <Link href="/dashboard" className="block">
            <div className="font-mono text-xl tracking-[0.35em] text-white">
              NETRA
            </div>

            <div className="mt-2 font-mono text-[8px] tracking-[0.28em] text-zinc-600">
              INTELLIGENCE OPERATIONS NETWORK
            </div>
          </Link>
        </div>

        <div className="px-4 py-6">
          <div className="mb-3 px-3 font-mono text-[8px] tracking-[0.3em] text-zinc-700">
            OPERATIONS
          </div>

          <NavItem
            href="/dashboard"
            label="IDENTITIES"
            icon="01"
          />

          <NavItem
            href="/dashboard/cases"
            label="CASES"
            icon="02"
            active
          />

          <NavItem
            href="/dashboard/network"
            label="NETWORK"
            icon="03"
          />

          <NavItem
            href="/dashboard/reports"
            label="REPORTS"
            icon="04"
          />

          <NavItem
            href="/dashboard/archive"
            label="ARCHIVE"
            icon="05"
          />
        </div>

        <div className="mt-auto border-t border-white/10 p-5">
          <div className="font-mono text-[8px] tracking-[0.2em] text-zinc-700">
            SYSTEM STATUS
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

            <span className="font-mono text-[9px] tracking-widest text-emerald-400">
              ONLINE
            </span>
          </div>

          <div className="mt-2 font-mono text-[8px] tracking-widest text-zinc-700">
            SECURE CHANNEL
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  label,
  icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "mb-1 flex h-11 items-center gap-3 border px-3 font-mono text-[9px] tracking-[0.18em] transition " +
        (active
          ? "border-cyan-900/60 bg-cyan-950/20 text-cyan-300"
          : "border-transparent text-zinc-600 hover:border-white/10 hover:bg-white/[0.02] hover:text-zinc-300")
      }
    >
      <span
        className={
          active
            ? "w-5 text-[8px] text-cyan-500"
            : "w-5 text-[8px] text-zinc-700"
        }
      >
        {icon}
      </span>

      <span>{label}</span>

      {active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />
      )}
    </Link>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-white/10 px-5 py-4">
      <div className="font-mono text-[9px] tracking-[0.25em] text-slate-600">
        {title}
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
    <div className="border border-white/10 bg-[#080c11]/90 p-5">
      <div className="font-mono text-[8px] tracking-[0.2em] text-slate-600">
        {label}
      </div>

      <div className="mt-3 font-mono text-2xl font-light text-slate-200">
        {value}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#080c11] p-5">
      <div className="font-mono text-[8px] tracking-[0.2em] text-slate-600">
        {label}
      </div>

      <div className="mt-2 break-words font-mono text-[10px] tracking-[0.08em] text-slate-300">
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  return (
    <div className="border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 font-mono text-[9px] tracking-[0.18em] text-cyan-300">
      {label}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-white/10 px-4 py-8 text-center font-mono text-[9px] tracking-[0.2em] text-slate-700">
      {text}
    </div>
  );
}

function TimelineItem({
  label,
  date,
  last = false,
}: {
  label: string;
  date: string;
  last?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="mt-1 h-2 w-2 rounded-full bg-cyan-400" />

        {!last && (
          <div className="mt-2 h-full min-h-10 w-px bg-white/10" />
        )}
      </div>

      <div className="pb-6">
        <div className="font-mono text-[10px] tracking-[0.12em] text-slate-300">
          {label}
        </div>

        <div className="mt-1 font-mono text-[8px] tracking-[0.12em] text-slate-600">
          {formatDate(date)}
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB");
}

