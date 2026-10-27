import type { PRNG } from "../prng/mulberry32.js";
import type { PhysicalCharacteristics, SexType } from "../../shared/types/dossier.js";

export function generatePhysicalDomain(
  prng: PRNG,
  sex: SexType
): PhysicalCharacteristics {
  return {
    heightCm: sex === "M" ? prng.nextInt(170, 195) : prng.nextInt(158, 178),
    weightKg: sex === "M" ? prng.nextInt(68, 102) : prng.nextInt(52, 78),
    eyeColor: prng.pick(["amber", "blue", "brown", "gray", "green", "hazel"]),
    hairColor: prng.pick(["black", "brown", "blonde", "red", "gray"]),
    hairStyle: prng.pick(["short taper", "side part", "buzz cut", "shoulder-length wavy"]),
    skinTone: prng.pick(["Fair, Fitzpatrick Type II", "Medium, Fitzpatrick Type III", "Olive, Fitzpatrick Type IV"]),
    facialHair: sex === "M" ? prng.pick(["none", "clean-shaven", "stubble", "full-beard", "goatee"]) : "none",
    distinguishingFeatures: [
      {
        type: prng.pick(["scar", "tattoo", "birthmark"]),
        location: prng.pick(["left forearm", "right shoulder", "neck", "jawline"]),
        description: prng.pick(["linear surgical scar", "geometric symbol", "faint pigmented mark"])
      }
    ],
    biometricFingerprintHash: prng.hex(64),
    correctiveLenses: prng.pick(["none", "glasses", "contacts", "both"])
  };
}
