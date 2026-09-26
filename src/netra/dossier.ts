import type { NetraIdentity } from './identity.js';

export interface NetraDossier {
  dossierId: string;
  netraId: string;
  subject: {
    name: string;
    dateOfBirth: string;
    gender: string;
    nationality: string;
  };
  identifiers: NetraIdentity['governmentIds'];
  family: NetraIdentity['family'];
  profile: NetraIdentity['profile'];
  intelligence: {
    aliases: string[];
    occupation: string;
    location: string;
    education: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    confidence: number;
  };
  metadata: {
    generatedAt: string;
    dataClass: 'NATIONAL INFORMATICS CENTER(NIC)';
  };
}

function readString(
  value: unknown,
  fallback = 'UNKNOWN',
): string {
  return typeof value === 'string' && value.length > 0
    ? value
    : fallback;
}

export function createDossier(identity: NetraIdentity): NetraDossier {
  const profile = identity.profile as unknown as Record<string, unknown>;

  const name = [
    readString(profile.firstName, ''),
    readString(profile.lastName, ''),
  ]
    .filter(Boolean)
    .join(' ') || 'UNKNOWN';

  const occupation =
    readString(profile.occupation, 'UNKNOWN');

  const location =
    readString(
      profile.city ??
        profile.district ??
        profile.state,
      'UNKNOWN',
    );

  const education =
    readString(
      profile.education ??
        profile.degree ??
        profile.university,
      'UNKNOWN',
    );

  return {
    dossierId: `DOSSIER-${identity.netraId.replace('NETRA-', '')}`,
    netraId: identity.netraId,

    subject: {
      name,
      dateOfBirth: readString(
        profile.dateOfBirth ??
          profile.dob,
      ),
      gender: readString(profile.gender),
      nationality: readString(
        profile.nationality,
        'Indian',
      ),
    },

    identifiers: identity.governmentIds,
    family: identity.family,
    profile: identity.profile,

    intelligence: {
      aliases: [],
      occupation,
      location,
      education,
      riskLevel: 'LOW',
      confidence: 0.95,
    },

    metadata: {
      generatedAt: identity.metadata.generatedAt,
      dataClass: 'NATIONAL INFORMATICS CENTER(NIC)',
    },
  };
}