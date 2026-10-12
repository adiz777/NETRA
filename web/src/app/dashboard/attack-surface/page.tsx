"use client";

import { FormEvent, useMemo, useState } from "react";
import NetraSidebar from "@/components/NetraSidebar";

type DnsAnswer = { name?: string; type?: number; TTL?: number; data?: string };
type SurfaceResult = {
  kind: "domain";
  query: string;
  fetchedAt: string;
  sources?: string[];
  dns?: { status?: number | null; answers?: DnsAnswer[] };
  certificateNames?: string[];
  note?: string;
};
type SurfaceNode = {
  id: string;
  label: string;
  kind: "domain" | "subdomain" | "ip";
  x: number;
  y: number;
  detail: string;
};

const isIPv4 = (value: string) =>
  /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value);
const shortLabel = (value: string, max = 30) =>
  value.length > max ? value.slice(0, max - 1) + "…" : value;

export default function AttackSurfacePage() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<SurfaceResult | null>(null);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function discover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setSelected("");
    try {
      const response = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ kind: "domain", query: domain.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "DISCOVERY FAILED");
      setResult(data as SurfaceResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "DISCOVERY FAILED");
    } finally {
      setLoading(false);
    }
  }

  const nodes = useMemo<SurfaceNode[]>(() => {
    if (!result) return [];
    const root = result.query.toLowerCase();
    const subdomains = [...new Set(result.certificateNames ?? [])]
      .map((name) => name.toLowerCase())
      .filter((name) => name !== root && name.endsWith("." + root))
      .slice(0, 12);
    const ips = [...new Set((result.dns?.answers ?? [])
      .filter((answer) => answer.type === 1 && answer.data && isIPv4(answer.data))
      .map((answer) => answer.data as string))].slice(0, 6);
    const output: SurfaceNode[] = [
      { id: "root", label: root, kind: "domain", x: 500, y: 92, detail: "Root domain supplied for this passive lookup." },
    ];
    subdomains.forEach((name, index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);
      output.push({
        id: "sub-" + name,
        label: name,
        kind: "subdomain",
        x: 140 + column * 240,
        y: 220 + row * 88,
        detail: "Observed in certificate-transparency data. This does not prove the host is currently live.",
      });
    });
    ips.forEach((ip, index) => {
      output.push({
        id: "ip-" + ip,
        label: ip,
        kind: "ip",
        x: 100 + index * 160,
        y: 500,
        detail: "Returned by the public DNS lookup for the root domain.",
      });
    });
    return output;
  }, [result]);

  const selectedNode = nodes.find((node) => node.id === selected);
  const subdomainCount = nodes.filter((node) => node.kind === "subdomain").length;
  const ipCount = nodes.filter((node) => node.kind === "ip").length;

  function exportMap() {
    if (!result) return;
    const payload = {
      product: "NETRA Attack Surface Map",
      exportedAt: new Date().toISOString(),
      evidence: result,
      graph: {
        nodes: nodes.map(({ id, label, kind, detail }) => ({ id, label, kind, detail })),
        edges: [
          ...nodes.filter((node) => node.kind === "subdomain").map((node) => ({ from: "root", to: node.id, relation: "certificate name observed" })),
          ...nodes.filter((node) => node.kind === "ip").map((node) => ({ from: "root", to: node.id, relation: "DNS A record" })),
        ],
      },
      limitations: "Passive public-source snapshot only. Certificate names are not proof of live hosts; no ports or services were scanned.",
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "netra-attack-surface-" + result.query + ".json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#05070a] text-slate-200">
      <div className="flex min-h-screen">
        <NetraSidebar />
        <section className="min-w-0 flex-1">
          <header className="border-b border-white/10 bg-[#070a0f] px-6 py-5">
            <div className="font-mono text-[9px] tracking-[0.35em] text-cyan-500">NETRA // ATTACK SURFACE</div>
            <h1 className="mt-2 font-mono text-xl tracking-[0.18em] text-white">ATTACK SURFACE MAP</h1>
            <p className="mt-2 font-mono text-[10px] text-zinc-500">PASSIVE DNS + CERTIFICATE TRANSPARENCY // NO ACTIVE SCANNING</p>
          </header>

          <div className="mx-auto max-w-7xl space-y-5 p-5 md:p-8">
            <form onSubmit={discover} className="grid gap-3 border border-zinc-800 bg-[#080b0e] p-5 md:grid-cols-[1fr_auto_auto] md:items-end">
              <div>
                <label htmlFor="surface-domain" className="mb-2 block font-mono text-[10px] tracking-widest text-zinc-500">AUTHORISED DOMAIN</label>
                <input id="surface-domain" value={domain} onChange={(event) => setDomain(event.target.value)} required maxLength={253} placeholder="example.com" autoComplete="off" spellCheck={false} className="w-full border border-zinc-700 bg-[#050709] p-3 font-mono text-sm text-white outline-none focus:border-cyan-700" />
              </div>
              <button type="submit" disabled={loading} className="border border-cyan-800 bg-cyan-950/30 px-5 py-3 font-mono text-[10px] tracking-widest text-cyan-300 disabled:opacity-50">{loading ? "DISCOVERING..." : "BUILD MAP"}</button>
              <button type="button" onClick={exportMap} disabled={!result} className="border border-zinc-700 px-5 py-3 font-mono text-[10px] tracking-widest text-zinc-300 disabled:opacity-40">EXPORT JSON</button>
            </form>

            {error && <div role="alert" className="border border-red-900/60 bg-red-950/20 p-4 font-mono text-xs text-red-300">{error}</div>}

            {!result && !loading && (
              <section className="flex min-h-72 items-center justify-center border border-dashed border-zinc-800 bg-[#080b0e] p-8 text-center">
                <div className="max-w-lg">
                  <div className="font-mono text-xs tracking-[0.25em] text-cyan-500">MAP A PUBLIC-SOURCE SNAPSHOT</div>
                  <p className="mt-3 text-sm leading-6 text-zinc-500">Enter a domain you own or are authorised to assess. NETRA will map the root domain, names found in certificate-transparency records, and IPv4 DNS answers.</p>
                </div>
              </section>
            )}

            {loading && <div className="border border-zinc-800 bg-[#080b0e] p-12 text-center font-mono text-xs tracking-widest text-cyan-400">QUERYING PUBLIC DNS AND CERTIFICATE TRANSPARENCY SOURCES...</div>}

            {result && (
              <>
                <div className="grid gap-px border border-zinc-800 bg-zinc-800 sm:grid-cols-3">
                  <div className="bg-[#080b0e] p-4"><div className="font-mono text-[9px] tracking-widest text-zinc-500">ROOT DOMAIN</div><div className="mt-2 break-all font-mono text-sm text-white">{result.query}</div></div>
                  <div className="bg-[#080b0e] p-4"><div className="font-mono text-[9px] tracking-widest text-zinc-500">CERTIFICATE NAMES</div><div className="mt-2 font-mono text-2xl text-cyan-300">{subdomainCount}</div></div>
                  <div className="bg-[#080b0e] p-4"><div className="font-mono text-[9px] tracking-widest text-zinc-500">DNS IPv4 ANSWERS</div><div className="mt-2 font-mono text-2xl text-cyan-300">{ipCount}</div></div>
                </div>

                <section className="overflow-hidden border border-zinc-800 bg-[#080b0e]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4">
                    <div><h2 className="font-mono text-xs tracking-widest text-white">RELATIONSHIP GRAPH</h2><p className="mt-1 font-mono text-[9px] text-zinc-600">Select a node to inspect its evidence context.</p></div>
                    <div className="flex flex-wrap gap-3 font-mono text-[9px] text-zinc-500"><span className="text-cyan-300">● ROOT</span><span className="text-sky-300">● CERTIFICATE NAME</span><span className="text-amber-300">● DNS IPv4</span></div>
                  </div>
                  <div className="overflow-x-auto">
                    <svg viewBox="0 0 1000 570" role="img" aria-label={"Attack surface relationship graph for " + result.query} className="h-auto min-w-[700px] w-full">
                      <defs><pattern id="surface-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="#18212b" strokeWidth="0.7" /></pattern></defs>
                      <rect width="1000" height="570" fill="url(#surface-grid)" />
                      {nodes.filter((node) => node.kind !== "domain").map((node) => <line key={"edge-" + node.id} x1="500" y1="126" x2={node.x} y2={node.y - 25} stroke={node.kind === "ip" ? "#b45309" : "#0369a1"} strokeOpacity="0.75" strokeWidth="1.5" strokeDasharray={node.kind === "ip" ? "5 5" : "none"} />)}
                      {nodes.map((node) => {
                        const isRoot = node.kind === "domain";
                        const fill = isRoot ? "#083344" : node.kind === "subdomain" ? "#082f49" : "#451a03";
                        const stroke = isRoot ? "#22d3ee" : node.kind === "subdomain" ? "#38bdf8" : "#f59e0b";
                        return <g key={node.id} role="button" tabIndex={0} aria-label={"Inspect " + node.label} onClick={() => setSelected(node.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(node.id); } }} className="cursor-pointer outline-none">
                          <rect x={node.x - (isRoot ? 160 : 75)} y={node.y - (isRoot ? 31 : 25)} width={isRoot ? 320 : 150} height={isRoot ? 62 : 50} rx="5" fill={fill} stroke={selected === node.id ? "#ffffff" : stroke} strokeWidth={selected === node.id ? 2.5 : 1.2} />
                          <text x={node.x} y={node.y + 4} fill="#e2e8f0" fontSize={isRoot ? 16 : 11} textAnchor="middle" fontFamily="monospace">{shortLabel(node.label, isRoot ? 34 : 23)}</text>
                          <text x={node.x} y={node.y + (isRoot ? 21 : 16)} fill={stroke} fontSize="8" textAnchor="middle" fontFamily="monospace">{isRoot ? "ROOT DOMAIN" : node.kind === "subdomain" ? "CERTIFICATE NAME" : "DNS A RECORD"}</text>
                        </g>;
                      })}
                      {nodes.length === 1 && <text x="500" y="260" textAnchor="middle" fill="#71717a" fontSize="12" fontFamily="monospace">No related certificate names or IPv4 answers returned.</text>}
                      <text x="20" y="548" fill="#52525b" fontSize="9" fontFamily="monospace">PASSIVE OBSERVATIONS ONLY · SNAPSHOT {new Date(result.fetchedAt).toLocaleString()}</text>
                    </svg>
                  </div>
                  {selectedNode && <div className="border-t border-zinc-800 p-5"><div className="font-mono text-[9px] tracking-widest text-cyan-500">SELECTED NODE // {selectedNode.kind.toUpperCase()}</div><h3 className="mt-2 break-all font-mono text-sm text-white">{selectedNode.label}</h3><p className="mt-2 text-xs leading-5 text-zinc-400">{selectedNode.detail}</p></div>}
                </section>

                <section className="border border-zinc-800 bg-[#080b0e] p-5">
                  <h2 className="font-mono text-xs tracking-widest text-white">EVIDENCE & LIMITATIONS</h2>
                  <div className="mt-4 space-y-3 text-xs leading-5 text-zinc-400">
                    <p><span className="text-zinc-200">Sources:</span> {(result.sources ?? ["Public DNS", "Certificate Transparency"]).join(", ")}</p>
                    <p><span className="text-zinc-200">Collected:</span> {new Date(result.fetchedAt).toLocaleString()}</p>
                    <p>{result.note}</p>
                    <p className="text-amber-400">This is not a port scan or a complete inventory. Certificate-transparency entries can be historical, and DNS answers reflect only the query performed.</p>
                  </div>
                </section>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
