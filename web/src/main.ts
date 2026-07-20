import type { NarratorAdapter } from "@core/adapters/NarratorAdapter.js";
import { createSeededRngAdapter } from "@core/adapters/RngAdapter.js";
import { canonData } from "@core/data/loader.js";
import { createCharacterFlow } from "@core/character/createCharacter.js";
import { saveCharacter } from "@core/character/save.js";
import type { Character } from "@core/character/types.js";
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

async function main(): Promise<void> {
  const seed = randomSeed();
  const rng = createSeededRngAdapter(seed);

  await ui.print(
    "Somewhere, a quill dips itself in ink. Your story is about to be written — let's begin."
  );

  const character = await createCharacterFlow(ui, rng, canonData);
  await saveCharacter(storage, character);

  await ui.print(renderCharacterSheet(character));
  await ui.print(`(seed ${seed} — reproducible via createSeededRngAdapter(${seed}))`);

  await runGameLoop(ui, character, sceneBundle, INTRO_START_SCENE_ID, canonData, narrator);

  await ui.print("Your character has been saved to this browser.");
}

main().catch((err) => {
  console.error(err);
  void ui.print(`Something went wrong: ${(err as Error).message}`);
});
