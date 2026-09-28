import { NextResponse } from "next/server";
import { getIdentityById } from "@/lib/netra";

function normalizeIdentity(identity: ReturnType<typeof getIdentityById>) {
  const profile = identity.profile;
  const ids = identity.governmentIds;

  return {
    ...identity,
    profile: {
      ...profile,

      // Frontend-facing canonical identity aliases.
      fullName: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
      nationality: "Indian",
      phone: profile.phoneNumber,
      email: profile.email,

      governmentIds: {
        aadhaar: ids.aadhaar,
        pan: ids.pan,
        voterId: ids.voterId,
        phone: ids.phone,
        email: ids.email,
        bankName: ids.bank.bankName,
        bankAccountNumber: ids.bank.bankAccountNumber,
        bankIFSC: ids.bank.bankIFSC,
        upiId: ids.upi,
        vehicleRegistration: ids.vehicleRegistration,
      },

      address: {
        addressLine: profile.addressLine,
        locality: profile.locality,
        pinCode: profile.pinCode,
        district: profile.district,
        state: profile.state,
      },

      // Keep the raw generated structures available for backend consumers.
      sourceGovernmentIds: ids,
    },
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        { error: "IDENTITY ID REQUIRED" },
        { status: 400 },
      );
    }

    const identity = getIdentityById(id);
    return NextResponse.json(normalizeIdentity(identity), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "IDENTITY GENERATION FAILED" },
      { status: 500 },
    );
  }
}
