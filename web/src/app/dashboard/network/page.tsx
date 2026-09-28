"use client";

import NetraSidebar from "@/components/NetraSidebar";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Person = {
  name?: string;
  firstName?: string;
  lastName?: string;
  relation: string;
  age?: number;
  gender?: string;
  dateOfBirth?: string;
  fatherName?: string;
  motherName?: string;
  maritalStatus?: string;
};

type Identity = {
  netraId: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    age?: number;
    gender?: string;
    dateOfBirth?: string;
  };
  family?: {
    spouse?: Person;
    parents?: {
      father?: Person;
      mother?: Person;
    };
    children?: Person[];
    siblings?: Person[];
  };
};

type NetraCase = {
  caseId: string;
  title: string;
  status?: string;
  subjects?: string[];
};

export default function NetworkPage() {
  const [identityId, setIdentityId] = useState("");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [cases, setCases] = useState<NetraCase[]>([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [loading, setLoading] = useState(false);
  const [caseLoading, setCaseLoading] = useState(false);
  const [error, setError] = useState("");
  const [caseMessage, setCaseMessage] = useState("");

  useEffect(() => {
    loadCases();
  }, []);

  async function loadCases() {
    try {
      const response = await fetch("/api/cases", {
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = await response.json();
      setCases(data.cases || []);
    } catch {
      // Case integration remains optional if the case store is unavailable.
    }
  }

  async function searchIdentity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const id = identityId.trim();

    if (!id) {
      setError("IDENTITY ID REQUIRED");
      setIdentity(null);
      return;
    }

    setLoading(true);
    setError("");
    setCaseMessage("");
    setIdentity(null);

    try {
      const response = await fetch(
        "/api/identity?id=" + encodeURIComponent(id),
        { method: "GET", cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("IDENTITY NOT FOUND");
      }

      setIdentity(await response.json());
    } catch {
      setError("IDENTITY RETRIEVAL FAILED");
    } finally {
      setLoading(false);
    }
  }

  async function attachToCase() {
    if (!identity || !selectedCase) {
      setCaseMessage("SELECT A CASE");
      return;
    }

    setCaseLoading(true);
    setCaseMessage("");

    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "subject",
          caseId: selectedCase,
          identityId: identity.netraId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "CASE UPDATE FAILED");
      }

      setCases((current) =>
        current.map((item) =>
          item.caseId === selectedCase
            ? {
                ...item,
                subjects: data.subjects || item.subjects,
              }
            : item,
        ),
      );
      setCaseMessage("SUBJECT ATTACHED TO CASE");
    } catch (err) {
      setCaseMessage(
        err instanceof Error ? err.message : "CASE UPDATE FAILED",
      );
    } finally {
      setCaseLoading(false);
    }
  }

  const people = buildNetwork(identity);
  const subjectName = identity?.profile
    ? [identity.profile.firstName, identity.profile.lastName]
        .filter(Boolean)
        .join(" ")
    : "UNKNOWN SUBJECT";

  return (
    <main className="min-h-screen bg-[#05070a] text-slate-200">
      <div className="flex min-h-screen">
        <NetraSidebar />

        <section className="min-w-0 flex-1">
          <header className="border-b border-white/10 bg-[#070a0f] px-6 py-5">
            <div className="text-[9px] tracking-[0.35em] text-cyan-500">
              NETRA // NETWORK
            </div>
            <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-lg tracking-[0.18em] text-slate-100">
                  RELATIONSHIP NETWORK
                </h1>
                <p className="mt-1 text-[10px] tracking-[0.12em] text-slate-600">
                  FAMILY AND RELATIONSHIP INTELLIGENCE
                </p>
              </div>
              <div className="font-mono text-[9px] tracking-[0.2em] text-slate-700">
                NETWORK ENGINE // READY
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] space-y-5 p-6">
            <section className="border border-white/10 bg-[#080c11]">
              <SectionHeader label="NETWORK SUBJECT" detail="IDENTITY SEARCH" />
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
                  disabled={loading}
                  className="border border-cyan-500/30 bg-cyan-500/5 px-6 py-3 text-[10px] tracking-[0.2em] text-cyan-400 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "SEARCHING" : "LOAD NETWORK"}
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
                  <SectionHeader label="NETWORK SUBJECT" detail="ACTIVE IDENTITY" />
                  <div className="grid gap-px bg-white/10 md:grid-cols-4">
                    <Stat label="IDENTITY" value={identity.netraId} />
                    <Stat label="NAME" value={subjectName} />
                    <Stat label="RELATIONS" value={String(people.length)} />
                    <Stat label="NETWORK STATUS" value="RESOLVED" />
                  </div>
                </section>

                <section className="border border-white/10 bg-[#080c11]">
                  <SectionHeader
                    label="CASE INTEGRATION"
                    detail="INVESTIGATION WORKSPACE"
                  />
                  <div className="grid gap-3 p-5 md:grid-cols-[1fr_auto]">
                    <select
                      value={selectedCase}
                      onChange={(event) => setSelectedCase(event.target.value)}
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
                      onClick={attachToCase}
                      disabled={caseLoading || !selectedCase}
                      className="border border-cyan-500/30 bg-cyan-500/5 px-6 py-3 text-[9px] tracking-[0.18em] text-cyan-400 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {caseLoading ? "ATTACHING" : "ATTACH SUBJECT"}
                    </button>
                  </div>
                  {caseMessage && (
                    <div className="border-t border-white/10 px-5 py-3 text-[9px] tracking-[0.16em] text-slate-500">
                      {caseMessage}
                    </div>
                  )}
                </section>

                <section className="border border-white/10 bg-[#080c11]">
                  <SectionHeader
                    label="RELATIONSHIP GRAPH"
                    detail="CONNECTED IDENTITIES"
                  />
                  <div className="relative min-h-[420px] overflow-hidden bg-[#05070a] p-6">
                    <div className="pointer-events-none absolute inset-0 opacity-30">
                      <div
                        className="h-full w-full"
                        style={{
                          backgroundImage:
                            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
                          backgroundSize: "40px 40px",
                        }}
                      />
                    </div>
                    <div className="relative flex min-h-[360px] flex-col items-center justify-center">
                      <div className="relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/[0.06] text-center shadow-[0_0_50px_rgba(34,211,238,0.08)]">
                        <div className="text-[8px] tracking-[0.2em] text-cyan-500">
                          SUBJECT
                        </div>
                        <div className="mt-2 max-w-[100px] truncate text-xs text-slate-200">
                          {subjectName}
                        </div>
                        <div className="mt-2 font-mono text-[7px] text-slate-600">
                          {identity.netraId}
                        </div>
                      </div>

                      {people.length > 0 ? (
                        <div className="mt-8 grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {people.map((person, index) => (
                            <NetworkNode
                              key={person.relation + person.name + index}
                              person={person}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="mt-8 text-[9px] tracking-[0.2em] text-slate-700">
                          NO CONNECTED RELATIONS
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="border border-white/10 bg-[#080c11]">
                  <SectionHeader
                    label="RELATION REGISTER"
                    detail={people.length + " CONNECTIONS"}
                  />
                  {people.length === 0 ? (
                    <div className="px-5 py-12 text-center text-[9px] tracking-[0.2em] text-slate-700">
                      NO RELATIONSHIP DATA AVAILABLE
                    </div>
                  ) : (
                    <div className="divide-y divide-white/10">
                      {people.map((person, index) => (
                        <RelationRow
                          key={person.relation + person.name + index}
                          person={person}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}

            {!identity && !loading && (
              <section className="border border-dashed border-white/10 bg-[#080c11]/50 px-6 py-16 text-center">
                <div className="text-[10px] tracking-[0.3em] text-slate-600">
                  NO NETWORK SUBJECT LOADED
                </div>
                <div className="mt-2 text-[9px] tracking-[0.12em] text-slate-800">
                  ENTER AN IDENTITY ID TO RESOLVE RELATIONSHIPS
                </div>
              </section>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function buildNetwork(identity: Identity | null): Person[] {
  if (!identity?.family) return [];

  const people: Person[] = [];

  if (identity.family.spouse) {
    people.push({ ...identity.family.spouse, relation: "SPOUSE", name: getName(identity.family.spouse) });
  }

  if (identity.family.parents?.father) {
    people.push({ ...identity.family.parents.father, relation: "FATHER", name: getName(identity.family.parents.father) });
  }

  if (identity.family.parents?.mother) {
    people.push({ ...identity.family.parents.mother, relation: "MOTHER", name: getName(identity.family.parents.mother) });
  }

  for (const child of identity.family.children || []) {
    people.push({ ...child, relation: "CHILD", name: getName(child) });
  }

  for (const sibling of identity.family.siblings || []) {
    people.push({ ...sibling, relation: "SIBLING", name: getName(sibling) });
  }

  return people;
}

function getName(person: Person) {
  return person.name || [person.firstName, person.lastName].filter(Boolean).join(" ") || "UNKNOWN";
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

function NetworkNode({ person }: { person: Person }) {
  return (
    <div className="border border-white/10 bg-[#080c11] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[8px] tracking-[0.18em] text-cyan-500/70">{person.relation}</div>
        <div className="font-mono text-[7px] text-slate-700">PROFILE</div>
      </div>
      <div className="mt-3 truncate text-xs text-slate-300">{person.name}</div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[8px] tracking-[0.08em] text-slate-600">
        <span>AGE {person.age ?? "—"}</span>
        <span>{String(person.gender || "—").toUpperCase()}</span>
      </div>
    </div>
  );
}

function RelationRow({ person }: { person: Person }) {
  return (
    <div className="grid gap-4 px-5 py-5 md:grid-cols-[140px_1fr_180px] md:items-center">
      <div className="text-[8px] tracking-[0.18em] text-cyan-500/70">{person.relation}</div>
      <div>
        <div className="text-xs text-slate-300">{person.name}</div>
        <div className="mt-1 text-[8px] tracking-[0.08em] text-slate-700">
          AGE {person.age ?? "—"} // DOB {person.dateOfBirth || "—"}
        </div>
      </div>
      <div className="text-[8px] tracking-[0.14em] text-slate-700">
        FAMILY PROFILE
      </div>
    </div>
  );
}
