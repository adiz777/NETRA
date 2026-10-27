import type { z } from "zod";
import type {
  GeneratorOptionsSchema,
  MetaDomainSchema,
  PersonalDomainSchema,
  LanguageProficiencySchema,
  PlaceOfBirthSchema,
  PhysicalDomainSchema,
  DistinguishingFeatureSchema,
  CoordinatesSchema,
  AddressRecordSchema,
  AddressesDomainSchema,
  PhoneNumberSchema,
  EmailAddressSchema,
  SecureMessagingSchema,
  CommunicationsDomainSchema,
  NationalIdSchema,
  VisaSchema,
  PassportSchema,
  DriversLicenseSchema,
  TaxIdentifierSchema,
  GovernmentIdsDomainSchema,
  CurrentEmploymentSchema,
  EmploymentRecordSchema,
  EducationRecordSchema,
  CertificationRecordSchema,
  CareerEducationDomainSchema,
  BankAccountSchema,
  CryptoWalletSchema,
  SuspiciousIndicatorSchema,
  FinancialDomainSchema,
  SocialProfileSchema,
  IpGeolocationSchema,
  DigitalFingerprintSchema,
  KnownBreachSchema,
  DigitalFootprintDomainSchema,
  VehicleAssetSchema,
  RealEstateAssetSchema,
  CorporateAffiliationSchema,
  AssetsDomainSchema,
  NetworkNodeSchema,
  NetworkEdgeSchema,
  NetworkGraphDomainSchema,
  TimelineEventSchema,
  TimelineDomainSchema,
  IdentityDossierSchema
} from "../schemas/dossier.js";

/**
 * ============================================================================
 * NETRA - Canonical TypeScript Types for Synthetic Identity Dossier
 * Target File: src/shared/types/dossier.ts
 * ============================================================================
 */

// Generator options
export type GeneratorOptions = z.infer<typeof GeneratorOptionsSchema>;

// Domain 1: Meta
export type MetaProfile = z.infer<typeof MetaDomainSchema>;
export type IntelligenceClassification = MetaProfile["classification"];
export type DossierStatus = MetaProfile["status"];

// Domain 2: Personal Demographics
export type LanguageProficiency = z.infer<typeof LanguageProficiencySchema>;
export type PlaceOfBirth = z.infer<typeof PlaceOfBirthSchema>;
export type PersonalDemographics = z.infer<typeof PersonalDomainSchema>;
export type GenderType = PersonalDemographics["gender"];
export type SexType = PersonalDemographics["sex"];
export type BloodType = PersonalDemographics["bloodType"];
export type MaritalStatus = PersonalDemographics["maritalStatus"];

// Domain 3: Physical Characteristics
export type DistinguishingFeature = z.infer<typeof DistinguishingFeatureSchema>;
export type PhysicalCharacteristics = z.infer<typeof PhysicalDomainSchema>;

// Domain 4: Addresses
export type Coordinates = z.infer<typeof CoordinatesSchema>;
export type AddressRecord = z.infer<typeof AddressRecordSchema>;
export type AddressesProfile = z.infer<typeof AddressesDomainSchema>;

// Domain 5: Communications
export type PhoneNumber = z.infer<typeof PhoneNumberSchema>;
export type EmailAddress = z.infer<typeof EmailAddressSchema>;
export type SecureMessagingAccount = z.infer<typeof SecureMessagingSchema>;
export type CommunicationsProfile = z.infer<typeof CommunicationsDomainSchema>;

// Domain 6: Government IDs
export type NationalIdRecord = z.infer<typeof NationalIdSchema>;
export type PassportVisa = z.infer<typeof VisaSchema>;
export type PassportRecord = z.infer<typeof PassportSchema>;
export type DriversLicenseRecord = z.infer<typeof DriversLicenseSchema>;
export type TaxIdentifierRecord = z.infer<typeof TaxIdentifierSchema>;
export type GovernmentIdsProfile = z.infer<typeof GovernmentIdsDomainSchema>;

// Domain 7: Career & Education
export type CurrentEmployment = z.infer<typeof CurrentEmploymentSchema>;
export type EmploymentHistoryRecord = z.infer<typeof EmploymentRecordSchema>;
export type EducationRecord = z.infer<typeof EducationRecordSchema>;
export type ProfessionalCertification = z.infer<typeof CertificationRecordSchema>;
export type CareerEducationProfile = z.infer<typeof CareerEducationDomainSchema>;

// Domain 8: Financial Profile
export type BankAccountRecord = z.infer<typeof BankAccountSchema>;
export type CryptoWalletRecord = z.infer<typeof CryptoWalletSchema>;
export type SuspiciousActivityIndicator = z.infer<typeof SuspiciousIndicatorSchema>;
export type FinancialProfile = z.infer<typeof FinancialDomainSchema>;

// Domain 9: Digital Footprint
export type SocialProfile = z.infer<typeof SocialProfileSchema>;
export type IpGeolocation = z.infer<typeof IpGeolocationSchema>;
export type DigitalFingerprint = z.infer<typeof DigitalFingerprintSchema>;
export type KnownBreachRecord = z.infer<typeof KnownBreachSchema>;
export type DigitalFootprintProfile = z.infer<typeof DigitalFootprintDomainSchema>;

// Domain 10: Assets
export type VehicleAsset = z.infer<typeof VehicleAssetSchema>;
export type RealEstateAsset = z.infer<typeof RealEstateAssetSchema>;
export type CorporateAffiliation = z.infer<typeof CorporateAffiliationSchema>;
export type AssetsProfile = z.infer<typeof AssetsDomainSchema>;

// Domain 11: Network Graph
export type NetworkNode = z.infer<typeof NetworkNodeSchema>;
export type NetworkEdge = z.infer<typeof NetworkEdgeSchema>;
export type NetworkGraphProfile = z.infer<typeof NetworkGraphDomainSchema>;

// Domain 12: Chronological Timeline
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type TimelineProfile = z.infer<typeof TimelineDomainSchema>;

// Master Dossier Type
export type IdentityDossier = z.infer<typeof IdentityDossierSchema>;
