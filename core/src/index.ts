// Adapters (interfaces + reference/default implementations)
export type { StorageAdapter } from "./adapters/StorageAdapter.js";
export { MemoryStorageAdapter } from "./adapters/StorageAdapter.js";
export type { RngAdapter } from "./adapters/RngAdapter.js";
export { createSeededRngAdapter } from "./adapters/RngAdapter.js";
export type { UiAdapter, UiChoice } from "./adapters/UiAdapter.js";
export { ScriptedUiAdapter } from "./adapters/UiAdapter.js";
export type { NarratorAdapter, NarratorContext } from "./adapters/NarratorAdapter.js";
export { NullNarratorAdapter } from "./adapters/NarratorAdapter.js";

// Canon data layer
export * from "./data/types.js";
export { canonData, getHouse, getCharacter, getSpell, getSubject } from "./data/loader.js";

// Character creation
export * from "./character/types.js";
export { createCharacterFlow } from "./character/createCharacter.js";
export { saveCharacter, loadCharacter, listCharacterIds, deleteCharacter } from "./character/save.js";
export { runSortingHatFlow, sortHat, scoreHouses, SORTING_QUESTIONS } from "./character/sortingHat.js";
export { runWandFlow } from "./character/wand.js";

// Canon validator
export * from "./canon/validator.js";

// Gameplay loop
export * from "./game/types.js";
export type { GameLoopOptions } from "./game/sceneEngine.js";
export { runGameLoop, runScene, CUSTOM_ACTION_ID } from "./game/sceneEngine.js";
export { buildWiderWorldParagraph, getDadaProfessor, getSubjectProfessor } from "./game/widerWorld.js";
export { getUpbringingReaction } from "./game/reactions.js";
export { buildNarratorContext, buildFreeActionContext } from "./game/narratorPrompt.js";
export { sceneBundle, INTRO_START_SCENE_ID } from "./game/scenesLoader.js";
export type { GameProgress } from "./game/gameSave.js";
export { saveGameProgress, loadGameProgress, deleteGameProgress } from "./game/gameSave.js";
