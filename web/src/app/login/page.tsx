"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "ACCESS DENIED");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setStatus("SYSTEM ERROR // AUTHENTICATION SERVICE UNAVAILABLE");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070a] text-slate-200">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
        <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:40px_40px]" />

        <div className="relative w-full max-w-md font-mono">
          <div className="mb-6 flex items-center justify-between text-[8px] tracking-[0.2em] text-slate-700">
            <span>NETRA // SECURE CHANNEL</span>
            <span>NODE 01</span>
          </div>

          <div className="border border-white/[0.1] bg-[#070a0e] shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <div className="text-sm font-semibold tracking-[0.3em] text-white">
                  NETRA
                </div>
                <div className="mt-1 text-[8px] tracking-[0.22em] text-slate-600">
                  RESTRICTED INTELLIGENCE NETWORK
                </div>
              </div>

              <div className="flex items-center gap-2 text-[8px] tracking-[0.15em] text-emerald-400/70">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                ONLINE
              </div>
            </div>

            <div className="px-7 py-9">
              <div className="mb-8">
                <p className="text-[9px] tracking-[0.3em] text-cyan-400/60">
                  AUTHENTICATION REQUIRED
                </p>

                <h1 className="mt-3 text-xl tracking-[0.12em] text-white">
                  ACCESS CONTROL
                </h1>

                <p className="mt-3 text-[9px] leading-5 tracking-[0.08em] text-slate-600">
                  AUTHORIZED PERSONNEL ONLY. ALL ACCESS ATTEMPTS ARE
                  SUBJECT TO SYSTEM LOGGING.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="username"
                    className="mb-2 block text-[8px] tracking-[0.2em] text-slate-600"
                  >
                    OPERATIVE ID
                  </label>

                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                    className="w-full border border-white/[0.1] bg-black/30 px-4 py-3 text-xs text-white outline-none transition placeholder:text-slate-800 focus:border-cyan-400/40"
                    placeholder="ENTER OPERATIVE ID"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-[8px] tracking-[0.2em] text-slate-600"
                  >
                    ACCESS KEY
                  </label>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="w-full border border-white/[0.1] bg-black/30 px-4 py-3 text-xs text-white outline-none transition placeholder:text-slate-800 focus:border-cyan-400/40"
                    placeholder="ENTER ACCESS KEY"
                  />
                </div>

                {status && (
                  <div className="border border-red-400/20 bg-red-400/[0.03] px-4 py-3 text-[8px] tracking-[0.12em] text-red-400/80">
                    {status}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full border border-cyan-400/30 bg-cyan-400/[0.04] px-4 py-3 text-[9px] tracking-[0.3em] text-cyan-300 transition hover:border-cyan-300/60 hover:bg-cyan-400/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "AUTHENTICATING..." : "AUTHENTICATE"}
                </button>
              </form>
            </div>

            <div className="border-t border-white/[0.08] px-5 py-3 text-[8px] tracking-[0.12em] text-slate-700">
              ENCRYPTED CHANNEL // ACCESS CONTROL ENABLED
            </div>
          </div>

          <div className="mt-5 flex justify-between text-[8px] tracking-[0.15em] text-slate-700">
            <span>NETRA SYSTEM</span>
            <span>RESTRICTED</span>
          </div>
        </div>
      </div>
    </main>
  );
}
