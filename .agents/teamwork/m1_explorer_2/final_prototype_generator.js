// Production-aligned prototype generator satisfying 100% of m1_explorer_3 Zod schema

const REFERENCE_EPOCH = "2026-10-27T00:00:00.000Z";
const REFERENCE_TIMESTAMP_MS = 1793059200000;

function murmurhash3_32(key, seed = 0) {
  const bytes = typeof key === 'string' ? new TextEncoder().encode(key) : key;
  let h1 = seed >>> 0;
  const remainder = bytes.length & 3;
  const len = bytes.length - remainder;
  for (let i = 0; i < len; i += 4) {
    let k1 = (bytes[i]) | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24);
    k1 = Math.imul(k1, 0xcc9e2d51);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, 0x1b873593);
    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = (Math.imul(h1, 5) + 0xe6546b64) | 0;
  }
  let k1 = 0;
  switch (remainder) {
    case 3: k1 ^= bytes[len + 2] << 16;
    case 2: k1 ^= bytes[len + 1] << 8;
    case 1:
      k1 ^= bytes[len];
      k1 = Math.imul(k1, 0xcc9e2d51);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, 0x1b873593);
      h1 ^= k1;
  }
  h1 ^= bytes.length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;
  return h1 >>> 0;
}

function createMulberry32(seed) {
  let s = seed | 0;
  function next() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function nextInt(min, max) {
    return Math.floor(next() * (max - min + 1)) + min;
  }
  function pick(items) {
    return items[Math.floor(next() * items.length)];
  }
  function pickWeighted(items) {
    let total = 0;
    for (const item of items) total += item.weight;
    let r = next() * total;
    for (const item of items) {
      if (r < item.weight) return item.item;
      r -= item.weight;
    }
    return items[items.length - 1].item;
  }
  function sample(items, count) {
    const copy = [...items];
    const res = [];
    const n = Math.min(count, copy.length);
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(next() * copy.length);
      res.push(copy.splice(idx, 1)[0]);
    }
    return res;
  }
  function boolean(chance = 0.5) {
    return next() < chance;
  }
  function hex(chars = 8) {
    let out = '';
    for (let i = 0; i < chars; i++) {
      out += Math.floor(next() * 16).toString(16);
    }
    return out;
  }
  function digits(count = 4) {
    let out = '';
    for (let i = 0; i < count; i++) {
      out += Math.floor(next() * 10).toString();
    }
    return out;
  }
  return { next, nextInt, pick, pickWeighted, sample, boolean, hex, digits };
}

function canonicalizeOptions(seed, options = {}) {
  const normalized = {
    seed: String(seed),
    nationality: (options.nationality ?? "US").toUpperCase(),
    ageRange: options.ageRange ?? [25, 60],
    gender: options.gender ?? "auto",
    occupationCategory: options.occupationCategory ?? "auto",
    riskLevel: options.riskLevel ?? "medium",
    complexity: options.complexity ?? "standard"
  };
  return JSON.stringify(normalized, Object.keys(normalized).sort());
}

function deriveMasterSeed(seed, options) {
  return murmurhash3_32(canonicalizeOptions(seed, options), 0);
}

function getDomainPRNG(masterSeed, domain) {
  const dSeed = murmurhash3_32(`domain:${domain}::${masterSeed}`, 0);
  return createMulberry32(dSeed);
}

