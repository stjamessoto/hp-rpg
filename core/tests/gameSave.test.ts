import { describe, expect, it } from "vitest";
import { createSeededRngAdapter } from "@core/adapters/RngAdapter.js";
import { ScriptedUiAdapter } from "@core/adapters/UiAdapter.js";
import { MemoryStorageAdapter } from "@core/adapters/StorageAdapter.js";
import { canonData } from "@core/data/loader.js";
import { createCharacterFlow } from "@core/character/createCharacter.js";
import { saveCharacter } from "@core/character/save.js";
import { deleteGameProgress, loadGameProgress, saveGameProgress } from "@core/game/gameSave.js";
import { runGameLoop } from "@core/game/sceneEngine.js";
import { sceneBundle } from "@core/game/scenesLoader.js";
import type { Scene } from "@core/game/types.js";

describe("saveGameProgress / loadGameProgress / deleteGameProgress", () => {
  it("round-trips a progress record", async () => {
    const storage = new MemoryStorageAdapter();
    await saveGameProgress(storage, "pc-1", "hogwarts-express");
    const loaded = await loadGameProgress(storage, "pc-1");
    expect(loaded).toMatchObject({ characterId: "pc-1", currentSceneId: "hogwarts-express" });
  });

  it("returns null for a character with no saved progress", async () => {
    const storage = new MemoryStorageAdapter();
    expect(await loadGameProgress(storage, "nobody")).toBeNull();
  });

  it("clears progress on delete", async () => {
    const storage = new MemoryStorageAdapter();
    await saveGameProgress(storage, "pc-1", "sorting-feast");
    await deleteGameProgress(storage, "pc-1");
    expect(await loadGameProgress(storage, "pc-1")).toBeNull();
  });

  it("keeps separate characters' progress independent", async () => {
    const storage = new MemoryStorageAdapter();
    await saveGameProgress(storage, "pc-1", "sorting-feast");
    await saveGameProgress(storage, "pc-2", "graduation");
    expect((await loadGameProgress(storage, "pc-1"))?.currentSceneId).toBe("sorting-feast");
    expect((await loadGameProgress(storage, "pc-2"))?.currentSceneId).toBe("graduation");
  });
});

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
    "quiz",
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

describe("runGameLoop with storage wired in", () => {
  it("auto-saves progress as the mid-chain scene id after each transition", async () => {
    const character = await makeCharacter();
    await saveCharacter(new MemoryStorageAdapter(), character); // sanity: save.ts still works independently
    const storage = new MemoryStorageAdapter();
    const ui = new ScriptedUiAdapter(["to-b", "end"]);
    const twoScenes: Record<string, Scene> = {
      "scene-a": {
        id: "scene-a",
        title: "A",
        hogwartsYear: 1,
        prose: ["First."],
        choices: [{ id: "to-b", label: "Go on.", next: "scene-b" }],
      },
      // scene-b points at a scene id that isn't in the bundle, so the loop
      // prints "isn't written yet" and returns right after resolving to it —
      // letting us inspect progress exactly as it stood after the first
      // (and only) real transition, without the loop running all the way
      // to a natural, progress-clearing end.
      "scene-b": {
        id: "scene-b",
        title: "B",
        hogwartsYear: 1,
        prose: ["Last."],
        choices: [{ id: "end", label: "Finish.", next: "scene-c-does-not-exist" }],
      },
    };

    await runGameLoop(ui, character, twoScenes, "scene-a", canonData, { storage });

    expect((await loadGameProgress(storage, character.id))?.currentSceneId).toBe("scene-c-does-not-exist");
  });

  it("clears progress once a two-scene chain reaches its natural end", async () => {
    const character = await makeCharacter();
    const storage = new MemoryStorageAdapter();
    const ui = new ScriptedUiAdapter(["no-pet-yet"]);
    const soloScene: Record<string, Scene> = {
      "diagon-alley": { ...sceneBundle["diagon-alley"], choices: [{ id: "no-pet-yet", label: "x", next: null }] },
    };

    await runGameLoop(ui, character, soloScene, "diagon-alley", canonData, { storage });

    expect(await loadGameProgress(storage, character.id)).toBeNull();
  });

  it("resuming from a saved mid-chain scene id skips everything before it", async () => {
    const character = await makeCharacter();
    const ui = new ScriptedUiAdapter(["continue"]);

    // Resume directly at wider-world-y1 rather than diagon-alley — none of
    // the earlier scenes' titles should appear. Only one answer is
    // scripted, so the loop runs out of answers partway into the next
    // scene and rejects — that's fine, we only care what got printed
    // before then.
    await runGameLoop(ui, character, sceneBundle, "wider-world-y1", canonData).catch(() => {});

    expect(ui.printed).toContain("Word From Beyond the Castle Walls");
    expect(ui.printed).not.toContain("Diagon Alley");
    expect(ui.printed).not.toContain("The Hogwarts Express");
    expect(ui.printed).not.toContain("The Sorting Feast");
  });

  it("clears progress once a playthrough reaches its natural end", async () => {
    const character = await makeCharacter();
    const storage = new MemoryStorageAdapter();
    await saveGameProgress(storage, character.id, "graduation"); // pretend they were mid-story
    const ui = new ScriptedUiAdapter([]); // graduation auto-prints its single terminal choice, no input needed

    await runGameLoop(ui, character, sceneBundle, "graduation", canonData, { storage });

    expect(await loadGameProgress(storage, character.id)).toBeNull();
  });
});
