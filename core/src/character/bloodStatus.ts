import type { UiAdapter } from "../adapters/UiAdapter.js";
import type { BloodStatusId, CanonDataBundle } from "../data/types.js";

/** Era notes from the data layer whose `era` string matches the given story year. */
export function getEraImplications(
  bloodStatusId: BloodStatusId,
  storyYear: number,
  data: CanonDataBundle
): string[] {
  const entry = data.bloodStatuses.find((b) => b.id === bloodStatusId);
  if (!entry) return [];
  return entry.eraNotes
    .filter((note) => matchesEra(note.era, storyYear))
    .map((note) => note.note);
}

function matchesEra(era: string, storyYear: number): boolean {
  if (era === "throughout") return true;
  const rangeMatch = era.match(/^(\d{4})-(\d{4})$/);
  if (rangeMatch) {
    const [, start, end] = rangeMatch;
    return storyYear >= Number(start) && storyYear <= Number(end);
  }
  return era === String(storyYear);
}

export async function runBloodStatusFlow(
  ui: UiAdapter,
  data: CanonDataBundle,
  storyYear: number
): Promise<BloodStatusId> {
  const options = data.bloodStatuses
    .filter((b) => b.id !== "squib") // a Squib doesn't attend Hogwarts as a student
    .map((b) => ({ id: b.id, label: b.name, hint: b.description }));

  const bloodStatus = await ui.choose<BloodStatusId>(
    "What is your character's blood status?",
    options
  );

  const implications = getEraImplications(bloodStatus, storyYear, data);
  for (const note of implications) {
    await ui.print(note);
  }

  return bloodStatus;
}
