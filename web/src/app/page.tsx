"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toISOString().replace("T", " ").replace("Z", " UTC"),
      );

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#05070a] text-slate-200 selection:bg-cyan-400/20">
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:40px_40px]" />

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[0.025] blur-3xl" />

        <div className="relative mx-auto flex min-h-screen max-w-[1400px] flex-col px-6 py-6 font-mono">
          <header className="flex items-start justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center border border-cyan-400/30 bg-cyan-400/[0.04] text-sm text-cyan-300">
                N
              </div>

              <div>
                <div className="text-sm font-semibold tracking-[0.35em] text-white">
                  NETRA
                </div>
                <div className="mt-1 text-[9px] tracking-[0.25em] text-slate-600">
                  INTELLIGENCE NETWORK
                </div>
              </div>
            </div>

            <div className="hidden text-right text-[9px] leading-5 tracking-[0.18em] text-slate-600 sm:block">
              <div>NODE // 01</div>
              <div>CHANNEL // ENCRYPTED</div>
            </div>
          </header>

          <section className="flex flex-1 items-center justify-center py-16">
            <div className="w-full max-w-3xl">
              <div className="mb-10 flex items-center justify-center gap-3">
                <span className="h-px w-16 bg-white/[0.08]" />
                <span className="text-[9px] tracking-[0.35em] text-slate-600">
                  RESTRICTED ACCESS
                </span>
                <span className="h-px w-16 bg-white/[0.08]" />
              </div>

              <div className="border border-white/[0.1] bg-[#070a0e]/90 shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3">
                  <div className="text-[9px] tracking-[0.25em] text-slate-600">
                    NETRA // SECURE TERMINAL
                  </div>

                  <div className="flex items-center gap-2 text-[9px] tracking-[0.15em] text-emerald-400/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    ONLINE
                  </div>
                </div>

                <div className="px-7 py-10 sm:px-12 sm:py-14">
                  <div className="text-center">
                    <div className="text-[10px] tracking-[0.45em] text-cyan-400/60">
                      CLASSIFIED INTELLIGENCE SYSTEM
                    </div>

                    <h1 className="mt-6 text-5xl font-bold tracking-[0.22em] text-white sm:text-7xl">
                      NETRA
                    </h1>

                    <div className="mx-auto mt-5 h-px w-32 bg-cyan-400/30" />

                    <p className="mt-5 text-[10px] tracking-[0.28em] text-slate-600">
                      IDENTITY // DOSSIER // NETWORK // INVESTIGATION
                    </p>
                  </div>

                  <div className="mx-auto mt-12 grid max-w-xl grid-cols-2 border border-white/[0.07] sm:grid-cols-4">
                    {[
                      ["CORE", "READY"],
                      ["IDENTITY", "READY"],
                      ["NETWORK", "READY"],
                      ["ARCHIVE", "LOCKED"],
                    ].map(([label, value], index) => (
                      <div
                        key={label}
                        className={`px-4 py-4 text-center ${
                          index > 0 ? "border-l border-white/[0.07]" : ""
                        }`}
                      >
                        <div className="text-[8px] tracking-[0.2em] text-slate-700">
                          {label}
                        </div>
                        <div
                          className={`mt-2 text-[9px] tracking-[0.15em] ${
                            value === "READY"
                              ? "text-emerald-400/70"
                              : "text-amber-400/60"
                          }`}
                        >
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 flex justify-center">
                    <a
                      href="/login"
                      className="group relative border border-cyan-400/30 bg-cyan-400/[0.035] px-10 py-4 text-[10px] tracking-[0.3em] text-cyan-300 transition hover:border-cyan-300/60 hover:bg-cyan-400/[0.08]"
                    >
                      AUTHENTICATE
                      <span className="ml-5 text-cyan-400/40 transition group-hover:text-cyan-300">
                        →
                      </span>
                    </a>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-2 border-t border-white/[0.08] px-5 py-3 text-[8px] tracking-[0.15em] text-slate-700 sm:flex-row">
                  <span>ACCESS CONTROL // ENABLED</span>
                  <span>{time || "INITIALIZING..."}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-between text-[8px] tracking-[0.18em] text-slate-700">
                <span>NETRA SYSTEM</span>
                <span>AUTHORIZED PERSONNEL ONLY</span>
              </div>
            </div>
          </section>

          <footer className="flex items-center justify-between border-t border-white/[0.06] pt-4 text-[8px] tracking-[0.15em] text-slate-700">
            <span>SECURE CHANNEL</span>
            <span>NO PUBLIC ACCESS</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
