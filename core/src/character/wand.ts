import type { RngAdapter } from "../adapters/RngAdapter.js";
import type { UiAdapter, UiChoice } from "../adapters/UiAdapter.js";
import type { CanonDataBundle, WandCore, WandWood } from "../data/types.js";
import type { CharacterWand } from "./types.js";

interface WeightedOption {
  id: string;
  label: string;
  woodWeights: Record<string, number>;
  coreWeights: Record<string, number>;
}

/**
 * The Elder Wand's wood (elder) and its thestral-tail-hair core are unique
 * Deathly Hallow lore, not stock Ollivander sells to a first-year — they
 * are excluded from the ordinary assignment pool.
 */
const EXCLUDED_WOOD_IDS = new Set(["elder"]);
const EXCLUDED_CORE_IDS = new Set(["thestral-tail-hair"]);

const WAND_QUESTIONS: { id: string; prompt: string; options: WeightedOption[] }[] = [
  {
    id: "temperament",
    prompt: "Ollivander studies you for a moment. \"Tell me — when you want something, are you more likely to plan carefully, or act on instinct?\"",
    options: [
      { id: "plan", label: "Plan carefully.", woodWeights: { oak: 2, vine: 1 }, coreWeights: { "unicorn-hair": 1 } },
      { id: "instinct", label: "Act on instinct.", woodWeights: { hawthorn: 2, yew: 1 }, coreWeights: { "dragon-heartstring": 1 } },
    ],
  },
  {
    id: "loyalty",
    prompt: "\"And if someone you trusted turned out to have deceived you — what then?\"",
    options: [
      { id: "forgive", label: "I'd look for a reason to forgive them.", woodWeights: { willow: 2, oak: 1 }, coreWeights: { "unicorn-hair": 2 } },
      { id: "confront", label: "I'd want it out in the open, whatever it cost.", woodWeights: { hawthorn: 1, holly: 2 }, coreWeights: { "phoenix-feather": 1 } },
      { id: "wary", label: "I don't think I'd trust easily again.", woodWeights: { yew: 2, vine: 1 }, coreWeights: { "dragon-heartstring": 1 } },
    ],
  },
  {
    id: "ambition",
    prompt: "\"One more. What would you say you want most, out of all this?\"",
    options: [
      { id: "protect", label: "To protect the people who matter to me.", woodWeights: { holly: 2, willow: 1 }, coreWeights: { "phoenix-feather": 2 } },
      { id: "understand", label: "To understand things properly, all the way down.", woodWeights: { vine: 2, oak: 1 }, coreWeights: { "unicorn-hair": 1 } },
      { id: "matter", label: "To matter — to do something people remember.", woodWeights: { yew: 2, hawthorn: 1 }, coreWeights: { "dragon-heartstring": 2 } },
    ],
  },
];

function pickTop(weights: Record<string, number>, fallback: string, rng: RngAdapter): string {
  const entries = Object.entries(weights);
  if (entries.length === 0) return fallback;
  const max = Math.max(...entries.map(([, w]) => w));
  const top = entries.filter(([, w]) => w === max).map(([id]) => id);
  return top.length === 1 ? top[0] : rng.pick(top);
}

function findWood(data: CanonDataBundle, id: string): WandWood {
  const wood = data.wands.woods.find((w) => w.id === id && !EXCLUDED_WOOD_IDS.has(w.id));
  return wood ?? data.wands.woods.find((w) => !EXCLUDED_WOOD_IDS.has(w.id))!;
}

function findCore(data: CanonDataBundle, id: string): WandCore {
  const core = data.wands.cores.find((c) => c.id === id && !EXCLUDED_CORE_IDS.has(c.id));
  return core ?? data.wands.cores.find((c) => !EXCLUDED_CORE_IDS.has(c.id))!;
}

function buildFlavorText(characterName: string, wood: WandWood, core: WandCore, lengthInches: number, flexibility: string): string {
  return (
    `Ollivander measures you with a tape that keeps working after he's let go of it, then vanishes for a long moment among the shelves. ` +
    `He returns with a single narrow box. "Try this," he says. "${wood.name} and ${core.name.toLowerCase()}, ` +
    `${lengthInches} inches, ${flexibility}." ${wood.ollivanderNote} ${core.description} ` +
    `A warmth spreads from your fingers up your arm the moment you take it. Ollivander smiles, just slightly. "Curious," he says, as he always does. "Curious indeed."`
  );
}

export async function runWandFlow(
  ui: UiAdapter,
  rng: RngAdapter,
  data: CanonDataBundle,
  characterName: string
): Promise<CharacterWand> {
  await ui.print(
    "Ollivander's is narrow and shabby, a single spindly chair against a wall stacked to the ceiling with thin boxes. \"Good afternoon,\" says a soft voice right behind you."
  );

  const woodWeights: Record<string, number> = {};
  const coreWeights: Record<string, number> = {};

  for (const question of WAND_QUESTIONS) {
    const choices: UiChoice[] = question.options.map((o) => ({ id: o.id, label: o.label }));
    const answerId = await ui.choose(question.prompt, choices);
    const option = question.options.find((o) => o.id === answerId)!;
    for (const [wood, weight] of Object.entries(option.woodWeights)) {
      woodWeights[wood] = (woodWeights[wood] ?? 0) + weight;
    }
    for (const [core, weight] of Object.entries(option.coreWeights)) {
      coreWeights[core] = (coreWeights[core] ?? 0) + weight;
    }
  }

  const wood = findWood(data, pickTop(woodWeights, "holly", rng));
  const core = findCore(data, pickTop(coreWeights, "phoenix-feather", rng));

  const { min, max, typical } = data.wands.lengthRangeInches;
  const jitter = rng.nextInt(-2, 2);
  const lengthInches = Math.min(max, Math.max(min, typical + jitter));

  const flexibility = rng.pick(data.wands.flexibilities);

  const flavorText = buildFlavorText(characterName, wood, core, lengthInches, flexibility);
  await ui.print(flavorText);

  return { wood: wood.id, core: core.id, lengthInches, flexibility, flavorText };
}
