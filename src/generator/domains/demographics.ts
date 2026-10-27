import type { PRNG } from "../prng/mulberry32.js";
import type { LocaleCatalog } from "../catalogs/types.js";
import type { ResolvedGeneratorOptions, PersonalDemographics } from "../../shared/types/dossier.js";

export function generatePersonalDomain(
  prng: PRNG,
  loc: LocaleCatalog,
  options: ResolvedGeneratorOptions
): PersonalDemographics {
  const gender = options.gender !== "auto" ? options.gender : prng.pick(["male", "female"]);
  const sex = gender === "male" ? "M" : gender === "female" ? "F" : "X";
  const firstName = gender === "female" ? prng.pick(loc.femaleFirst) : prng.pick(loc.maleFirst);
  const middleName = prng.boolean(0.7)
    ? gender === "female"
      ? prng.pick(loc.femaleFirst)
      : prng.pick(loc.maleFirst)
    : null;
  const lastName = prng.pick(loc.lastNames);
  const legalFullName = `${firstName} ${middleName ? middleName + " " : ""}${lastName}`;
  const age = prng.nextInt(options.ageRange[0], options.ageRange[1]);
  const birthYear = 2026 - age;
  const birthMonth = String(prng.nextInt(1, 12)).padStart(2, "0");
  const birthDay = String(prng.nextInt(1, 28)).padStart(2, "0");
  const dateOfBirth = `${birthYear}-${birthMonth}-${birthDay}`;
  const birthLoc = prng.pick(loc.cities);

  const nativeLang =
    options.nationality === "US" || options.nationality === "GB" || options.nationality === "CA"
      ? "English"
      : options.nationality === "DE"
      ? "German"
      : options.nationality === "IN"
      ? "Hindi"
      : options.nationality === "JP"
      ? "Japanese"
      : "Estonian";

  const englishProficiency =
    options.nationality === "US" || options.nationality === "GB" || options.nationality === "CA"
      ? "native"
      : "fluent";

  return {
    firstName,
    middleName,
    lastName,
    legalFullName,
    aliases: [
      `${firstName[0]}${lastName}`,
      `${lastName}0x`,
      prng.pick(["Shadow", "Ghost", "Zero", "Cipher", "Apex"]) + prng.digits(2)
    ],
    dateOfBirth,
    age,
    gender: gender as PersonalDemographics["gender"],
    sex: sex as PersonalDemographics["sex"],
    nationality: options.nationality,
    citizenship: [options.nationality],
    placeOfBirth: { city: birthLoc.city, stateProvince: birthLoc.stateProvince, country: options.nationality },
    ethnicity: `${options.nationality} Heritage`,
    languages: [
      { language: nativeLang, proficiency: "native" },
      { language: "English", proficiency: englishProficiency }
    ],
    maritalStatus: prng.pick(["single", "married", "divorced"]),
    bloodType: prng.pick(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
  };
}

export const generateDemographicsDomain = generatePersonalDomain;
