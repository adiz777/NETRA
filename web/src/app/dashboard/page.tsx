"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type Person = {
  firstName?: string;
  lastName?: string;
  gender?: string;
  age?: number;
  dateOfBirth?: string;
};

type GovernmentIds = {
  aadhaar?: string;
  pan?: string;
  voterId?: string;
  bankAccountNumber?: string;
  bankIFSC?: string;
  bankName?: string;
  drivingLicense?: string;
  passport?: string;
  vehicleRegistration?: string;
  upiId?: string;
};

type Address = {
  addressLine?: string;
  locality?: string;
  pinCode?: string;
  district?: string;
  state?: string;

  // Compatibility with older frontend data
  line1?: string;
  city?: string;
  pincode?: string;
};

type LifeEvent = {
  year: number;
  event: string;
  detail?: string;
};

type Profile = Person & {
  fullName?: string;
  middleName?: string;
  firstName?: string;
  lastName?: string;

  fatherName?: string;
  motherName?: string;
  spouseName?: string;

  heightCm?: number;
  weightKg?: number;
  bloodGroup?: string;
  occupation?: string;
  education?: string;
  nationality?: string;

  phone?: string;
  email?: string;

  address?: Address;

  governmentIds?: GovernmentIds;

  lifeEvents?: LifeEvent[];
};

type Identity = {
  netraId: string;
  seed: string;

  profile: Profile;

  family?: {
    head?: Person;
    spouse?: Person;
    parents?: {
      father?: Person;
      mother?: Person;
    };
    children?: Person[];
    siblings?: Person[];
  };

  metadata?: {
    generatedAt?: string;
    deterministic?: boolean;
    dataClass?: string;
  };
};

function displayValue(value?: string | number | null): string {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

  return String(value);
}

