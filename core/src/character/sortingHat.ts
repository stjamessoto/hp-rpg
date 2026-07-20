import type { RngAdapter } from "../adapters/RngAdapter.js";
import type { UiAdapter, UiChoice } from "../adapters/UiAdapter.js";
import type { HouseId } from "../data/types.js";

type HouseWeights = Partial<Record<HouseId, number>>;

interface SortingOption {
  id: string;
  label: string;
  weights: HouseWeights;
}

interface SortingQuestion {
  id: string;
  prompt: string;
  options: SortingOption[];
}

export const SORTING_QUESTIONS: SortingQuestion[] = [
  {
    id: "corridor",
    prompt: "A first-year drops their books in a crowded corridor. What do you do?",
    options: [
      { id: "help-directly", label: "Stop and help them gather everything up.", weights: { hufflepuff: 3, gryffindor: 1 } },
      { id: "organize-others", label: "Get a couple of nearby students to help so it's done fast.", weights: { ravenclaw: 2, hufflepuff: 1 } },
      { id: "shield-them", label: "Plant yourself between them and the older students laughing.", weights: { gryffindor: 3 } },
      { id: "note-and-move", label: "Notice who didn't help — worth remembering later.", weights: { slytherin: 3 } },
    ],
  },
  {
    id: "unlocked-door",
    prompt: "You find a locked door with a sign reading 'Do Not Enter.' What's your instinct?",
    options: [
      { id: "walk-past", label: "Walk past it. Rules exist for reasons.", weights: { hufflepuff: 2 } },
      { id: "figure-out-lock", label: "Wonder exactly what charm is holding it shut.", weights: { ravenclaw: 3 } },
      { id: "try-the-handle", label: "Try the handle, just to see.", weights: { gryffindor: 2, slytherin: 1 } },
      { id: "come-back-later", label: "Note it, and come back when nobody's watching.", weights: { slytherin: 3 } },
    ],
  },
  {
    id: "greatest-fear",
    prompt: "What worries you more?",
    options: [
      { id: "failing-friends", label: "Failing the people who are counting on you.", weights: { hufflepuff: 2, gryffindor: 1 } },
      { id: "being-powerless", label: "Being powerless when it matters.", weights: { slytherin: 2, gryffindor: 1 } },
      { id: "never-knowing", label: "Never finding out the answer to something important.", weights: { ravenclaw: 3 } },
      { id: "cowardice", label: "Being too afraid to act when you should.", weights: { gryffindor: 3 } },
    ],
  },
  {
    id: "reward",
    prompt: "You're offered a reward for a job well done. What matters most about it?",
    options: [
      { id: "shared-credit", label: "That the people who helped get credit too.", weights: { hufflepuff: 3 } },
      { id: "proof-of-skill", label: "That it proves how good you actually are.", weights: { ravenclaw: 2, slytherin: 1 } },
      { id: "what-it-gets-you", label: "What it lets you do next.", weights: { slytherin: 3 } },
      { id: "dont-care-about-reward", label: "Honestly, you'd have done it without one.", weights: { gryffindor: 2, hufflepuff: 1 } },
    ],
  },
  {
    id: "disagreement",
    prompt: "A friend is about to do something you think is a bad idea. What do you do?",
    options: [
      { id: "argue-it-out", label: "Argue them out of it with better logic.", weights: { ravenclaw: 3 } },
      { id: "go-along", label: "Go along with it — you're not leaving them to do it alone.", weights: { gryffindor: 2, hufflepuff: 1 } },
      { id: "quiet-word", label: "Have a quiet word instead of a public scene.", weights: { slytherin: 2, hufflepuff: 1 } },
      { id: "stand-by-patiently", label: "Tell them your concerns once, then stand by them either way.", weights: { hufflepuff: 3 } },
    ],
  },
  {
    id: "define-success",
    prompt: "Ten years from now, what would make you feel your life had gone well?",
    options: [
      { id: "known-for-courage", label: "Having stood up when it counted, even scared.", weights: { gryffindor: 3 } },
      { id: "known-for-loyalty", label: "The people close to you knowing they could always rely on you.", weights: { hufflepuff: 3 } },
      { id: "known-for-mastery", label: "Having actually mastered something difficult.", weights: { ravenclaw: 3 } },
      { id: "known-for-achievement", label: "Having become someone people had to take seriously.", weights: { slytherin: 3 } },
    ],
  },
];

export function scoreHouses(answerIds: string[]): Record<HouseId, number> {
  const scores: Record<HouseId, number> = { gryffindor: 0, hufflepuff: 0, ravenclaw: 0, slytherin: 0 };
  for (const question of SORTING_QUESTIONS) {
    const chosen = question.options.find((o) => o.id === answerIds[SORTING_QUESTIONS.indexOf(question)]);
    if (!chosen) continue;
    for (const [house, weight] of Object.entries(chosen.weights) as [HouseId, number][]) {
      scores[house] += weight;
    }
  }
  return scores;
}

