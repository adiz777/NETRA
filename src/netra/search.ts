import {
  generateIdentity,
  type NetraIdentity,
} from './identity.js';

export interface NetraSearchQuery {
  id?: string | number;
  name?: string;
  alias?: string;
  occupation?: string;
  location?: string;
}

export interface NetraSearchResult {
  found: boolean;
  generated: boolean;
  identity: NetraIdentity;
}

export function searchIdentity(
  query: NetraSearchQuery,
): NetraSearchResult {
  /*
   * NETRA currently uses deterministic identity generation.
   *
   * If an ID is supplied, the ID itself becomes the seed.
   * Therefore the same ID always resolves to the same identity.
   *
   * A persistent database can be connected later for saved
   * investigations, modifications and case records.
   */

  if (query.id !== undefined) {
    return {
      found: true,
      generated: true,
      identity: generateIdentity({
        id: query.id,
      }),
    };
  }

  const seed = [
    query.name,
    query.alias,
    query.occupation,
    query.location,
  ]
    .filter(Boolean)
    .join(':');

  if (!seed) {
    throw new Error(
      'NETRA search requires at least one search field.',
    );
  }

  return {
    found: true,
    generated: true,
    identity: generateIdentity({
      id: seed,
    }),
  };
}

export function getIdentityById(
  id: string | number,
): NetraIdentity {
  return generateIdentity({ id });
}