// Locale sample for US, GB, DE, IN, JP, CA, EE
const LOCALES = {
  US: {
    maleFirst: ["James", "Marcus", "Alexander", "David", "Robert", "Michael"],
    femaleFirst: ["Sarah", "Emily", "Jessica", "Elena", "Rachel", "Morgan"],
    lastNames: ["Vance", "Miller", "Sterling", "Mercer", "Callahan", "Hayes", "Reynolds"],
    cities: [
      { city: "Arlington", stateProvince: "VA", postalCode: "22201", lat: 38.8816, lng: -77.0910 },
      { city: "Reston", stateProvince: "VA", postalCode: "20190", lat: 38.9586, lng: -77.3570 },
      { city: "Bethesda", stateProvince: "MD", postalCode: "20814", lat: 38.9847, lng: -77.1200 },
      { city: "Austin", stateProvince: "TX", postalCode: "78701", lat: 30.2672, lng: -97.7431 }
    ],
    streets: ["Elmwood Terrace", "Constitution Ave", "Oak Ridge Road", "K Street NW", "Technology Pkwy"],
    phoneCode: "+1",
    currency: "USD",
    phoneGen: (prng) => `+1-${prng.pick(["202", "703", "571", "512"])}-555-0${prng.digits(3)}`,
    nationalIdGen: (prng) => ({ type: "SSN", number: `9${prng.digits(2)}-${prng.digits(2)}-${prng.digits(4)}`, issuingCountry: "US" }),
    passportGen: (prng) => `P${prng.digits(8)}`,
    licenseGen: (prng, state) => `${state}-${prng.pick(["V", "T", "D", "K"])}${prng.digits(3)}-${prng.digits(3)}-${prng.digits(3)}`,
    taxIdGen: (prng) => ({ tin: `${prng.digits(2)}-${prng.digits(7)}`, jurisdiction: "US-IRS" }),
    employers: ["Apex Defense Dynamics", "Sentrix Security", "Blackwood Intelligence", "Vanguard Quant Labs"],
    carriers: ["Verizon Wireless", "AT&T Mobility", "T-Mobile US"]
  },
  GB: {
    maleFirst: ["Oliver", "Arthur", "Alistair", "Julian", "Charles", "Nigel"],
    femaleFirst: ["Eleanor", "Charlotte", "Fiona", "Gemma", "Victoria", "Beatrice"],
    lastNames: ["Sterling", "Finch", "Montgomery", "Pemberton", "Sinclair", "Davies"],
    cities: [
      { city: "London", stateProvince: "Greater London", postalCode: "SW1A 1AA", lat: 51.5014, lng: -0.1419 },
      { city: "Cheltenham", stateProvince: "Gloucestershire", postalCode: "GL51 0EX", lat: 51.8994, lng: -2.0783 },
      { city: "Manchester", stateProvince: "Greater Manchester", postalCode: "M1 1AD", lat: 53.4808, lng: -2.2426 }
    ],
    streets: ["Victoria Embankment", "Queen Anne's Gate", "Oxford Road", "High Street"],
    phoneCode: "+44",
    currency: "GBP",
    phoneGen: (prng) => `+44-20-7946-0${prng.digits(3)}`,
    nationalIdGen: (prng) => ({ type: "National Insurance", number: `QQ ${prng.digits(2)} ${prng.digits(2)} ${prng.digits(2)} A`, issuingCountry: "GB" }),
    passportGen: (prng) => `${prng.digits(9)}`,
    licenseGen: (prng) => `STERL${prng.digits(6)}99AB`,
    taxIdGen: (prng) => ({ tin: `${prng.digits(10)}`, jurisdiction: "UK-HMRC" }),
    employers: ["Thorne Aerospace", "Cheltenham Cyber Labs", "Albion Strategic Partners"],
    carriers: ["EE", "Vodafone UK", "O2 UK"]
  },
  DE: {
    maleFirst: ["Maximilian", "Lukas", "Felix", "Tobias", "Niklas", "Florian"],
    femaleFirst: ["Hannah", "Sophie", "Leonie", "Lena", "Katharina", "Julia"],
    lastNames: ["Richter", "Weber", "Zimmermann", "Hoffmann", "Krause", "Hartmann"],
    cities: [
      { city: "Berlin", stateProvince: "Berlin", postalCode: "10115", lat: 52.5316, lng: 13.3853 },
      { city: "Munich", stateProvince: "Bavaria", postalCode: "80331", lat: 48.1351, lng: 11.5820 },
      { city: "Frankfurt", stateProvince: "Hesse", postalCode: "60311", lat: 50.1109, lng: 8.6821 }
    ],
    streets: ["Königsallee", "Friedrichstraße", "Taunusanlage", "Leopoldstraße"],
    phoneCode: "+49",
    currency: "EUR",
    phoneGen: (prng) => `+49-30-2312-${prng.digits(4)}`,
    nationalIdGen: (prng) => ({ type: "Steuer-ID", number: `${prng.digits(2)} ${prng.digits(3)} ${prng.digits(3)} ${prng.digits(3)}`, issuingCountry: "DE" }),
    passportGen: (prng) => `C01X${prng.digits(5)}`,
    licenseGen: (prng) => `B072${prng.digits(7)}`,
    taxIdGen: (prng) => ({ tin: `${prng.digits(11)}`, jurisdiction: "DE-Finanzamt" }),
    employers: ["Bavaria Cyber Defense", "Rhein-Main Analytics GmbH", "Krupp Data Systems"],
    carriers: ["Deutsche Telekom", "Vodafone DE", "O2 Telefónica"]
  },
  IN: {
    maleFirst: ["Arjun", "Rohan", "Vikram", "Siddharth", "Aditya", "Rajesh"],
    femaleFirst: ["Priya", "Ananya", "Deepa", "Kavita", "Meera", "Shweta"],
    lastNames: ["Sharma", "Patel", "Iyer", "Menon", "Verma", "Kulkarni"],
    cities: [
      { city: "Bengaluru", stateProvince: "Karnataka", postalCode: "560001", lat: 12.9716, lng: 77.5946 },
      { city: "Mumbai", stateProvince: "Maharashtra", postalCode: "400051", lat: 19.0657, lng: 72.8687 },
      { city: "New Delhi", stateProvince: "Delhi", postalCode: "110001", lat: 28.6139, lng: 77.2090 }
    ],
    streets: ["MG Road", "Outer Ring Road", "Brigade Road", "Cyber City Expressway"],
    phoneCode: "+91",
    currency: "INR",
    phoneGen: (prng) => `+91-98765-${prng.digits(5)}`,
    nationalIdGen: (prng) => ({ type: "Aadhaar", number: `${prng.digits(4)} ${prng.digits(4)} ${prng.digits(4)}`, issuingCountry: "IN" }),
    passportGen: (prng) => `Z${prng.digits(7)}`,
    licenseGen: (prng) => `KA01-2020-${prng.digits(7)}`,
    taxIdGen: (prng) => ({ tin: `XYZPV${prng.digits(4)}K`, jurisdiction: "ITD-India" }),
    employers: ["Bharat Cyber Security", "Indus Tech Solutions", "Bangalore Infosec Labs"],
    carriers: ["Airtel", "Jio", "Vodafone Idea"]
  },
  JP: {
    maleFirst: ["Kenji", "Ren", "Hiroshi", "Daiki", "Souta", "Kazuki"],
    femaleFirst: ["Yui", "Aoi", "Sakura", "Hina", "Mei", "Nanami"],
    lastNames: ["Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe", "Ito"],
    cities: [
      { city: "Tokyo", stateProvince: "Tokyo", postalCode: "100-0001", lat: 35.6895, lng: 139.6917 },
      { city: "Osaka", stateProvince: "Osaka", postalCode: "540-0001", lat: 34.6937, lng: 135.5023 },
      { city: "Yokohama", stateProvince: "Kanagawa", postalCode: "220-0012", lat: 35.4437, lng: 139.6380 }
    ],
    streets: ["Marunouchi 2-chome", "Roppongi Hills Mori Tower", "Dogenzaka 1-chome"],
    phoneCode: "+81",
    currency: "JPY",
    phoneGen: (prng) => `+81-3-5555-${prng.digits(4)}`,
    nationalIdGen: (prng) => ({ type: "My Number", number: `${prng.digits(4)} ${prng.digits(4)} ${prng.digits(4)}`, issuingCountry: "JP" }),
    passportGen: (prng) => `TK${prng.digits(7)}`,
    licenseGen: (prng) => `3001-${prng.digits(4)}-${prng.digits(4)}`,
    taxIdGen: (prng) => ({ tin: `${prng.digits(13)}`, jurisdiction: "NTA-Japan" }),
    employers: ["Nippon Secure Systems", "Chiyoda Information Warfare", "Kanto Cyber Labs"],
    carriers: ["NTT Docomo", "SoftBank", "au KDDI"]
  },
  CA: {
    maleFirst: ["Liam", "Noah", "William", "Logan", "Lucas", "Félix"],
    femaleFirst: ["Olivia", "Emma", "Charlotte", "Chloé", "Léa", "Maya"],
    lastNames: ["Tremblay", "Roy", "Bouchard", "Campbell", "MacDonald", "Fraser"],
    cities: [
      { city: "Ottawa", stateProvince: "Ontario", postalCode: "K1P 1J1", lat: 45.4215, lng: -75.6972 },
      { city: "Toronto", stateProvince: "Ontario", postalCode: "M5V 2T6", lat: 43.6532, lng: -79.3832 },
      { city: "Vancouver", stateProvince: "British Columbia", postalCode: "V6C 2T8", lat: 49.2827, lng: -123.1207 }
    ],
    streets: ["Wellington Street", "Bay Street", "Rue Sainte-Catherine", "Burrard Street"],
    phoneCode: "+1",
    currency: "CAD",
    phoneGen: (prng) => `+1-613-555-01${prng.digits(2)}`,
    nationalIdGen: (prng) => ({ type: "SIN", number: `9${prng.digits(2)}-${prng.digits(3)}-${prng.digits(3)}`, issuingCountry: "CA" }),
    passportGen: (prng) => `AB${prng.digits(6)}`,
    licenseGen: (prng) => `T${prng.digits(14)}`,
    taxIdGen: (prng) => ({ tin: `${prng.digits(9)}`, jurisdiction: "CRA-Canada" }),
    employers: ["Laurentian Cyber Defense", "Maple Leaf Security Systems", "Great Lakes Intel"],
    carriers: ["Rogers Wireless", "Bell Mobility", "Telus"]
  },
  EE: {
    maleFirst: ["Markus", "Rasmus", "Sander", "Martin", "Robin", "Kaspar"],
    femaleFirst: ["Laura", "Liis", "Sandra", "Maria", "Eliise", "Kadri"],
    lastNames: ["Tamm", "Saar", "Sepp", "Mägi", "Kallas", "Kukk"],
    cities: [
      { city: "Tallinn", stateProvince: "Harjumaa", postalCode: "10111", lat: 59.4370, lng: 24.7536 },
      { city: "Tartu", stateProvince: "Tartumaa", postalCode: "51003", lat: 58.3780, lng: 26.7290 }
    ],
    streets: ["Lõõtsa tn", "Pärnu mnt", "Narva mnt", "Tartu mnt", "Liivalaia tn"],
    phoneCode: "+372",
    currency: "EUR",
    phoneGen: (prng) => `+372-5555-${prng.digits(4)}`,
    nationalIdGen: (prng) => ({ type: "Isikukood", number: `3880614${prng.digits(4)}`, issuingCountry: "EE" }),
    passportGen: (prng) => `K${prng.digits(7)}`,
    licenseGen: (prng) => `EE${prng.digits(6)}`,
    taxIdGen: (prng) => ({ tin: `EE${prng.digits(9)}`, jurisdiction: "EMTA-Estonia" }),
    employers: ["Ülemiste Cyber Fortress", "Estonian e-State Labs", "Nordic Sentinel Tech"],
    carriers: ["Telia Eesti", "Elisa Eesti", "Tele2 Eesti"]
  }
};

