"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import NetraSidebar from "@/components/NetraSidebar";

type CaseRecord = {
  caseId: string;
  title: string;
  status?: string;
  priority?: string;
  subjects?: string[];
  evidence?: Array<{ id: string; type: string; title: string; description: string; createdAt: string }>;
  notes?: string[];
  timeline?: Array<{ date?: string; title?: string; description?: string }>;
  createdAt?: string;
  updatedAt?: string;
};

type ApiResult = Record<string, unknown> | null;

const panel = "border border-white/10 bg-[#080c11] p-5";
const field = "w-full border border-white/10 bg-[#05080c] px-3 py-3 font-mono text-xs text-slate-200 outline-none focus:border-cyan-500/50";
const button = "border border-cyan-400/40 bg-cyan-400/5 px-4 py-3 font-mono text-[9px] tracking-[0.18em] text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-40";
const muted = "text-[10px] leading-5 tracking-wide text-slate-500";

export default function IntelligencePage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [caseId, setCaseId] = useState("");
  const [task, setTask] = useState("summary");
  const [analysis, setAnalysis] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ available?: boolean; model?: string | null } | null>(null);
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [evidenceType, setEvidenceType] = useState("DOCUMENT");
  const [evidenceMessage, setEvidenceMessage] = useState("");
  const [busyEvidence, setBusyEvidence] = useState(false);
  const [action, setAction] = useState("urlhaus");
  const [url, setUrl] = useState("");
  const [place, setPlace] = useState("");
  const [query, setQuery] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [publicResult, setPublicResult] = useState<ApiResult>(null);
  const [publicError, setPublicError] = useState("");
  const [publicLoading, setPublicLoading] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetch("/api/cases", { cache: "no-store" }).then((response) => response.ok ? response.json() : { cases: [] }).then((data) => {
        const loaded = Array.isArray(data.cases) ? data.cases as CaseRecord[] : [];
        setCases(loaded);
        if (loaded.length) setCaseId(loaded[0].caseId);
      }).catch(() => undefined),
      fetch("/api/analysis", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((data) => setAiStatus(data)).catch(() => undefined),
    ]);
  }, []);

  const selectedCase = useMemo(() => cases.find((item) => item.caseId === caseId), [cases, caseId]);

  const caseContext = useMemo(() => {
    if (!selectedCase) return "";
    return JSON.stringify({
      caseId: selectedCase.caseId,
      title: selectedCase.title,
      status: selectedCase.status,
      priority: selectedCase.priority,
      subjects: selectedCase.subjects,
      evidence: (selectedCase.evidence || []).map(({ type, title, description, createdAt }) => ({ type, title, description, createdAt })),
      notes: selectedCase.notes,
      timeline: selectedCase.timeline,
    }, null, 2);
  }, [selectedCase]);

  async function runAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnalysis("");
    setAnalysisError("");
    if (!selectedCase) {
      setAnalysisError("SELECT A CASE FIRST. CREATE A CASE FROM THE CASES PAGE.");
      return;
    }
    setAnalysisLoading(true);
    try {
      const response = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, context: caseContext }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.error || "ANALYSIS FAILED");
      setAnalysis(String(data.analysis || ""));
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "ANALYSIS FAILED");
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function addEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEvidenceMessage("");
    if (!selectedCase) {
      setEvidenceMessage("SELECT AN EXISTING CASE FIRST.");
      return;
    }
    if (!evidenceTitle.trim() || !evidenceDescription.trim()) {
      setEvidenceMessage("EVIDENCE TITLE AND DESCRIPTION ARE REQUIRED.");
      return;
    }
    setBusyEvidence(true);
    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "evidence", caseId, title: evidenceTitle.trim(), description: evidenceDescription.trim(), type: evidenceType }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "EVIDENCE SAVE FAILED");
      setCases((previous) => previous.map((item) => item.caseId === caseId ? data as CaseRecord : item));
      setEvidenceTitle("");
      setEvidenceDescription("");
      setEvidenceMessage("EVIDENCE ADDED TO CASE. SOURCE/VERIFICATION STATUS SHOULD BE RECORDED IN THE DESCRIPTION.");
    } catch (error) {
      setEvidenceMessage(error instanceof Error ? error.message : "EVIDENCE SAVE FAILED");
    } finally {
      setBusyEvidence(false);
    }
  }

  async function runPublicLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPublicResult(null);
    setPublicError("");
    setPublicLoading(true);
    try {
      let payload: Record<string, string> = { action };
      if (action === "urlhaus") payload.url = url;
      if (action === "geocode") payload.place = place;
      if (action === "news") payload.query = query;
      if (action === "weather") {
        payload.latitude = latitude;
        payload.longitude = longitude;
      }
      const response = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "LOOKUP FAILED");
      setPublicResult(data);
    } catch (error) {
      setPublicError(error instanceof Error ? error.message : "PUBLIC LOOKUP FAILED");
    } finally {
      setPublicLoading(false);
    }
  }

  function downloadAnalysis() {
    if (!analysis) return;
    const blob = new Blob([analysis], { type: "text/plain;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `NETRA-${task}-analysis.txt`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  function useCoordinates(lat: unknown, lon: unknown) {
    setLatitude(String(lat ?? ""));
    setLongitude(String(lon ?? ""));
    setAction("weather");
  }

  return (
    <main className="min-h-screen bg-[#05070a] text-slate-200">
      <div className="flex min-h-screen">
        <NetraSidebar />
        <section className="min-w-0 flex-1">
          <header className="border-b border-white/10 bg-[#070a0f] px-5 py-6 md:px-8">
            <div className="font-mono text-[9px] tracking-[0.35em] text-cyan-500">NETRA // INTELLIGENCE WORKSPACE</div>
            <h1 className="mt-2 text-xl tracking-[0.15em] text-white">AI ANALYST & PUBLIC INTELLIGENCE</h1>
            <p className="mt-2 max-w-3xl text-[10px] leading-5 tracking-wide text-slate-500">Hosted AI analysis, evidence management, public threat-feed checks, geographic context and public technology news. No local model is used.</p>
          </header>

          <div className="space-y-5 p-5 md:p-8">
            <section className={panel}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-mono text-[9px] tracking-[0.25em] text-cyan-400">01 / HOSTED AI ANALYST</div>
                  <h2 className="mt-2 text-sm tracking-widest text-white">CASE ANALYSIS</h2>
                  <p className={muted}>Summaries, timeline organisation, relationship explanations and report drafting from selected case records only.</p>
                </div>
                <div className={`border px-3 py-2 font-mono text-[9px] ${aiStatus?.available ? "border-emerald-500/30 text-emerald-400" : "border-amber-500/30 text-amber-300"}`}>
                  {aiStatus?.available ? `HOSTED AI READY · ${aiStatus.model}` : "HOSTED AI NEEDS DEPLOYMENT SECRETS"}
                </div>
              </div>
              <form onSubmit={runAnalysis} className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <select className={field} value={caseId} onChange={(event) => setCaseId(event.target.value)}>
                  <option value="">SELECT CASE</option>
                  {cases.map((item) => <option key={item.caseId} value={item.caseId}>{item.caseId} — {item.title}</option>)}
                </select>
                <select className={field} value={task} onChange={(event) => setTask(event.target.value)}>
                  <option value="summary">CASE SUMMARY</option>
                  <option value="timeline">TIMELINE REVIEW</option>
                  <option value="relationships">RELATIONSHIP EXPLANATION</option>
                  <option value="report">INTELLIGENCE REPORT DRAFT</option>
                </select>
                <button className={button} disabled={analysisLoading || !selectedCase}>{analysisLoading ? "ANALYSING..." : "RUN ANALYSIS"}</button>
              </form>
              {analysisError && <p className="mt-3 text-xs text-rose-300">{analysisError}</p>}
              {analysis && <div className="mt-4 border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-3"><span className="font-mono text-[9px] tracking-widest text-amber-300">AI-GENERATED · VERIFY BEFORE USE</span><button className={button} onClick={downloadAnalysis}>EXPORT TXT</button></div>
                <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-6 text-slate-300">{analysis}</pre>
              </div>}
              <p className={`${muted} mt-3`}>Do not send passwords, financial account details, government ID numbers or unnecessary personal data to a third-party model. AI output is not independently verified.</p>
            </section>

            <section className={panel}>
              <div className="font-mono text-[9px] tracking-[0.25em] text-cyan-400">02 / EVIDENCE EXPLORER</div>
              <h2 className="mt-2 text-sm tracking-widest text-white">CASE EVIDENCE</h2>
              <p className={muted}>Add evidence to an existing NETRA case and review its current evidence list. Use descriptions to record source, date collected and verification status.</p>
              <form onSubmit={addEvidence} className="mt-4 grid gap-3 md:grid-cols-2">
                <input className={field} value={evidenceTitle} onChange={(event) => setEvidenceTitle(event.target.value)} placeholder="EVIDENCE TITLE" maxLength={180} />
                <select className={field} value={evidenceType} onChange={(event) => setEvidenceType(event.target.value)}>
                  <option value="DOCUMENT">DOCUMENT</option><option value="LINK">LINK</option><option value="NOTE">NOTE</option><option value="IMAGE">IMAGE</option><option value="RECORD">RECORD</option>
                </select>
                <textarea className={`${field} min-h-24 md:col-span-2`} value={evidenceDescription} onChange={(event) => setEvidenceDescription(event.target.value)} placeholder="DESCRIPTION, SOURCE URL, COLLECTION DATE, VERIFICATION STATUS..." maxLength={4000} />
                <div className="md:col-span-2"><button className={button} disabled={busyEvidence || !selectedCase}>{busyEvidence ? "SAVING..." : "ADD TO SELECTED CASE"}</button></div>
              </form>
              {evidenceMessage && <p className="mt-3 text-xs text-cyan-300">{evidenceMessage}</p>}
              <div className="mt-5 space-y-2">
                {(selectedCase?.evidence || []).map((item) => <article key={item.id} className="border border-white/10 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-slate-200">{item.title}</span><span className="font-mono text-[9px] text-cyan-500">{item.type}</span></div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-500">{item.description}</p>
                  <p className="mt-2 font-mono text-[8px] text-slate-700">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "DATE NOT AVAILABLE"}</p>
                </article>)}
                {selectedCase && !selectedCase.evidence?.length && <p className={muted}>NO EVIDENCE HAS BEEN ADDED TO THIS CASE.</p>}
                {!selectedCase && <p className={muted}>SELECT OR CREATE A CASE TO MANAGE EVIDENCE.</p>}
              </div>
            </section>

            <section className={panel}>
              <div className="font-mono text-[9px] tracking-[0.25em] text-cyan-400">03 / PUBLIC API CONNECTORS</div>
              <h2 className="mt-2 text-sm tracking-widest text-white">PUBLIC-SOURCE LOOKUPS</h2>
              <p className={muted}>Each lookup returns source and caveat metadata. Results are contextual indicators, not proof of a person's identity, activity or involvement.</p>
              <form onSubmit={runPublicLookup} className="mt-4 space-y-3">
                <select className={field} value={action} onChange={(event) => { setAction(event.target.value); setPublicResult(null); setPublicError(""); }}>
                  <option value="urlhaus">URLHAUS — URL THREAT FEED</option>
                  <option value="geocode">OPEN-METEO — GEOCODE PLACE</option>
                  <option value="weather">OPEN-METEO — WEATHER CONTEXT</option>
                  <option value="news">HACKER NEWS — PUBLIC TECH SEARCH</option>
                </select>
                {action === "urlhaus" && <input className={field} value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/path" type="url" required />}
                {action === "geocode" && <input className={field} value={place} onChange={(event) => setPlace(event.target.value)} placeholder="PLACE NAME" required />}
                {action === "weather" && <div className="grid gap-3 sm:grid-cols-2"><input className={field} value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="LATITUDE" type="number" step="any" required /><input className={field} value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="LONGITUDE" type="number" step="any" required /></div>}
                {action === "news" && <input className={field} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="PUBLIC TECHNOLOGY TOPIC" required />}
                <button className={button} disabled={publicLoading}>{publicLoading ? "QUERYING PUBLIC SOURCE..." : "RUN PUBLIC LOOKUP"}</button>
              </form>
              {publicError && <p className="mt-3 text-xs text-rose-300">{publicError}</p>}
              {publicResult && <div className="mt-4 border border-white/10 bg-black/20 p-4">
                <div className="mb-3 font-mono text-[9px] tracking-widest text-emerald-300">{String(publicResult.source || "PUBLIC SOURCE")} · {String(publicResult.checkedAt || "")}</div>
                {Array.isArray(publicResult.results) && (publicResult.results as Array<Record<string, unknown>>).map((item, index) => <article key={index} className="mb-2 border-b border-white/10 pb-3 last:border-0">
                  <div className="text-xs text-slate-200">{String(item.title || item.name || "RESULT")}</div>
                  <div className="mt-1 break-words text-[10px] text-slate-500">{[item.admin1, item.country, item.createdAt, item.latitude !== undefined ? `LAT ${item.latitude}` : "", item.longitude !== undefined ? `LON ${item.longitude}` : ""].filter(Boolean).join(" · ")}</div>
                  {typeof item.url === "string" && <a className="mt-2 inline-block break-all text-[10px] text-cyan-400 underline" href={item.url} target="_blank" rel="noreferrer noopener">{item.url}</a>}
                  {action === "geocode" && typeof item.latitude === "number" && typeof item.longitude === "number" && <button className={`${button} mt-2 block`} onClick={() => useCoordinates(item.latitude, item.longitude)}>USE COORDINATES FOR WEATHER</button>}
                </article>)}
                {publicResult.result !== undefined && <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words text-[10px] leading-5 text-slate-400">{JSON.stringify(publicResult.result, null, 2)}</pre>}
                {typeof publicResult.caveat === "string" && <p className="mt-3 border-t border-white/10 pt-3 text-[10px] leading-5 text-amber-200/70">{publicResult.caveat}</p>}
              </div>}
              <p className={`${muted} mt-3`}>Public API rate limits and terms apply. Do not use threat-feed results as a standalone verdict; a clean result is not proof that a URL is safe.</p>
            </section>

            <section className="border border-amber-500/20 bg-amber-500/[0.03] p-4">
              <div className="font-mono text-[9px] tracking-[0.2em] text-amber-300">DATA HANDLING NOTICE</div>
              <p className="mt-2 text-[10px] leading-5 text-slate-500">Only analyse information you are authorised to use. NETRA-generated identity data is fictional test data. External API results and AI-generated text may be incomplete, stale or incorrect; preserve source links and have a human review any conclusions. Cloud AI providers may process submitted case context under their own terms.</p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
