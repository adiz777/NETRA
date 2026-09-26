import type { NetraCase } from './case.js';
import type { NetraIdentity } from './identity.js';
import { createDossier } from './dossier.js';
import { createNetwork } from './network.js';
import { createTimeline } from './timeline.js';

export interface NetraInvestigation {
  case: NetraCase;
  subjects: NetraIdentity[];
  dossiers: ReturnType<typeof createDossier>[];
  timelines: ReturnType<typeof createTimeline>[];
  networks: ReturnType<typeof createNetwork>[];
}

export function createInvestigation(
  netraCase: NetraCase,
  subjects: NetraIdentity[],
): NetraInvestigation {
  return {
    case: netraCase,
    subjects,
    dossiers: subjects.map(createDossier),
    timelines: subjects.map(createTimeline),
    networks: subjects.map(createNetwork),
  };
}

export function addInvestigationSubject(
  investigation: NetraInvestigation,
  identity: NetraIdentity,
): NetraInvestigation {
  if (
    investigation.subjects.some(
      (subject) => subject.netraId === identity.netraId,
    )
  ) {
    return investigation;
  }

  const subjects = [
    ...investigation.subjects,
    identity,
  ];

  return createInvestigation(
    investigation.case,
    subjects,
  );
}