function getLocale(nat) {
  return LOCALES[nat] || LOCALES.US;
}

function generateCompleteIdentity(rawOptions) {
  const seed = rawOptions.seed || "default-seed";
  const nationality = (rawOptions.nationality || "US").toUpperCase();
  const options = {
    seed,
    nationality,
    ageRange: rawOptions.ageRange || [25, 60],
    gender: rawOptions.gender || "auto",
    occupationCategory: rawOptions.occupationCategory || "cybersecurity",
    riskLevel: rawOptions.riskLevel || "medium",
    complexity: rawOptions.complexity || "standard"
  };

  const masterSeed = deriveMasterSeed(seed, options);
  const loc = getLocale(options.nationality);

  // 1. Meta Domain
  const prngMeta = getDomainPRNG(masterSeed, "meta");
  const threatScore = options.riskLevel === "critical" ? prngMeta.nextInt(88, 99) :
                      options.riskLevel === "high" ? prngMeta.nextInt(70, 87) :
                      options.riskLevel === "low" ? prngMeta.nextInt(10, 35) :
                      prngMeta.nextInt(36, 69);
  const meta = {
    id: `dos_${prngMeta.hex(16)}`,
    seed: String(seed),
    version: "1.0.0",
    classification: options.riskLevel === "critical" ? "TOP_SECRET" :
                    options.riskLevel === "high" ? "SECRET" :
                    options.riskLevel === "low" ? "UNCLASSIFIED" : "CONFIDENTIAL",
    status: threatScore > 75 ? "PERSON_OF_INTEREST" : "ACTIVE",
    threatScore,
    generatedAt: REFERENCE_EPOCH,
    tags: ["synthetic", "cyber_intel", "target_profile"],
    handlingCaveats: ["NOFORN", "ORCON", "SYNTHETIC_EXERCISE_ONLY"]
  };

  // 2. Personal Domain
  const prngPers = getDomainPRNG(masterSeed, "personal");
  const gender = options.gender !== "auto" ? options.gender : prngPers.pick(["male", "female"]);
  const sex = gender === "male" ? "M" : gender === "female" ? "F" : "X";
  const firstName = gender === "female" ? prngPers.pick(loc.femaleFirst) : prngPers.pick(loc.maleFirst);
  const middleName = prngPers.boolean(0.7) ? (gender === "female" ? prngPers.pick(loc.femaleFirst) : prngPers.pick(loc.maleFirst)) : null;
  const lastName = prngPers.pick(loc.lastNames);
  const legalFullName = `${firstName} ${middleName ? middleName + " " : ""}${lastName}`;
  const age = prngPers.nextInt(options.ageRange[0], options.ageRange[1]);
  const birthYear = 2026 - age;
  const birthMonth = String(prngPers.nextInt(1, 12)).padStart(2, '0');
  const birthDay = String(prngPers.nextInt(1, 28)).padStart(2, '0');
  const dateOfBirth = `${birthYear}-${birthMonth}-${birthDay}`;
  const birthLoc = prngPers.pick(loc.cities);

  const personal = {
    firstName,
    middleName,
    lastName,
    legalFullName,
    aliases: [
      `${firstName[0]}${lastName}`,
      `${lastName}0x`,
      prngPers.pick(["Shadow", "Ghost", "Zero", "Cipher", "Apex"]) + prngPers.digits(2)
    ],
    dateOfBirth,
    age,
    gender,
    sex,
    nationality: options.nationality,
    citizenship: [options.nationality],
    placeOfBirth: { city: birthLoc.city, stateProvince: birthLoc.stateProvince, country: options.nationality },
    ethnicity: `${options.nationality} Heritage`,
    languages: [
      { language: options.nationality === "US" || options.nationality === "GB" || options.nationality === "CA" ? "English" :
                  options.nationality === "DE" ? "German" :
                  options.nationality === "IN" ? "Hindi" :
                  options.nationality === "JP" ? "Japanese" : "Estonian", proficiency: "native" },
      { language: "English", proficiency: options.nationality === "US" || options.nationality === "GB" || options.nationality === "CA" ? "native" : "fluent" }
    ],
    maritalStatus: prngPers.pick(["single", "married", "divorced"]),
    bloodType: prngPers.pick(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
  };

  // 3. Physical Domain
  const prngPhys = getDomainPRNG(masterSeed, "physical");
  const physical = {
    heightCm: sex === "M" ? prngPhys.nextInt(170, 195) : prngPhys.nextInt(158, 178),
    weightKg: sex === "M" ? prngPhys.nextInt(68, 102) : prngPhys.nextInt(52, 78),
    eyeColor: prngPhys.pick(["amber", "blue", "brown", "gray", "green", "hazel"]),
    hairColor: prngPhys.pick(["black", "brown", "blonde", "red", "gray"]),
    hairStyle: prngPhys.pick(["short taper", "side part", "buzz cut", "shoulder-length wavy"]),
    skinTone: prngPhys.pick(["Fair, Fitzpatrick Type II", "Medium, Fitzpatrick Type III", "Olive, Fitzpatrick Type IV"]),
    facialHair: sex === "M" ? prngPhys.pick(["none", "clean-shaven", "stubble", "full-beard", "goatee"]) : "none",
    distinguishingFeatures: [
      {
        type: prngPhys.pick(["scar", "tattoo", "birthmark"]),
        location: prngPhys.pick(["left forearm", "right shoulder", "neck", "jawline"]),
        description: prngPhys.pick(["linear surgical scar", "geometric symbol", "faint pigmented mark"])
      }
    ],
    biometricFingerprintHash: prngPhys.hex(64),
    correctiveLenses: prngPhys.pick(["none", "glasses", "contacts", "both"])
  };

  // 4. Addresses Domain
  const prngAddr = getDomainPRNG(masterSeed, "addresses");
  const currentCity = prngAddr.pick(loc.cities);
  const residenceYear = 2026 - prngAddr.nextInt(2, 6);
  const addresses = {
    current: {
      addressLine1: `${prngAddr.nextInt(100, 9999)} ${prngAddr.pick(loc.streets)}`,
      addressLine2: null,
      city: currentCity.city,
      stateProvince: currentCity.stateProvince,
      postalCode: currentCity.postalCode,
      country: options.nationality,
      coordinates: {
        latitude: +(currentCity.lat + (prngAddr.next() - 0.5) * 0.05).toFixed(4),
        longitude: +(currentCity.lng + (prngAddr.next() - 0.5) * 0.05).toFixed(4)
      },
      domicileType: prngAddr.pick(["owned", "rented"]),
      residenceSince: `${residenceYear}-0${prngAddr.nextInt(1, 9)}-15`,
      residenceUntil: null
    },
    previous: [
      {
        addressLine1: `${prngAddr.nextInt(100, 9999)} ${prngAddr.pick(loc.streets)}`,
        addressLine2: null,
        city: birthLoc.city,
        stateProvince: birthLoc.stateProvince,
        postalCode: birthLoc.postalCode,
        country: options.nationality,
        coordinates: {
          latitude: +(birthLoc.lat + (prngAddr.next() - 0.5) * 0.05).toFixed(4),
          longitude: +(birthLoc.lng + (prngAddr.next() - 0.5) * 0.05).toFixed(4)
        },
        domicileType: "rented",
        residenceSince: `${birthYear + 18}-09-01`,
        residenceUntil: `${residenceYear}-08-31`
      }
    ]
  };

  // 5. Communications Domain
  const prngComm = getDomainPRNG(masterSeed, "communications");
  const communications = {
    phoneNumbers: [
      {
        type: "mobile",
        number: loc.phoneGen(prngComm),
        carrier: prngComm.pick(loc.carriers),
        imsi: `${prngComm.digits(15)}`,
        imei: `${prngComm.digits(15)}`,
        status: "active"
      }
    ],
    emailAddresses: [
      {
        type: "work",
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@netra-intel.internal`,
        domain: "netra-intel.internal",
        primary: true,
        pgpKeyFingerprint: `${prngComm.hex(4)} ${prngComm.hex(4)} ${prngComm.hex(4)} ${prngComm.hex(4)} ${prngComm.hex(4)} ${prngComm.hex(4)} ${prngComm.hex(4)} ${prngComm.hex(4)}`.toUpperCase(),
        compromisedInBreach: prngComm.boolean(0.3)
      },
      {
        type: "personal",
        email: `${firstName.toLowerCase()}${prngComm.digits(2)}@threat-mail.mock`,
        domain: "threat-mail.mock",
        primary: false,
        pgpKeyFingerprint: null,
        compromisedInBreach: prngComm.boolean(0.5)
      }
    ],
    secureMessaging: [
      {
        platform: "signal",
        handle: `@${personal.aliases[1]}`,
        registeredPhoneOrId: `usr_${prngComm.hex(8)}`,
        lastActive: "2026-10-26T21:15:00Z"
      }
    ]
  };

  // 6. Government IDs Domain
  const prngGov = getDomainPRNG(masterSeed, "governmentIds");
  const passportIssueYear = 2026 - prngGov.nextInt(2, 8);
  const governmentIds = {
    nationalId: loc.nationalIdGen(prngGov),
    passports: [
      {
        passportNumber: loc.passportGen(prngGov),
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
      licenseNumber: loc.licenseGen(prngGov, currentCity.stateProvince),
      issuingState: currentCity.stateProvince,
      issuingCountry: options.nationality,
      class: "Standard",
      expiryDate: `${2026 + prngGov.nextInt(2, 6)}-${birthMonth}-${birthDay}`,
      endorsements: prngGov.boolean(0.3) ? ["Motorcycle"] : []
    },
    taxIdentifier: loc.taxIdGen(prngGov)
  };

  // 7. Career and Education Domain
  const prngCar = getDomainPRNG(masterSeed, "careerAndEducation");
  const currentEmployer = prngCar.pick(loc.employers);
  const careerAndEducation = {
    current: {
      employer: currentEmployer,
      jobTitle: prngCar.pick(["Lead Threat Intelligence Engineer", "Principal Security Architect", "OSINT Research Specialist", "Cryptographic Systems Auditor"]),
      department: "Cyber Defense Operations",
      industry: "Defense Contracting",
      annualSalaryUsd: prngCar.nextInt(110000, 240000),
      clearanceLevel: threatScore > 80 ? "top_secret_sci" : threatScore > 60 ? "secret" : "confidential",
      startDate: `${2026 - 3}-06-01`
    },
    employmentHistory: [
      {
        employer: prngCar.pick(loc.employers),
        jobTitle: "Senior Security Analyst",
        startDate: `${birthYear + 23}-07-01`,
        endDate: `${2026 - 3}-05-30`,
        reasonForLeaving: "Career advancement"
      }
    ],
    education: [
      {
        institution: `${birthLoc.city} Technical University`,
        degree: "Bachelor of Science",
        fieldOfStudy: "Computer Science & Cryptography",
        graduationYear: birthYear + 22
      }
    ],
    certifications: [
      {
        name: "CISSP",
        issuingBody: "(ISC)²",
        issueYear: birthYear + 25,
        credentialId: `CERT-${prngCar.digits(6)}`
      }
    ]
  };

  // 8. Financial Domain
  const prngFin = getDomainPRNG(masterSeed, "financial");
  const creditScore = prngFin.nextInt(580, 840);
  const financial = {
    creditScore,
    creditRating: creditScore >= 740 ? "excellent" : creditScore >= 670 ? "good" : creditScore >= 580 ? "fair" : "poor",
    estimatedNetWorthUsd: prngFin.nextInt(150000, 1800000),
    annualGrossIncomeUsd: careerAndEducation.current.annualSalaryUsd,
    taxComplianceStatus: threatScore > 85 ? "under_audit" : "compliant",
    bankAccounts: [
      {
        institution: `${currentCity.city} Commercial Bank`,
        accountType: "checking",
        accountNumberMasked: `******${prngFin.digits(4)}`,
        routingOrSwift: `SWIFT${prngFin.digits(6)}`,
        currency: loc.currency,
        balanceBracket: "$25,000 - $75,000"
      }
    ],
    cryptoWallets: [
      {
        network: "monero",
        address: `4${prngFin.hex(40)}`,
        label: "Private Escrow",
        balanceEstimate: `${prngFin.nextInt(2, 45)} XMR`,
        riskFlags: threatScore > 70 ? ["mixer_associated", "high_anonymity"] : []
      },
      {
        network: "bitcoin",
        address: `bc1q${prngFin.hex(38)}`,
        label: "Cold Storage",
        balanceEstimate: `${(prngFin.nextInt(10, 250) / 100).toFixed(2)} BTC`,
        riskFlags: []
      }
    ],
    suspiciousIndicators: threatScore > 75 ? [
      {
        code: "SAR-STRUCT-01",
        description: "Multiple crypto off-ramp transfers below reporting threshold",
        reportedDate: "2025-11-14"
      }
    ] : []
  };

  // 9. Digital Footprint Domain
  const prngDig = getDomainPRNG(masterSeed, "digitalFootprint");
  const digitalFootprint = {
    socialProfiles: [
      {
        platform: "github",
        handle: `${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
        url: `https://github.com/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
        accountAgeYears: prngDig.nextInt(3, 10),
        followersCount: prngDig.nextInt(50, 800),
        bio: "Security Researcher | Distributed Systems & FFI"
      },
      {
        platform: "twitter_x",
        handle: `@${personal.aliases[1]}`,
        url: `https://x.com/${personal.aliases[1]}`,
        accountAgeYears: prngDig.nextInt(2, 8),
        followersCount: prngDig.nextInt(120, 3400),
        bio: "OSINT practitioner. Views my own."
      }
    ],
    digitalFingerprint: {
      primaryIpAddress: `198.51.100.${prngDig.nextInt(10, 250)}`,
      ipGeolocation: {
        city: currentCity.city,
        country: options.nationality,
        isp: `${currentCity.city} Telecom`,
        asn: `AS${prngDig.nextInt(10000, 65000)}`
      },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      preferredTimezone: options.nationality === "US" ? "America/New_York" :
                         options.nationality === "GB" ? "Europe/London" :
                         options.nationality === "DE" ? "Europe/Berlin" :
                         options.nationality === "IN" ? "Asia/Kolkata" :
                         options.nationality === "JP" ? "Asia/Tokyo" : "UTC"
    },
    knownBreaches: [
      {
        breachName: "ExploitIn Combolist",
        year: 2021,
        leakedDataTypes: ["email", "password_hash"]
      }
    ]
  };

  // 10. Assets Domain
  const prngAss = getDomainPRNG(masterSeed, "assets");
  const assets = {
    vehicles: [
      {
        make: prngAss.pick(["Honda", "Toyota", "BMW", "Audi", "Volvo"]),
        model: prngAss.pick(["Accord", "Camry", "330i", "A4", "XC60"]),
        year: 2026 - prngAss.nextInt(1, 7),
        color: prngAss.pick(["Graphite Gray", "Midnight Blue", "Pearl White", "Obsidian Black"]),
        vin: `1HG${prngAss.hex(14).toUpperCase()}`,
        licensePlate: `${prngAss.hex(3).toUpperCase()}-${prngAss.digits(4)}`,
        registrationStateCountry: `${currentCity.stateProvince}-${options.nationality}`,
        status: "registered"
      }
    ],
    realEstate: [
      {
        propertyType: addresses.current.domicileType === "owned" ? "residential" : "commercial",
        address: `${addresses.current.addressLine1}, ${currentCity.city}, ${currentCity.stateProvince}`,
        estimatedValueUsd: prngAss.nextInt(380000, 950000),
        ownershipType: addresses.current.domicileType === "owned" ? "sole_owner" : "llc_trust"
      }
    ],
    corporateAffiliations: [
      {
        companyName: `${lastName} Intelligence Advisory LLC`,
        registrationNumber: `LLC-${prngAss.digits(7)}`,
        jurisdiction: currentCity.stateProvince,
        role: "director",
        isShellCompanyCandidate: threatScore > 70
      }
    ]
  };

  // 11. Network Graph Domain
  const prngNet = getDomainPRNG(masterSeed, "networkGraph");
  const subjectNodeId = meta.id;
  const associate1Id = `node_${prngNet.hex(8)}`;
  const associate2Id = `node_${prngNet.hex(8)}`;
  const entity3Id = `node_${prngNet.hex(8)}`;

  const networkGraph = {
    nodes: [
      {
        id: subjectNodeId,
        label: legalFullName,
        category: "person",
        role: "Subject of Investigation",
        isSubject: true,
        riskScore: threatScore
      },
      {
        id: associate1Id,
        label: `${prngNet.pick(loc.maleFirst)} ${lastName}`,
        category: "person",
        role: "Associate / Kin",
        isSubject: false,
        riskScore: prngNet.nextInt(20, 60)
      },
      {
        id: associate2Id,
        label: `${prngNet.pick(loc.femaleFirst)} ${prngNet.pick(loc.lastNames)}`,
        category: "person",
        role: "Senior Co-Worker",
        isSubject: false,
        riskScore: prngNet.nextInt(15, 45)
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
        id: `edge_${prngNet.hex(6)}`,
        source: subjectNodeId,
        target: associate1Id,
        type: "family",
        weight: 0.85,
        status: "active",
        firstObserved: `${birthYear + 18}-01-01`,
        notes: "Immediate familial relationship"
      },
      {
        id: `edge_${prngNet.hex(6)}`,
        source: subjectNodeId,
        target: associate2Id,
        type: "co_worker",
        weight: 0.65,
        status: "active",
        firstObserved: `${2026 - 3}-06-01`,
        notes: "Direct professional collaborator at current employer"
      },
      {
        id: `edge_${prngNet.hex(6)}`,
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

  // 12. Timeline Domain
  const prngTime = getDomainPRNG(masterSeed, "timeline");
  const events = [
    {
      id: `evt_01_${prngTime.hex(6)}`,
      timestamp: `${dateOfBirth}T08:30:00.000Z`,
      category: "birth",
      title: "Birth of Subject",
      description: `Subject born in ${birthLoc.city}, ${birthLoc.stateProvince}, ${options.nationality}`,
      severity: "routine",
      location: `${birthLoc.city}, ${options.nationality}`,
      tags: ["vital_records", "civil_registry"]
    },
    {
      id: `evt_02_${prngTime.hex(6)}`,
      timestamp: `${birthYear + 18}-06-15T14:00:00.000Z`,
      category: "education",
      title: "Secondary Education Completed",
      description: `Graduated from secondary school in ${birthLoc.city}`,
      severity: "routine",
      location: `${birthLoc.city}, ${options.nationality}`,
      tags: ["education", "diploma"]
    },
    {
      id: `evt_03_${prngTime.hex(6)}`,
      timestamp: `${birthYear + 22}-06-20T10:00:00.000Z`,
      category: "education",
      title: "Bachelor's Degree Conferred",
      description: `${careerAndEducation.education[0].degree} in ${careerAndEducation.education[0].fieldOfStudy} from ${careerAndEducation.education[0].institution}`,
      severity: "routine",
      location: `${birthLoc.city}, ${options.nationality}`,
      tags: ["education", "degree"]
    },
    {
      id: `evt_04_${prngTime.hex(6)}`,
      timestamp: `${careerAndEducation.employmentHistory[0].startDate}T09:00:00.000Z`,
      category: "career",
      title: "First Professional Appointment",
      description: `Appointed as ${careerAndEducation.employmentHistory[0].jobTitle} at ${careerAndEducation.employmentHistory[0].employer}`,
      severity: "routine",
      location: `${currentCity.city}, ${options.nationality}`,
      tags: ["employment", "career_start"]
    },
    {
      id: `evt_05_${prngTime.hex(6)}`,
      timestamp: `${governmentIds.passports[0].issueDate}T11:00:00.000Z`,
      category: "travel",
      title: "Biometric Passport Issued",
      description: `National passport ${governmentIds.passports[0].passportNumber} issued by government authorities`,
      severity: "routine",
      location: options.nationality,
      tags: ["passport", "travel_docs"]
    },
    {
      id: `evt_06_${prngTime.hex(6)}`,
      timestamp: `${addresses.current.residenceSince}T12:00:00.000Z`,
      category: "residence",
      title: "Relocation to Current Residence",
      description: `Established residence at ${addresses.current.addressLine1}, ${currentCity.city}`,
      severity: "routine",
      location: `${currentCity.city}, ${options.nationality}`,
      tags: ["address", "residency"]
    },
    {
      id: `evt_07_${prngTime.hex(6)}`,
      timestamp: "2026-08-14T19:42:00.000Z",
      category: threatScore > 70 ? "intelligence_flag" : "financial",
      title: threatScore > 70 ? "Flagged Financial Transaction" : "Asset Acquisition",
      description: threatScore > 70 ? "Suspicious cross-border transaction registered on monitored node" : "Standard property tax and corporate filing registered",
      severity: threatScore > 70 ? "critical" : "notable",
      location: `${currentCity.city}, ${options.nationality}`,
      tags: ["audit", "intelligence"]
    }
  ];

  // Strictly sort chronological ascending
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const timeline = { events };

  return {
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
}

module.exports = {
  REFERENCE_EPOCH,
  REFERENCE_TIMESTAMP_MS,
  murmurhash3_32,
  createMulberry32,
  canonicalizeOptions,
  deriveMasterSeed,
  getDomainPRNG,
  generateCompleteIdentity,
  LOCALES
};
