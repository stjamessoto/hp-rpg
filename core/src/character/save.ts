import type { StorageAdapter } from "../adapters/StorageAdapter.js";
import type { Character } from "./types.js";

const KEY_PREFIX = "hp-rpg:character:";
const INDEX_KEY = "hp-rpg:character-index";

function keyFor(id: string): string {
  return `${KEY_PREFIX}${id}`;
}

async function readIndex(storage: StorageAdapter): Promise<string[]> {
  const raw = await storage.getItem(INDEX_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

async function writeIndex(storage: StorageAdapter, ids: string[]): Promise<void> {
  await storage.setItem(INDEX_KEY, JSON.stringify(ids));
}

/** Storage-agnostic save: works identically against localStorage today and device storage later. */
export async function saveCharacter(storage: StorageAdapter, character: Character): Promise<void> {
  await storage.setItem(keyFor(character.id), JSON.stringify(character));
  const index = await readIndex(storage);
  if (!index.includes(character.id)) {
    await writeIndex(storage, [...index, character.id]);
  }
}

export async function loadCharacter(storage: StorageAdapter, id: string): Promise<Character | null> {
  const raw = await storage.getItem(keyFor(id));
  if (!raw) return null;
  const parsed = JSON.parse(raw) as Character;
  if (parsed.schemaVersion !== 1) {
    throw new Error(`Unsupported character save schemaVersion: ${parsed.schemaVersion}`);
  }
  return parsed;
}

export async function listCharacterIds(storage: StorageAdapter): Promise<string[]> {
  return readIndex(storage);
}

export async function deleteCharacter(storage: StorageAdapter, id: string): Promise<void> {
  await storage.removeItem(keyFor(id));
  const index = await readIndex(storage);
  await writeIndex(storage, index.filter((existingId) => existingId !== id));
}
