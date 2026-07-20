import type { RngAdapter } from "../adapters/RngAdapter.js";
import type { UiAdapter } from "../adapters/UiAdapter.js";
import type { CanonDataBundle } from "../data/types.js";
import { validateCharacter } from "../canon/validator.js";
import { runAppearanceFlow } from "./appearance.js";
import { runBackstoryFlow } from "./backstory.js";
import { runBloodStatusFlow } from "./bloodStatus.js";
import { runIdentityFlow } from "./identity.js";
import { runSortingHatFlow } from "./sortingHat.js";
import type { Character } from "./types.js";
import { runWandFlow } from "./wand.js";
import { rollAttributes } from "./attributes.js";

/** Valid Hogwarts start years for v1 — the seven core-canon years, 1997 being the last normal-ish intake before the war year. */
const PLAYABLE_START_YEARS = [1991, 1992, 1993, 1994, 1995, 1996, 1997] as const;

const ERA_BLURBS: Record<number, string> = {
  1991: "the year Harry Potter himself started at Hogwarts",
  1992: "the year the Chamber of Secrets was reopened",
  1993: "the year Sirius Black escaped Azkaban",
  1994: "the year of the Triwizard Tournament",
  1995: "the year Dolores Umbridge took over as High Inquisitor",
  1996: "the year Horace Slughorn returned to teach Potions",
  1997: "the eve of war — Voldemort's followers are gaining ground",
};

async function chooseEra(ui: UiAdapter): Promise<number> {
  const choiceId = await ui.choose(
    "What year does your story begin? (September of the year you choose.)",
    PLAYABLE_START_YEARS.map((year) => ({
      id: String(year),
      label: `${year} — ${ERA_BLURBS[year]}`,
    }))
  );
  return Number(choiceId);
}

function generateId(rng: RngAdapter, hogwartsStartYear: number): string {
  return `pc-${hogwartsStartYear}-${rng.nextInt(100000, 999999)}`;
}

export async function createCharacterFlow(
  ui: UiAdapter,
  rng: RngAdapter,
  data: CanonDataBundle
): Promise<Character> {
  const hogwartsStartYear = await chooseEra(ui);
  const { identity } = await runIdentityFlow(ui, data, hogwartsStartYear);
  const bloodStatus = await runBloodStatusFlow(ui, data, hogwartsStartYear);
  const backstory = await runBackstoryFlow(ui);
  const appearance = await runAppearanceFlow(ui);
  const sorting = await runSortingHatFlow(ui, rng);
  const wand = await runWandFlow(ui, rng, data, identity.name);
  const attributes = rollAttributes(data, sorting.house, rng);

  const character: Character = {
    schemaVersion: 1,
    id: generateId(rng, hogwartsStartYear),
    identity,
    bloodStatus,
    backstory,
    appearance,
    house: sorting.house,
    sortingHatReasoning: sorting.reasoning,
    wand,
    attributes,
    creationSeed: rng.seed,
    createdAt: new Date().toISOString(),
  };

  const violations = validateCharacter(character, data);
  for (const violation of violations) {
    await ui.print(`[${violation.severity}] ${violation.message}`);
  }

  return character;
}
