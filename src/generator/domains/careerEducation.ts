import type { PRNG } from "../prng/mulberry32.js";
import type { LocaleCatalog } from "../catalogs/types.js";
import type {
  PersonalDemographics,
  CareerEducationProfile
} from "../../shared/types/dossier.js";

export function generateCareerEducationDomain(
  prng: PRNG,
  loc: LocaleCatalog,
  personal: PersonalDemographics,
  threatScore: number
): CareerEducationProfile {
  const currentEmployer = prng.pick(loc.employers);
  const birthYear = parseInt(personal.dateOfBirth.split("-")[0], 10);
  const birthCity = personal.placeOfBirth.city;

  return {
    current: {
      employer: currentEmployer,
      jobTitle: prng.pick([
        "Lead Threat Intelligence Engineer",
        "Principal Security Architect",
        "OSINT Research Specialist",
        "Cryptographic Systems Auditor"
      ]),
      department: "Cyber Defense Operations",
      industry: "Defense Contracting",
      annualSalaryUsd: prng.nextInt(110000, 240000),
      clearanceLevel:
        threatScore > 80
          ? "top_secret_sci"
          : threatScore > 60
          ? "secret"
          : "confidential",
      startDate: `${2026 - 3}-06-01`
    },
    employmentHistory: [
      {
        employer: prng.pick(loc.employers),
        jobTitle: "Senior Security Analyst",
        startDate: `${Math.min(birthYear + 23, 2022)}-07-01`,
        endDate: `${2026 - 3}-05-30`,
        reasonForLeaving: "Career advancement"
      }
    ],
    education: [
      {
        institution: `${birthCity} Technical University`,
        degree: "Bachelor of Science",
        fieldOfStudy: "Computer Science & Cryptography",
        graduationYear: Math.max(1950, Math.min(2026, birthYear + 22))
      }
    ],
    certifications: [
      {
        name: "CISSP",
        issuingBody: "(ISC)²",
        issueYear: Math.max(1970, Math.min(2026, birthYear + 25)),
        credentialId: `CERT-${prng.digits(6)}`
      }
    ]
  };
}
