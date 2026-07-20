import { describe, expect, it } from "vitest";
import { createSeededRngAdapter } from "@core/adapters/RngAdapter.js";
import { ScriptedUiAdapter } from "@core/adapters/UiAdapter.js";
import { canonData } from "@core/data/loader.js";
import { createCharacterFlow } from "@core/character/createCharacter.js";
import { runGameLoop, runScene } from "@core/game/sceneEngine.js";
import { sceneBundle, INTRO_START_SCENE_ID } from "@core/game/scenesLoader.js";
import { buildWiderWorldParagraph, getDadaProfessor } from "@core/game/widerWorld.js";
import { getUpbringingReaction } from "@core/game/reactions.js";
import type { Scene } from "@core/game/types.js";

describe("calendarYearLookup branch", () => {
  it("routes to the matching case for the character's actual calendar year at that hogwartsYear, regardless of which case list is longer", async () => {
    const scene: Scene = {
      id: "router",
      title: "Router",
      hogwartsYear: 4,
      prose: [],
      choices: [
        {
          id: "go",
          label: "Continue",
          next: null,
          branch: {
            on: "calendarYearLookup",
            targetHogwartsYear: 4,
            cases: { 1994: "triwizard-arc", 1995: "umbridge-arc" },
            fallback: "ordinary-year-four",
          },
        },
      ],
    };
    const answers: (string | boolean)[] = [
      "1991", "Test", "witch", "1980", "half-blood", "wizarding", "x", "y",
      "a", "b", "c", "", "", "quiz", "shield-them", "try-the-handle", "cowardice",
      "dont-care-about-reward", "go-along", "known-for-courage", false, "instinct",
      "confront", "protect",
    ];
    const character = await createCharacterFlow(new ScriptedUiAdapter(answers), createSeededRngAdapter(1), canonData);
    // 1991 start -> hogwartsYear 4 = calendar 1994 -> should hit the Triwizard case.
    const next = await runScene(new ScriptedUiAdapter(["go"]), scene, character, canonData);
    expect(next).toBe("triwizard-arc");
  });

  it("falls back when the character's calendar year for that slot matches no case", async () => {
    const scene: Scene = {
      id: "router",
      title: "Router",
      hogwartsYear: 4,
      prose: [],
      choices: [
        {
          id: "go",
          label: "Continue",
          next: null,
          branch: { on: "calendarYearLookup", targetHogwartsYear: 4, cases: { 1994: "triwizard-arc" }, fallback: "ordinary-year-four" },
        },
      ],
    };
    const answers: (string | boolean)[] = [
      "1993", "Test", "witch", "1982", "half-blood", "wizarding", "x", "y",
      "a", "b", "c", "", "", "quiz", "shield-them", "try-the-handle", "cowardice",
      "dont-care-about-reward", "go-along", "known-for-courage", false, "instinct",
      "confront", "protect",
    ];
    const character = await createCharacterFlow(new ScriptedUiAdapter(answers), createSeededRngAdapter(1), canonData);
    // 1993 start -> hogwartsYear 4 = calendar 1996, not in cases -> fallback.
    const next = await runScene(new ScriptedUiAdapter(["go"]), scene, character, canonData);
    expect(next).toBe("ordinary-year-four");
  });
});

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
}

// Each array below is a full, validated transcript of scene-choice answers
// (character-creation answers excluded) for one seven-year playthrough
// through the current 104-scene chain. They were generated by walking every
// scene from "diagon-alley" onward and, at each choice point, always taking
// the first-listed option (or the branch-relevant option where a scenario
// needs to exercise a specific fork, e.g. Muggle-born on the wartime year 7
// branch) — see the note atop this file's history for how to regenerate
// these if the scene graph changes shape again.
const NAV_ANSWERS_WAR_1991: string[] = [
  "menagerie-owl", "share-snacks", "talk-to-neighbour", "focus-quietly", "keep-head-down",
  "gentle-hands", "steady-landing", "chaser", "stay-late", "library", "continue", "stayed",
  "continue", "your-house-wins", "revised-hard", "continue", "continue", "continue",
  "actually-listened", "keep-trying", "loved-it", "walk-away", "stayed-at-school",
  "finished-essay", "continue", "stay-alert", "unsettled", "support-friends", "relief",
  "continue", "continue", "divination", "careful-notes", "three-broomsticks", "proud-of-it",
  "played-well", "grateful", "continue", "shaken", "sympathetic", "continue", "continue",
  "nailed-it", "dare-closer", "keep-the-rivalry", "unsettled-by-it", "continue", "continue",
  "still-shaken", "sympathetic-to-harry", "asked-someone", "thrilling", "grieving", "continue",
  "continue", "took-notes", "actually-relaxed", "made-prefect", "lean-in", "continue",
  "keep-quiet", "avoid-attention", "proud-to-have-joined", "relieved-and-grieving", "continue",
  "continue", "continue", "clear-direction", "continue", "continue", "made-captain",
  "thriving", "continue", "got-invited", "stay-hopeful", "grieving", "continue", "continue",
  "keep-silent", "hold-onto-it", "continue", "continue", "got-them-there", "continue",
];