export interface SortingResult {
  house: HouseId;
  scores: Record<HouseId, number>;
  consideredPreference: boolean;
  reasoning: string;
}

/**
 * Canon behavior: the Sorting Hat can weigh a wearer's strong preference
 * (famously Harry's "not Slytherin") alongside their raw disposition. We
 * model that as a moderate bonus to the requested house rather than a
 * guarantee — a very lopsided disposition can still overrule the request.
 */
export function sortHat(
  scores: Record<HouseId, number>,
  rng: RngAdapter,
  preference?: HouseId
): SortingResult {
  const adjusted = { ...scores };
  const consideredPreference = preference !== undefined;
  if (preference) {
    adjusted[preference] += 2;
  }

  const maxScore = Math.max(...Object.values(adjusted));
  const topHouses = (Object.keys(adjusted) as HouseId[]).filter((h) => adjusted[h] === maxScore);
  const house = topHouses.length === 1 ? topHouses[0] : rng.pick(topHouses);

  const reasoning = buildReasoning(house, scores, preference);
  return { house, scores, consideredPreference, reasoning };
}

function buildReasoning(house: HouseId, rawScores: Record<HouseId, number>, preference?: HouseId): string {
  const houseName = house[0].toUpperCase() + house.slice(1);
  if (preference && preference !== house) {
    return `The Hat lingers. "You asked for ${preference[0].toUpperCase()}${preference.slice(1)}," it murmurs, "but that's not where you'd do best." Better be — ${houseName.toUpperCase()}!`;
  }
  if (preference && preference === house) {
    return `"Ah — you've a preference, I see. Well, it happens I agree with you." Better be — ${houseName.toUpperCase()}!`;
  }
  const runnerUp = (Object.keys(rawScores) as HouseId[])
    .filter((h) => h !== house)
    .sort((a, b) => rawScores[b] - rawScores[a])[0];
  if (rawScores[runnerUp] >= rawScores[house] - 1) {
    return `"Difficult. Very difficult. Plenty of ${runnerUp} in you too — but I think I know just where to put you." Better be — ${houseName.toUpperCase()}!`;
  }
  return `"Yes... I know exactly what to do with you." — ${houseName.toUpperCase()}!`;
}

const HOUSE_CHOICES: UiChoice<HouseId>[] = [
  { id: "gryffindor", label: "Gryffindor" },
  { id: "hufflepuff", label: "Hufflepuff" },
  { id: "ravenclaw", label: "Ravenclaw" },
  { id: "slytherin", label: "Slytherin" },
];

function buildChosenReasoning(house: HouseId): string {
  const houseName = house[0].toUpperCase() + house.slice(1);
  return `The Hat barely settles before it speaks. "Oh — you already know, don't you?" it murmurs. "Well. Who am I to argue." Better be — ${houseName.toUpperCase()}!`;
}

/**
 * Two paths: the canon-faithful default (a short quiz decides, with an
 * optional stated preference the Hat "considers" but can override — see
 * `sortHat`'s doc comment), or picking the house directly, for players who
 * just want the house they want. Both are legitimate ways to play; the
 * quiz path is offered first since it's the one the books actually show.
 */
export async function runSortingHatFlow(ui: UiAdapter, rng: RngAdapter): Promise<SortingResult> {
  await ui.print(
    "The Hat drops over your eyes. A small voice speaks, seemingly from inside your own head. \"Hmm. Let's see, then...\""
  );

  const mode = await ui.choose<"quiz" | "choose">(
    "Before it asks anything else: some students already know exactly where they belong. Others let the Hat work it out.",
    [
      { id: "quiz", label: "Let the Hat decide, based on who you are." },
      { id: "choose", label: "Tell it exactly which house you want." },
    ]
  );

  if (mode === "choose") {
    const house = await ui.choose<HouseId>("Which house?", HOUSE_CHOICES);
    const scores: Record<HouseId, number> = { gryffindor: 0, hufflepuff: 0, ravenclaw: 0, slytherin: 0 };
    scores[house] = 1;
    const result: SortingResult = {
      house,
      scores,
      consideredPreference: true,
      reasoning: buildChosenReasoning(house),
    };
    await ui.print(result.reasoning);
    return result;
  }

  const answerIds: string[] = [];
  for (const question of SORTING_QUESTIONS) {
    const choices: UiChoice[] = question.options.map((o) => ({ id: o.id, label: o.label }));
    const answer = await ui.choose(question.prompt, choices);
    answerIds.push(answer);
  }

  const wantsToState = await ui.confirm("Do you want to tell the Hat which house you're hoping for?");
  let preference: HouseId | undefined;
  if (wantsToState) {
    preference = await ui.choose<HouseId>("Which house?", HOUSE_CHOICES);
  }

  const scores = scoreHouses(answerIds);
  const result = sortHat(scores, rng, preference);
  await ui.print(result.reasoning);
  return result;
}
