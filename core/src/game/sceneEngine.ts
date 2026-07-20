import type { NarratorAdapter } from "../adapters/NarratorAdapter.js";
import { NullNarratorAdapter } from "../adapters/NarratorAdapter.js";
import type { StorageAdapter } from "../adapters/StorageAdapter.js";
import type { UiAdapter } from "../adapters/UiAdapter.js";
import type { Character } from "../character/types.js";
import type { CanonDataBundle } from "../data/types.js";
import { deleteGameProgress, saveGameProgress } from "./gameSave.js";
import { buildFreeActionContext, buildNarratorContext } from "./narratorPrompt.js";
import { buildWiderWorldParagraph, getDadaProfessor, getSubjectProfessor } from "./widerWorld.js";
import { getUpbringingReaction } from "./reactions.js";
import type { Scene, SceneBundle, SceneBranch, SceneChoice } from "./types.js";

function calendarYearFor(character: Character, hogwartsYear: number): number {
  return character.identity.hogwartsStartYear + (hogwartsYear - 1);
}

function buildWandSummary(character: Character, data: CanonDataBundle): string {
  const wood = data.wands.woods.find((w) => w.id === character.wand.wood);
  const core = data.wands.cores.find((c) => c.id === character.wand.core);
  const woodName = wood?.name.toLowerCase() ?? character.wand.wood;
  const coreName = core?.name.toLowerCase() ?? character.wand.core;
  return `${character.wand.lengthInches}" of ${woodName}, ${coreName}`;
}

function buildTokens(scene: Scene, character: Character, data: CanonDataBundle): Record<string, string> {
  const houseName = character.house[0].toUpperCase() + character.house.slice(1);
  const calendarYear = calendarYearFor(character, scene.hogwartsYear);
  return {
    name: character.identity.name,
    house: houseName,
    "wider-world": buildWiderWorldParagraph(calendarYear, data),
    "dada-professor": getDadaProfessor(calendarYear, data),
    "potions-professor": getSubjectProfessor("potions", calendarYear, data),
    "comc-professor": getSubjectProfessor("care-of-magical-creatures", calendarYear, data),
    "upbringing-reaction": getUpbringingReaction(character.backstory.upbringing),
    "wand-summary": buildWandSummary(character, data),
  };
}

function renderProse(paragraphs: string[], tokens: Record<string, string>): string[] {
  // split/join rather than String.prototype.replaceAll, which isn't
  // available on older JS engines some React Native/Hermes versions ship.
  return paragraphs.map((paragraph) =>
    Object.entries(tokens).reduce(
      (text, [key, value]) => text.split(`{{${key}}}`).join(value),
      paragraph
    )
  );
}

function resolveBranch(branch: SceneBranch, character: Character): string {
  if (branch.on === "calendarYear") {
    const targetCalendarYear = calendarYearFor(character, branch.targetHogwartsYear);
    return targetCalendarYear >= branch.calendarYearAtLeast ? branch.ifTrue : branch.ifFalse;
  }
  if (branch.on === "calendarYearLookup") {
    const targetCalendarYear = calendarYearFor(character, branch.targetHogwartsYear);
    return branch.cases[targetCalendarYear] ?? branch.fallback;
  }
  return character.bloodStatus === branch.bloodStatus ? branch.ifTrue : branch.ifFalse;
}

function resolveDestination(choice: SceneChoice, character: Character): string | null {
  return choice.branch ? resolveBranch(choice.branch, character) : choice.next;
}

export const CUSTOM_ACTION_ID = "__custom-action__";
const CUSTOM_ACTION_LABEL = "Something else — type your own action.";

/**
 * The written choices in scene.choices funnel to the same next checkpoint
 * regardless of which one is picked (the only real forks are the
 * calendar-year and blood-status `branch`es, which are automatic, not
 * choice-driven) — so it's always safe to resolve a free-typed action
 * through the scene's first choice: for a branch scene that IS the branch,
 * for every other scene it's simply "the" destination.
 */
async function runCustomAction(
  ui: UiAdapter,
  scene: Scene,
  character: Character,
  data: CanonDataBundle,
  narrator: NarratorAdapter
): Promise<string | null> {
  const actionText = await ui.ask("What does your character do?", {
    placeholder: "Describe it in your own words...",
  });
  const reaction = await narrator.generate(buildFreeActionContext(scene, character, data, actionText));
  await ui.print(reaction ?? `You ${actionText.trim() || "wait and see what happens"}.`);
  return resolveDestination(scene.choices[0], character);
}

export async function runScene(
  ui: UiAdapter,
  scene: Scene,
  character: Character,
  data: CanonDataBundle,
  narrator: NarratorAdapter = new NullNarratorAdapter()
): Promise<string | null> {
  await ui.print(scene.title);
  const tokens = buildTokens(scene, character, data);
  for (const paragraph of renderProse(scene.prose, tokens)) {
    await ui.print(paragraph);
  }

  // Optional LLM-backed enrichment: a short extra beat reacting to this
  // character specifically. Silent no-op with NullNarratorAdapter (the
  // default) or on any failure — never blocks or errors the scene.
  const personalBeat = await narrator.generate(buildNarratorContext(scene, character, data));
  if (personalBeat) {
    await ui.print(personalBeat);
  }

  if (scene.choices.length === 0) return null;
  if (scene.choices.length === 1 && scene.choices[0].next === null && !scene.choices[0].branch) {
    await ui.print(scene.choices[0].label);
    return null;
  }

  const chosenId = await ui.choose("What do you do?", [
    ...scene.choices.map((c) => ({ id: c.id, label: c.label })),
    { id: CUSTOM_ACTION_ID, label: CUSTOM_ACTION_LABEL },
  ]);

  if (chosenId === CUSTOM_ACTION_ID) {
    return runCustomAction(ui, scene, character, data, narrator);
  }

  const choice = scene.choices.find((c) => c.id === chosenId);
  return choice ? resolveDestination(choice, character) : null;
}

export interface GameLoopOptions {
  /** Optional LLM-backed scene enrichment — see NarratorAdapter.ts. Defaults to a no-op. */
  narrator?: NarratorAdapter;
  /**
   * Optional save-file wiring: when provided, progress is saved after every
   * scene transition (so closing and reopening the app resumes exactly
   * where you left off) and cleared automatically once the story reaches
   * its natural end. Omit for a one-shot run (e.g. tests) that shouldn't
   * touch storage at all.
   */
  storage?: StorageAdapter;
}

export async function runGameLoop(
  ui: UiAdapter,
  character: Character,
  scenes: SceneBundle,
  startSceneId: string,
  data: CanonDataBundle,
  options: GameLoopOptions = {}
): Promise<void> {
  const narrator = options.narrator ?? new NullNarratorAdapter();
  let currentId: string | null = startSceneId;

  while (currentId) {
    const scene: Scene | undefined = scenes[currentId];
    if (!scene) {
      await ui.print(`(The story trails off here — scene "${currentId}" isn't written yet.)`);
      return;
    }
    currentId = await runScene(ui, scene, character, data, narrator);

    if (options.storage) {
      if (currentId) {
        await saveGameProgress(options.storage, character.id, currentId);
      } else {
        await deleteGameProgress(options.storage, character.id);
      }
    }
  }

  await ui.print("--- Your years at Hogwarts end here. ---");
}
