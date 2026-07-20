import type { NarratorAdapter } from "../adapters/NarratorAdapter.js";
import { NullNarratorAdapter } from "../adapters/NarratorAdapter.js";
import type { UiAdapter } from "../adapters/UiAdapter.js";
import type { Character } from "../character/types.js";
import type { CanonDataBundle } from "../data/types.js";
import { buildNarratorContext } from "./narratorPrompt.js";
import { buildWiderWorldParagraph, getDadaProfessor } from "./widerWorld.js";
import { getUpbringingReaction } from "./reactions.js";
import type { Scene, SceneBundle, SceneBranch, SceneChoice } from "./types.js";

function calendarYearFor(character: Character, hogwartsYear: number): number {
  return character.identity.hogwartsStartYear + (hogwartsYear - 1);
}

function buildTokens(scene: Scene, character: Character, data: CanonDataBundle): Record<string, string> {
  const houseName = character.house[0].toUpperCase() + character.house.slice(1);
  const calendarYear = calendarYearFor(character, scene.hogwartsYear);
  return {
    name: character.identity.name,
    house: houseName,
    "wider-world": buildWiderWorldParagraph(calendarYear, data),
    "dada-professor": getDadaProfessor(calendarYear, data),
    "upbringing-reaction": getUpbringingReaction(character.backstory.upbringing),
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
  return character.bloodStatus === branch.bloodStatus ? branch.ifTrue : branch.ifFalse;
}

function resolveDestination(choice: SceneChoice, character: Character): string | null {
  return choice.branch ? resolveBranch(choice.branch, character) : choice.next;
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

  const chosenId = await ui.choose(
    "What do you do?",
    scene.choices.map((c) => ({ id: c.id, label: c.label }))
  );
  const choice = scene.choices.find((c) => c.id === chosenId);
  return choice ? resolveDestination(choice, character) : null;
}

export async function runGameLoop(
  ui: UiAdapter,
  character: Character,
  scenes: SceneBundle,
  startSceneId: string,
  data: CanonDataBundle,
  narrator: NarratorAdapter = new NullNarratorAdapter()
): Promise<void> {
  let currentId: string | null = startSceneId;

  while (currentId) {
    const scene: Scene | undefined = scenes[currentId];
    if (!scene) {
      await ui.print(`(The story trails off here — scene "${currentId}" isn't written yet.)`);
      return;
    }
    currentId = await runScene(ui, scene, character, data, narrator);
  }

  await ui.print("--- Your years at Hogwarts end here. ---");
}
