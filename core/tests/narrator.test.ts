import { describe, expect, it } from "vitest";
import { NullNarratorAdapter } from "@core/adapters/NarratorAdapter.js";
import type { NarratorAdapter, NarratorContext } from "@core/adapters/NarratorAdapter.js";
import { createSeededRngAdapter } from "@core/adapters/RngAdapter.js";
import { ScriptedUiAdapter } from "@core/adapters/UiAdapter.js";
import { canonData } from "@core/data/loader.js";
import { createCharacterFlow } from "@core/character/createCharacter.js";
import { buildNarratorContext } from "@core/game/narratorPrompt.js";
import { runGameLoop, runScene } from "@core/game/sceneEngine.js";
import { sceneBundle } from "@core/game/scenesLoader.js";
import type { Scene } from "@core/game/types.js";

const SORTING_FEAST = sceneBundle["sorting-feast"];

async function makeCharacter() {
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
    "Tall",
    "",
    "",
    "shield-them",
    "try-the-handle",
    "cowardice",
    "dont-care-about-reward",
    "go-along",
    "known-for-courage",
    false,
    "instinct",
    "confront",
    "protect",
  ];
  const ui = new ScriptedUiAdapter(answers);
  const rng = createSeededRngAdapter(1);
  return createCharacterFlow(ui, rng, canonData);
}

describe("buildNarratorContext", () => {
  it("fills the system prompt with the character's actual house and story year", async () => {
    const character = await makeCharacter();
    const context = buildNarratorContext(SORTING_FEAST, character, canonData);
    const houseName = character.house[0].toUpperCase() + character.house.slice(1);
    expect(context.systemPrompt).toContain("Current story year: 1991");
    expect(context.systemPrompt).toContain(`House: ${houseName}`);
    expect(context.systemPrompt).not.toContain("{{");
  });

  it("grounds the call in this character's specific backstory and blood status, not generic facts", async () => {
    const character = await makeCharacter();
    const context = buildNarratorContext(SORTING_FEAST, character, canonData);
    expect(context.groundingFacts.bloodStatus).toBe(character.bloodStatus);
    expect(context.groundingFacts.backstoryFreeText).toBe(character.backstory.freeText);
    expect(context.groundingFacts.wand).toEqual(character.wand);
  });
});

describe("NullNarratorAdapter", () => {
  it("always returns null", async () => {
    const narrator = new NullNarratorAdapter();
    await expect(narrator.generate({ systemPrompt: "", instruction: "", groundingFacts: {} })).resolves.toBeNull();
  });
});

class MockNarratorAdapter implements NarratorAdapter {
  calls: NarratorContext[] = [];
  constructor(private readonly response: string | null) {}
  async generate(context: NarratorContext): Promise<string | null> {
    this.calls.push(context);
    return this.response;
  }
}

describe("runScene with a NarratorAdapter", () => {
  it("prints the narrator's enrichment text after the scene's own prose, when provided", async () => {
    const character = await makeCharacter();
    const ui = new ScriptedUiAdapter(["talk-to-neighbour"]);
    const narrator = new MockNarratorAdapter("A wholly invented personal aside, grounded in canon.");

    await runScene(ui, SORTING_FEAST, character, canonData, narrator);

    expect(ui.printed).toContain("A wholly invented personal aside, grounded in canon.");
    expect(narrator.calls).toHaveLength(1);
    expect(narrator.calls[0].groundingFacts.sceneTitle).toBe(SORTING_FEAST.title);
  });

  it("prints nothing extra when the narrator returns null (default, or a failed call)", async () => {
    const character = await makeCharacter();
    const ui = new ScriptedUiAdapter(["talk-to-neighbour"]);
    const narrator = new MockNarratorAdapter(null);

    const beforeCount = ui.printed.length;
    await runScene(ui, SORTING_FEAST, character, canonData, narrator);

    // Only the title + 3 prose paragraphs should have been printed — no extra line for a null response.
    expect(ui.printed.length - beforeCount).toBe(4);
  });

  it("defaults to NullNarratorAdapter (zero calls, zero extra prose) when no narrator is passed to runGameLoop", async () => {
    const character = await makeCharacter();
    const ui = new ScriptedUiAdapter(["talk-to-neighbour"]);
    const soloScene: Record<string, Scene> = { "sorting-feast": { ...SORTING_FEAST, choices: [] } };

    await runGameLoop(ui, character, soloScene, "sorting-feast", canonData);

    // Title + 3 prose paragraphs + the loop's closing line, nothing more.
    expect(ui.printed).toHaveLength(5);
  });
});
