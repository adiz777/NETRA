import type { PRNG } from "../prng/mulberry32.js";
import type { LocaleCatalog } from "../catalogs/types.js";
import type {
  AddressesProfile,
  CareerEducationProfile,
  FinancialProfile
} from "../../shared/types/dossier.js";

export function generateFinancialDomain(
  prng: PRNG,
  loc: LocaleCatalog,
  addresses: AddressesProfile,
  career: CareerEducationProfile,
  threatScore: number
): FinancialProfile {
  const creditScore = prng.nextInt(580, 840);
  const currentCity = addresses.current.city;

  return {
    creditScore,
    creditRating:
      creditScore >= 740
        ? "excellent"
        : creditScore >= 670
        ? "good"
        : creditScore >= 580
        ? "fair"
        : "poor",
    estimatedNetWorthUsd: prng.nextInt(150000, 1800000),
    annualGrossIncomeUsd: career.current.annualSalaryUsd,
    taxComplianceStatus: threatScore > 85 ? "under_audit" : "compliant",
    bankAccounts: [
      {
        institution: `${currentCity} Commercial Bank`,
        accountType: "checking",
        accountNumberMasked: `******${prng.digits(4)}`,
        routingOrSwift: `SWIFT${prng.digits(6)}`,
        currency: loc.currency,
        balanceBracket: "$25,000 - $75,000"
      }
    ],
    cryptoWallets: [
      {
        network: "monero",
        address: `4${prng.hex(40)}`,
        label: "Private Escrow",
        balanceEstimate: `${prng.nextInt(2, 45)} XMR`,
        riskFlags: threatScore > 70 ? ["mixer_associated", "high_anonymity"] : []
      },
      {
        network: "bitcoin",
        address: `bc1q${prng.hex(38)}`,
        label: "Cold Storage",
        balanceEstimate: `${(prng.nextInt(10, 250) / 100).toFixed(2)} BTC`,
        riskFlags: []
      }
    ],
    suspiciousIndicators:
      threatScore > 75
        ? [
            {
              code: "SAR-STRUCT-01",
              description: "Multiple crypto off-ramp transfers below reporting threshold",
              reportedDate: "2025-11-14"
            }
          ]
        : []
  };
}
