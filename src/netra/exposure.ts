import type { NetraIdentity } from './identity.js';

export interface NetraExposure {
  netraId: string;
  digitalFootprint: {
    usernames: string[];
    email: string;
    phone: string;
    platforms: string[];
  };
  exposure: {
    publicIdentifiers: string[];
    locationExposure: string;
    contactExposure: string;
  };
  assessment: {
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    confidence: number;
  };
}

export function createExposure(
  identity: NetraIdentity,
): NetraExposure {
  const profile =
    identity.profile as unknown as Record<string, unknown>;

  const firstName =
    typeof profile.firstName === 'string'
      ? profile.firstName.toLowerCase()
      : 'user';

  const lastName =
    typeof profile.lastName === 'string'
      ? profile.lastName.toLowerCase()
      : 'netra';

  const usernameBase = `${firstName}.${lastName}`;

  return {
    netraId: identity.netraId,

    digitalFootprint: {
      usernames: [
        usernameBase,
        `${firstName}${lastName}`,
        `${firstName}_${lastName}`,
      ],
      email: identity.governmentIds.email,
      phone: identity.governmentIds.phone,
      platforms: [
        'Email',
        'Messaging',
        'Social',
        'Professional',
      ],
    },

    exposure: {
      publicIdentifiers: [
        identity.governmentIds.pan,
        identity.governmentIds.voterId,
        identity.governmentIds.vehicleRegistration,
      ],
      locationExposure:
        identity.governmentIds.address.addressLine,
      contactExposure:
        identity.governmentIds.phone,
    },

    assessment: {
      level: 'MEDIUM',
      confidence: 0.85,
    },
  };
}
