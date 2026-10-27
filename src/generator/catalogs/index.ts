import type { LocaleCatalog } from "./types.js";

export * from "./types.js";

export const LOCALES: Record<string, LocaleCatalog> = {
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

export function getLocaleCatalog(countryCode: string): LocaleCatalog {
  return LOCALES[countryCode.toUpperCase()] || LOCALES.US;
}
