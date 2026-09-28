import { createRNG, normalizeSeed } from '../core/sampler.js';
import { generate } from '../utils/generator.js';
import { generateFamily, type FamilyUnit } from '../utils/relations.js';
import type {
  DemographicProfile,
  GenerationConstraints,
} from '../types.js';
import type { NetraGovernmentIds } from './governmentIds.js';

export interface NetraIdentity {
  netraId: string;
  seed: string;

  profile: DemographicProfile;
  governmentIds: NetraGovernmentIds;
  family: FamilyUnit;

  metadata: {
    generatedAt: string;
    deterministic: true;
    dataClass: 'NATIONAL INFORMATICS CENTER(NIC)';
  };
}

function createNetraId(seed: string): string {
  const normalized = normalizeSeed(seed);
  const rng = createRNG(normalized);

  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let value = '';

  for (let i = 0; i < 8; i++) {
    value += alphabet[Math.floor(rng.next() * alphabet.length)];
  }

  return `NETRA-${value}`;
}

function buildGovernmentIds(profile: DemographicProfile): NetraGovernmentIds {
  return {
    aadhaar: profile.aadhaarNumber,
    pan: profile.panNumber,
    voterId: profile.voterIdNumber,
    drivingLicense: profile.drivingLicenseNumber,
    passport: profile.passportNumber,
    phone: profile.phoneNumber,
    email: profile.email,

    bank: {
      bankName: profile.bankName,
      bankIFSC: profile.bankIFSC,
      bankAccountNumber: profile.bankAccountNumber,
    },

    upi: profile.upiId ?? '',
    vehicleRegistration: profile.vehicleRegistration ?? '',

    address: {
      addressLine: profile.addressLine,
      locality: profile.locality,
    },
  };
}

export interface NetraIdentityOptions {
  id?: string | number;
  constraints?: GenerationConstraints;
}

export function generateIdentity(
  options: NetraIdentityOptions = {},
): NetraIdentity {
  const seed = String(
    options.id ?? Date.now(),
  );

  const profile = generate({
    seed,
    constraints: options.constraints,
    includeProbabilityMetrics: true,
  })[0];

  const family = generateFamily({
    seed,
    constraints: options.constraints,
    includeProbabilityMetrics: true,
  });

  return {
    netraId: createNetraId(seed),
    seed,
    profile,
    governmentIds: buildGovernmentIds(profile),
    family,

    metadata: {
      generatedAt: new Date().toISOString(),
      deterministic: true,
      dataClass:
        'NATIONAL INFORMATICS CENTER(NIC)',
    },
  };
}

export function getIdentity(
  id: string | number,
): NetraIdentity {
  return generateIdentity({ id });
}
