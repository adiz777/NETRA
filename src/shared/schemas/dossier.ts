import { z } from "zod";

/**
 * ============================================================================
 * NETRA - Deterministic Synthetic Identity Dossier Schema
 * Target File: src/shared/schemas/dossier.ts
 *
 * Architecture:
 * - 12 isolated intelligence domains
 * - Strict runtime validation with regex formatting, numerical bounds, and enums
 * - Zero external runtime dependencies besides Zod
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// Generator Options Schema
// ----------------------------------------------------------------------------
export const GeneratorOptionsSchema = z.object({
  seed: z
    .union([z.string().min(1), z.number()])
    .optional()
    .default("default-seed")
    .transform((val) => String(val)),
  nationality: z.enum(["US", "GB", "DE", "IN", "JP", "CA", "EE"]).optional().default("US"),
  ageRange: z
    .tuple([z.number().int().min(18).max(100), z.number().int().min(18).max(100)])
    .refine(([min, max]) => min <= max, { message: "ageRange min must be <= max" })
    .optional()
    .default([25, 60]),
  gender: z.enum(["male", "female", "non-binary", "auto"]).optional().default("auto"),
  occupationCategory: z
    .enum(["cybersecurity", "finance", "defense", "logistics", "academic", "medical", "auto"])
    .optional()
    .default("cybersecurity"),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).optional().default("medium"),
  complexity: z.enum(["minimal", "standard", "exhaustive"]).optional().default("standard")
});

// ----------------------------------------------------------------------------
// Domain 1: Meta Schema
// ----------------------------------------------------------------------------
export const MetaDomainSchema = z.object({
  id: z.string().regex(/^dos_[a-f0-9]{16,32}$/, "Invalid dossier ID format (must start with dos_)"),
  seed: z.string().min(1),
  version: z.string().default("1.0.0"),
  classification: z.enum(["UNCLASSIFIED", "RESTRICTED", "CONFIDENTIAL", "SECRET", "TOP_SECRET"]),
  status: z.enum(["ACTIVE", "ARCHIVED", "MONITORED", "PERSON_OF_INTEREST"]),
  threatScore: z.number().int().min(0).max(100),
  generatedAt: z.string().datetime(), // Anchored to deterministic epoch: "2026-10-27T00:00:00.000Z"
  tags: z.array(z.string()),
  handlingCaveats: z.array(z.string())
});

// ----------------------------------------------------------------------------
// Domain 2: Personal Demographics Schema
// ----------------------------------------------------------------------------
export const LanguageProficiencySchema = z.object({
  language: z.string().min(1),
  proficiency: z.enum(["native", "fluent", "intermediate", "basic"])
});

export const PlaceOfBirthSchema = z.object({
  city: z.string().min(1),
  stateProvince: z.string().min(1),
  country: z.string().length(2)
});

export const PersonalDomainSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().nullable(),
  lastName: z.string().min(1),
  legalFullName: z.string().min(1),
  aliases: z.array(z.string()),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dateOfBirth must follow YYYY-MM-DD"),
  age: z.number().int().min(18).max(120),
  gender: z.enum(["male", "female", "non-binary", "other"]),
  sex: z.enum(["M", "F", "X"]),
  nationality: z.string().length(2),
  citizenship: z.array(z.string().length(2)).min(1),
  placeOfBirth: PlaceOfBirthSchema,
  ethnicity: z.string().min(1),
  languages: z.array(LanguageProficiencySchema).min(1),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed", "separated"]),
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
});

// ----------------------------------------------------------------------------
// Domain 3: Physical Characteristics Schema
// ----------------------------------------------------------------------------
export const DistinguishingFeatureSchema = z.object({
  type: z.enum(["scar", "tattoo", "birthmark", "piercing", "implant", "prosthetic"]),
  location: z.string().min(1),
  description: z.string().min(1)
});

export const PhysicalDomainSchema = z.object({
  heightCm: z.number().int().min(120).max(220),
  weightKg: z.number().int().min(40).max(200),
  eyeColor: z.enum(["amber", "blue", "brown", "gray", "green", "hazel"]),
  hairColor: z.enum(["black", "brown", "blonde", "red", "gray", "bald"]),
  hairStyle: z.string().min(1),
  skinTone: z.string().min(1),
  facialHair: z.enum(["none", "clean-shaven", "stubble", "full-beard", "goatee", "mustache"]),
  distinguishingFeatures: z.array(DistinguishingFeatureSchema),
  biometricFingerprintHash: z.string().regex(/^[a-f0-9]{64}$/, "Fingerprint hash must be 64-char lowercase hex"),
  correctiveLenses: z.enum(["none", "glasses", "contacts", "both"])
});

// ----------------------------------------------------------------------------
// Domain 4: Addresses Schema
// ----------------------------------------------------------------------------
export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

export const AddressRecordSchema = z.object({
  addressLine1: z.string().min(1),
  addressLine2: z.string().nullable().optional(),
  city: z.string().min(1),
  stateProvince: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().length(2),
  coordinates: CoordinatesSchema,
  domicileType: z.enum(["owned", "rented", "commercial", "safehouse", "temporary"]),
  residenceSince: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  residenceUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()
});

export const AddressesDomainSchema = z.object({
  current: AddressRecordSchema,
  previous: z.array(AddressRecordSchema)
});

// ----------------------------------------------------------------------------
// Domain 5: Communications Schema
// ----------------------------------------------------------------------------
export const PhoneNumberSchema = z.object({
  type: z.enum(["mobile", "home", "work", "burner", "voip"]),
  number: z.string().min(7),
  carrier: z.string().min(1),
  imsi: z.string().regex(/^\d{14,15}$/, "IMSI must be 14 or 15 digits"),
  imei: z.string().regex(/^\d{15}$/, "IMEI must be 15 digits"),
  status: z.enum(["active", "disconnected", "monitored"])
});

export const EmailAddressSchema = z.object({
  type: z.enum(["personal", "work", "covert", "throwaway"]),
  email: z.string().email(),
  domain: z.string().min(1),
  primary: z.boolean(),
  pgpKeyFingerprint: z.string().nullable().optional(),
  compromisedInBreach: z.boolean()
});

export const SecureMessagingSchema = z.object({
  platform: z.enum(["signal", "telegram", "session", "threema", "matrix", "whatsapp"]),
  handle: z.string().min(1),
  registeredPhoneOrId: z.string().min(1),
  lastActive: z.string()
});

export const CommunicationsDomainSchema = z.object({
  phoneNumbers: z.array(PhoneNumberSchema).min(1),
  emailAddresses: z.array(EmailAddressSchema).min(1),
  secureMessaging: z.array(SecureMessagingSchema)
});

// ----------------------------------------------------------------------------
// Domain 6: Government IDs Schema
// ----------------------------------------------------------------------------
export const NationalIdSchema = z.object({
  type: z.string().min(1), // e.g., "SSN", "NIN", "Aadhaar", "TaxID", "MyNumber", "SIN", "Isikukood"
  number: z.string().min(1),
  issuingCountry: z.string().length(2)
});

export const VisaSchema = z.object({
  country: z.string().length(2),
  type: z.string().min(1),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const PassportSchema = z.object({
  passportNumber: z.string().min(5),
  issuingCountry: z.string().length(2),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["valid", "expired", "revoked", "diplomatic"]),
  visas: z.array(VisaSchema)
});

export const DriversLicenseSchema = z.object({
  licenseNumber: z.string().min(1),
  issuingState: z.string().min(1),
  issuingCountry: z.string().length(2),
  class: z.string().min(1),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endorsements: z.array(z.string())
});

export const TaxIdentifierSchema = z.object({
  tin: z.string().min(1),
  jurisdiction: z.string().min(1)
});

export const GovernmentIdsDomainSchema = z.object({
  nationalId: NationalIdSchema,
  passports: z.array(PassportSchema),
  driversLicense: DriversLicenseSchema,
  taxIdentifier: TaxIdentifierSchema
});

// ----------------------------------------------------------------------------
// Domain 7: Career & Education Schema
// ----------------------------------------------------------------------------
export const CurrentEmploymentSchema = z.object({
  employer: z.string().min(1),
  jobTitle: z.string().min(1),
  department: z.string().min(1),
  industry: z.string().min(1),
  annualSalaryUsd: z.number().int().nonnegative(),
  clearanceLevel: z.enum(["none", "public_trust", "confidential", "secret", "top_secret", "top_secret_sci"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const EmploymentRecordSchema = z.object({
  employer: z.string().min(1),
  jobTitle: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reasonForLeaving: z.string().min(1)
});

export const EducationRecordSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  fieldOfStudy: z.string().min(1),
  graduationYear: z.number().int().min(1950).max(2030)
});

export const CertificationRecordSchema = z.object({
  name: z.string().min(1),
  issuingBody: z.string().min(1),
  issueYear: z.number().int().min(1970).max(2030),
  credentialId: z.string().min(1)
});

export const CareerEducationDomainSchema = z.object({
  current: CurrentEmploymentSchema,
  employmentHistory: z.array(EmploymentRecordSchema),
  education: z.array(EducationRecordSchema),
  certifications: z.array(CertificationRecordSchema)
});

// ----------------------------------------------------------------------------
// Domain 8: Financial Profile Schema
// ----------------------------------------------------------------------------
export const BankAccountSchema = z.object({
  institution: z.string().min(1),
  accountType: z.enum(["checking", "savings", "investment", "offshore"]),
  accountNumberMasked: z.string().min(4),
  routingOrSwift: z.string().min(1),
  currency: z.string().length(3),
  balanceBracket: z.string().min(1)
});

export const CryptoWalletSchema = z.object({
  network: z.enum(["bitcoin", "ethereum", "monero", "solana", "tether_tron"]),
  address: z.string().min(10),
  label: z.string().min(1),
  balanceEstimate: z.string().min(1),
  riskFlags: z.array(z.string())
});

export const SuspiciousIndicatorSchema = z.object({
  code: z.string().min(1),
  description: z.string().min(1),
  reportedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const FinancialDomainSchema = z.object({
  creditScore: z.number().int().min(300).max(850),
  creditRating: z.enum(["poor", "fair", "good", "excellent"]),
  estimatedNetWorthUsd: z.number().int(),
  annualGrossIncomeUsd: z.number().int().nonnegative(),
  taxComplianceStatus: z.enum(["compliant", "under_audit", "lien_recorded", "delinquent"]),
  bankAccounts: z.array(BankAccountSchema),
  cryptoWallets: z.array(CryptoWalletSchema),
  suspiciousIndicators: z.array(SuspiciousIndicatorSchema)
});

// ----------------------------------------------------------------------------
// Domain 9: Digital Footprint & Cyber Schema
// ----------------------------------------------------------------------------
export const SocialProfileSchema = z.object({
  platform: z.enum(["twitter_x", "linkedin", "github", "reddit", "facebook", "instagram", "darknet_forum"]),
  handle: z.string().min(1),
  url: z.string().url(),
  accountAgeYears: z.number().min(0),
  followersCount: z.number().int().nonnegative(),
  bio: z.string()
});

export const IpGeolocationSchema = z.object({
  city: z.string().min(1),
  country: z.string().length(2),
  isp: z.string().min(1),
  asn: z.string().regex(/^AS\d+$/, "ASN must follow format AS<number>")
});

export const DigitalFingerprintSchema = z.object({
  primaryIpAddress: z.string().ip({ version: "v4" }),
  ipGeolocation: IpGeolocationSchema,
  userAgent: z.string().min(1),
  preferredTimezone: z.string().min(1)
});

export const KnownBreachSchema = z.object({
  breachName: z.string().min(1),
  year: z.number().int().min(2000).max(2030),
  leakedDataTypes: z.array(z.string())
});

export const DigitalFootprintDomainSchema = z.object({
  socialProfiles: z.array(SocialProfileSchema),
  digitalFingerprint: DigitalFingerprintSchema,
  knownBreaches: z.array(KnownBreachSchema)
});

// ----------------------------------------------------------------------------
// Domain 10: Assets Schema
// ----------------------------------------------------------------------------
export const VehicleAssetSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1970).max(2030),
  color: z.string().min(1),
  vin: z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/, "VIN must be 17 standard characters"),
  licensePlate: z.string().min(1),
  registrationStateCountry: z.string().min(1),
  status: z.enum(["registered", "transferred", "impounded", "stolen"])
});

export const RealEstateAssetSchema = z.object({
  propertyType: z.enum(["residential", "commercial", "undeveloped_land", "storage_facility"]),
  address: z.string().min(1),
  estimatedValueUsd: z.number().int().nonnegative(),
  ownershipType: z.enum(["sole_owner", "joint", "llc_trust"])
});

export const CorporateAffiliationSchema = z.object({
  companyName: z.string().min(1),
  registrationNumber: z.string().min(1),
  jurisdiction: z.string().min(1),
  role: z.enum(["director", "beneficial_owner", "shareholder", "officer", "registered_agent"]),
  isShellCompanyCandidate: z.boolean()
});

export const AssetsDomainSchema = z.object({
  vehicles: z.array(VehicleAssetSchema),
  realEstate: z.array(RealEstateAssetSchema),
  corporateAffiliations: z.array(CorporateAffiliationSchema)
});

// ----------------------------------------------------------------------------
// Domain 11: Network Graph Schema
// ----------------------------------------------------------------------------
export const NetworkNodeCategorySchema = z.enum(["person", "organization", "crypto_wallet", "vehicle", "shell_company"]);

export const NetworkNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  category: NetworkNodeCategorySchema,
  role: z.string().min(1),
  isSubject: z.boolean(),
  riskScore: z.number().int().min(0).max(100)
});

export const NetworkEdgeTypeSchema = z.enum([
  "family",
  "spouse",
  "co_worker",
  "co_conspirator",
  "financial_transaction",
  "frequent_communicator",
  "legal_counsel",
  "informant",
  "handler",
  "shell_entity_owner"
]);

export const NetworkEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  type: NetworkEdgeTypeSchema,
  weight: z.number().min(0).max(1),
  status: z.enum(["active", "dormant", "severed", "monitored"]),
  firstObserved: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "firstObserved must follow YYYY-MM-DD"),
  notes: z.string()
});

export const NetworkGraphDomainSchema = z.object({
  nodes: z.array(NetworkNodeSchema).min(1),
  edges: z.array(NetworkEdgeSchema)
});

// ----------------------------------------------------------------------------
// Domain 12: Chronological Timeline Schema
// ----------------------------------------------------------------------------
export const TimelineCategorySchema = z.enum([
  "birth",
  "education",
  "career",
  "residence",
  "travel",
  "telecom",
  "financial",
  "legal_or_incident",
  "intelligence_flag"
]);

export const TimelineSeveritySchema = z.enum(["routine", "notable", "critical", "warning"]);

export const TimelineEventSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().datetime(), // ISO 8601 UTC
  category: TimelineCategorySchema,
  title: z.string().min(1),
  description: z.string().min(1),
  severity: TimelineSeveritySchema,
  location: z.string().optional(),
  sourceEvidence: z.string().optional(),
  tags: z.array(z.string())
});

export const TimelineDomainSchema = z.object({
  events: z.array(TimelineEventSchema).min(1)
});

// ----------------------------------------------------------------------------
// Master Identity Dossier Schema
// ----------------------------------------------------------------------------
export const IdentityDossierSchema = z.object({
  meta: MetaDomainSchema,
  personal: PersonalDomainSchema,
  physical: PhysicalDomainSchema,
  addresses: AddressesDomainSchema,
  communications: CommunicationsDomainSchema,
  governmentIds: GovernmentIdsDomainSchema,
  careerAndEducation: CareerEducationDomainSchema,
  financial: FinancialDomainSchema,
  digitalFootprint: DigitalFootprintDomainSchema,
  assets: AssetsDomainSchema,
  networkGraph: NetworkGraphDomainSchema,
  timeline: TimelineDomainSchema
});
