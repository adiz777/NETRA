import type { PRNG } from "../prng/mulberry32.js";
import type { LocaleCatalog } from "../catalogs/types.js";
import type { PersonalDemographics, CommunicationsProfile } from "../../shared/types/dossier.js";

export function generateCommunicationsDomain(
  prng: PRNG,
  loc: LocaleCatalog,
  personal: PersonalDemographics
): CommunicationsProfile {
  const cleanFirst =
    personal.firstName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '') || 'entity';
  const cleanLast =
    personal.lastName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '') || 'subject';

  return {
    phoneNumbers: [
      {
        type: "mobile",
        number: loc.phoneGen(prng),
        carrier: prng.pick(loc.carriers),
        imsi: `${prng.digits(15)}`,
        imei: `${prng.digits(15)}`,
        status: "active"
      }
    ],
    emailAddresses: [
      {
        type: "work",
        email: `${cleanFirst}.${cleanLast}@netra-intel.internal`,
        domain: "netra-intel.internal",
        primary: true,
        pgpKeyFingerprint: `${prng.hex(4)} ${prng.hex(4)} ${prng.hex(4)} ${prng.hex(4)} ${prng.hex(4)} ${prng.hex(4)} ${prng.hex(4)} ${prng.hex(4)}`.toUpperCase(),
        compromisedInBreach: prng.boolean(0.3)
      },
      {
        type: "personal",
        email: `${cleanFirst}${prng.digits(2)}@threat-mail.mock`,
        domain: "threat-mail.mock",
        primary: false,
        pgpKeyFingerprint: null,
        compromisedInBreach: prng.boolean(0.5)
      }
    ],
    secureMessaging: [
      {
        platform: "signal",
        handle: `@${personal.aliases[1]}`,
        registeredPhoneOrId: `usr_${prng.hex(8)}`,
        lastActive: "2026-10-26T21:15:00Z"
      }
    ]
  };
}
