import { createRNG, normalizeSeed } from '../core/sampler.js';
import { generate } from '../utils/generator.js';
import { generateFamily, type FamilyUnit } from '../utils/relations.js';
import type {
  DemographicProfile,
  GenerationConstraints,
} from '../types.js';
import {
  generateGovernmentIds,
  type NetraGovernmentIds,
} from './governmentIds.js';

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

function extractIdentityDetails(
  profile: DemographicProfile,
): {
  firstName: string;
  lastName: string;
  stateId: string;
  district: string;
} {
  const data =
    profile as unknown as Record<string, unknown>;

  const firstName =
    typeof data.firstName === 'string'
      ? data.firstName
      : 'Amit';

  const lastName =
    typeof data.lastName === 'string'
      ? data.lastName
      : 'Sharma';

  const stateId =
    typeof data.stateId === 'string'
      ? data.stateId
      : typeof data.state === 'string'
        ? data.state
        : 'GJ';

  const district =
    typeof data.district === 'string'
      ? data.district
      : typeof data.city === 'string'
        ? data.city
        : 'Ahmedabad';

  return {
    firstName,
    lastName,
    stateId,
    district,
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

  const details =
    extractIdentityDetails(profile);

  const governmentIds =
    generateGovernmentIds(
      seed,
      details.firstName,
      details.lastName,
      details.stateId,
      details.district,
    );

  return {
    netraId: createNetraId(seed),
    seed,
    profile,
    governmentIds,
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