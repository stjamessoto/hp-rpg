import type { NarratorAdapter } from "@core/adapters/NarratorAdapter.js";
import { createSeededRngAdapter } from "@core/adapters/RngAdapter.js";
import { canonData } from "@core/data/loader.js";
import { createCharacterFlow } from "@core/character/createCharacter.js";
import { listCharacterIds, loadCharacter, saveCharacter } from "@core/character/save.js";
import type { Character } from "@core/character/types.js";
import { loadGameProgress } from "@core/game/gameSave.js";
import { runGameLoop } from "@core/game/sceneEngine.js";
import { sceneBundle, INTRO_START_SCENE_ID } from "@core/game/scenesLoader.js";

import { DomUiAdapter } from "./adapters/DomUiAdapter.js";
import { GeminiNarratorAdapter } from "./adapters/GeminiNarratorAdapter.js";
import { LocalStorageAdapter } from "./adapters/LocalStorageAdapter.js";

const logEl = document.getElementById("log")!;
const controlsEl = document.getElementById("controls")!;

const ui = new DomUiAdapter(logEl, controlsEl);
const storage = new LocalStorageAdapter();

// Optional: only wired up if VITE_GEMINI_API_KEY is set (see web/.env.example).
// Undefined falls back to /core's own NullNarratorAdapter default — the
// game plays identically either way, just without the personalized extra
// beat each scene can otherwise carry.
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const narrator: NarratorAdapter | undefined = geminiApiKey
  ? new GeminiNarratorAdapter(geminiApiKey, import.meta.env.VITE_GEMINI_MODEL)
  : undefined;

function randomSeed(): number {
  const buffer = new Uint32Array(1);
  window.crypto.getRandomValues(buffer);
  return buffer[0];
}

function renderCharacterSheet(character: Character): string {
  const house = character.house[0].toUpperCase() + character.house.slice(1);
  const aptitudes = Object.entries(character.attributes.subjectAptitude)
    .map(([subjectId, score]) => {
      const subject = canonData.subjects.find((s) => s.id === subjectId);
      return `${subject?.name ?? subjectId}: ${score}/10`;
    })
    .join(" · ");

  return [
    `--- ${character.identity.name} ---`,
    `${character.identity.gender === "other" ? "" : character.identity.gender === "witch" ? "Witch" : "Wizard"}, born ${character.identity.birthYear} · ${character.bloodStatus}`,
    `House: ${house}`,
    `Wand: ${character.wand.lengthInches}", ${character.wand.flexibility}`,
    `Aptitude — ${aptitudes}`,
  ].join("\n");
}

async function runFromScene(character: Character, startSceneId: string): Promise<void> {
  await runGameLoop(ui, character, sceneBundle, startSceneId, canonData, { narrator, storage });
  await ui.print("Your progress has been saved to this browser.");
}

async function startNewCharacter(): Promise<void> {
  const seed = randomSeed();
  const rng = createSeededRngAdapter(seed);

  await ui.print(
    "Somewhere, a quill dips itself in ink. Your story is about to be written — let's begin."
  );

  const character = await createCharacterFlow(ui, rng, canonData);
  await saveCharacter(storage, character);

  await ui.print(renderCharacterSheet(character));
  await ui.print(`(seed ${seed} — reproducible via createSeededRngAdapter(${seed}))`);

  await runFromScene(character, INTRO_START_SCENE_ID);
}

/** Returns true if an existing save was picked up and played (so the caller shouldn't also start a new one). */
async function offerContinueOrNew(existingIds: string[]): Promise<boolean> {
  const NEW_CHARACTER_ID = "__new-character__";
  const options: { id: string; label: string }[] = [];
  const loaded = new Map<string, Character>();

  for (const id of existingIds) {
    const character = await loadCharacter(storage, id);
    if (!character) continue;
    loaded.set(id, character);

    const progress = await loadGameProgress(storage, id);
    const houseName = character.house[0].toUpperCase() + character.house.slice(1);
    if (progress) {
      const hogwartsYear = sceneBundle[progress.currentSceneId]?.hogwartsYear;
      const yearLabel = hogwartsYear ? `Year ${hogwartsYear}` : "in progress";
      options.push({ id, label: `Continue as ${character.identity.name} (${houseName}, ${yearLabel})` });
    } else {
      options.push({ id, label: `${character.identity.name} (${houseName}) — story complete` });
    }
  }
  options.push({ id: NEW_CHARACTER_ID, label: "Start a new character" });

  const choiceId = await ui.choose("Welcome back. What would you like to do?", options);
  if (choiceId === NEW_CHARACTER_ID) return false;

  const character = loaded.get(choiceId)!;
  const progress = await loadGameProgress(storage, choiceId);

  if (!progress) {
    await ui.print(renderCharacterSheet(character));
    await ui.print(`${character.identity.name}'s story has already reached its end.`);
    return true;
  }

  await ui.print(`Picking up where you left off, ${character.identity.name}...`);
  await runFromScene(character, progress.currentSceneId);
  return true;
}

async function main(): Promise<void> {
  const existingIds = await listCharacterIds(storage);
  const resumed = existingIds.length > 0 && (await offerContinueOrNew(existingIds));
  if (!resumed) {
    await startNewCharacter();
  }
}

main().catch((err) => {
  console.error(err);
  void ui.print(`Something went wrong: ${(err as Error).message}`);
});
