import type { BloodStatusId } from "../data/types.js";

export interface CalendarYearBranch {
  on: "calendarYear";
  /** Hogwarts year (1-7) the branch is choosing content for. */
  targetHogwartsYear: number;
  /** If the target year's calendar year is >= this, take `ifTrue`; otherwise `ifFalse`. */
  calendarYearAtLeast: number;
  ifTrue: string;
  ifFalse: string;
}

export interface BloodStatusBranch {
  on: "bloodStatus";
  /** Take `ifTrue` when the character's blood status matches this value, `ifFalse` otherwise. */
  bloodStatus: BloodStatusId;
  ifTrue: string;
  ifFalse: string;
}

export interface CalendarYearLookupBranch {
  on: "calendarYearLookup";
  /** Hogwarts year (1-7) the branch is choosing content for. */
  targetHogwartsYear: number;
  /**
   * Exact calendar year -> destination scene id. For canon set-pieces that
   * only happened in one specific real year (the Triwizard Tournament,
   * Umbridge's tenure, the Chamber of Secrets reopening...) — since the
   * same calendar year can land on a different hogwartsYear depending on
   * when a character started, this routes to the matching detailed arc
   * regardless of which year-of-schooling it falls in for this character.
   */
  cases: Record<number, string>;
  /** Destination when the target year's calendar year matches no case (an "ordinary" year). */
  fallback: string;
}

export type SceneBranch = CalendarYearBranch | BloodStatusBranch | CalendarYearLookupBranch;

export interface SceneChoice {
  id: string;
  label: string;
  /** Scene id to go to next, or null to end the loop. Ignored if `branch` is present. */
  next: string | null;
  /** Character-dependent fork (era, blood status, ...) — overrides `next` when present. */
  branch?: SceneBranch;
}

export interface Scene {
  id: string;
  title: string;
  /** Which Hogwarts year (1-7) this scene belongs to — drives calendar-year-aware content. */
  hogwartsYear: number;
  /** Paragraphs of prose; may contain {{name}} / {{house}} / {{wider-world}} / {{dada-professor}} / {{upbringing-reaction}} tokens. */
  prose: string[];
  choices: SceneChoice[];
}

export type SceneBundle = Record<string, Scene>;
