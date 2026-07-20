import type { UiAdapter } from "../adapters/UiAdapter.js";
import type { CanonDataBundle } from "../data/types.js";
import type { CharacterIdentity, Gender } from "./types.js";

export interface IdentityWarning {
  message: string;
}

/**
 * Hogwarts admits students who turn 11 on or before the 31 August prior to
 * the start of term. Without collecting an exact birth date, we accept the
 * two plausible ages (10 or 11 at the September start) and reject anything
 * further out as implausible.
 */
export function validateAge(birthYear: number, hogwartsStartYear: number): string | null {
  const age = hogwartsStartYear - birthYear;
  if (age < 10 || age > 11) {
    return `A student born in ${birthYear} would be ${age} in September ${hogwartsStartYear} — Hogwarts admits students who are turning 11 that year. Pick a birth year of ${hogwartsStartYear - 11} or ${hogwartsStartYear - 10}.`;
  }
  return null;
}

/** Non-fatal heads-up when the chosen birth year lands in a canonical character's own cohort. */
export function checkCanonicalCollision(
  birthYear: number,
  data: CanonDataBundle
): IdentityWarning[] {
  const warnings: IdentityWarning[] = [];
  for (const character of data.characters) {
    if (character.birthYear === birthYear) {
      warnings.push({
        message: `${character.name} was also born in ${birthYear} in canon — your character will share their year group. That's allowed, but keep it in mind if you write scenes involving them.`,
      });
    }
  }
  return warnings;
}

export interface IdentityFlowResult {
  identity: CharacterIdentity;
  warnings: IdentityWarning[];
}

export async function runIdentityFlow(
  ui: UiAdapter,
  data: CanonDataBundle,
  hogwartsStartYear: number
): Promise<IdentityFlowResult> {
  await ui.print(
    "Before your story begins, the quill wants a name. Who are you?"
  );
  const name = (await ui.ask("What is your character's full name?")).trim();

  const gender = await ui.choose<Gender>("How should the story refer to you?", [
    { id: "witch", label: "Witch" },
    { id: "wizard", label: "Wizard" },
    { id: "other", label: "Something else / I'll specify in free text" },
  ]);

  let birthYear = hogwartsStartYear - 11;
  for (;;) {
    const raw = await ui.ask(
      `What year was ${name || "your character"} born? (Hogwarts starts in September ${hogwartsStartYear}, so most first-years were born ${hogwartsStartYear - 11} or ${hogwartsStartYear - 10}.)`
    );
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      await ui.print("That doesn't look like a year — try again, e.g. 1980.");
      continue;
    }
    const error = validateAge(parsed, hogwartsStartYear);
    if (error) {
      await ui.print(error);
      continue;
    }
    birthYear = parsed;
    break;
  }

  const warnings = checkCanonicalCollision(birthYear, data);
  for (const warning of warnings) {
    await ui.print(warning.message);
  }

  return {
    identity: { name: name || "Unnamed", gender, birthYear, hogwartsStartYear },
    warnings,
  };
}
