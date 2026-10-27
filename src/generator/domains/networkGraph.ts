import type { PRNG } from "../prng/mulberry32.js";
import type { LocaleCatalog } from "../catalogs/types.js";
import type {
  MetaProfile,
  PersonalDemographics,
  AssetsProfile,
  NetworkGraphProfile
} from "../../shared/types/dossier.js";

export function generateNetworkGraphDomain(
  prng: PRNG,
  loc: LocaleCatalog,
  meta: MetaProfile,
  personal: PersonalDemographics,
  assets: AssetsProfile,
  threatScore: number
): NetworkGraphProfile {
  const subjectNodeId = meta.id;
  const associate1Id = `node_${prng.hex(8)}`;
  const associate2Id = `node_${prng.hex(8)}`;
  const entity3Id = `node_${prng.hex(8)}`;
  const birthYear = parseInt(personal.dateOfBirth.split("-")[0], 10);
  const lastName = personal.lastName;

  return {
    nodes: [
      {
        id: subjectNodeId,
        label: personal.legalFullName,
        category: "person",
        role: "Subject of Investigation",
        isSubject: true,
        riskScore: threatScore
      },
      {
        id: associate1Id,
        label: `${prng.pick(loc.maleFirst)} ${lastName}`,
        category: "person",
        role: "Associate / Kin",
        isSubject: false,
        riskScore: prng.nextInt(20, 60)
      },
      {
        id: associate2Id,
        label: `${prng.pick(loc.femaleFirst)} ${prng.pick(loc.lastNames)}`,
        category: "person",
        role: "Senior Co-Worker",
        isSubject: false,
        riskScore: prng.nextInt(15, 45)
      },
      {
        id: entity3Id,
        label: assets.corporateAffiliations[0].companyName,
        category: "shell_company",
        role: "Corporate Entity",
        isSubject: false,
        riskScore: threatScore > 70 ? 78 : 25
      }
    ],
    edges: [
      {
        id: `edge_${prng.hex(6)}`,
        source: subjectNodeId,
        target: associate1Id,
        type: "family",
        weight: 0.85,
        status: "active",
        firstObserved: `${birthYear + 18}-01-01`,
        notes: "Immediate familial relationship"
      },
      {
        id: `edge_${prng.hex(6)}`,
        source: subjectNodeId,
        target: associate2Id,
        type: "co_worker",
        weight: 0.65,
        status: "active",
        firstObserved: `${2026 - 3}-06-01`,
        notes: "Direct professional collaborator at current employer"
      },
      {
        id: `edge_${prng.hex(6)}`,
        source: subjectNodeId,
        target: entity3Id,
        type: "shell_entity_owner",
        weight: 0.95,
        status: "active",
        firstObserved: `${2026 - 4}-03-15`,
        notes: "Sole beneficial ownership and director registration"
      }
    ]
  };
}
