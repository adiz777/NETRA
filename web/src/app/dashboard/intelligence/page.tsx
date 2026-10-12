"use client";

import { FormEvent, useState } from "react";
import NetraSidebar from "@/components/NetraSidebar";

type LookupKind = "domain" | "ip" | "username" | "email";

export default function IntelligencePage() {
  const [kind, setKind] = useState<LookupKind>("domain");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [error, setError] = useState("");

  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError(""); setResult(null); setAnalysis("");
    try {
      const response = await fetch("/api/intelligence", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, query: query.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "LOOKUP FAILED");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "LOOKUP FAILED");
    } finally { setLoading(false); }
  }

  async function analyse() {
    if (!result) return;
    setAnalysing(true); setError("");
    try {
      const response = await fetch("/api/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "Analyse these public-source intelligence results. Identify verified findings, uncertainties and reasonable follow-up checks.", evidence: result }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI ANALYSIS FAILED");
      setAnalysis(data.analysis || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI ANALYSIS FAILED");
    } finally { setAnalysing(false); }
  }

  async function exportResult() {
    if (!result) return;
    try {
      const response = await fetch("/api/export", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: "netra-" + kind + "-report", data: { result, analysis: analysis || null } }),
      });
      if (!response.ok) throw new Error("EXPORT FAILED");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = "netra-" + kind + "-report.json";
      link.click(); URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "EXPORT FAILED");
    }
  }

  return (
    <main className="min-h-screen bg-[#05070a] text-slate-200">
      <div className="flex min-h-screen"><NetraSidebar />
        <section className="min-w-0 flex-1">
          <header className="border-b border-white/10 bg-[#070a0f] px-6 py-5">
            <div className="font-mono text-[9px] tracking-[0.35em] text-cyan-500">NETRA // INTELLIGENCE</div>
            <h1 className="mt-2 font-mono text-xl tracking-[0.18em] text-white">PUBLIC-SOURCE LOOKUPS</h1>
            <p className="mt-2 font-mono text-[10px] text-zinc-500">PASSIVE LOOKUPS // SOURCE-ATTRIBUTED RESULTS</p>
          </header>
          <div className="mx-auto max-w-5xl space-y-6 p-5 md:p-8">
            <form onSubmit={lookup} className="space-y-4 border border-zinc-800 bg-[#080b0e] p-5">
              <label className="block font-mono text-[10px] tracking-widest text-zinc-500">LOOKUP TYPE</label>
              <select value={kind} onChange={(e) => setKind(e.target.value as LookupKind)} className="w-full border border-zinc-700 bg-[#050709] p-3 font-mono text-sm text-white">
                <option value="domain">DOMAIN INTELLIGENCE</option>
                <option value="ip">IP INTELLIGENCE</option>
                <option value="username">PUBLIC USERNAME SEARCH</option>
                <option value="email">EMAIL EXPOSURE CHECK (HIBP KEY REQUIRED)</option>
              </select>
              <label className="block font-mono text-[10px] tracking-widest text-zinc-500">QUERY</label>
              <input value={query} onChange={(e) => setQuery(e.target.value)} required maxLength={320} placeholder={kind === "domain" ? "example.com" : kind === "ip" ? "8.8.8.8" : kind === "username" ? "public_username" : "you@example.com"} className="w-full border border-zinc-700 bg-[#050709] p-3 font-mono text-sm text-white outline-none focus:border-cyan-700" />
              <button disabled={loading} className="border border-cyan-800 bg-cyan-950/30 px-5 py-3 font-mono text-[10px] tracking-widest text-cyan-300 disabled:opacity-50">{loading ? "QUERYING SOURCES..." : "RUN LOOKUP"}</button>
              {kind === "email" && <p className="font-mono text-[10px] leading-5 text-amber-500">Only check email addresses you own or are authorised to investigate. NETRA requires your own HIBP API key.</p>}
            </form>
            {error && <div role="alert" className="border border-red-900/60 bg-red-950/20 p-4 font-mono text-xs text-red-300">{error}</div>}
            {result !== null && <section className="border border-zinc-800 bg-[#080b0e] p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-mono text-sm tracking-widest text-white">SOURCE RESULTS</h2>
                <div className="flex gap-2">
                  <button onClick={analyse} disabled={analysing} className="border border-cyan-900 px-3 py-2 font-mono text-[10px] text-cyan-300 disabled:opacity-50">{analysing ? "ANALYSING..." : "AI ANALYSIS"}</button>
                  <button onClick={exportResult} className="border border-zinc-700 px-3 py-2 font-mono text-[10px] text-zinc-300">EXPORT JSON</button>
                </div>
              </div>
              <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-6 text-zinc-300">{JSON.stringify(result, null, 2)}</pre>
              {analysis && <div className="mt-5 border-t border-zinc-800 pt-5"><h3 className="mb-3 font-mono text-xs tracking-widest text-cyan-400">ANALYST NOTES</h3><pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-zinc-300">{analysis}</pre></div>}
            </section>}
            <p className="font-mono text-[9px] leading-5 text-zinc-600">Public-source matches are leads, not proof of identity. Geolocation is approximate. Provider availability and free-tier limits may vary.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
