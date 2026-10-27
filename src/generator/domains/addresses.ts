import type { PRNG } from "../prng/mulberry32.js";
import type { LocaleCatalog } from "../catalogs/types.js";
import type {
  ResolvedGeneratorOptions,
  PersonalDemographics,
  AddressesProfile
} from "../../shared/types/dossier.js";

export function generateAddressesDomain(
  prng: PRNG,
  loc: LocaleCatalog,
  options: ResolvedGeneratorOptions,
  personal: PersonalDemographics
): AddressesProfile {
  const currentCity = prng.pick(loc.cities);
  const residenceYear = 2026 - prng.nextInt(2, 6);
  const birthLoc = loc.cities.find((c) => c.city === personal.placeOfBirth.city) || loc.cities[0];
  const birthYear = parseInt(personal.dateOfBirth.split("-")[0], 10);

  return {
    current: {
      addressLine1: `${prng.nextInt(100, 9999)} ${prng.pick(loc.streets)}`,
      addressLine2: null,
      city: currentCity.city,
      stateProvince: currentCity.stateProvince,
      postalCode: currentCity.postalCode,
      country: options.nationality,
      coordinates: {
        latitude: +(currentCity.lat + (prng.next() - 0.5) * 0.05).toFixed(4),
        longitude: +(currentCity.lng + (prng.next() - 0.5) * 0.05).toFixed(4)
      },
      domicileType: prng.pick(["owned", "rented"]),
      residenceSince: `${residenceYear}-0${prng.nextInt(1, 9)}-15`,
      residenceUntil: null
    },
    previous: [
      {
        addressLine1: `${prng.nextInt(100, 9999)} ${prng.pick(loc.streets)}`,
        addressLine2: null,
        city: birthLoc.city,
        stateProvince: birthLoc.stateProvince,
        postalCode: birthLoc.postalCode,
        country: options.nationality,
        coordinates: {
          latitude: +(birthLoc.lat + (prng.next() - 0.5) * 0.05).toFixed(4),
          longitude: +(birthLoc.lng + (prng.next() - 0.5) * 0.05).toFixed(4)
        },
        domicileType: "rented",
        residenceSince: `${Math.min(birthYear + 18, residenceYear - 1)}-09-01`,
        residenceUntil: `${residenceYear}-08-31`
      }
    ]
  };
}
