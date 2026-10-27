import type { PRNG } from "../prng/mulberry32.js";

export interface CityInfo {
  city: string;
  stateProvince: string;
  postalCode: string;
  lat: number;
  lng: number;
}

export interface NationalIdInfo {
  type: string;
  number: string;
  issuingCountry: string;
}

export interface TaxIdInfo {
  tin: string;
  jurisdiction: string;
}

export interface LocaleCatalog {
  maleFirst: string[];
  femaleFirst: string[];
  lastNames: string[];
  cities: CityInfo[];
  streets: string[];
  phoneCode: string;
  currency: string;
  phoneGen: (prng: PRNG) => string;
  nationalIdGen: (prng: PRNG) => NationalIdInfo;
  passportGen: (prng: PRNG) => string;
  licenseGen: (prng: PRNG, state: string) => string;
  taxIdGen: (prng: PRNG) => TaxIdInfo;
  employers: string[];
  carriers: string[];
}
