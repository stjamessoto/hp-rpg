import { describe, expect, it } from "vitest";
import { createSeededRngAdapter } from "@core/adapters/RngAdapter.js";
import { scoreHouses, sortHat, SORTING_QUESTIONS } from "@core/character/sortingHat.js";

describe("scoreHouses", () => {
  it("sums weighted answers per house across all questions", () => {
    const answers = SORTING_QUESTIONS.map((q) => q.options[0].id);
    const scores = scoreHouses(answers);
    const expected = { gryffindor: 0, hufflepuff: 0, ravenclaw: 0, slytherin: 0 };
    SORTING_QUESTIONS.forEach((q) => {
      const chosen = q.options[0];
      for (const [house, weight] of Object.entries(chosen.weights)) {
        expected[house as keyof typeof expected] += weight as number;
      }
    });
    expect(scores).toEqual(expected);
  });
});

describe("sortHat", () => {
  it("picks the strictly highest-scoring house with no preference involved", () => {
    const rng = createSeededRngAdapter(1);
    const result = sortHat({ gryffindor: 10, hufflepuff: 1, ravenclaw: 1, slytherin: 1 }, rng);
    expect(result.house).toBe("gryffindor");
    expect(result.consideredPreference).toBe(false);
  });

  it("lets a stated preference tip a close call in its favor", () => {
    const rng = createSeededRngAdapter(1);
    const result = sortHat({ gryffindor: 4, hufflepuff: 0, ravenclaw: 0, slytherin: 3 }, rng, "slytherin");
    expect(result.house).toBe("slytherin");
    expect(result.consideredPreference).toBe(true);
  });

  it("does not let a preference override an overwhelming disposition", () => {
    const rng = createSeededRngAdapter(1);
    const result = sortHat({ gryffindor: 20, hufflepuff: 0, ravenclaw: 0, slytherin: 1 }, rng, "slytherin");
    expect(result.house).toBe("gryffindor");
  });
});
