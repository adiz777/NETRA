import type { PRNG } from "../prng/mulberry32.js";
import type {
  ResolvedGeneratorOptions,
  PersonalDemographics,
  AddressesProfile,
  CareerEducationProfile,
  GovernmentIdsProfile,
  TimelineProfile,
  TimelineEvent
} from "../../shared/types/dossier.js";

export function generateTimelineDomain(
  prng: PRNG,
  options: ResolvedGeneratorOptions,
  personal: PersonalDemographics,
  addresses: AddressesProfile,
  career: CareerEducationProfile,
  governmentIds: GovernmentIdsProfile,
  threatScore: number
): TimelineProfile {
  const birthLoc = personal.placeOfBirth;
  const dateOfBirth = personal.dateOfBirth;
  const birthYear = parseInt(dateOfBirth.split("-")[0], 10);
  const currentCity = addresses.current;

  const events: TimelineEvent[] = [
    {
      id: `evt_01_${prng.hex(6)}`,
      timestamp: `${dateOfBirth}T08:30:00.000Z`,
      category: "birth",
      title: "Birth of Subject",
      description: `Subject born in ${birthLoc.city}, ${birthLoc.stateProvince}, ${options.nationality}`,
      severity: "routine",
      location: `${birthLoc.city}, ${options.nationality}`,
      tags: ["vital_records", "civil_registry"]
    },
    {
      id: `evt_02_${prng.hex(6)}`,
      timestamp: `${birthYear + 18}-06-15T14:00:00.000Z`,
      category: "education",
      title: "Secondary Education Completed",
      description: `Graduated from secondary school in ${birthLoc.city}`,
      severity: "routine",
      location: `${birthLoc.city}, ${options.nationality}`,
      tags: ["education", "diploma"]
    },
    {
      id: `evt_03_${prng.hex(6)}`,
      timestamp: `${Math.min(2026, birthYear + 22)}-06-20T10:00:00.000Z`,
      category: "education",
      title: "Bachelor's Degree Conferred",
      description: `${career.education[0].degree} in ${career.education[0].fieldOfStudy} from ${career.education[0].institution}`,
      severity: "routine",
      location: `${birthLoc.city}, ${options.nationality}`,
      tags: ["education", "degree"]
    },
    {
      id: `evt_04_${prng.hex(6)}`,
      timestamp: `${career.employmentHistory[0].startDate}T09:00:00.000Z`,
      category: "career",
      title: "First Professional Appointment",
      description: `Appointed as ${career.employmentHistory[0].jobTitle} at ${career.employmentHistory[0].employer}`,
      severity: "routine",
      location: `${currentCity.city}, ${options.nationality}`,
      tags: ["employment", "career_start"]
    },
    {
      id: `evt_05_${prng.hex(6)}`,
      timestamp: `${governmentIds.passports[0].issueDate}T11:00:00.000Z`,
      category: "travel",
      title: "Biometric Passport Issued",
      description: `National passport ${governmentIds.passports[0].passportNumber} issued by government authorities`,
      severity: "routine",
      location: options.nationality,
      tags: ["passport", "travel_docs"]
    },
    {
      id: `evt_06_${prng.hex(6)}`,
      timestamp: `${addresses.current.residenceSince}T12:00:00.000Z`,
      category: "residence",
      title: "Relocation to Current Residence",
      description: `Established residence at ${addresses.current.addressLine1}, ${currentCity.city}`,
      severity: "routine",
      location: `${currentCity.city}, ${options.nationality}`,
      tags: ["address", "residency"]
    },
    {
      id: `evt_07_${prng.hex(6)}`,
      timestamp: "2026-08-14T19:42:00.000Z",
      category: threatScore > 70 ? "intelligence_flag" : "financial",
      title: threatScore > 70 ? "Flagged Financial Transaction" : "Asset Acquisition",
      description:
        threatScore > 70
          ? "Suspicious cross-border transaction registered on monitored node"
          : "Standard property tax and corporate filing registered",
      severity: threatScore > 70 ? "critical" : "notable",
      location: `${currentCity.city}, ${options.nationality}`,
      tags: ["audit", "intelligence"]
    }
  ];

  const maxEpochMs = new Date("2026-10-27T00:00:00.000Z").getTime();
  const validEvents = events.filter((e) => new Date(e.timestamp).getTime() <= maxEpochMs);
  validEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return { events: validEvents.length > 0 ? validEvents : [events[0]] };
}
