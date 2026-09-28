
"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Person = {
  id: string;
  name: string;
  relation: string;
};

type Identity = {
  id?: string;
  profile?: {
    name?: string;
  };
  spouse?: {
    id?: string;
    name?: string;
  } | null;
  parents?: {
    father?: {
      id?: string;
      name?: string;
    } | null;
    mother?: {
      id?: string;
      name?: string;
    } | null;
  };
  children?: Array<{
    id?: string;
    name?: string;
  }>;
  siblings?: Array<{
    id?: string;
    name?: string;
  }>;
};

export default function NetworkPage() {
  const [identityId, setIdentityId] = useState("");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    setIdentity(null);

    try {
      const url =
        "/api/identity?id=" + encodeURIComponent(id);

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("IDENTITY NOT FOUND");
      }

      const data = await response.json();

      setIdentity(data);
    } catch {
      setError("IDENTITY RETRIEVAL FAILED");
    } finally {
      setLoading(false);
    }
  }

  const people = buildNetwork(identity);

  return (
    <main className="min-h-screen bg-[#05070a] text-slate-200">
      <div className="flex min-h-screen">
        <Sidebar />

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
                  IDENTITY RELATIONSHIP INTELLIGENCE
                </p>
              </div>

              <div className="font-mono text-[9px] tracking-[0.2em] text-slate-700">
                NETWORK ENGINE // READY
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] space-y-5 p-6">
            <section className="border border-white/10 bg-[#080c11]">
              <SectionHeader
                label="NETWORK SUBJECT"
                detail="IDENTITY SEARCH"
              />

              <form
                onSubmit={searchIdentity}
                className="grid gap-3 p-5 md:grid-cols-[1fr_auto]"
              >
                <input
                  value={identityId}
                  onChange={(event) =>
                    setIdentityId(event.target.value)
                  }
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
                  <SectionHeader
                    label="NETWORK SUBJECT"
                    detail="ACTIVE IDENTITY"
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
                        "UNKNOWN SUBJECT"
                      }
                    />

                    <Stat
                      label="RELATIONS"
                      value={String(people.length)}
                    />

                    <Stat
                      label="NETWORK STATUS"
                      value="RESOLVED"
                    />
                  </div>
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
                          {identity.profile?.name ||
                            "UNKNOWN"}
                        </div>

                        <div className="mt-2 font-mono text-[7px] text-slate-600">
                          {identity.id || identityId}
                        </div>
                      </div>

                      {people.length > 0 ? (
                        <div className="mt-8 grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {people.map((person) => (
                            <NetworkNode
                              key={
                                person.id +
                                person.relation
                              }
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
                    detail={`${people.length} CONNECTIONS`}
                  />

                  {people.length === 0 ? (
                    <div className="px-5 py-12 text-center text-[9px] tracking-[0.2em] text-slate-700">
                      NO RELATIONSHIP DATA AVAILABLE
                    </div>
                  ) : (
                    <div className="divide-y divide-white/10">
                      {people.map((person) => (
                        <RelationRow
                          key={
                            person.id +
                            person.relation
                          }
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

function buildNetwork(
  identity: Identity | null
): Person[] {
  if (!identity) {
    return [];
  }

  const people: Person[] = [];

  if (identity.spouse?.id) {
    people.push({
      id: identity.spouse.id,
      name: identity.spouse.name || "UNKNOWN",
      relation: "SPOUSE",
    });
  }

  if (identity.parents?.father?.id) {
    people.push({
      id: identity.parents.father.id,
      name:
        identity.parents.father.name ||
        "UNKNOWN",
      relation: "FATHER",
    });
  }

  if (identity.parents?.mother?.id) {
    people.push({
      id: identity.parents.mother.id,
      name:
        identity.parents.mother.name ||
        "UNKNOWN",
      relation: "MOTHER",
    });
  }

  for (const child of identity.children || []) {
    if (!child.id) {
      continue;
    }

    people.push({
      id: child.id,
      name: child.name || "UNKNOWN",
      relation: "CHILD",
    });
  }

  for (const sibling of identity.siblings || []) {
    if (!sibling.id) {
      continue;
    }

    people.push({
      id: sibling.id,
      name: sibling.name || "UNKNOWN",
      relation: "SIBLING",
    });
  }

  return people;
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

      <div className="mt-2 truncate font-mono text-xs tracking-[0.08em] text-slate-300">
        {value}
      </div>
    </div>
  );
}

function NetworkNode({
  person,
}: {
  person: Person;
}) {
  return (
    <Link
      href={
        "/dashboard?identity=" +
        encodeURIComponent(person.id)
      }
      className="border border-white/10 bg-[#080c11] p-4 transition hover:border-cyan-500/30 hover:bg-cyan-500/[0.03]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[8px] tracking-[0.18em] text-cyan-500/70">
          {person.relation}
        </div>

        <div className="font-mono text-[7px] text-slate-700">
          NODE
        </div>
      </div>

      <div className="mt-3 truncate text-xs text-slate-300">
        {person.name}
      </div>

      <div className="mt-2 truncate font-mono text-[8px] tracking-[0.08em] text-slate-600">
        {person.id}
      </div>
    </Link>
  );
}

function RelationRow({
  person,
}: {
  person: Person;
}) {
  return (
    <div className="grid gap-4 px-5 py-5 md:grid-cols-[140px_1fr_180px_auto] md:items-center">
      <div className="text-[8px] tracking-[0.18em] text-cyan-500/70">
        {person.relation}
      </div>

      <div>
        <div className="text-xs text-slate-300">
          {person.name}
        </div>

        <div className="mt-1 font-mono text-[8px] tracking-[0.08em] text-slate-700">
          {person.id}
        </div>
      </div>

      <div className="text-[8px] tracking-[0.14em] text-slate-700">
        CONNECTED IDENTITY
      </div>

      <Link
        href={
          "/dashboard?identity=" +
          encodeURIComponent(person.id)
        }
        className="border border-white/10 px-3 py-2 text-center text-[8px] tracking-[0.16em] text-slate-500 transition hover:border-cyan-500/30 hover:text-cyan-400"
      >
        OPEN
      </Link>
    </div>
  );
}

