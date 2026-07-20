import { describe, expect, it } from "vitest";
import { createSeededRngAdapter } from "@core/adapters/RngAdapter.js";
import { ScriptedUiAdapter } from "@core/adapters/UiAdapter.js";
import { canonData } from "@core/data/loader.js";
import { createCharacterFlow } from "@core/character/createCharacter.js";
import { runGameLoop } from "@core/game/sceneEngine.js";
import { sceneBundle, INTRO_START_SCENE_ID } from "@core/game/scenesLoader.js";
import { buildWiderWorldParagraph, getDadaProfessor } from "@core/game/widerWorld.js";
import { getUpbringingReaction } from "@core/game/reactions.js";

describe("buildWiderWorldParagraph", () => {
  it("surfaces the Triwizard Tournament and Voldemort's return for the 1994 school year", () => {
    const paragraph = buildWiderWorldParagraph(1994, canonData);
    expect(paragraph).toContain("Triwizard");
    expect(paragraph).toContain("Voldemort");
  });

  it("surfaces the Battle of Hogwarts for the 1997 school year, not 1998", () => {
    // The battle happens May 1998, the tail end of the 1997-98 school year
    // (school-year label 1997) — see widerWorld.ts's placement table.
    const paragraph1997 = buildWiderWorldParagraph(1997, canonData);
    expect(paragraph1997).toContain("Battle of Hogwarts");
    const paragraph1998 = buildWiderWorldParagraph(1998, canonData);
    expect(paragraph1998).not.toContain("Battle of Hogwarts");
  });

  it("falls back to a generic line for years with no canon events on record", () => {
    const paragraph = buildWiderWorldParagraph(2001, canonData);
    expect(paragraph.length).toBeGreaterThan(0);
    expect(paragraph).not.toContain("Triwizard");
  });
});

describe("getDadaProfessor", () => {
  it("returns the correct professor for a documented year", () => {
    expect(getDadaProfessor(1993, canonData)).toBe("Remus Lupin");
    expect(getDadaProfessor(1995, canonData)).toBe("Dolores Umbridge");
  });

  it("falls back gracefully for years with no recorded professor", () => {
    expect(getDadaProfessor(2000, canonData)).toBe("this year's Defence Against the Dark Arts teacher");
  });
});

describe("getUpbringingReaction", () => {
  it("returns a distinct reaction per upbringing", () => {
    const wizarding = getUpbringingReaction("wizarding");
    const muggle = getUpbringingReaction("muggle");
    const mixed = getUpbringingReaction("mixed");
    expect(new Set([wizarding, muggle, mixed]).size).toBe(3);
  });
});

function characterCreationAnswers(
  era: string,
  birthYear: string,
  bloodStatus: string = "half-blood"
): (string | boolean)[] {
  return [
    era,
    "Test Testerson", // name
    "witch", // gender
    birthYear,
    bloodStatus,
    "wizarding", // upbringing
    "A quiet family.", // family description
    "Excited to start.", // backstory free text
    "Black", // hair
    "Brown", // eyes
    "Tall", // build
    "", // distinguishing features
    "", // appearance free text
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
}

const NAV_ANSWERS_YEARS_1_TO_6: string[] = [
  // Year 1
  "talk-to-neighbour", "focus-quietly", "steady-landing", "continue", "continue",
  // Year 2
  "continue", "continue", "continue", "continue",
  // Year 3
  "continue", "divination", "three-broomsticks", "continue", "continue",
  // Year 4
  "continue", "continue", "continue", "continue",
  // Year 5
  "continue", "continue", "continue", "continue", "continue",
  // Year 6 (last "continue" triggers the war/peace branch)
  "continue", "continue", "continue", "continue",
];

// Non-Muggle-born: start-of-year-seven-*, wider-world-y7-*, resistance-y7|newts-final (3 answers; finale auto-prints).
const NAV_ANSWERS_YEAR_7 = ["continue", "continue", "continue"];
// Muggle-born on the wartime branch only: wider-world-y7-war's branch adds the
// muggle-born-in-hiding scene before resistance-y7 (4 answers).
const NAV_ANSWERS_YEAR_7_MUGGLEBORN_WAR = ["continue", "continue", "continue", "continue"];

async function playThrough(era: string, birthYear: string, bloodStatus: string, year7Answers: string[]) {
  const answers: (string | boolean)[] = [
    ...characterCreationAnswers(era, birthYear, bloodStatus),
    ...NAV_ANSWERS_YEARS_1_TO_6,
    ...year7Answers,
  ];
  const ui = new ScriptedUiAdapter(answers);
  const rng = createSeededRngAdapter(99);
  const character = await createCharacterFlow(ui, rng, canonData);
  await runGameLoop(ui, character, sceneBundle, INTRO_START_SCENE_ID, canonData);
  return { character, ui };
}

describe("runGameLoop across a full seven-year playthrough", () => {
  it("takes an 1991 start (year 7 = 1997) down the wartime branch, ending at the Battle of Hogwarts", async () => {
    const { ui } = await playThrough("1991", "1980", "half-blood", NAV_ANSWERS_YEAR_7);
    expect(ui.printed.some((line) => line.includes("scene") && line.includes("isn't written yet"))).toBe(false);
    expect(ui.printed).toContain("The Battle of Hogwarts");
    expect(ui.printed).toContain("Seventh Year, Under New Management");
    expect(ui.printed).not.toContain("The Registration Commission");
    expect(ui.printed).not.toContain("Leaving Hogwarts");
    expect(ui.printed[ui.printed.length - 1]).toBe("--- Your years at Hogwarts end here. ---");
  });

  it("takes a 1993 start (year 7 = 1999) down the peacetime branch, ending at graduation", async () => {
    const { ui } = await playThrough("1993", "1982", "half-blood", NAV_ANSWERS_YEAR_7);
    expect(ui.printed.some((line) => line.includes("scene") && line.includes("isn't written yet"))).toBe(false);
    expect(ui.printed).toContain("Leaving Hogwarts");
    expect(ui.printed).toContain("Seventh Year");
    expect(ui.printed).not.toContain("The Battle of Hogwarts");
    expect(ui.printed[ui.printed.length - 1]).toBe("--- Your years at Hogwarts end here. ---");
  });

  it("routes a Muggle-born character on the wartime branch through the Registration Commission scene", async () => {
    const { ui } = await playThrough("1991", "1980", "muggle-born", NAV_ANSWERS_YEAR_7_MUGGLEBORN_WAR);
    expect(ui.printed.some((line) => line.includes("scene") && line.includes("isn't written yet"))).toBe(false);
    expect(ui.printed).toContain("The Registration Commission");
    expect(ui.printed).toContain("The Battle of Hogwarts");
    expect(ui.printed[ui.printed.length - 1]).toBe("--- Your years at Hogwarts end here. ---");
  });

  it("does not route a half-blood character through the Registration Commission scene", async () => {
    const { ui } = await playThrough("1991", "1980", "half-blood", NAV_ANSWERS_YEAR_7);
    expect(ui.printed).not.toContain("The Registration Commission");
  });
});
