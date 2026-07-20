import type { StorageAdapter } from "../adapters/StorageAdapter.js";

/**
 * Where a character is in the 7-year scene chain — separate from the
 * `Character` save itself (identity/house/wand/etc, see
 * character/save.ts), since the two change at very different rates and a
 * finished character should stay loadable/viewable after their story
 * (and this progress record) is gone.
 */
export interface GameProgress {
  schemaVersion: 1;
  characterId: string;
  currentSceneId: string;
  updatedAt: string;
}

const KEY_PREFIX = "hp-rpg:progress:";

function keyFor(characterId: string): string {
  return `${KEY_PREFIX}${characterId}`;
}

export async function saveGameProgress(
  storage: StorageAdapter,
  characterId: string,
  currentSceneId: string
): Promise<void> {
  const progress: GameProgress = {
    schemaVersion: 1,
    characterId,
    currentSceneId,
    updatedAt: new Date().toISOString(),
  };
  await storage.setItem(keyFor(characterId), JSON.stringify(progress));
}

export async function loadGameProgress(
  storage: StorageAdapter,
  characterId: string
): Promise<GameProgress | null> {
  const raw = await storage.getItem(keyFor(characterId));
  if (!raw) return null;
  const parsed = JSON.parse(raw) as GameProgress;
  if (parsed.schemaVersion !== 1) {
    throw new Error(`Unsupported game progress schemaVersion: ${parsed.schemaVersion}`);
  }
  return parsed;
}

/** Called when a playthrough reaches its natural end, so a finished story doesn't show up as "continue"-able. */
export async function deleteGameProgress(storage: StorageAdapter, characterId: string): Promise<void> {
  await storage.removeItem(keyFor(characterId));
}
