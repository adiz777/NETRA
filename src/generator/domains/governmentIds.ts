import type { PRNG } from "../prng/mulberry32.js";
import type { LocaleCatalog } from "../catalogs/types.js";
import type {
  ResolvedGeneratorOptions,
  PersonalDemographics,
  AddressesProfile,
  GovernmentIdsProfile
} from "../../shared/types/dossier.js";

export function generateGovernmentIdsDomain(
  prng: PRNG,
  loc: LocaleCatalog,
  options: ResolvedGeneratorOptions,
  personal: PersonalDemographics,
  addresses: AddressesProfile
): GovernmentIdsProfile {
  const passportIssueYear = 2026 - prng.nextInt(2, 8);
  const [, birthMonth, birthDay] = personal.dateOfBirth.split("-");
  const stateProvince = addresses.current.stateProvince;

  return {
    nationalId: loc.nationalIdGen(prng),
    passports: [
      {
        passportNumber: loc.passportGen(prng),
        issuingCountry: options.nationality,
        issueDate: `${passportIssueYear}-04-12`,
        expiryDate: `${passportIssueYear + 10}-04-11`,
        status: "valid",
        visas: [
          { country: "CH", type: "Business / Schengen", validUntil: `${passportIssueYear + 3}-12-31` }
        ]
      }
    ],
    driversLicense: {
      licenseNumber: loc.licenseGen(prng, stateProvince),
      issuingState: stateProvince,
      issuingCountry: options.nationality,
      class: "Standard",
      expiryDate: `${2026 + prng.nextInt(2, 6)}-${birthMonth}-${birthDay}`,
      endorsements: prng.boolean(0.3) ? ["Motorcycle"] : []
    },
    taxIdentifier: loc.taxIdGen(prng)
  };
}
