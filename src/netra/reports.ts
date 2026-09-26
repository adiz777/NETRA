import type { NetraIdentity } from './identity.js';
import { createDossier } from './dossier.js';
import { createNetwork } from './network.js';
import { createTimeline } from './timeline.js';
import { createExposure } from './exposure.js';

export interface NetraReport {
  reportId: string;
  generatedAt: string;
  classification: 'FICTIONAL';
  subject: string;
  dossier: ReturnType<typeof createDossier>;
  timeline: ReturnType<typeof createTimeline>;
  network: ReturnType<typeof createNetwork>;
  exposure: ReturnType<typeof createExposure>;
}

export function createReport(
  identity: NetraIdentity,
): NetraReport {
  return {
    reportId: `RPT-${identity.netraId.replace(
      'NETRA-',
      '',
    )}`,
    generatedAt: new Date().toISOString(),
    classification: 'FICTIONAL',
    subject: identity.netraId,
    dossier: createDossier(identity),
    timeline: createTimeline(identity),
    network: createNetwork(identity),
    exposure: createExposure(identity),
  };
}

export function exportReportJSON(
  report: NetraReport,
): string {
  return JSON.stringify(report, null, 2);
}
