import { deriveMasterSeed, getDomainPRNG } from "./prng/domain_isolation.js";
import { getLocaleCatalog } from "./catalogs/index.js";
import { REFERENCE_EPOCH } from "./constants.js";
import type { GeneratorOptions, ResolvedGeneratorOptions, IdentityDossier } from "../shared/types/dossier.js";
import { GeneratorOptionsSchema, IdentityDossierSchema } from "../shared/schemas/dossier.js";

import { generateMetaDomain } from "./domains/meta.js";
import { generatePersonalDomain } from "./domains/demographics.js";
import { generatePhysicalDomain } from "./domains/physical.js";
import { generateAddressesDomain } from "./domains/addresses.js";
import { generateCommunicationsDomain } from "./domains/communications.js";
import { generateGovernmentIdsDomain } from "./domains/governmentIds.js";
import { generateCareerEducationDomain } from "./domains/careerEducation.js";
import { generateFinancialDomain } from "./domains/financial.js";
import { generateDigitalFootprintDomain } from "./domains/digitalFootprint.js";
import { generateAssetsDomain } from "./domains/assets.js";
import { generateNetworkGraphDomain } from "./domains/networkGraph.js";
import { generateTimelineDomain } from "./domains/timeline.js";

/**
 * Deterministically generates a complete synthetic identity dossier.
 * Pure TypeScript, zero external runtime dependencies.
 */
export function generateIdentity(userOptions: Partial<GeneratorOptions> = {}): IdentityDossier {
  const parsed = GeneratorOptionsSchema.parse(userOptions ?? {});
  const seed = parsed.seed;
  const nationality = parsed.nationality as ResolvedGeneratorOptions["nationality"];
  const options: ResolvedGeneratorOptions = {
    seed,
    nationality,
    ageRange: parsed.ageRange,
    gender: parsed.gender,
    occupationCategory: parsed.occupationCategory as ResolvedGeneratorOptions["occupationCategory"],
    riskLevel: parsed.riskLevel,
    complexity: parsed.complexity
  };

  const masterSeed = deriveMasterSeed(seed, options);
  const loc = getLocaleCatalog(options.nationality);

  // 1. Meta Domain
  const prngMeta = getDomainPRNG(masterSeed, "meta");
  const meta = generateMetaDomain(prngMeta, seed, options, REFERENCE_EPOCH);

  // 2. Personal / Demographics Domain
  const prngPers = getDomainPRNG(masterSeed, "personal");
  const personal = generatePersonalDomain(prngPers, loc, options);

  // 3. Physical Characteristics Domain
  const prngPhys = getDomainPRNG(masterSeed, "physical");
  const physical = generatePhysicalDomain(prngPhys, personal.sex);

  // 4. Addresses Domain
  const prngAddr = getDomainPRNG(masterSeed, "addresses");
  const addresses = generateAddressesDomain(prngAddr, loc, options, personal);

  // 5. Communications Domain
  const prngComm = getDomainPRNG(masterSeed, "communications");
  const communications = generateCommunicationsDomain(prngComm, loc, personal);

  // 6. Government IDs Domain
  const prngGov = getDomainPRNG(masterSeed, "governmentIds");
  const governmentIds = generateGovernmentIdsDomain(prngGov, loc, options, personal, addresses);

  // 7. Career & Education Domain
  const prngCar = getDomainPRNG(masterSeed, "careerAndEducation");
  const careerAndEducation = generateCareerEducationDomain(prngCar, loc, personal, meta.threatScore);

  // 8. Financial Profile Domain
  const prngFin = getDomainPRNG(masterSeed, "financial");
  const financial = generateFinancialDomain(prngFin, loc, addresses, careerAndEducation, meta.threatScore);

  // 9. Digital Footprint Domain
  const prngDig = getDomainPRNG(masterSeed, "digitalFootprint");
  const digitalFootprint = generateDigitalFootprintDomain(prngDig, options, personal, addresses);

  // 10. Assets Domain
  const prngAss = getDomainPRNG(masterSeed, "assets");
  const assets = generateAssetsDomain(prngAss, options, personal, addresses, meta.threatScore);

  // 11. Network Graph Domain
  const prngNet = getDomainPRNG(masterSeed, "networkGraph");
  const networkGraph = generateNetworkGraphDomain(prngNet, loc, meta, personal, assets, meta.threatScore);

  // 12. Chronological Timeline Domain
  const prngTime = getDomainPRNG(masterSeed, "timeline");
  const timeline = generateTimelineDomain(
    prngTime,
    options,
    personal,
    addresses,
    careerAndEducation,
    governmentIds,
    meta.threatScore
  );

  const dossier: IdentityDossier = {
    meta,
    personal,
    physical,
    addresses,
    communications,
    governmentIds,
    careerAndEducation,
    financial,
    digitalFootprint,
    assets,
    networkGraph,
    timeline
  };

  return IdentityDossierSchema.parse(dossier);
}

/**
 * Asserts reproducibility by generating multiple dossiers for the same seed and asserting deep equality.
 */
export function verifyDeterminism(seed: string | number, runs = 100): boolean {
  const baseline = JSON.stringify(generateIdentity({ seed: String(seed) }));
  for (let i = 0; i < runs; i++) {
    const nextRun = JSON.stringify(generateIdentity({ seed: String(seed) }));
    if (baseline !== nextRun) return false;
  }
  return true;
}
