import { createRNG, normalizeSeed } from '../core/sampler.js';
import {
  generateAadhaar,
  generatePAN,
  generateVoterID,
  generatePhoneNumber,
  generateEmail,
  generateBankDetails,
  generateUPI,
  generateVehicleRegistration,
  generateAddress,
} from '../utils/identifiers.js';

export interface NetraGovernmentIds {
  aadhaar: string;
  pan: string;
  voterId: string;
  phone: string;
  email: string;
  bank: ReturnType<typeof generateBankDetails>;
  upi: string;
  vehicleRegistration: string;
  address: ReturnType<typeof generateAddress>;
}

export function generateGovernmentIds(
  seed: string,
  firstName = 'Amit',
  lastName = 'Sharma',
  stateId = 'GJ',
  district = 'Ahmedabad',
): NetraGovernmentIds {
  const normalized = normalizeSeed(seed);

  const aadhaarRng = createRNG(`${normalized}:aadhaar`);
  const panRng = createRNG(`${normalized}:pan`);
  const voterRng = createRNG(`${normalized}:voter`);
  const phoneRng = createRNG(`${normalized}:phone`);
  const emailRng = createRNG(`${normalized}:email`);
  const bankRng = createRNG(`${normalized}:bank`);
  const upiRng = createRNG(`${normalized}:upi`);
  const vehicleRng = createRNG(`${normalized}:vehicle`);
  const addressRng = createRNG(`${normalized}:address`);

  const phone = generatePhoneNumber(stateId, phoneRng);

  return {
    aadhaar: generateAadhaar(aadhaarRng),
    pan: generatePAN(lastName, panRng),
    voterId: generateVoterID(stateId, voterRng),
    phone,
    email: generateEmail(firstName, lastName, emailRng),
    bank: generateBankDetails(bankRng),
    upi: generateUPI(phone, firstName, upiRng),
    vehicleRegistration: generateVehicleRegistration(stateId, vehicleRng),
    address: generateAddress(district, 'urban', addressRng),
  };
}