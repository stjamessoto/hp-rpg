import type { BloodStatusId, HouseId } from "../data/types.js";

export type Gender = "witch" | "wizard" | "other";

export interface CharacterIdentity {
  name: string;
  gender: Gender;
  /** Calendar year of birth, e.g. 1980. */
  birthYear: number;
  /** The story year (September) the character starts at Hogwarts, e.g. 1991. */
  hogwartsStartYear: number;
}

export type Upbringing = "wizarding" | "muggle" | "mixed";

export interface CharacterBackstory {
  upbringing: Upbringing;
  familyDescription: string;
  freeText: string;
  tags: string[];
}

export interface CharacterAppearance {
  hairColor: string;
  eyeColor: string;
  build: string;
  distinguishingFeatures: string[];
  freeText: string;
}

export interface CharacterWand {
  wood: string;
  core: string;
  lengthInches: number;
  flexibility: string;
  /** In-canon, Ollivander-voiced description generated at assignment time. */
  flavorText: string;
}

export interface CharacterAttributes {
  /** subjectId -> aptitude score, 1-10. */
  subjectAptitude: Record<string, number>;
}

export interface Character {
  schemaVersion: 1;
  id: string;
  identity: CharacterIdentity;
  bloodStatus: BloodStatusId;
  backstory: CharacterBackstory;
  appearance: CharacterAppearance;
  house: HouseId;
  sortingHatReasoning: string;
  wand: CharacterWand;
  attributes: CharacterAttributes;
  /** RNG seed the creation flow ran with, kept for reproducibility. */
  creationSeed: number;
  createdAt: string;
}
