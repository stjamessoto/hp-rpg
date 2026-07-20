import { describe, expect, it } from "vitest";
import { canonData } from "@core/data/loader.js";
import type { Character } from "@core/character/types.js";
import {
  validateAgeViolation,
  validateBackstoryCanon,
  validateHouseLock,
  validateNpcPresence,
  validateSpellEra,
} from "@core/canon/validator.js";

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    schemaVersion: 1,
    id: "pc-test",
    identity: { name: "Test Testerson", gender: "witch", birthYear: 1980, hogwartsStartYear: 1991 },
    bloodStatus: "half-blood",
    backstory: { upbringing: "wizarding", familyDescription: "", freeText: "", tags: [] },
    appearance: { hairColor: "black", eyeColor: "brown", build: "average", distinguishingFeatures: [], freeText: "" },
    house: "gryffindor",
    sortingHatReasoning: "",
    wand: { wood: "holly", core: "phoenix-feather", lengthInches: 11, flexibility: "supple", flavorText: "" },
    attributes: { subjectAptitude: {} },
    creationSeed: 1,
    createdAt: new Date(0).toISOString(),
    ...overrides,
  };
}

describe("validateAgeViolation", () => {
  it("flags a student who is far too young for the chosen start year", () => {
    const character = makeCharacter({
      identity: { name: "Too Young", gender: "witch", birthYear: 1985, hogwartsStartYear: 1991 },
    });
    const violations = validateAgeViolation(character);
    expect(violations).toHaveLength(1);
    expect(violations[0].code).toBe("invalid-age");
  });

  it("allows an age-11 start", () => {
    const character = makeCharacter({
      identity: { name: "Just Right", gender: "witch", birthYear: 1980, hogwartsStartYear: 1991 },
    });
    expect(validateAgeViolation(character)).toHaveLength(0);
  });
});

describe("validateNpcPresence", () => {
  it("flags a canonical NPC referenced after their death year", () => {
    const violations = validateNpcPresence("albus-dumbledore", 1999, canonData);
    expect(violations.some((v) => v.code === "npc-dead")).toBe(true);
  });

  it("allows a canonical NPC referenced while alive", () => {
    const violations = validateNpcPresence("albus-dumbledore", 1995, canonData);
    expect(violations).toHaveLength(0);
  });

  it("flags a canonical NPC referenced before they were born", () => {
    const violations = validateNpcPresence("harry-potter", 1975, canonData);
    expect(violations.some((v) => v.code === "npc-not-born")).toBe(true);
  });

  it("treats a school year matching the literal death year as already absent", () => {
    // Dumbledore dies June 1997, the tail end of story-year 1996 (HBP). He
    // should already be gone for story-year 1997 (DH), not just 1998+.
    const violations = validateNpcPresence("albus-dumbledore", 1997, canonData);
    expect(violations.some((v) => v.code === "npc-dead")).toBe(true);
  });

  it("still allows an NPC present for the school year they die at the end of", () => {
    const violations = validateNpcPresence("albus-dumbledore", 1996, canonData);
    expect(violations).toHaveLength(0);
  });
});

describe("validateSpellEra", () => {
  it("flags an Unforgivable Curse used before its first canonical appearance", () => {
    const violations = validateSpellEra("avada-kedavra", 1992, canonData);
    expect(violations.some((v) => v.code === "spell-not-yet-known")).toBe(true);
  });

  it("allows a spell used at or after its first canonical appearance", () => {
    const violations = validateSpellEra("avada-kedavra", 1995, canonData);
    expect(violations).toHaveLength(0);
  });

  it("allows an era-agnostic spell like Wingardium Leviosa from year one", () => {
    const violations = validateSpellEra("wingardium-leviosa", 1991, canonData);
    expect(violations).toHaveLength(0);
  });
});

describe("validateHouseLock", () => {
  it("flags a Sorted house that contradicts a locked backstory tag", () => {
    const character = makeCharacter({
      house: "gryffindor",
      backstory: { upbringing: "wizarding", familyDescription: "", freeText: "", tags: ["house-locked:slytherin"] },
    });
    const violations = validateHouseLock(character);
    expect(violations.some((v) => v.code === "house-contradicts-lock")).toBe(true);
  });

  it("allows a Sorted house that matches the locked backstory tag", () => {
    const character = makeCharacter({
      house: "slytherin",
      backstory: { upbringing: "wizarding", familyDescription: "", freeText: "", tags: ["house-locked:slytherin"] },
    });
    expect(validateHouseLock(character)).toHaveLength(0);
  });
});

describe("validateBackstoryCanon", () => {
  it("flags a claim to be an additional Potter child", () => {
    const character = makeCharacter({
      backstory: {
        upbringing: "wizarding",
        familyDescription: "",
        freeText: "I am the Potters' second child, born after Harry.",
        tags: [],
      },
    });
    const violations = validateBackstoryCanon(character);
    expect(violations.some((v) => v.code === "backstory-contradicts-canon")).toBe(true);
  });

  it("allows an ordinary original backstory", () => {
    const character = makeCharacter({
      backstory: {
        upbringing: "muggle",
        familyDescription: "Two Muggle parents, an accountant and a teacher.",
        freeText: "Found out about Hogwarts when the letter arrived; nobody in the family believed it at first.",
        tags: [],
      },
    });
    expect(validateBackstoryCanon(character)).toHaveLength(0);
  });
});
