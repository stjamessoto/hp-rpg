/**
 * All randomness in /core flows through this interface so a run can be
 * reproduced from a seed (deterministic Sorting, wand assignment, scene
 * outcomes). Web and mobile both get their seed from a platform RNG once
 * (e.g. crypto.getRandomValues) and hand it to `createSeededRngAdapter`;
 * core itself never reads Math.random() or any platform entropy source
 * directly.
 */
export interface RngAdapter {
  /** The seed this adapter was created from, for save-game reproducibility. */
  readonly seed: number;
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max], inclusive. */
  nextInt(min: number, max: number): number;
  /** Uniform pick from a non-empty array. */
  pick<T>(items: readonly T[]): T;
  /** Weighted pick; weights need not sum to 1. */
  weightedPick<T>(items: readonly { value: T; weight: number }[]): T;
}

/**
 * mulberry32 - small, fast, dependency-free seeded PRNG. Pure arithmetic,
 * so it is as portable to React Native / a mobile JS engine as it is to
 * the browser.
 */
export function createSeededRngAdapter(seed: number): RngAdapter {
  let state = seed >>> 0;

  const next = (): number => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const nextInt = (min: number, max: number): number => {
    if (max < min) throw new Error(`nextInt: max (${max}) < min (${min})`);
    return min + Math.floor(next() * (max - min + 1));
  };

  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error("pick: cannot pick from an empty array");
    return items[nextInt(0, items.length - 1)];
  };

  const weightedPick = <T>(items: readonly { value: T; weight: number }[]): T => {
    if (items.length === 0) throw new Error("weightedPick: cannot pick from an empty array");
    const total = items.reduce((sum, i) => sum + i.weight, 0);
    let roll = next() * total;
    for (const item of items) {
      roll -= item.weight;
      if (roll <= 0) return item.value;
    }
    return items[items.length - 1].value;
  };

  return { seed, next, nextInt, pick, weightedPick };
}