function formatDate(value?: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatEventName(value: string): string {
  return value.replaceAll("_", " ").toUpperCase();
}

export default function DashboardPage() {
  const [identityId, setIdentityId] = useState("");
  const [profile, setProfile] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchIdentity(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const id = identityId.trim();

    if (!id) {
      setError("IDENTITY ID REQUIRED");
      setProfile(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/identity?id=${encodeURIComponent(id)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "IDENTITY LOOKUP FAILED");
      }

      setProfile(data);
    } catch (err) {
      setProfile(null);
      setError(
        err instanceof Error ? err.message.toUpperCase() : "LOOKUP FAILED"
      );
    } finally {
      setLoading(false);
    }
  }

  const person = profile?.profile;
  const governmentIds = person?.governmentIds;
  const address = person?.address;

  const bankAccount =
    governmentIds?.bankAccountNumber ||
    (governmentIds as GovernmentIds & { accountNumber?: string } | undefined)
      ?.accountNumber;

  const bankIFSC =
    governmentIds?.bankIFSC ||
    (governmentIds as GovernmentIds & { ifsc?: string } | undefined)?.ifsc;

  const bankName = governmentIds?.bankName;

  const addressLine = address?.addressLine || address?.line1;
  const locality = address?.locality || address?.city;
  const pinCode = address?.pinCode || address?.pincode;

  const children = profile?.family?.children ?? [];
  const siblings = profile?.family?.siblings ?? [];

  return (
    <main className="min-h-screen bg-[#05070a] text-slate-200">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* SIDEBAR */}
        <aside className="w-full border-b border-white/10 bg-[#070a0f] lg:w-64 lg:border-b-0 lg:border-r">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="text-2xl font-semibold tracking-[0.3em] text-white">
              NETRA
            </div>

            <div className="mt-2 text-[9px] tracking-[0.25em] text-slate-600">
              INTELLIGENCE SYSTEM
            </div>
          </div>

          <nav className="p-3">
            <Link
              href="/dashboard"
              className="block border border-cyan-400/30 bg-cyan-400/5 px-4 py-3 text-[10px] tracking-[0.2em] text-cyan-400"
            >
              IDENTITY INTELLIGENCE
            </Link>

            <Link
              href="/dashboard/cases"
              className="mt-1 block border border-transparent px-4 py-3 text-[10px] tracking-[0.2em] text-slate-500 transition hover:border-white/10 hover:bg-white/[0.02] hover:text-slate-300"
            >
              CASES
            </Link>

            <Link
              href="/dashboard/network"
              className="mt-1 block border border-transparent px-4 py-3 text-[10px] tracking-[0.2em] text-slate-500 transition hover:border-white/10 hover:bg-white/[0.02] hover:text-slate-300"
            >
              NETWORK
            </Link>

            <Link
              href="/dashboard/reports"
              className="mt-1 block border border-transparent px-4 py-3 text-[10px] tracking-[0.2em] text-slate-500 transition hover:border-white/10 hover:bg-white/[0.02] hover:text-slate-300"
            >
              REPORTS
            </Link>

            <Link
              href="/dashboard/archive"
              className="mt-1 block border border-transparent px-4 py-3 text-[10px] tracking-[0.2em] text-slate-500 transition hover:border-white/10 hover:bg-white/[0.02] hover:text-slate-300"
            >
              ARCHIVE
            </Link>
          </nav>

          <div className="mt-auto hidden border-t border-white/10 p-5 lg:block">
            <div className="text-[8px] tracking-[0.2em] text-slate-700">
              SYSTEM
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[9px] tracking-[0.15em] text-slate-500">
                OPERATIONAL
              </span>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <section className="min-w-0 flex-1">
          {/* HEADER */}
          <header className="border-b border-white/10 bg-[#06090d] px-5 py-5 md:px-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="text-[9px] tracking-[0.3em] text-slate-600">
                  NETRA / DASHBOARD
                </div>

                <h1 className="mt-2 text-xl font-medium tracking-[0.12em] text-white">
                  IDENTITY INTELLIGENCE
                </h1>

                <p className="mt-2 max-w-2xl text-[10px] leading-5 tracking-[0.08em] text-slate-600">
                  SEARCH, GENERATE AND ANALYSE DETERMINISTIC IDENTITY RECORDS.
                </p>
              </div>

              <form
                onSubmit={searchIdentity}
                className="flex w-full max-w-xl gap-2"
              >
                <input
                  value={identityId}
                  onChange={(event) => setIdentityId(event.target.value)}
                  placeholder="ENTER NETRA ID"
                  spellCheck={false}
                  autoComplete="off"
                  className="min-w-0 flex-1 border border-white/10 bg-[#090d12] px-4 py-3 font-mono text-xs tracking-[0.1em] text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="border border-cyan-400/40 bg-cyan-400/5 px-5 py-3 text-[9px] tracking-[0.2em] text-cyan-400 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "SEARCHING" : "SEARCH"}
                </button>
              </form>
            </div>
          </header>

          {/* CONTENT */}
          <div className="p-5 md:p-8">
            {error && (
              <div className="mb-6 border border-red-400/20 bg-red-400/5 px-5 py-4 text-[10px] tracking-[0.15em] text-red-400">
                {error}
              </div>
            )}

            {!profile ? (
              <div className="flex min-h-[60vh] items-center justify-center">
                <div className="max-w-md text-center">
                  <div className="font-mono text-5xl tracking-[0.25em] text-slate-800">
                    N
                  </div>

                  <div className="mt-6 text-[10px] tracking-[0.3em] text-slate-600">
                    NO IDENTITY LOADED
                  </div>

                  <div className="mt-3 text-xs leading-6 tracking-[0.05em] text-slate-700">
                    ENTER A NETRA ID TO RETRIEVE OR DETERMINISTICALLY GENERATE
                    AN IDENTITY RECORD.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* IDENTITY HEADER */}
                <section className="border border-white/10 bg-[#080c11]/90">
                  <div className="border-b border-white/10 px-5 py-5 md:px-6">
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-[9px] tracking-[0.25em] text-slate-600">
                          IDENTITY RECORD
                        </div>

                        <div className="mt-2 break-all font-mono text-lg tracking-[0.12em] text-cyan-400">
                          {profile.netraId}
                        </div>

                        <div className="mt-2 font-mono text-[9px] tracking-[0.12em] text-slate-700">
                          SEED: {profile.seed}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 border border-emerald-400/20 bg-emerald-400/5 px-3 py-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[8px] tracking-[0.2em] text-emerald-400">
                          RECORD ACTIVE
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-px bg-white/10 md:grid-cols-3">
                    <div className="bg-[#080c11] p-5">
                      <div className="text-[8px] tracking-[0.2em] text-slate-600">
                        FULL NAME
                      </div>
                      <div className="mt-2 text-sm tracking-[0.08em] text-slate-200">
                        {displayValue(
                          person?.fullName ||
                            [person?.firstName, person?.middleName, person?.lastName]
                              .filter(Boolean)
                              .join(" ")
                        )}
                      </div>
                    </div>

                    <div className="bg-[#080c11] p-5">
                      <div className="text-[8px] tracking-[0.2em] text-slate-600">
                        DATE OF BIRTH
                      </div>
                      <div className="mt-2 text-sm tracking-[0.08em] text-slate-200">
                        {formatDate(person?.dateOfBirth)}
                      </div>
                    </div>

                    <div className="bg-[#080c11] p-5">
                      <div className="text-[8px] tracking-[0.2em] text-slate-600">
                        AGE
                      </div>
                      <div className="mt-2 font-mono text-sm text-slate-200">
                        {displayValue(person?.age)}
                      </div>
                    </div>
                  </div>
                </section>

                {/* PROFILE */}
                <section className="border border-white/10 bg-[#080c11]/90">
                  <div className="border-b border-white/10 px-5 py-4">
                    <div className="text-[9px] tracking-[0.25em] text-slate-600">
                      PERSONAL PROFILE
                    </div>
                    <div className="mt-1 text-xs tracking-[0.12em] text-slate-400">
                      PRIMARY IDENTITY ATTRIBUTES
                    </div>
                  </div>

                  <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ["GENDER", person?.gender],
                      ["BLOOD GROUP", person?.bloodGroup],
                      ["NATIONALITY", person?.nationality],
                      ["OCCUPATION", person?.occupation],
                      ["EDUCATION", person?.education],
                      ["HEIGHT", person?.heightCm ? `${person.heightCm} CM` : undefined],
                      ["WEIGHT", person?.weightKg ? `${person.weightKg} KG` : undefined],
                      ["PHONE", person?.phone],
                      ["EMAIL", person?.email],
                      ["FATHER", person?.fatherName],
                      ["MOTHER", person?.motherName],
                      ["SPOUSE", person?.spouseName],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="bg-[#080c11] p-5"
                      >
                        <div className="text-[8px] tracking-[0.2em] text-slate-600">
                          {label}
                        </div>

                        <div className="mt-2 break-words text-xs leading-5 tracking-[0.04em] text-slate-300">
                          {displayValue(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* GOVERNMENT IDENTIFIERS */}
                <section className="border border-white/10 bg-[#080c11]/90">
                  <div className="border-b border-white/10 px-5 py-4">
                    <div className="text-[9px] tracking-[0.25em] text-slate-600">
                      GOVERNMENT IDENTIFIERS
                    </div>

                    <div className="mt-1 text-xs tracking-[0.12em] text-slate-400">
                      REGISTERED IDENTITY REFERENCES
                    </div>
                  </div>

                  <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      ["AADHAAR", governmentIds?.aadhaar],
                      ["PAN", governmentIds?.pan],
                      ["VOTER ID", governmentIds?.voterId],
                      ["DRIVING LICENSE", governmentIds?.drivingLicense],
                      ["PASSPORT", governmentIds?.passport],
                      ["VEHICLE REGISTRATION", governmentIds?.vehicleRegistration],
                      ["UPI ID", governmentIds?.upiId],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="bg-[#080c11] p-5"
                      >
                        <div className="text-[8px] tracking-[0.2em] text-slate-600">
                          {label}
                        </div>

                        <div className="mt-2 break-all font-mono text-xs tracking-[0.08em] text-slate-300">
                          {displayValue(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* BANK + ADDRESS */}
                <div className="grid gap-6 xl:grid-cols-2">
                  <section className="border border-white/10 bg-[#080c11]/90">
                    <div className="border-b border-white/10 px-5 py-4">
                      <div className="text-[9px] tracking-[0.25em] text-slate-600">
                        FINANCIAL PROFILE
                      </div>
                      <div className="mt-1 text-xs tracking-[0.12em] text-slate-400">
                        BANKING IDENTIFIERS
                      </div>
                    </div>

                    <div className="divide-y divide-white/10">
                      <div className="flex items-center justify-between gap-5 px-5 py-4">
                        <span className="text-[8px] tracking-[0.2em] text-slate-600">
                          BANK
                        </span>
                        <span className="text-right text-xs text-slate-300">
                          {displayValue(bankName)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-5 px-5 py-4">
                        <span className="text-[8px] tracking-[0.2em] text-slate-600">
                          ACCOUNT
                        </span>
                        <span className="break-all text-right font-mono text-xs text-slate-300">
                          {displayValue(bankAccount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-5 px-5 py-4">
                        <span className="text-[8px] tracking-[0.2em] text-slate-600">
                          IFSC
                        </span>
                        <span className="font-mono text-xs text-slate-300">
                          {displayValue(bankIFSC)}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className="border border-white/10 bg-[#080c11]/90">
                    <div className="border-b border-white/10 px-5 py-4">
                      <div className="text-[9px] tracking-[0.25em] text-slate-600">
                        RESIDENTIAL PROFILE
                      </div>
                      <div className="mt-1 text-xs tracking-[0.12em] text-slate-400">
                        REGISTERED LOCATION
                      </div>
                    </div>

                    <div className="divide-y divide-white/10">
                      <div className="px-5 py-4">
                        <div className="text-[8px] tracking-[0.2em] text-slate-600">
                          ADDRESS
                        </div>
                        <div className="mt-2 text-xs leading-6 text-slate-300">
                          {displayValue(addressLine)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-px bg-white/10">
                        <div className="bg-[#080c11] p-5">
                          <div className="text-[8px] tracking-[0.2em] text-slate-600">
                            LOCALITY
                          </div>
                          <div className="mt-2 text-xs text-slate-300">
                            {displayValue(locality)}
                          </div>
                        </div>

                        <div className="bg-[#080c11] p-5">
                          <div className="text-[8px] tracking-[0.2em] text-slate-600">
                            PIN CODE
                          </div>
                          <div className="mt-2 font-mono text-xs text-slate-300">
                            {displayValue(pinCode)}
                          </div>
                        </div>

                        <div className="bg-[#080c11] p-5">
                          <div className="text-[8px] tracking-[0.2em] text-slate-600">
                            DISTRICT
                          </div>
                          <div className="mt-2 text-xs text-slate-300">
                            {displayValue(address?.district)}
                          </div>
                        </div>

                        <div className="bg-[#080c11] p-5">
                          <div className="text-[8px] tracking-[0.2em] text-slate-600">
                            STATE
                          </div>
                          <div className="mt-2 text-xs text-slate-300">
                            {displayValue(address?.state)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* RELATIONSHIP SUMMARY */}
                <section className="border border-white/10 bg-[#080c11]/90">
                  <div className="border-b border-white/10 px-5 py-4">
                    <div className="text-[9px] tracking-[0.25em] text-slate-600">
                      RELATIONSHIP INTELLIGENCE
                    </div>

                    <div className="mt-1 text-xs tracking-[0.12em] text-slate-400">
                      CONNECTED IDENTITY STRUCTURE
                    </div>
                  </div>

                  <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-[#080c11] p-5">
                      <div className="text-[8px] tracking-[0.2em] text-slate-600">
                        FATHER
                      </div>
                      <div className="mt-2 text-xs text-slate-300">
                        {displayValue(profile.family?.parents?.father?.firstName)}
                        {profile.family?.parents?.father?.lastName
                          ? ` ${profile.family.parents.father.lastName}`
                          : ""}
                      </div>
                    </div>

                    <div className="bg-[#080c11] p-5">
                      <div className="text-[8px] tracking-[0.2em] text-slate-600">
                        MOTHER
                      </div>
                      <div className="mt-2 text-xs text-slate-300">
                        {displayValue(profile.family?.parents?.mother?.firstName)}
                        {profile.family?.parents?.mother?.lastName
                          ? ` ${profile.family.parents.mother.lastName}`
                          : ""}
                      </div>
                    </div>

                    <div className="bg-[#080c11] p-5">
                      <div className="text-[8px] tracking-[0.2em] text-slate-600">
                        CHILDREN
                      </div>
                      <div className="mt-2 font-mono text-sm text-cyan-400">
                        {children.length}
                      </div>
                    </div>

                    <div className="bg-[#080c11] p-5">
                      <div className="text-[8px] tracking-[0.2em] text-slate-600">
                        SIBLINGS
                      </div>
                      <div className="mt-2 font-mono text-sm text-cyan-400">
                        {siblings.length}
                      </div>
                    </div>
                  </div>
                </section>

                {/* LIFE TIMELINE */}
                <section className="border border-white/10 bg-[#080c11]/90">
                  <div className="border-b border-white/10 px-5 py-4">
                    <div className="text-[9px] tracking-[0.25em] text-slate-600">
                      LIFE TIMELINE
                    </div>

                    <div className="mt-1 text-xs tracking-[0.12em] text-slate-400">
                      CHRONOLOGICAL IDENTITY EVENTS
                    </div>
                  </div>

                  <div className="divide-y divide-white/10">
                    {person?.lifeEvents?.length ? (
                      person.lifeEvents.map((event, index) => (
                        <div
                          key={`${event.year}-${event.event}-${index}`}
                          className="grid gap-4 px-5 py-5 md:grid-cols-[90px_180px_1fr] md:items-start"
                        >
                          <div className="font-mono text-sm tracking-[0.12em] text-cyan-400">
                            {event.year}
                          </div>

                          <div className="text-[9px] tracking-[0.2em] text-slate-500">
                            {formatEventName(event.event)}
                          </div>

                          <div className="text-xs leading-6 tracking-[0.04em] text-slate-300">
                            {event.detail || "NO EVENT DETAIL AVAILABLE"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-5 py-8 text-[10px] tracking-[0.15em] text-slate-600">
                        NO TIMELINE EVENTS AVAILABLE
                      </div>
                    )}
                  </div>
                </section>

                {/* METADATA */}
                <section className="border border-white/10 bg-[#080c11]/90">
                  <div className="border-b border-white/10 px-5 py-4">
                    <div className="text-[9px] tracking-[0.25em] text-slate-600">
                      RECORD METADATA
                    </div>

                    <div className="mt-1 text-xs tracking-[0.12em] text-slate-400">
                      SYSTEM-GENERATED RECORD INFORMATION
                    </div>
                  </div>

                  <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="bg-[#080c11] p-5">
                      <div className="text-[8px] tracking-[0.2em] text-slate-600">
                        GENERATED
                      </div>

                      <div className="mt-2 text-xs text-slate-300">
                        {formatDate(profile.metadata?.generatedAt)}
                      </div>
                    </div>

                    <div className="bg-[#080c11] p-5">
                      <div className="text-[8px] tracking-[0.2em] text-slate-600">
                        DETERMINISTIC
                      </div>

                      <div className="mt-2 font-mono text-xs text-emerald-400">
                        {profile.metadata?.deterministic ? "TRUE" : "FALSE"}
                      </div>
                    </div>

                    <div className="bg-[#080c11] p-5">
                      <div className="text-[8px] tracking-[0.2em] text-slate-600">
                        DATA CLASS
                      </div>

                      <div className="mt-2 text-xs leading-5 text-slate-300">
                        {displayValue(profile.metadata?.dataClass)}
                      </div>
                    </div>
                  </div>
                </section>

                {/* FOOTER */}
                <div className="flex flex-col gap-3 border-t border-white/10 pt-5 text-[8px] tracking-[0.15em] text-slate-700 md:flex-row md:items-center md:justify-between">
                  <span>NETRA INTELLIGENCE SYSTEM</span>
                  <span>DETERMINISTIC IDENTITY ENGINE</span>
                  <span>RECORD: {profile.netraId}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}