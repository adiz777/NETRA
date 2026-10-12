"use client";

import { FormEvent, useState } from "react";
import NetraSidebar from "@/components/NetraSidebar";

type Review = {
  age?: string;
  weightKg?: string;
  education?: string;
  country?: string;
  educationContext?: string;
  notes?: string;
};

export default function DataQualityPage() {
  const [form, setForm] = useState<Review>({ age: "14", weightKg: "41.4", education: "middle", country: "", educationContext: "", notes: "" });
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(key: keyof Review, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setAnalysis("");
    const evidence = {
      record: {
        ageYears: form.age ? Number(form.age) : null,
        weightKg: form.weightKg ? Number(form.weightKg) : null,
        educationLabel: form.education?.trim() || null,
        countryOrEducationSystem: form.country?.trim() || null,
        educationContext: form.educationContext?.trim() || null,
        additionalNotes: form.notes?.trim() || null,
      },
      taskType: "data_quality_review",
    };
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          task: "Act as NETRA's Data-Quality Analyst. Review the supplied record for internal consistency and explain ambiguous labels. For age and weight, do not call a value impossible merely because it is uncommon; classify it as plausible, needs context, or likely inconsistent, and explain what additional context would be needed. Do not diagnose or make medical conclusions. For education labels such as 'middle', do not assume a universal meaning: explain possible interpretations and state that country, age, and source taxonomy may be needed. Separate observations from assumptions, show calculations only where justified, identify missing context, and give a concise confidence level. Do not invent facts. Return headings: Record Summary, Checks, Education Label, Missing Context, Confidence.",
          evidence,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "REVIEW FAILED");
      setAnalysis(data.analysis || "No analysis returned.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "REVIEW FAILED");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070a] text-slate-200">
      <div className="flex min-h-screen">
        <NetraSidebar />
        <section className="min-w-0 flex-1">
          <header className="border-b border-white/10 bg-[#070a0f] px-6 py-5">
            <div className="font-mono text-[9px] tracking-[0.35em] text-cyan-500">NETRA // AI QUALITY</div>
            <h1 className="mt-2 font-mono text-xl tracking-[0.18em] text-white">DATA-QUALITY ANALYST</h1>
            <p className="mt-2 font-mono text-[10px] text-zinc-500">CONSISTENCY CHECKS // CONTEXT-AWARE LABEL INTERPRETATION</p>
          </header>
          <div className="mx-auto max-w-5xl space-y-5 p-5 md:p-8">
            <section className="border border-zinc-800 bg-[#080b0e] p-5">
              <p className="mb-5 text-sm leading-6 text-zinc-400">Review a record for possible inconsistencies without treating unusual values as impossible. The AI should explain uncertainty and ask for context when a label is ambiguous.</p>
              <form onSubmit={review} className="grid gap-4 md:grid-cols-2">
                <div><label htmlFor="dq-age" className="mb-2 block font-mono text-[10px] tracking-widest text-zinc-500">AGE (YEARS)</label><input id="dq-age" type="number" min="0" max="130" step="1" value={form.age ?? ""} onChange={(e) => update("age", e.target.value)} className="w-full border border-zinc-700 bg-[#050709] p-3 font-mono text-sm text-white" /></div>
                <div><label htmlFor="dq-weight" className="mb-2 block font-mono text-[10px] tracking-widest text-zinc-500">WEIGHT (KG)</label><input id="dq-weight" type="number" min="0" max="500" step="0.1" value={form.weightKg ?? ""} onChange={(e) => update("weightKg", e.target.value)} className="w-full border border-zinc-700 bg-[#050709] p-3 font-mono text-sm text-white" /></div>
                <div><label htmlFor="dq-education" className="mb-2 block font-mono text-[10px] tracking-widest text-zinc-500">EDUCATION LABEL</label><input id="dq-education" value={form.education ?? ""} onChange={(e) => update("education", e.target.value)} placeholder="e.g. middle" className="w-full border border-zinc-700 bg-[#050709] p-3 font-mono text-sm text-white" /></div>
                <div><label htmlFor="dq-country" className="mb-2 block font-mono text-[10px] tracking-widest text-zinc-500">COUNTRY / EDUCATION SYSTEM (OPTIONAL)</label><input id="dq-country" value={form.country ?? ""} onChange={(e) => update("country", e.target.value)} placeholder="e.g. India, UK, unknown" className="w-full border border-zinc-700 bg-[#050709] p-3 font-mono text-sm text-white" /></div>
                <div className="md:col-span-2"><label htmlFor="dq-context" className="mb-2 block font-mono text-[10px] tracking-widest text-zinc-500">SOURCE TAXONOMY OR FIELD DEFINITION (OPTIONAL)</label><input id="dq-context" value={form.educationContext ?? ""} onChange={(e) => update("educationContext", e.target.value)} placeholder="Where the label came from or what the field means" className="w-full border border-zinc-700 bg-[#050709] p-3 font-mono text-sm text-white" /></div>
                <div className="md:col-span-2"><label htmlFor="dq-notes" className="mb-2 block font-mono text-[10px] tracking-widest text-zinc-500">OTHER RECORD DETAILS (OPTIONAL)</label><textarea id="dq-notes" value={form.notes ?? ""} onChange={(e) => update("notes", e.target.value)} rows={3} placeholder="Add context without including unnecessary sensitive personal information." className="w-full border border-zinc-700 bg-[#050709] p-3 font-mono text-sm text-white" /></div>
                <div className="md:col-span-2"><button type="submit" disabled={loading} className="border border-cyan-800 bg-cyan-950/30 px-5 py-3 font-mono text-[10px] tracking-widest text-cyan-300 disabled:opacity-50">{loading ? "REVIEWING RECORD..." : "RUN DATA-QUALITY REVIEW"}</button></div>
              </form>
            </section>
            {error && <div role="alert" className="border border-red-900/60 bg-red-950/20 p-4 font-mono text-xs text-red-300">{error}</div>}
            {analysis && <section className="border border-zinc-800 bg-[#080b0e] p-5"><h2 className="mb-4 font-mono text-xs tracking-widest text-cyan-300">AI REVIEW // FINDINGS</h2><pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-zinc-300">{analysis}</pre><p className="mt-5 border-t border-zinc-800 pt-4 text-[10px] leading-5 text-zinc-600">AI output is a review aid, not ground truth. Verify unusual records against the original source and its definitions.</p></section>}
          </div>
        </section>
      </div>
    </main>
  );
}
