/**
 * Shared shape for the canon data layer (/data/*.json).
 *
 * Every fact in the data layer carries `canonTier` and `source` so the
 * canon validator (and any future strictness setting) can decide how much
 * to trust it:
 *   - "book": stated or unambiguously implied in the seven novels.
 *   - "supplementary": Pottermore/Wizarding World author writing that does
 *     not contradict the books.
 *   - "wiki-only": sourced from the Harry Potter Wiki and not independently
 *     confirmed against the books. Treated as lowest-confidence and never
 *     allowed to override a "book" fact.
 *
 * Unknown facts are `null`, never invented.
 */
export type CanonTier = "book" | "supplementary" | "wiki-only";

export interface Canonical {
  canonTier: CanonTier;
  /** Human-readable citation, e.g. "Philosopher's Stone, ch. 7" or a wiki URL. */
  source: string;
}

export type HouseId = "gryffindor" | "hufflepuff" | "ravenclaw" | "slytherin";

export interface HeadOfHouse extends Canonical {
  name: string;
  eraStart: number | null;
  eraEnd: number | null;
}

export interface House extends Canonical {
  id: HouseId;
  name: string;
  founder: string;
  traits: string[];
  values: string[];
  commonRoomLocation: string;
  ghost: string | null;
  animal: string;
  element: string | null;
  colors: string[];
  headsOfHouse: HeadOfHouse[];
}

export interface WandWood extends Canonical {
  id: string;
  name: string;
  traits: string[];
  ollivanderNote: string;
}

export interface WandCore extends Canonical {
  id: string;
  name: string;
  description: string;
  notableTraits: string[];
}

export interface FamousWand extends Canonical {
  owner: string;
  wood: string;
  core: string;
  lengthInches: number | null;
  flexibility: string | null;
  notes: string;
}

export interface WandData extends Canonical {
  woods: WandWood[];
  cores: WandCore[];
  flexibilities: string[];
  lengthRangeInches: { min: number; max: number; typical: number };
  famousWands: FamousWand[];
}

export type SpellType =
  | "charm"
  | "curse"
  | "hex"
  | "jinx"
  | "transfiguration"
  | "counter-spell"
  | "spell";

export type SpellDifficulty = "simple" | "standard" | "advanced" | "newt-level" | "unknown";

export interface Spell extends Canonical {
  id: string;
  incantation: string | null;
  effect: string;
  type: SpellType;
  difficulty: SpellDifficulty;
  isUnforgivable: boolean;
  firstCanonicalAppearance: { book: string; year: number | null } | null;
  wandMovement: string | null;
}

export type BloodStatusId = "pure-blood" | "half-blood" | "muggle-born" | "squib";

export interface CharacterStatusAtYear extends Canonical {
  year: number;
  status: string;
  location: string | null;
}

/** A canonical NPC record — not to be confused with the player's own `Character` (see /core/character/types.ts). */
export interface CanonCharacter extends Canonical {
  id: string;
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  house: HouseId | null;
  bloodStatus: BloodStatusId | null;
  affiliations: string[];
  statusByYear: CharacterStatusAtYear[];
}

export interface TimelineEvent extends Canonical {
  id: string;
  year: number;
  date: string | null;
  title: string;
  description: string;
  relatedCharacterIds: string[];
}

export interface SubLocation extends Canonical {
  id: string;
  name: string;
  description: string;
}

export interface Location extends Canonical {
  id: string;
  name: string;
  region: string;
  type: string;
  description: string;
  notableFeatures: string[];
  subLocations: SubLocation[];
}

export interface Creature extends Canonical {
  id: string;
  name: string;
  classification: string | null;
  description: string;
  habitat: string;
  danger: string | null;
}

export interface ProfessorTenure extends Canonical {
  name: string;
  eraStart: number | null;
  eraEnd: number | null;
}

export interface Subject extends Canonical {
  id: string;
  name: string;
  category: "core" | "elective";
  yearIntroduced: number;
  owlAvailable: boolean;
  newtAvailable: boolean;
  professorsByEra: ProfessorTenure[];
}

export interface BloodStatusEraNote extends Canonical {
  era: string;
  note: string;
}

export interface BloodStatusEntry extends Canonical {
  id: BloodStatusId;
  name: string;
  description: string;
  eraNotes: BloodStatusEraNote[];
}

export interface Faction extends Canonical {
  id: string;
  name: string;
  description: string;
  alignment: "light" | "dark" | "neutral" | "institutional";
  activeYears: { start: number | null; end: number | null };
  notableMemberIds: string[];
}

export interface CanonDataBundle {
  houses: House[];
  wands: WandData;
  spells: Spell[];
  characters: CanonCharacter[];
  timeline: TimelineEvent[];
  locations: Location[];
  creatures: Creature[];
  subjects: Subject[];
  bloodStatuses: BloodStatusEntry[];
  factions: Faction[];
}
