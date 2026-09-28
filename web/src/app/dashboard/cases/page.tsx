"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type NetraCase = {
  caseId: string;
  title: string;
  status: string;
  priority: string;
  subjects: string[];
  objectives: string[];
  evidence: {
    id: string;
    type: string;
    title: string;
    description: string;
    createdAt: string;
  }[];
  notes: string[];
  createdAt: string;
  updatedAt: string;
};

export default function CasesPage() {
  const [cases, setCases] = useState<NetraCase[]>([]);
  const [title, setTitle] = useState("");
  const [identityId, setIdentityId] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCases();
  }, []);

  async function loadCases() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/cases");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "CASE DATABASE UNAVAILABLE",
        );
      }

      setCases(data.cases || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "CASE DATABASE UNAVAILABLE",
      );
    } finally {
      setLoading(false);
    }
  }

  async function createNewCase(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setError("CASE TITLE REQUIRED");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          title: title.trim(),
          identityId: identityId.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "CASE CREATION FAILED",
        );
      }

      setCases((current) => [data, ...current]);
      setTitle("");
      setIdentityId("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "CASE CREATION FAILED",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050709] text-zinc-300">
      <div className="min-h-screen bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:40px_40px]">
        <header className="border-b border-zinc-800 bg-[#07090c]/95">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
            <div>
              <div className="font-mono text-lg tracking-[0.35em] text-white">
                NETRA
              </div>

              <div className="mt-1 font-mono text-[9px] tracking-[0.3em] text-zinc-600">
                INTELLIGENCE OPERATIONS NETWORK
              </div>
            </div>

            <div className="flex items-center gap-4 font-mono text-[10px] tracking-widest">
              <span className="text-zinc-600">
                CHANNEL
              </span>

              <span className="text-cyan-400">
                ENCRYPTED
              </span>

              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

              <span className="text-emerald-400">
                ONLINE
              </span>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] p-5 md:p-8">
          <div className="mb-8">
            <div className="font-mono text-[10px] tracking-[0.35em] text-cyan-500">
              MODULE // 02
            </div>

            <h1 className="mt-2 font-mono text-2xl tracking-[0.18em] text-white">
              CASE MANAGEMENT
            </h1>

            <p className="mt-2 max-w-2xl font-mono text-[10px] leading-5 text-zinc-600">
              Create and manage NETRA intelligence cases,
              subjects and investigative evidence.
            </p>
          </div>

          <section className="border border-zinc-800 bg-[#080b0e] p-5">
            <div className="mb-5">
              <div className="font-mono text-[9px] tracking-[0.25em] text-zinc-600">
                NEW CASE
              </div>
            </div>

            <form
              onSubmit={createNewCase}
              className="grid gap-3 md:grid-cols-[1fr_240px_auto]"
            >
              <input
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="CASE TITLE"
                className="h-11 border border-zinc-800 bg-black px-4 font-mono text-xs tracking-widest text-white outline-none placeholder:text-zinc-700 focus:border-cyan-800"
              />

              <input
                value={identityId}
                onChange={(event) =>
                  setIdentityId(event.target.value)
                }
                placeholder="NETRA ID (OPTIONAL)"
                className="h-11 border border-zinc-800 bg-black px-4 font-mono text-xs tracking-widest text-white outline-none placeholder:text-zinc-700 focus:border-cyan-800"
              />

              <button
                type="submit"
                disabled={creating}
                className="h-11 border border-cyan-900 bg-cyan-950/20 px-7 font-mono text-[10px] tracking-[0.2em] text-cyan-300 transition hover:bg-cyan-900/30 disabled:opacity-50"
              >
                {creating
                  ? "CREATING..."
                  : "CREATE CASE"}
              </button>
            </form>

            {error && (
              <div className="mt-4 border border-red-950 bg-red-950/10 px-4 py-3 font-mono text-[10px] tracking-widest text-red-400">
                {error}
              </div>
            )}
          </section>

          <section className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-mono text-[9px] tracking-[0.25em] text-zinc-600">
                ACTIVE CASE FILES
              </div>

              <div className="font-mono text-[9px] text-zinc-700">
                {cases.length} RECORDS
              </div>
            </div>

            {loading ? (
              <div className="border border-zinc-800 bg-[#080b0e] p-8 text-center font-mono text-[10px] tracking-widest text-zinc-600">
                LOADING CASE DATABASE...
              </div>
            ) : cases.length === 0 ? (
              <div className="border border-zinc-800 bg-[#080b0e] p-8 text-center font-mono text-[10px] tracking-widest text-zinc-600">
                NO ACTIVE CASES
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {cases.map((item) => (
                  <Link
                    key={item.caseId}
                    href={
                      "/dashboard/cases/" +
                      item.caseId
                    }
                    className="block border border-zinc-800 bg-[#080b0e] transition hover:border-cyan-900 hover:bg-[#0a0f13]"
                  >
                    <div className="flex items-start justify-between border-b border-zinc-800 p-5">
                      <div>
                        <div className="font-mono text-[9px] tracking-widest text-zinc-600">
                          {item.caseId}
                        </div>

                        <h2 className="mt-2 font-mono text-sm tracking-widest text-white">
                          {item.title}
                        </h2>
                      </div>

                      <span className="border border-emerald-950 bg-emerald-950/20 px-2 py-1 font-mono text-[8px] tracking-widest text-emerald-400">
                        {item.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-px bg-zinc-800">
                      <div className="bg-[#080b0e] p-4">
                        <div className="font-mono text-[8px] text-zinc-600">
                          PRIORITY
                        </div>

                        <div className="mt-2 font-mono text-[10px] text-zinc-300">
                          {item.priority}
                        </div>
                      </div>

                      <div className="bg-[#080b0e] p-4">
                        <div className="font-mono text-[8px] text-zinc-600">
                          SUBJECTS
                        </div>

                        <div className="mt-2 font-mono text-[10px] text-zinc-300">
                          {item.subjects.length}
                        </div>
                      </div>

                      <div className="bg-[#080b0e] p-4">
                        <div className="font-mono text-[8px] text-zinc-600">
                          EVIDENCE
                        </div>

                        <div className="mt-2 font-mono text-[10px] text-zinc-300">
                          {item.evidence.length}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

