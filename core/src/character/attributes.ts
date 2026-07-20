import type { RngAdapter } from "../adapters/RngAdapter.js";
import type { CanonDataBundle, HouseId } from "../data/types.js";
import type { CharacterAttributes } from "./types.js";

/**
 * Light, text-RPG-appropriate stats: a 1-10 aptitude per core subject.
 * Deliberately simple — a base score, a small house-flavored nudge toward
 * subjects that house's traits suit, and a little RNG jitter so no two
 * characters in the same house are identical.
 */
const HOUSE_SUBJECT_BONUS: Record<HouseId, Record<string, number>> = {
  gryffindor: { "defence-against-the-dark-arts": 2, "flying-lessons": 1 },
  hufflepuff: { herbology: 2, "care-of-magical-creatures": 1 },
  ravenclaw: { charms: 2, "ancient-runes": 1 },
  slytherin: { potions: 2, transfiguration: 1 },
};

const BASE_APTITUDE = 5;

export function rollAttributes(
  data: CanonDataBundle,
  house: HouseId,
  rng: RngAdapter
): CharacterAttributes {
  const coreSubjects = data.subjects.filter((s) => s.category === "core");
  const bonuses = HOUSE_SUBJECT_BONUS[house];

  const subjectAptitude: Record<string, number> = {};
  for (const subject of coreSubjects) {
    const bonus = bonuses[subject.id] ?? 0;
    const jitter = rng.nextInt(-1, 1);
    const score = Math.min(10, Math.max(1, BASE_APTITUDE + bonus + jitter));
    subjectAptitude[subject.id] = score;
  }

  return { subjectAptitude };
}
