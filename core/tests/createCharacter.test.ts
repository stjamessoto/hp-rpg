import { describe, expect, it } from "vitest";
import { createSeededRngAdapter } from "@core/adapters/RngAdapter.js";
import { ScriptedUiAdapter } from "@core/adapters/UiAdapter.js";
import { MemoryStorageAdapter } from "@core/adapters/StorageAdapter.js";
import { canonData } from "@core/data/loader.js";
import { createCharacterFlow } from "@core/character/createCharacter.js";
import { loadCharacter, saveCharacter } from "@core/character/save.js";
import { validateCharacter } from "@core/canon/validator.js";

const SCRIPTED_ANSWERS = [
  "1991", // era
  "Test Testerson", // name
  "witch", // gender
  "1980", // birth year
  "half-blood", // blood status
  "wizarding", // upbringing
  "A quiet, entirely magical family, two younger siblings.", // family description
  "Excited and terrified in equal measure to start at Hogwarts.", // backstory free text
  "Black", // hair
  "Brown", // eyes
  "Average height, quick on her feet", // build
  "", // distinguishing features
  "Keeps her sleeves rolled up.", // appearance free text
  "quiz", // sorting mode: let the Hat decide
  "shield-them", // sorting: corridor
  "try-the-handle", // sorting: unlocked-door
  "cowardice", // sorting: greatest-fear
  "dont-care-about-reward", // sorting: reward
  "go-along", // sorting: disagreement
  "known-for-courage", // sorting: define-success
  false, // no stated house preference
  "instinct", // wand: temperament
  "confront", // wand: loyalty
  "protect", // wand: ambition
];

describe("createCharacterFlow", () => {
  it("produces a canon-valid character from a full scripted playthrough", async () => {
    const ui = new ScriptedUiAdapter(SCRIPTED_ANSWERS);
    const rng = createSeededRngAdapter(42);

    const character = await createCharacterFlow(ui, rng, canonData);

    expect(character.schemaVersion).toBe(1);
    expect(character.identity.name).toBe("Test Testerson");
    expect(character.identity.hogwartsStartYear).toBe(1991);
    expect(["gryffindor", "hufflepuff", "ravenclaw", "slytherin"]).toContain(character.house);
    expect(character.wand.wood).toBeTruthy();
    expect(character.wand.core).toBeTruthy();
    expect(Object.keys(character.attributes.subjectAptitude).length).toBeGreaterThan(0);

    const violations = validateCharacter(character, canonData);
    expect(violations.filter((v) => v.severity === "error")).toHaveLength(0);
  });

  it("is reproducible: the same seed and answers produce the same wand and house", async () => {
    const run = async () => {
      const ui = new ScriptedUiAdapter(SCRIPTED_ANSWERS);
      const rng = createSeededRngAdapter(42);
      return createCharacterFlow(ui, rng, canonData);
    };
    const a = await run();
    const b = await run();
    expect(a.house).toBe(b.house);
    expect(a.wand).toEqual(b.wand);
  });

  it("round-trips through save/load via a storage-agnostic adapter", async () => {
    const ui = new ScriptedUiAdapter(SCRIPTED_ANSWERS);
    const rng = createSeededRngAdapter(7);
    const character = await createCharacterFlow(ui, rng, canonData);

    const storage = new MemoryStorageAdapter();
    await saveCharacter(storage, character);
    const loaded = await loadCharacter(storage, character.id);

    expect(loaded).toEqual(character);
  });

  it("lets a player choose their house directly instead of taking the quiz", async () => {
    const answers: (string | boolean)[] = [
      "1991",
      "Test Testerson",
      "witch",
      "1980",
      "half-blood",
      "wizarding",
      "A quiet family.",
      "Excited to start.",
      "Black",
      "Brown",
      "Average height",
      "",
      "",
      "choose", // sorting mode: pick it myself
      "slytherin", // the chosen house
      "instinct",
      "confront",
      "protect",
    ];
    const ui = new ScriptedUiAdapter(answers);
    const rng = createSeededRngAdapter(42);

    const character = await createCharacterFlow(ui, rng, canonData);

    expect(character.house).toBe("slytherin");
    expect(character.sortingHatReasoning).toContain("SLYTHERIN");
  });
});
