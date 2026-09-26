import type { NetraIdentity } from './identity.js';

export type NetraNodeType =
  | 'PERSON'
  | 'ORGANIZATION'
  | 'LOCATION'
  | 'EDUCATION'
  | 'EMPLOYMENT';

export type NetraRelationshipType =
  | 'FAMILY'
  | 'FRIEND'
  | 'COLLEAGUE'
  | 'LOCATED_AT'
  | 'EDUCATED_AT'
  | 'EMPLOYED_BY';

export interface NetraNetworkNode {
  id: string;
  type: NetraNodeType;
  label: string;
  metadata?: Record<string, unknown>;
}

export interface NetraNetworkEdge {
  id: string;
  source: string;
  target: string;
  relationship: NetraRelationshipType;
}

export interface NetraNetwork {
  netraId: string;
  nodes: NetraNetworkNode[];
  edges: NetraNetworkEdge[];
}

function readString(
  value: unknown,
  fallback = 'UNKNOWN',
): string {
  return typeof value === 'string' && value.length > 0
    ? value
    : fallback;
}

export function createNetwork(
  identity: NetraIdentity,
): NetraNetwork {
  const profile =
    identity.profile as unknown as Record<string, unknown>;

  const nodes: NetraNetworkNode[] = [
    {
      id: identity.netraId,
      type: 'PERSON',
      label: readString(
        profile.firstName,
        'Subject',
      ),
      metadata: {
        netraId: identity.netraId,
      },
    },
  ];

  const edges: NetraNetworkEdge[] = [];

  const location = readString(
    profile.city ??
      profile.district ??
      profile.state,
  );

  const locationId = `${identity.netraId}-LOCATION`;

  nodes.push({
    id: locationId,
    type: 'LOCATION',
    label: location,
  });

  edges.push({
    id: `${identity.netraId}-LOCATED`,
    source: identity.netraId,
    target: locationId,
    relationship: 'LOCATED_AT',
  });

  const occupation = readString(
    profile.occupation,
  );

  if (occupation !== 'UNKNOWN') {
    const employmentId =
      `${identity.netraId}-EMPLOYMENT`;

    nodes.push({
      id: employmentId,
      type: 'EMPLOYMENT',
      label: occupation,
    });

    edges.push({
      id: `${identity.netraId}-EMPLOYED`,
      source: identity.netraId,
      target: employmentId,
      relationship: 'EMPLOYED_BY',
    });
  }

  return {
    netraId: identity.netraId,
    nodes,
    edges,
  };
}
