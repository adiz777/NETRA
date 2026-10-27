import type { PRNG } from "../prng/mulberry32.js";
import type {
  ResolvedGeneratorOptions,
  PersonalDemographics,
  AddressesProfile,
  AssetsProfile
} from "../../shared/types/dossier.js";

export function generateAssetsDomain(
  prng: PRNG,
  options: ResolvedGeneratorOptions,
  personal: PersonalDemographics,
  addresses: AddressesProfile,
  threatScore: number
): AssetsProfile {
  const currentCity = addresses.current;
  const lastName = personal.lastName;

  return {
    vehicles: [
      {
        make: prng.pick(["Honda", "Toyota", "BMW", "Audi", "Volvo"]),
        model: prng.pick(["Accord", "Camry", "330i", "A4", "XC60"]),
        year: 2026 - prng.nextInt(1, 7),
        color: prng.pick(["Graphite Gray", "Midnight Blue", "Pearl White", "Obsidian Black"]),
        vin: `1HG${prng.hex(14).toUpperCase()}`,
        licensePlate: `${prng.hex(3).toUpperCase()}-${prng.digits(4)}`,
        registrationStateCountry: `${currentCity.stateProvince}-${options.nationality}`,
        status: "registered"
      }
    ],
    realEstate: [
      {
        propertyType: addresses.current.domicileType === "owned" ? "residential" : "commercial",
        address: `${addresses.current.addressLine1}, ${currentCity.city}, ${currentCity.stateProvince}`,
        estimatedValueUsd: prng.nextInt(380000, 950000),
        ownershipType: addresses.current.domicileType === "owned" ? "sole_owner" : "llc_trust"
      }
    ],
    corporateAffiliations: [
      {
        companyName: `${lastName} Intelligence Advisory LLC`,
        registrationNumber: `LLC-${prng.digits(7)}`,
        jurisdiction: currentCity.stateProvince,
        role: "director",
        isShellCompanyCandidate: threatScore > 70
      }
    ]
  };
}
