import type { PRNG } from "../prng/mulberry32.js";
import type {
  ResolvedGeneratorOptions,
  PersonalDemographics,
  AddressesProfile,
  DigitalFootprintProfile
} from "../../shared/types/dossier.js";

export function generateDigitalFootprintDomain(
  prng: PRNG,
  options: ResolvedGeneratorOptions,
  personal: PersonalDemographics,
  addresses: AddressesProfile
): DigitalFootprintProfile {
  const firstName = personal.firstName.toLowerCase();
  const lastName = personal.lastName.toLowerCase();
  const currentCity = addresses.current.city;

  const preferredTimezone =
    options.nationality === "US"
      ? "America/New_York"
      : options.nationality === "GB"
      ? "Europe/London"
      : options.nationality === "DE"
      ? "Europe/Berlin"
      : options.nationality === "IN"
      ? "Asia/Kolkata"
      : options.nationality === "JP"
      ? "Asia/Tokyo"
      : "UTC";

  return {
    socialProfiles: [
      {
        platform: "github",
        handle: `${firstName}-${lastName}`,
        url: `https://github.com/${firstName}-${lastName}`,
        accountAgeYears: prng.nextInt(3, 10),
        followersCount: prng.nextInt(50, 800),
        bio: "Security Researcher | Distributed Systems & FFI"
      },
      {
        platform: "twitter_x",
        handle: `@${personal.aliases[1]}`,
        url: `https://x.com/${personal.aliases[1]}`,
        accountAgeYears: prng.nextInt(2, 8),
        followersCount: prng.nextInt(120, 3400),
        bio: "OSINT practitioner. Views my own."
      }
    ],
    digitalFingerprint: {
      primaryIpAddress: `198.51.100.${prng.nextInt(10, 250)}`,
      ipGeolocation: {
        city: currentCity,
        country: options.nationality,
        isp: `${currentCity} Telecom`,
        asn: `AS${prng.nextInt(10000, 65000)}`
      },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      preferredTimezone
    },
    knownBreaches: [
      {
        breachName: "ExploitIn Combolist",
        year: 2021,
        leakedDataTypes: ["email", "password_hash"]
      }
    ]
  };
}
