import { validateAge } from "../character/identity.js";
import { validateBackstoryText } from "../character/backstory.js";
import type { Character } from "../character/types.js";
import type { CanonDataBundle, HouseId } from "../data/types.js";

export type ViolationSeverity = "error" | "warning";

export interface Violation {
  severity: ViolationSeverity;
  code: string;
  message: string;
}

/** A backstory tag of the form "house-locked:<houseId>" pins a character to a house ahead of Sorting. */
function lockedHouseFromTags(tags: string[]): HouseId | null {
  for (const tag of tags) {
    const match = tag.match(/^house-locked:(gryffindor|hufflepuff|ravenclaw|slytherin)$/);
    if (match) return match[1] as HouseId;
  }
  return null;
}

/** Violation: attending Hogwarts too young (or too old) for the chosen start year. */
export function validateAgeViolation(character: Character): Violation[] {
  const error = validateAge(character.identity.birthYear, character.identity.hogwartsStartYear);
  return error ? [{ severity: "error", code: "invalid-age", message: error }] : [];
}

/** Violation: Sorted house contradicts a backstory tag that locked the house in advance. */
export function validateHouseLock(character: Character): Violation[] {
  const locked = lockedHouseFromTags(character.backstory.tags);
  if (locked && locked !== character.house) {
    return [
      {
        severity: "error",
        code: "house-contradicts-lock",
        message: `Backstory locks this character to ${locked}, but they were Sorted into ${character.house}.`,
      },
    ];
  }
  return [];
}

/** Violation: backstory free text makes a claim that contradicts a canonically closed family. */
export function validateBackstoryCanon(character: Character): Violation[] {
  const text = `${character.backstory.familyDescription} ${character.backstory.freeText}`;
  return validateBackstoryText(text).map((v) => ({
    severity: "error" as const,
    code: "backstory-contradicts-canon",
    message: v.message,
  }));
}

/** Violation: a spell referenced in a scene/choice hasn't been invented/isn't public knowledge yet in the given story year. */
export function validateSpellEra(spellId: string, storyYear: number, data: CanonDataBundle): Violation[] {
  const spell = data.spells.find((s) => s.id === spellId);
  if (!spell) {
    return [{ severity: "warning", code: "unknown-spell", message: `Spell "${spellId}" is not in the canon data layer.` }];
  }
  const firstYear = spell.firstCanonicalAppearance?.year;
  if (firstYear !== null && firstYear !== undefined && storyYear < firstYear) {
    return [
      {
        severity: "error",
        code: "spell-not-yet-known",
        message: `${spell.incantation ?? spell.id} isn't shown in canon until ${firstYear} — using it in ${storyYear} is an anachronism.`,
      },
    ];
  }
  return [];
}

/**
 * Violation: an NPC is referenced as present after their death year, before
 * their birth year, or (loosely) outside any recorded status window.
 *
 * `storyYear` is the Hogwarts school-year-start label (e.g. 1996 means the
 * Sept 1996 - June 1997 school year). `deathYear` is stored as the literal
 * real-world calendar year a death occurs in `characters.json`. Several
 * canon deaths (Sirius Black, Dumbledore, everyone lost at the Battle of
 * Hogwarts) happen in the second half of a school year — e.g. Dumbledore
 * dies June 1997, which is the tail end of story-year 1996, not 1997. That
 * means a death in calendar year Y makes an NPC absent starting story-year
 * Y (not Y+1) — hence `>=` rather than `>` below.
 */
export function validateNpcPresence(characterId: string, storyYear: number, data: CanonDataBundle): Violation[] {
  const npc = data.characters.find((c) => c.id === characterId);
  if (!npc) {
    return [{ severity: "warning", code: "unknown-npc", message: `Character "${characterId}" is not in the canon data layer.` }];
  }
  const violations: Violation[] = [];
  if (npc.deathYear !== null && storyYear >= npc.deathYear) {
    violations.push({
      severity: "error",
      code: "npc-dead",
      message: `${npc.name} died in ${npc.deathYear} and cannot appear in ${storyYear}.`,
    });
  }
  if (npc.birthYear !== null && storyYear < npc.birthYear) {
    violations.push({
      severity: "error",
      code: "npc-not-born",
      message: `${npc.name} was not yet born in ${storyYear} (born ${npc.birthYear}).`,
    });
  }
  return violations;
}

/** Non-fatal informational note, not a violation: blood-status era risk (e.g. 1997-98 for Muggle-borns). */
export function validateEraRisk(character: Character, data: CanonDataBundle): Violation[] {
  if (character.bloodStatus !== "muggle-born") return [];
  const startYear = character.identity.hogwartsStartYear;
  const inRegistrationEra = startYear <= 1998 && startYear + 7 >= 1997;
  if (!inRegistrationEra) return [];
  return [
    {
      severity: "warning",
      code: "muggle-born-registration-risk",
      message:
        "A Muggle-born character attending in or after 1997 will live through the Muggle-born Registration Commission — a genuine, canon-documented danger, not just flavor text.",
    },
  ];
}

/** Full validation pass over a character against the canon data layer. */
export function validateCharacter(character: Character, data: CanonDataBundle): Violation[] {
  return [
    ...validateAgeViolation(character),
    ...validateHouseLock(character),
    ...validateBackstoryCanon(character),
    ...validateEraRisk(character, data),
  ];
}
