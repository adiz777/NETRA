"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "IDENTITIES", icon: "01" },
  { href: "/dashboard/cases", label: "CASES", icon: "02" },
  { href: "/dashboard/network", label: "NETWORK", icon: "03" },
  { href: "/dashboard/reports", label: "REPORTS", icon: "04" },
  { href: "/dashboard/archive", label: "ARCHIVE", icon: "05" },
  { href: "/dashboard/security", label: "SECURITY", icon: "06" },
];

export default function NetraSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/10 bg-[#07090c]/95 lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 px-6 py-6">
          <Link href="/dashboard" className="block">
            <div className="font-mono text-xl tracking-[0.35em] text-white">NETRA</div>
            <div className="mt-2 font-mono text-[8px] tracking-[0.28em] text-zinc-600">
              INTELLIGENCE OPERATIONS NETWORK
            </div>
          </Link>
        </div>

        <nav className="px-4 py-6">
          <div className="mb-3 px-3 font-mono text-[8px] tracking-[0.3em] text-zinc-700">
            OPERATIONS
          </div>

          {items.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "mb-1 flex h-11 items-center gap-3 border px-3 font-mono text-[9px] tracking-[0.18em] transition " +
                  (active
                    ? "border-cyan-900/60 bg-cyan-950/20 text-cyan-300"
                    : "border-transparent text-zinc-600 hover:border-white/10 hover:bg-white/[0.02] hover:text-zinc-300")
                }
              >
                <span className={active ? "w-5 text-[8px] text-cyan-500" : "w-5 text-[8px] text-zinc-700"}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 p-5">
          <div className="font-mono text-[8px] tracking-[0.2em] text-zinc-700">SYSTEM STATUS</div>
          <div className="mt-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono text-[9px] tracking-widest text-emerald-400">ONLINE</span>
          </div>
          <div className="mt-2 font-mono text-[8px] tracking-widest text-zinc-700">SECURE CHANNEL</div>
        </div>
      </div>
    </aside>
  );
}