const NAV_ANSWERS_MUGGLEBORN_WAR_1991: string[] = [
  "menagerie-owl", "share-snacks", "talk-to-neighbour", "focus-quietly", "keep-head-down",
  "gentle-hands", "steady-landing", "chaser", "stay-late", "library", "continue", "stayed",
  "continue", "your-house-wins", "revised-hard", "continue", "continue", "continue",
  "actually-listened", "keep-trying", "loved-it", "walk-away", "stayed-at-school",
  "finished-essay", "continue", "stay-alert", "unsettled", "support-friends", "relief",
  "continue", "continue", "divination", "careful-notes", "three-broomsticks", "proud-of-it",
  "played-well", "grateful", "continue", "shaken", "sympathetic", "continue", "continue",
  "nailed-it", "dare-closer", "keep-the-rivalry", "unsettled-by-it", "continue", "continue",
  "still-shaken", "sympathetic-to-harry", "asked-someone", "thrilling", "grieving", "continue",
  "continue", "took-notes", "actually-relaxed", "made-prefect", "lean-in", "continue",
  "keep-quiet", "avoid-attention", "proud-to-have-joined", "relieved-and-grieving", "continue",
  "continue", "continue", "clear-direction", "continue", "continue", "made-captain",
  "thriving", "continue", "got-invited", "stay-hopeful", "grieving", "continue", "continue",
  // wider-world-y7-war's bloodStatus branch routes Muggle-borns through the
  // extra "muggle-born-in-hiding" scene before rejoining at resistance-y7 —
  // one more "continue" than the half-blood/pure-blood transcript above.
  "keep-silent", "hold-onto-it", "continue", "continue", "continue", "got-them-there", "continue",
];

const NAV_ANSWERS_PEACE_1993: string[] = [
  "menagerie-owl", "share-snacks", "talk-to-neighbour", "focus-quietly", "keep-head-down",
  "gentle-hands", "steady-landing", "chaser", "stay-late", "library", "continue", "stayed",
  "continue", "your-house-wins", "revised-hard", "continue", "continue", "continue",
  "actually-listened", "keep-trying", "loved-it", "walk-away", "stayed-at-school",
  "finished-essay", "continue", "continue", "continue", "continue", "continue", "divination",
  "careful-notes", "three-broomsticks", "proud-of-it", "played-well", "grateful", "continue",
  "continue", "continue", "continue", "continue", "nailed-it", "dare-closer",
  "keep-the-rivalry", "unsettled-by-it", "continue", "continue", "continue", "continue",
  "continue", "continue", "took-notes", "actually-relaxed", "made-prefect", "lean-in",
  "continue", "continue", "continue", "continue", "continue", "continue", "clear-direction",
  "continue", "continue", "made-captain", "thriving", "continue", "continue", "continue",
  "continue", "continue", "embrace-it", "proud-of-the-distance", "savour-it", "continue",
  "continue",
];

async function playThrough(era: string, birthYear: string, bloodStatus: string, navAnswers: string[]) {
  const answers: (string | boolean)[] = [
    ...characterCreationAnswers(era, birthYear, bloodStatus),
    ...navAnswers,
  ];
  const ui = new ScriptedUiAdapter(answers);
  const rng = createSeededRngAdapter(99);
  const character = await createCharacterFlow(ui, rng, canonData);
  await runGameLoop(ui, character, sceneBundle, INTRO_START_SCENE_ID, canonData);
  return { character, ui };
}

describe("runGameLoop across a full seven-year playthrough", () => {
  it("takes an 1991 start (year 7 = 1997) down the wartime branch, ending at the Battle of Hogwarts", async () => {
    const { ui } = await playThrough("1991", "1980", "half-blood", NAV_ANSWERS_WAR_1991);
    expect(ui.printed.some((line) => line.includes("scene") && line.includes("isn't written yet"))).toBe(false);
    expect(ui.printed).toContain("The Battle of Hogwarts");
    expect(ui.printed).toContain("Seventh Year, Under New Management");
    expect(ui.printed).not.toContain("The Registration Commission");
    expect(ui.printed).not.toContain("Leaving Hogwarts");
    expect(ui.printed[ui.printed.length - 1]).toBe("--- Your years at Hogwarts end here. ---");
  });

  it("takes a 1993 start (year 7 = 1999) down the peacetime branch, ending at graduation", async () => {
    const { ui } = await playThrough("1993", "1982", "half-blood", NAV_ANSWERS_PEACE_1993);
    expect(ui.printed.some((line) => line.includes("scene") && line.includes("isn't written yet"))).toBe(false);
    expect(ui.printed).toContain("Leaving Hogwarts");
    expect(ui.printed).toContain("Seventh Year");
    expect(ui.printed).not.toContain("The Battle of Hogwarts");
    expect(ui.printed[ui.printed.length - 1]).toBe("--- Your years at Hogwarts end here. ---");
  });

  it("routes a Muggle-born character on the wartime branch through the Registration Commission scene", async () => {
    const { ui } = await playThrough("1991", "1980", "muggle-born", NAV_ANSWERS_MUGGLEBORN_WAR_1991);
    expect(ui.printed.some((line) => line.includes("scene") && line.includes("isn't written yet"))).toBe(false);
    expect(ui.printed).toContain("The Registration Commission");
    expect(ui.printed).toContain("The Battle of Hogwarts");
    expect(ui.printed[ui.printed.length - 1]).toBe("--- Your years at Hogwarts end here. ---");
  });

  it("does not route a half-blood character through the Registration Commission scene", async () => {
    const { ui } = await playThrough("1991", "1980", "half-blood", NAV_ANSWERS_WAR_1991);
    expect(ui.printed).not.toContain("The Registration Commission");
  });
});
