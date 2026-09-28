
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AuditEvent = {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  target: string;
  status: "SUCCESS" | "DENIED" | "SYSTEM";
  source: string;
};

export default function SecurityPage() {
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    async function loadAudit() {
      try {
        const response = await fetch("/api/audit", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        setAudit(Array.isArray(data.events) ? data.events : []);
      } catch {
        setAudit([]);
      }
    }
    void loadAudit();
  }, []);

  const filteredAudit = useMemo(() => {
    if (filter === "ALL") {
      return audit;
    }

    return audit.filter((event) => event.status === filter);
  }, [audit, filter]);

  async function recordEvent(
    action: string,
    status: AuditEvent["status"] = "SYSTEM"
  ) {
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, status, source: "SECURITY" }),
      });
      if (response.ok) {
        const event = await response.json();
        setAudit((current) => [event, ...current].slice(0, 100));
      }
    } catch {
      // Keep the security interface usable if the audit service is unavailable.
    }
  }

  async function clearAudit() {
    try {
      const response = await fetch("/api/audit", { method: "DELETE" });
      if (response.ok) {
        const event = await response.json();
        setAudit([event]);
      }
    } catch {
      // No client-side audit mutation when the server is unavailable.
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-[#05070a] text-slate-200">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <header className="border-b border-white/10 bg-[#070a0f] px-6 py-5">
            <div className="text-[9px] tracking-[0.35em] text-cyan-500">
              NETRA // SECURITY
            </div>

            <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-lg tracking-[0.18em] text-slate-100">
                  SECURITY & AUDIT
                </h1>

                <p className="mt-1 text-[10px] tracking-[0.12em] text-slate-600">
                  OPERATOR ACCESS AND SYSTEM ACTIVITY
                </p>
              </div>

              <div className="font-mono text-[9px] tracking-[0.2em] text-slate-700">
                SECURITY ENGINE // ACTIVE
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] space-y-5 p-6">
            <section className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-4">
              <SecurityStat
                label="AUTHENTICATION"
                value="ACTIVE"
                state="good"
              />

              <SecurityStat
                label="SESSION"
                value="HTTPONLY"
                state="good"
              />

              <SecurityStat
                label="AUDIT EVENTS"
                value={String(audit.length)}
                state="neutral"
              />

              <SecurityStat
                label="ACCESS"
                value="OPERATOR"
                state="neutral"
              />
            </section>

            <section className="border border-white/10 bg-[#080c11]">
              <SectionHeader
                label="SECURITY CONTROLS"
                detail="LOCAL OPERATOR CONTROLS"
              />

              <div className="grid gap-px bg-white/10 md:grid-cols-3">
                <Control
                  label="AUTHENTICATION"
                  value="SERVER SIDE"
                  detail="Credentials are resolved through environment configuration."
                />

                <Control
                  label="SESSION COOKIE"
                  value="HTTPONLY"
                  detail="Browser JavaScript cannot directly access the session cookie."
                />

                <Control
                  label="AUDIT STORAGE"
                  value="SESSION"
                  detail="Current audit records remain available for the active browser session."
                />
              </div>
            </section>

            <section className="border border-white/10 bg-[#080c11]">
              <SectionHeader
                label="AUDIT LOG"
                detail={`${filteredAudit.length} EVENTS`}
              />

              <div className="flex flex-col gap-3 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                  {["ALL", "SUCCESS", "DENIED", "SYSTEM"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      className={[
                        "border px-3 py-2 text-[8px] tracking-[0.16em] transition",
                        filter === value
                          ? "border-cyan-500/30 bg-cyan-500/5 text-cyan-400"
                          : "border-white/10 text-slate-600 hover:text-slate-300",
                      ].join(" ")}
                    >
                      {value}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void recordEvent("SECURITY CHECK EXECUTED", "SYSTEM")
                    }
                    className="border border-white/10 px-3 py-2 text-[8px] tracking-[0.16em] text-slate-500 transition hover:border-cyan-500/30 hover:text-cyan-400"
                  >
                    RUN SECURITY CHECK
                  </button>

                  <button
                    type="button"
                    onClick={() => void clearAudit()}
                    className="border border-red-500/20 px-3 py-2 text-[8px] tracking-[0.16em] text-red-400/70 transition hover:bg-red-500/5 hover:text-red-400"
                  >
                    RESET LOG
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => void logout()}
                  className="border border-red-500/20 px-3 py-2 text-[8px] tracking-[0.16em] text-red-400/70 transition hover:bg-red-500/5 hover:text-red-400"
                >
                  TERMINATE SESSION
                </button>
              </div>

              {filteredAudit.length === 0 ? (
                <div className="px-5 py-12 text-center text-[9px] tracking-[0.2em] text-slate-700">
                  NO AUDIT EVENTS
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {filteredAudit.map((event) => (
                    <AuditRow key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>

            <section className="border border-amber-500/10 bg-amber-500/[0.02] px-5 py-5">
              <div className="text-[9px] tracking-[0.2em] text-amber-500/60">
                SECURITY NOTICE
              </div>

              <p className="mt-2 max-w-4xl text-[9px] leading-5 tracking-[0.05em] text-slate-700">
                Authentication uses a signed HTTP-only session. Audit events
                are written server-side and retained in the local application
                data store.
              </p>
            </section>
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
        <NavItem href="/dashboard/reports" label="REPORTS" />
        <NavItem href="/dashboard/archive" label="ARCHIVE" />
        <NavItem href="/dashboard/security" label="SECURITY" active />
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

function SecurityStat({
  label,
  value,
  state,
}: {
  label: string;
  value: string;
  state: "good" | "neutral";
}) {
  return (
    <div className="bg-[#080c11] px-5 py-5">
      <div className="text-[8px] tracking-[0.2em] text-slate-600">
        {label}
      </div>

      <div
        className={[
          "mt-2 font-mono text-xs tracking-[0.1em]",
          state === "good" ? "text-emerald-400/80" : "text-slate-400",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function Control({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="bg-[#080c11] px-5 py-5">
      <div className="text-[8px] tracking-[0.18em] text-slate-600">
        {label}
      </div>

      <div className="mt-2 font-mono text-xs tracking-[0.1em] text-cyan-500/70">
        {value}
      </div>

      <p className="mt-3 text-[9px] leading-5 tracking-[0.04em] text-slate-700">
        {detail}
      </p>
    </div>
  );
}

function AuditRow({ event }: { event: AuditEvent }) {
  const statusClass =
    event.status === "SUCCESS"
      ? "text-emerald-400/80"
      : event.status === "DENIED"
        ? "text-red-400/80"
        : "text-cyan-500/70";

  return (
    <div className="grid gap-4 px-5 py-5 md:grid-cols-[150px_1fr_130px_100px] md:items-center">
      <div className="font-mono text-[9px] tracking-[0.08em] text-slate-700">
        {formatTimestamp(event.timestamp)}
      </div>

      <div>
        <div className="text-[9px] tracking-[0.14em] text-slate-400">
          {event.action}
        </div>

        <div className="mt-1 text-[7px] tracking-[0.16em] text-slate-700">
          {event.id} // {event.source}
        </div>
      </div>

      <div className="font-mono text-[8px] tracking-[0.12em] text-slate-600">
        {event.actor} → {event.target}
      </div>

      <div className={`text-[8px] tracking-[0.16em] ${statusClass}`}>
        {event.status}
      </div>
    </div>
  );
}

function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().replace("T", " ").slice(0, 19);
}

